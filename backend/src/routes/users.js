const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/auth');
const { dbRequest }  = require('../firebase-admin');

router.use(authMiddleware);

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const profile = await dbRequest('GET', `/users/${req.uid}`, null, req.idToken);
    res.json(profile || {});
  } catch (err) {
    console.error('[users/me]', err.message);
    res.status(500).json({ message: '프로필을 불러오는데 실패했습니다' });
  }
});

module.exports = router;
