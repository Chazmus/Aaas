import type { User } from '../types.ts';

export function renderAdminPage(options: {
  appName: string;
  users?: User[];
  currentUser?: User | null;
}) {
  const { appName, users = [] } = options;
  const safeUsers = Array.isArray(users) ? users : [];
  const adminCount = safeUsers.filter(u => u && u.role === 'admin').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - ${appName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6">
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Navbar -->
    <div class="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/30">
          A
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight">${appName} Admin Console</h1>
          <p class="text-xs text-slate-400">Database: Cloudflare D1 (SQLite) • Instant RBAC Management</p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <a href="/" class="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition">
          &larr; Server Home
        </a>
        <a href="/auth/login" class="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950 border border-indigo-800 rounded-lg hover:bg-indigo-900 transition">
          Login Portal
        </a>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Users</div>
        <div class="text-3xl font-extrabold text-white mt-1">${safeUsers.length}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Admins</div>
        <div class="text-3xl font-extrabold text-indigo-400 mt-1">${adminCount}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Storage Engine</div>
        <div class="text-sm font-semibold text-emerald-400 mt-2 flex items-center">
          <span class="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
          Cloudflare D1 (Serverless SQLite)
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-white">Registered Users & Role Management</h2>
          <p class="text-xs text-slate-400">Change roles instantly. Role changes update their claims on their next token issue.</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th class="py-3.5 px-5">User</th>
              <th class="py-3.5 px-4">Provider</th>
              <th class="py-3.5 px-4">Role (RBAC)</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4">Registered</th>
              <th class="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            ${safeUsers.length === 0 ? `
              <tr>
                <td colspan="6" class="py-8 text-center text-slate-500">
                  No users have registered yet. <a href="/auth/login" class="text-indigo-400 underline">Sign in via the login portal</a> to create the first user!
                </td>
              </tr>
            ` : safeUsers.map(user => `
              <tr class="hover:bg-slate-800/30 transition">
                <td class="py-4 px-5 flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700 flex items-center justify-center font-bold text-indigo-300 overflow-hidden text-xs">
                    ${user.avatar_url ? `<img src="${user.avatar_url}" class="w-full h-full object-cover">` : (user.name ? user.name[0].toUpperCase() : 'U')}
                  </div>
                  <div>
                    <div class="font-medium text-slate-200">${user.name || 'Anonymous'}</div>
                    <div class="text-slate-400 text-[11px] font-mono">${user.email}</div>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    ${user.provider}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <select onchange="updateRole('${user.id}', this.value)" 
                          class="bg-slate-950 text-xs border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>👤 User</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
                    <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>🛡️ Moderator</option>
                  </select>
                </td>
                <td class="py-4 px-4">
                  <span id="status-${user.id}" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                    user.status === 'active' 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }">
                    ${user.status}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-400 text-[11px]">
                  ${user.created_at || 'Just now'}
                </td>
                <td class="py-4 px-5 text-right">
                  <button onclick="toggleStatus('${user.id}')"
                          class="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition">
                    Toggle Status
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    async function updateRole(userId, newRole) {
      try {
        const res = await fetch('/admin/api/users/' + userId + '/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        });
        if (!res.ok) throw new Error('Failed to update role');
        alert('Role updated to ' + newRole);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function toggleStatus(userId) {
      try {
        const res = await fetch('/admin/api/users/' + userId + '/toggle', {
          method: 'POST'
        });
        const data = await res.json();
        if (data.status) {
          window.location.reload();
        }
      } catch (err) {
        alert('Error toggling status: ' + err.message);
      }
    }
  </script>
</body>
</html>`;
}
