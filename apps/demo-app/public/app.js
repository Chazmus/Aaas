let authServerUrl = 'http://localhost:8787/auth/login';

// Extract token from URL if returning from AaaS OAuth/Dev login
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');

if (tokenFromUrl) {
  localStorage.setItem('aaas_token', tokenFromUrl);
  // Clean URL
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

// Fetch backend config to get Auth Server URL
fetch('/api/config')
  .then(res => res.json())
  .then(cfg => {
    if (cfg.authUrl) authServerUrl = cfg.authUrl;
  })
  .catch(() => {});

function getToken() {
  return localStorage.getItem('aaas_token');
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function updateUI() {
  const token = getToken();
  const userBanner = document.getElementById('user-banner');
  const authHeaderBtn = document.getElementById('auth-header-btn');

  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      userBanner.classList.remove('hidden');
      authHeaderBtn.classList.add('hidden');

      document.getElementById('user-name').textContent = payload.name || 'Authenticated User';
      document.getElementById('user-email').textContent = payload.email || 'No email';
      document.getElementById('user-avatar').src = payload.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.email}`;
      
      const roleBadge = document.getElementById('user-role-badge');
      roleBadge.textContent = payload.role || 'user';
      if (payload.role === 'admin') {
        roleBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-800 font-bold';
      } else {
        roleBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-800';
      }
      return;
    }
  }

  userBanner.classList.add('hidden');
  authHeaderBtn.classList.remove('hidden');
}

function login() {
  const returnUrl = window.location.href;
  window.location.href = `${authServerUrl}?redirect_uri=${encodeURIComponent(returnUrl)}`;
}

function logout() {
  localStorage.removeItem('aaas_token');
  updateUI();
  document.getElementById('response-output').textContent = 'Logged out. Stored token cleared.';
  document.getElementById('response-status').textContent = 'Idle';
}

async function testApi(endpoint) {
  const statusEl = document.getElementById('response-status');
  const outputEl = document.getElementById('response-output');
  statusEl.textContent = 'Calling...';
  statusEl.className = 'font-mono text-[11px] text-indigo-400';

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, { headers });
    const data = await res.json().catch(() => ({ status: res.status, text: 'Non-JSON response' }));

    statusEl.textContent = `Status: ${res.status} ${res.statusText}`;
    if (res.ok) {
      statusEl.className = 'font-mono text-[11px] text-emerald-400 font-bold';
    } else {
      statusEl.className = 'font-mono text-[11px] text-rose-400 font-bold';
    }

    outputEl.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    statusEl.textContent = 'Network Error';
    statusEl.className = 'font-mono text-[11px] text-rose-400 font-bold';
    outputEl.textContent = err.message;
  }
}

document.addEventListener('DOMContentLoaded', updateUI);
