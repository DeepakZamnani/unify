const router = require('express').Router();
const { listDocs, getDoc, createDoc } = require('../lib/firestoreRest');
const { requireAuth } = require('../middleware/auth');

const COLLECTION = 'collaborations';

// GET /api/collaborations
router.get('/', async (req, res, next) => {
  try {
    const docs = await listDocs(COLLECTION, { orderBy: 'createdAt', direction: 'DESCENDING' });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// GET /api/collaborations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await getDoc(`${COLLECTION}/${req.params.id}`);
    if (!doc) return res.status(404).json({ error: 'Collaboration not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/collaborations
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { companyName, projectTitle, requiredSkills, budget, sector, partnersNeeded, description } = req.body;
    if (!companyName || !projectTitle) return res.status(400).json({ error: 'companyName and projectTitle are required' });

    const doc = await createDoc(COLLECTION, {
      companyName, projectTitle, requiredSkills: requiredSkills || [], budget, sector,
      partnersNeeded: partnersNeeded || 1, description,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    }, req.user.idToken);
    res.status(201).json({ id: doc.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
