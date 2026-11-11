const router = require('express').Router();
const { listDocs, getDoc, updateDoc } = require('../lib/firestoreRest');
const { requireAuth } = require('../middleware/auth');

const COLLECTION = 'opportunities';

// GET /api/opportunities
router.get('/', async (req, res, next) => {
  try {
    const docs = await listDocs(COLLECTION, { orderBy: 'createdAt', direction: 'DESCENDING' });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// GET /api/opportunities/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await getDoc(`${COLLECTION}/${req.params.id}`);
    if (!doc) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/opportunities/:id/save — Body: { saved: boolean }
router.patch('/:id/save', requireAuth, async (req, res, next) => {
  try {
    const { saved } = req.body;
    await updateDoc(`${COLLECTION}/${req.params.id}`, { saved: !!saved }, req.user.idToken);
    res.json({ id: req.params.id, saved: !!saved });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
