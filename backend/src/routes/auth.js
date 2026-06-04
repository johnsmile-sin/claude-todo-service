const express = require('express');
const router  = express.Router();
const { auth, dbRequest } = require('../firebase-admin');

const FIREBASE_API_KEY  = process.env.FIREBASE_API_KEY;
const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요' });

  try {
    const response = await fetch(
      `${FIREBASE_AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await response.json();
    if (!response.ok)
      return res.status(401).json({ code: data.error?.message, message: mapAuthError(data.error?.message) });

    res.json({ idToken: data.idToken, uid: data.localId, email: data.email });
  } catch {
    res.status(500).json({ message: '로그인 처리 중 오류가 발생했습니다' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name, org } = req.body;
  if (!email || !password || !name || !org)
    return res.status(400).json({ message: '모든 항목을 입력해주세요' });

  try {
    const userRecord = await auth.createUser({ email, password });

    // 가입 직후 로그인하여 idToken 발급
    const loginRes  = await fetch(
      `${FIREBASE_AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const loginData = await loginRes.json();
    const idToken   = loginData.idToken;

    // 발급된 idToken으로 프로필 저장
    await dbRequest('PUT', `/users/${userRecord.uid}`, {
      org, name, email,
      createdAt: new Date().toISOString(),
    }, idToken);

    res.json({ idToken, uid: userRecord.uid });
  } catch (err) {
    const code = err.errorInfo?.code || err.code;
    res.status(400).json({ code, message: mapAuthError(code) });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (token) {
    try {
      const decoded = await auth.verifyIdToken(token);
      await auth.revokeRefreshTokens(decoded.uid);
    } catch {}
  }
  res.json({ success: true });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: '이메일을 입력해주세요' });

  try {
    const response = await fetch(
      `${FIREBASE_AUTH_URL}:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
      }
    );
    const data = await response.json();
    if (!response.ok)
      return res.status(400).json({ code: data.error?.message, message: mapAuthError(data.error?.message) });

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: '오류가 발생했습니다' });
  }
});

function mapAuthError(code) {
  const map = {
    'EMAIL_NOT_FOUND':              '존재하지 않는 아이디입니다',
    'INVALID_PASSWORD':             '비밀번호가 틀렸습니다',
    'INVALID_LOGIN_CREDENTIALS':    '아이디 또는 비밀번호가 틀렸습니다',
    'INVALID_EMAIL':                '올바른 이메일 형식이 아닙니다',
    'EMAIL_EXISTS':                 '이미 사용 중인 아이디입니다',
    'WEAK_PASSWORD : Password should be at least 6 characters':
                                    '비밀번호는 6자 이상이어야 합니다',
    'TOO_MANY_ATTEMPTS_TRY_LATER':  '잠시 후 다시 시도해주세요',
    'auth/email-already-exists':    '이미 사용 중인 아이디입니다',
    'auth/weak-password':           '비밀번호는 6자 이상이어야 합니다',
    'auth/invalid-email':           '올바른 이메일 형식이 아닙니다',
  };
  return map[code] || '오류가 발생했습니다. 다시 시도해주세요';
}

module.exports = router;
