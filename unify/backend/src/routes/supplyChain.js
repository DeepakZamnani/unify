const router = require('express').Router();
const { listDocs, getDoc, createDoc } = require('../lib/firestoreRest');
const { requireAuth } = require('../middleware/auth');

const COLLECTION = 'supplyChainRequests';

// GET /api/supply-chain
router.get('/', async (req, res, next) => {
  try {
    const docs = await listDocs(COLLECTION, { orderBy: 'createdAt', direction: 'DESCENDING' });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// GET /api/supply-chain/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await getDoc(`${COLLECTION}/${req.params.id}`);
    if (!doc) return res.status(404).json({ error: 'Supply chain request not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/supply-chain
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { companyName, title, sector, quantity, budget, location, deadline, description } = req.body;
    if (!companyName || !title) return res.status(400).json({ error: 'companyName and title are required' });

    const doc = await createDoc(COLLECTION, {
      companyName, title, sector, quantity, budget, location, deadline, description,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    }, req.user.idToken);
    res.status(201).json({ id: doc.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
