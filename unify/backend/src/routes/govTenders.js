const router = require('express').Router();
const { listDocs, getDoc, createDoc, updateDoc, deleteDoc } = require('../lib/firestoreRest');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const COLLECTION = 'governmentTenders';
const FIELDS = ['title', 'department', 'location', 'budget', 'deadline', 'sector', 'verified', 'description', 'fullDescription', 'applyLink', 'status'];

const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// GET /api/gov-tenders
router.get('/', async (req, res, next) => {
  try {
    const docs = await listDocs(COLLECTION, { orderBy: 'createdAt', direction: 'DESCENDING' });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// GET /api/gov-tenders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await getDoc(`${COLLECTION}/${req.params.id}`);
    if (!doc) return res.status(404).json({ error: 'Tender not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/gov-tenders — admin only
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: 'title is required' });
    const data = { status: 'active', verified: false, ...pick(req.body), createdAt: new Date().toISOString() };
    const doc = await createDoc(COLLECTION, data, req.user.idToken);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// PUT /api/gov-tenders/:id — admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await updateDoc(`${COLLECTION}/${req.params.id}`, pick(req.body), req.user.idToken);
    res.json({ id: req.params.id, ...pick(req.body) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/gov-tenders/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await deleteDoc(`${COLLECTION}/${req.params.id}`, req.user.idToken);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
