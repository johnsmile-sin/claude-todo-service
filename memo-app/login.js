import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

// 이미 로그인된 경우 앱으로 바로 이동
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = 'app.html';
});

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
    showError(errEl, null, '아이디와 비밀번호를 입력해주세요');
    return;
  }

  const btn = document.getElementById('btnLogin');
  btn.disabled   = true;
  btn.textContent = '로그인 중...';

  try {
    await signInWithEmailAndPassword(auth, email, pw);
    // onAuthStateChanged가 리다이렉트 처리
  } catch (err) {
    showError(errEl, err.code);
    btn.disabled   = false;
    btn.textContent = '로그인';
  }
}

function showError(el, code, msg) {
  const map = {
    'auth/invalid-email':      '올바른 이메일 형식이 아닙니다',
    'auth/user-not-found':     '존재하지 않는 아이디입니다',
    'auth/wrong-password':     '비밀번호가 틀렸습니다',
    'auth/invalid-credential': '아이디 또는 비밀번호가 틀렸습니다',
    'auth/too-many-requests':  '잠시 후 다시 시도해주세요',
  };
  el.textContent = msg || map[code] || '오류가 발생했습니다. 다시 시도해주세요';
  el.classList.remove('hidden');
}
