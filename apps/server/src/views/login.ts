export function renderLoginPage(options: {
  appName: string;
  redirectUri?: string;
  state?: string;
  hasGoogle: boolean;
  hasGitHub: boolean;
  isDevMode: boolean;
}) {
  const { appName, redirectUri = '/', state = '', hasGoogle, hasGitHub, isDevMode } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in - ${appName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
    <div class="text-center space-y-2">
      <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-indigo-500/30">
        A
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-white">Sign in to your account</h2>
      <p class="text-xs text-slate-400">Authenticate via ${appName}</p>
    </div>

    <div class="space-y-3">
      ${hasGoogle ? `
        <a href="/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}"
           class="flex items-center justify-center w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 hover:bg-slate-700/80 transition text-sm font-medium text-white shadow-sm">
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
          </svg>
          Continue with Google
        </a>
      ` : ''}

      ${hasGitHub ? `
        <a href="/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}"
           class="flex items-center justify-center w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 hover:bg-slate-700/80 transition text-sm font-medium text-white shadow-sm">
          <svg class="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          Continue with GitHub
        </a>
      ` : ''}

      ${(!hasGoogle && !hasGitHub && !isDevMode) ? `
        <div class="p-4 bg-amber-950/40 border border-amber-800 text-amber-300 text-xs rounded-xl">
          No OAuth providers configured yet. Set <code>GOOGLE_CLIENT_ID</code> or <code>GITHUB_CLIENT_ID</code> in wrangler.toml or Cloudflare secrets.
        </div>
      ` : ''}
    </div>

    ${isDevMode ? `
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
        <div class="relative flex justify-center text-xs uppercase"><span class="bg-slate-900 px-2 text-slate-500 font-mono">Developer Mock Login</span></div>
      </div>

      <div class="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <p class="text-xs text-slate-400">Quickly test client app authentication with pre-configured mock roles:</p>
        
        <form method="POST" action="/auth/dev-login" class="space-y-2">
          <input type="hidden" name="redirect_uri" value="${redirectUri}">
          <input type="hidden" name="state" value="${state}">

          <div class="grid grid-cols-2 gap-2">
            <button type="submit" name="preset" value="admin"
                    class="px-3 py-2 text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 rounded-lg transition">
              👑 Alice (Admin)
            </button>
            <button type="submit" name="preset" value="user"
                    class="px-3 py-2 text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 rounded-lg transition">
              👤 Bob (Regular User)
            </button>
          </div>
        </form>
      </div>
    ` : ''}

    <div class="text-center text-xs text-slate-500">
      <a href="/" class="text-indigo-400 hover:underline">&larr; Back to Home</a>
    </div>
  </div>
</body>
</html>`;
}
