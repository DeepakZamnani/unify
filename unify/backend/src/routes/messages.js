const router = require('express').Router();
const { listDocs, createDoc, updateDoc } = require('../lib/firestoreRest');
const { requireAuth } = require('../middleware/auth');

const CONVERSATIONS = 'conversations';

// GET /api/conversations — includes each conversation's messages
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const convos = await listDocs(CONVERSATIONS, { orderBy: 'lastMessageAt', direction: 'DESCENDING' }, req.user.idToken);
    const conversations = await Promise.all(convos.map(async (c) => {
      const messages = await listDocs(`${CONVERSATIONS}/${c.id}/messages`, { orderBy: 'createdAt', direction: 'ASCENDING' }, req.user.idToken);
      return { ...c, messages };
    }));
    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/:id/messages — Body: { text }
router.post('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const createdAt = new Date().toISOString();
    const message = await createDoc(`${CONVERSATIONS}/${req.params.id}/messages`, { text, sender: 'me', createdAt }, req.user.idToken);
    await updateDoc(`${CONVERSATIONS}/${req.params.id}`, {
      lastMessage: text,
      lastMessageAt: createdAt,
      unreadCount: 0,
    }, req.user.idToken);

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
