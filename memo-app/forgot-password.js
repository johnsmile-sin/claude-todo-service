import { api } from './api.js';

document.getElementById('btnFindPw').addEventListener('click', handleFindPw);
document.getElementById('findPwId').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleFindPw();
});

async function handleFindPw() {
  const email = document.getElementById('findPwId').value.trim();
  const errEl = document.getElementById('findPwError');
  const okEl  = document.getElementById('findPwSuccess');
  const btn   = document.getElementById('btnFindPw');
  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (!email) {
    showError(errEl, '이메일을 입력해주세요');
    return;
  }

  btn.disabled    = true;
  btn.textContent = '발송 중...';

  try {
    const data = await api.auth.forgotPassword(email);

    if (data?.success) {
      okEl.classList.remove('hidden');
      btn.textContent = '발송 완료';
    } else {
      showError(errEl, data?.message || '오류가 발생했습니다');
      btn.disabled    = false;
      btn.textContent = '재설정 메일 발송';
    }
  } catch {
    showError(errEl, '오류가 발생했습니다. 다시 시도해주세요');
    btn.disabled    = false;
    btn.textContent = '재설정 메일 발송';
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}
