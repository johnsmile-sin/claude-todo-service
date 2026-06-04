const { auth } = require('../firebase-admin');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    console.log('[auth] verifyIdToken 시작');
    const decoded = await auth.verifyIdToken(token);
    console.log('[auth] verifyIdToken 성공, uid:', decoded.uid);
    req.uid     = decoded.uid;
    req.idToken = token;
    next();
  } catch (err) {
    console.log('[auth] verifyIdToken 실패:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
