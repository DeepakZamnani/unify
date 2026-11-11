const router = require('express').Router();
const { listDocs, updateDoc, commitWrites } = require('../lib/firestoreRest');
const { requireAuth } = require('../middleware/auth');

const COLLECTION = 'notifications';

// GET /api/notifications
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const docs = await listDocs(COLLECTION, { orderBy: 'createdAt', direction: 'DESCENDING' }, req.user.idToken);
    const userNotifications = docs.filter((n) => !n.recipientId || n.recipientId === req.user.uid);
    res.json(userNotifications);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    await updateDoc(`${COLLECTION}/${req.params.id}`, { read: true }, req.user.idToken);
    res.json({ id: req.params.id, read: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    const unread = await listDocs(COLLECTION, { where: { field: 'read', op: 'EQUAL', value: false } }, req.user.idToken);
    if (unread.length) {
      await commitWrites(unread.map((d) => ({ path: `${COLLECTION}/${d.id}`, data: { read: true } })), req.user.idToken);
    }
    res.json({ updated: unread.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
