export function renderHomePage(appName: string, origin: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} - Serverless Auth</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center justify-center p-6">
  <div class="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
    <div class="flex items-center justify-between border-b border-slate-800 pb-6">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/30">
          A
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight">${appName}</h1>
          <p class="text-xs text-indigo-400 font-mono">Edge Authentication • Cloudflare Workers + D1 SQLite</p>
        </div>
      </div>
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
        Operational
      </span>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <a href="/auth/login" class="flex flex-col p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition group">
        <span class="text-sm font-semibold text-white group-hover:text-indigo-400 flex items-center justify-between">
          Login Portal &rarr;
        </span>
        <span class="text-xs text-slate-400 mt-1">Authenticate via Google, GitHub, or Dev Login</span>
      </a>

      <a href="/admin" class="flex flex-col p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition group">
        <span class="text-sm font-semibold text-white group-hover:text-indigo-400 flex items-center justify-between">
          Admin Dashboard &rarr;
        </span>
        <span class="text-xs text-slate-400 mt-1">Manage users, toggle RBAC roles in D1 SQLite</span>
      </a>
    </div>

    <div class="bg-slate-950 rounded-xl p-4 border border-slate-800/80">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Standard OIDC Endpoints</h3>
      <div class="space-y-1.5 text-xs font-mono">
        <div class="flex justify-between items-center text-slate-300">
          <span class="text-slate-500">JWKS (Public Keys):</span>
          <a href="/.well-known/jwks.json" class="text-indigo-400 hover:underline">/.well-known/jwks.json</a>
        </div>
        <div class="flex justify-between items-center text-slate-300">
          <span class="text-slate-500">Discovery Document:</span>
          <a href="/.well-known/openid-configuration" class="text-indigo-400 hover:underline">/.well-known/openid-configuration</a>
        </div>
      </div>
    </div>

    <div class="bg-slate-950 rounded-xl p-4 border border-slate-800/80">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Integration in Node/Express</h3>
      <pre class="text-xs text-slate-300 font-mono overflow-x-auto bg-slate-900 p-3 rounded-lg"><code>const { requireAuth } = require('@aaas/sdk');

// Protect your routes with 1 line of code:
app.get('/api/admin', requireAuth({
  issuer: '${origin}',
  role: 'admin'
}), (req, res) => {
  res.json({ message: \`Welcome \${req.user.name}!\` });
});</code></pre>
    </div>
  </div>
</body>
</html>`;
}
