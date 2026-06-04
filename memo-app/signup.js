import { api, setToken, clearToken } from './api.js';

// 이미 로그인된 경우 앱으로 바로 이동
if (localStorage.getItem('idToken')) {
  window.location.href = 'app.html';
}

document.getElementById('btnSignup').addEventListener('click', handleSignup);
document.getElementById('signupPwConfirm').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSignup();
});

async function handleSignup() {
  const org       = document.getElementById('signupOrg').value.trim();
  const name      = document.getElementById('signupName').value.trim();
  const email     = document.getElementById('signupId').value.trim();
  const pw        = document.getElementById('signupPw').value;
  const pwConfirm = document.getElementById('signupPwConfirm').value;
  const errEl     = document.getElementById('signupError');
  errEl.classList.add('hidden');

  if (!org || !name || !email || !pw) {
    showError(errEl, '모든 항목을 입력해주세요');
    return;
  }
  if (pw !== pwConfirm) {
    showError(errEl, '비밀번호가 일치하지 않습니다');
    return;
  }

  const btn = document.getElementById('btnSignup');
  btn.disabled    = true;
  btn.textContent = '가입 중...';

  try {
    const data = await api.auth.signup(email, pw, name, org);

    if (data?.idToken) {
      clearToken();
      setToken(data.idToken);
      localStorage.setItem('uid', data.uid);
      window.location.href = 'app.html';
    } else {
      showError(errEl, data?.message || '회원가입에 실패했습니다');
      btn.disabled    = false;
      btn.textContent = '회원가입';
    }
  } catch {
    showError(errEl, '오류가 발생했습니다. 다시 시도해주세요');
    btn.disabled    = false;
    btn.textContent = '회원가입';
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}
