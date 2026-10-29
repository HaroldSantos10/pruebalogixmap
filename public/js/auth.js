const API = '';

function switchTab(tab) {
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

function showMessage(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `form-message ${type}`;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Ingresando...';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage('login-error', data.message, 'error');
      document.getElementById('login-error').classList.remove('hidden');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('email', email);
    window.location.href = '/map.html';

  } catch {
    showMessage('login-error', 'Error de conexión con el servidor', 'error');
    document.getElementById('login-error').classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Ingresar';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  const errorEl = document.getElementById('reg-error');
  const successEl = document.getElementById('reg-success');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (password !== confirm) {
    showMessage('reg-error', 'Las contraseñas no coinciden', 'error');
    errorEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Creando cuenta...';

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage('reg-error', data.message, 'error');
      errorEl.classList.remove('hidden');
      return;
    }

    showMessage('reg-success', 'Cuenta creada. Podés iniciar sesión.', 'success');
    successEl.classList.remove('hidden');
    document.getElementById('form-register').reset();
    setTimeout(() => switchTab('login'), 1500);

  } catch {
    showMessage('reg-error', 'Error de conexión con el servidor', 'error');
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Crear cuenta';
  }
}

// Redirigir si ya hay sesión activa
if (localStorage.getItem('token')) {
  window.location.href = '/map.html';
}