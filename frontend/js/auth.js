// Shared helpers + register/login/logout/route-guard logic
const API = '/api';
const store = {
  get token() { return localStorage.getItem('ss_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('ss_user')); } catch (e) { return null; } },
  save(token, user) { localStorage.setItem('ss_token', token); localStorage.setItem('ss_user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('ss_token'); localStorage.removeItem('ss_user'); }
};

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (store.token) headers.Authorization = 'Bearer ' + store.token;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && store.token) { store.clear(); location.href = 'login.html'; }
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function show(el, type, text) { el.className = 'msg ' + type; el.textContent = text; }

// Route guard: any page that loads this script with data-protect is checked against the server.
(async function guard() {
  const me = document.currentScript;
  if (!me || !me.hasAttribute('data-protect')) return;
  document.documentElement.style.visibility = 'hidden';
  if (!store.token) { location.replace('login.html'); return; }
  try {
    const { user } = await api('/auth/me');
    store.save(store.token, user);
    document.documentElement.style.visibility = '';
    document.dispatchEvent(new CustomEvent('ss:ready', { detail: user }));
  } catch (e) { store.clear(); location.replace('login.html'); }
})();

function logout() { store.clear(); location.href = 'login.html'; }

const regForm = document.getElementById('registerForm');
if (regForm) regForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('msg'), btn = regForm.querySelector('button');
  const f = Object.fromEntries(new FormData(regForm));
  if (f.password !== f.confirmPassword) return show(msg, 'err', 'Passwords do not match.');
  btn.disabled = true;
  try {
    await api('/auth/register', { method: 'POST', body: JSON.stringify(f) });
    show(msg, 'ok', 'Account created. Redirecting to login…');
    setTimeout(() => location.href = 'login.html?registered=1', 900);
  } catch (err) { show(msg, 'err', err.message); btn.disabled = false; }
});

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  if (store.token) location.replace('dashboard.html');
  if (new URLSearchParams(location.search).has('registered'))
    show(document.getElementById('msg'), 'ok', 'Registration successful. Please log in.');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('msg'), btn = loginForm.querySelector('button');
    btn.disabled = true;
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(loginForm))) });
      store.save(data.token, data.user);
      location.href = 'dashboard.html';
    } catch (err) { show(msg, 'err', err.message); btn.disabled = false; }
  });
}
