import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env, User } from './types.ts';
import { getJWKS, issueUserToken } from './crypto/keys.ts';
import { upsertUser, getAllUsers, updateUserRole, toggleUserStatus } from './db/users.ts';
import { renderHomePage } from './views/home.ts';
import { renderLoginPage } from './views/login.ts';
import { renderAdminPage } from './views/admin.ts';

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Global error handler for descriptive feedback
app.onError((err, c) => {
  console.error('AaaS Uncaught Exception:', err);
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AaaS Server Error</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-lg w-full bg-slate-900 border border-rose-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
    <div class="flex items-center space-x-2 text-rose-400 font-bold text-lg">
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span>AaaS Server Error</span>
    </div>
    <p class="text-xs text-slate-300">An unexpected error occurred while processing your request:</p>
    <pre class="text-xs text-rose-300 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap">${err.message || 'Unknown error'}</pre>
    <div class="text-xs text-slate-500 pt-2 border-t border-slate-800">
      <a href="/" class="text-indigo-400 hover:underline">&larr; Return to Home</a>
    </div>
  </div>
</body>
</html>`, 500);
});

// Root / Welcome & Status Page
app.get('/', (c) => {
  const url = new URL(c.req.url);
  return c.html(renderHomePage(c.env.APP_NAME || 'AaaS Server', url.origin));
});

// Standard OIDC JWKS Endpoint
app.get('/.well-known/jwks.json', async (c) => {
  try {
    const jwks = await getJWKS(c.env);
    return c.json(jwks);
  } catch (err: any) {
    return c.json({ error: 'Failed to retrieve JWKS', details: err.message }, 500);
  }
});

// Standard OIDC Discovery Document
app.get('/.well-known/openid-configuration', (c) => {
  const origin = new URL(c.req.url).origin;
  const issuer = c.env.JWT_ISSUER || origin;

  return c.json({
    issuer,
    authorization_endpoint: `${origin}/auth/login`,
    token_endpoint: `${origin}/auth/token`,
    jwks_uri: `${origin}/.well-known/jwks.json`,
    response_types_supported: ['token', 'id_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256']
  });
});

// Login Page UI
app.get('/auth/login', (c) => {
  const redirectUri = c.req.query('redirect_uri') || '/';
  const state = c.req.query('state') || '';
  const isDev = c.env.DEV_MODE === 'true' || !c.env.GOOGLE_CLIENT_ID;

  return c.html(renderLoginPage({
    appName: c.env.APP_NAME || 'AaaS Server',
    redirectUri,
    state,
    hasGoogle: !!c.env.GOOGLE_CLIENT_ID,
    hasGitHub: !!c.env.GITHUB_CLIENT_ID,
    isDevMode: isDev
  }));
});

// Google OAuth Authorization Redirection
app.get('/auth/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.text('Google OAuth is not configured. Set GOOGLE_CLIENT_ID in environment.', 400);
  }

  const origin = new URL(c.req.url).origin;
  const redirectUri = `${origin}/auth/google/callback`;
  const clientRedirect = c.req.query('redirect_uri') || '/';
  const state = encodeURIComponent(JSON.stringify({
    redirect_uri: clientRedirect,
    client_state: c.req.query('state') || ''
  }));

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'online');

  return c.redirect(googleAuthUrl.toString());
});

// Google OAuth Callback
app.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code');
  const stateParam = c.req.query('state');
  if (!code) {
    return c.text('Missing authorization code', 400);
  }

  let clientRedirect = '/';
  if (stateParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(stateParam));
      if (parsed.redirect_uri) clientRedirect = parsed.redirect_uri;
    } catch {}
  }

  const origin = new URL(c.req.url).origin;
  const redirectUri = `${origin}/auth/google/callback`;

  // Exchange code for Google tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID!,
      client_secret: c.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    return c.text(`Google token exchange failed: ${errorText}`, 400);
  }

  const tokens = await tokenRes.json<{ access_token: string }>();

  // Fetch user profile from Google
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  const profile = await profileRes.json<{ id: string; email: string; name?: string; picture?: string }>();

  // Save/upsert user in D1 SQLite
  const user = await upsertUser(c.env, {
    email: profile.email,
    name: profile.name || null,
    avatar_url: profile.picture || null,
    provider: 'google',
    provider_id: profile.id
  });

  // Issue AaaS JWT
  const token = await issueUserToken(user, c.env, {
    issuer: c.env.JWT_ISSUER || origin
  });

  // Redirect back to client app with the token
  const targetUrl = new URL(clientRedirect, origin);
  targetUrl.searchParams.set('token', token);
  return c.redirect(targetUrl.toString());
});

// Quick Dev Login for local testing & demos
app.post('/auth/dev-login', async (c) => {
  const origin = new URL(c.req.url).origin;
  const body = await c.req.parseBody();
  const preset = body['preset'] as string;
  const clientRedirect = (body['redirect_uri'] as string) || '/';

  let email = 'user@example.com';
  let name = 'Bob Developer';
  let role = 'user';

  if (preset === 'admin') {
    email = 'alice@example.com';
    name = 'Alice Admin';
    role = 'admin';
  }

  const user = await upsertUser(c.env, {
    email,
    name,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
    provider: 'dev',
    provider_id: 'dev_' + preset,
    forceRole: role
  });

  const token = await issueUserToken(user, c.env, {
    issuer: c.env.JWT_ISSUER || origin
  });

  const targetUrl = new URL(clientRedirect, origin);
  targetUrl.searchParams.set('token', token);
  return c.redirect(targetUrl.toString());
});

// Admin Dashboard UI
app.get('/admin', async (c) => {
  const users = await getAllUsers(c.env);
  return c.html(renderAdminPage({
    appName: c.env.APP_NAME || 'AaaS Server',
    users
  }));
});

// Admin API: Update role
app.post('/admin/api/users/:id/role', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ role: string }>();
  if (!body.role) {
    return c.json({ error: 'Role is required' }, 400);
  }

  const success = await updateUserRole(c.env, id, body.role);
  return c.json({ success, role: body.role });
});

// Admin API: Toggle active/suspended status
app.post('/admin/api/users/:id/toggle', async (c) => {
  const id = c.req.param('id');
  const updated = await toggleUserStatus(c.env, id);
  if (!updated) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json({ success: true, status: updated.status });
});

export default app;
