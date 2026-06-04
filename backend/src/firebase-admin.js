const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const auth   = admin.auth();
const DB_URL = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');

// 사용자 ID 토큰으로 Firebase REST API 호출 (서비스 계정 키 서명 불필요)
async function dbRequest(method, path, body, idToken) {
  const url = `${DB_URL}${path}.json?auth=${idToken}`;
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body:    body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB ${res.status}: ${text}`);
  }
  return res.json();
}

module.exports = { auth, dbRequest };
