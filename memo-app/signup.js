import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

// 이미 로그인된 경우 앱으로 바로 이동
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = 'app.html';
});

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
    showError(errEl, null, '모든 항목을 입력해주세요');
    return;
  }
  if (pw !== pwConfirm) {
    showError(errEl, null, '비밀번호가 일치하지 않습니다');
    return;
  }

  const btn = document.getElementById('btnSignup');
  btn.disabled    = true;
  btn.textContent = '가입 중...';

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    await set(ref(db, `users/${cred.user.uid}`), {
      org, name, email,
      createdAt: new Date().toISOString(),
    });
    // onAuthStateChanged가 app.html로 리다이렉트
  } catch (err) {
    showError(errEl, err.code);
    btn.disabled    = false;
    btn.textContent = '회원가입';
  }
}

function showError(el, code, msg) {
  const map = {
    'auth/invalid-email':        '올바른 이메일 형식이 아닙니다',
    'auth/email-already-in-use': '이미 사용 중인 아이디입니다',
    'auth/weak-password':        '비밀번호는 6자 이상이어야 합니다',
    'auth/too-many-requests':    '잠시 후 다시 시도해주세요',
  };
  el.textContent = msg || map[code] || '오류가 발생했습니다. 다시 시도해주세요';
  el.classList.remove('hidden');
}
