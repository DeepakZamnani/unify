const router = require('express').Router();
const { getDoc, updateDoc } = require('../lib/firestoreRest');
const { requireAuth } = require('../middleware/auth');

// Single shared company profile document (matches original single-tenant design).
const DOC_PATH = 'profile/main';

// GET /api/profile
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDoc(DOC_PATH, req.user.idToken);
    if (!doc) return res.status(404).json({ error: 'Profile not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const { companyName, industry, employees, location, capabilities, certifications, bio, pastProjects } = req.body;
    const data = {
      companyName, industry, employees, location,
      capabilities: capabilities || [], certifications: certifications || [],
      bio, pastProjects: pastProjects || [],
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(DOC_PATH, data, req.user.idToken);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
