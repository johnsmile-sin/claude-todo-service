const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/auth');
const { dbRequest }  = require('../firebase-admin');

router.use(authMiddleware);

// GET /api/todos
router.get('/', async (req, res) => {
  try {
    const data  = await dbRequest('GET', `/todos/${req.uid}`, null, req.idToken);
    const todos = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
    res.json(todos);
  } catch (err) {
    console.error('[todos GET]', err.message);
    res.status(500).json({ message: '할일을 불러오는데 실패했습니다' });
  }
});

// POST /api/todos
router.post('/', async (req, res) => {
  try {
    const todo = {
      title:      '',
      dueDate:    '',
      notes:      '',
      done:       false,
      important:  false,
      authorName: req.body.authorName || '',
      authorId:   req.uid,
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    };
    const result = await dbRequest('POST', `/todos/${req.uid}`, todo, req.idToken);
    res.json({ id: result.name, ...todo });
  } catch (err) {
    console.error('[todos POST]', err.message);
    res.status(500).json({ message: '할일 생성에 실패했습니다' });
  }
});

// PATCH /api/todos/:id
router.patch('/:id', async (req, res) => {
  const updates = { ...req.body, updatedAt: new Date().toISOString() };
  try {
    await dbRequest('PATCH', `/todos/${req.uid}/${req.params.id}`, updates, req.idToken);
    res.json({ success: true });
  } catch (err) {
    console.error('[todos PATCH]', err.message);
    res.status(500).json({ message: '할일 수정에 실패했습니다' });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
  try {
    await dbRequest('DELETE', `/todos/${req.uid}/${req.params.id}`, null, req.idToken);
    res.json({ success: true });
  } catch (err) {
    console.error('[todos DELETE]', err.message);
    res.status(500).json({ message: '할일 삭제에 실패했습니다' });
  }
});

module.exports = router;
