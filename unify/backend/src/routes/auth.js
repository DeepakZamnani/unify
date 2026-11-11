const router = require('express').Router();
const { getDoc, createDoc } = require('../lib/firestoreRest');
const { requireAuth } = require('../middleware/auth');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// POST /api/auth/signup — called right after the frontend creates the
// Firebase Auth account (createUserWithEmailAndPassword). Requires a valid
// ID token so the profile can only ever be written by the account owner.
// Body: { name, company }
router.post('/signup', requireAuth, async (req, res, next) => {
  try {
    const { name, company } = req.body;
    if (!name || !company) return res.status(400).json({ error: 'name and company are required' });

    const existing = await getDoc(`users/${req.user.uid}`, req.user.idToken);
    if (existing) return res.status(409).json({ error: 'Profile already exists' });

    const isAdmin = ADMIN_EMAILS.includes((req.user.email || '').toLowerCase());
    const createdAt = new Date().toISOString();
    const profile = { name, email: req.user.email, company, isAdmin, createdAt };
    await createDoc('users', profile, req.user.idToken, { documentId: req.user.uid });

    res.status(201).json({ uid: req.user.uid, ...profile });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — current user's profile (creates none, just reads)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDoc(`users/${req.user.uid}`, req.user.idToken);
    if (!doc) return res.status(404).json({ error: 'Profile not found' });
    res.json({ uid: req.user.uid, ...doc });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
