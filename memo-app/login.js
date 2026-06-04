import { api, setToken, clearToken } from './api.js';

// 이미 로그인된 경우 앱으로 바로 이동
if (localStorage.getItem('idToken')) {
  window.location.href = 'app.html';
}

document.getElementById('btnLogin').addEventListener('click', handleLogin);
document.getElementById('loginPw').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});

async function handleLogin() {
  const email = document.getElementById('loginId').value.trim();
  const pw    = document.getElementById('loginPw').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');

  if (!email || !pw) {
    showError(errEl, '아이디와 비밀번호를 입력해주세요');
    return;
  }

  const btn = document.getElementById('btnLogin');
  btn.disabled    = true;
  btn.textContent = '로그인 중...';

  try {
    const data = await api.auth.login(email, pw);

    if (data?.idToken) {
      clearToken();
      setToken(data.idToken);
      localStorage.setItem('uid', data.uid);
      window.location.href = 'app.html';
    } else {
      showError(errEl, data?.message || '로그인에 실패했습니다');
      btn.disabled    = false;
      btn.textContent = '로그인';
    }
  } catch {
    showError(errEl, '오류가 발생했습니다. 다시 시도해주세요');
    btn.disabled    = false;
    btn.textContent = '로그인';
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}
