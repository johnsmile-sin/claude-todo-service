import { auth } from './firebase-config.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

document.getElementById('btnFindPw').addEventListener('click', handleFindPw);
document.getElementById('findPwId').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleFindPw();
});

async function handleFindPw() {
  const email  = document.getElementById('findPwId').value.trim();
  const errEl  = document.getElementById('findPwError');
  const okEl   = document.getElementById('findPwSuccess');
  const btn    = document.getElementById('btnFindPw');
  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (!email) {
    showError(errEl, null, '이메일을 입력해주세요');
    return;
  }

  btn.disabled    = true;
  btn.textContent = '발송 중...';

  try {
    await sendPasswordResetEmail(auth, email);
    okEl.classList.remove('hidden');
    btn.textContent = '발송 완료';
  } catch (err) {
    showError(errEl, err.code);
    btn.disabled    = false;
    btn.textContent = '재설정 메일 발송';
  }
}

function showError(el, code, msg) {
  const map = {
    'auth/invalid-email':  '올바른 이메일 형식이 아닙니다',
    'auth/user-not-found': '존재하지 않는 아이디입니다',
    'auth/too-many-requests': '잠시 후 다시 시도해주세요',
  };
  el.textContent = msg || map[code] || '오류가 발생했습니다. 다시 시도해주세요';
  el.classList.remove('hidden');
}
