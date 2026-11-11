const router = require('express').Router();
const { listDocs, getDoc, createDoc, updateDoc } = require('../lib/firestoreRest');
const { requireAuth } = require('../middleware/auth');

const COLLECTION = 'applications';

// GET /api/applications — Applications submitted by current user (Applicant view)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const docs = await listDocs(COLLECTION, { orderBy: 'createdAt', direction: 'DESCENDING' }, req.user.idToken);
    const myApps = docs.filter((d) => d.createdBy === req.user.uid || d.applicantId === req.user.uid);
    res.json(myApps);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/requests — Incoming requests for opportunities owned by current user (Owner view)
router.get('/requests', requireAuth, async (req, res, next) => {
  try {
    const userProfile = await getDoc(`users/${req.user.uid}`, req.user.idToken).catch(() => null);
    const userCompany = userProfile?.company?.toLowerCase() || '';

    const docs = await listDocs(COLLECTION, { orderBy: 'createdAt', direction: 'DESCENDING' }, req.user.idToken);
    
    // Filter requests where current user is the owner (by ownerId or company name match or not created by applicant)
    const requestsForMe = docs.filter((d) => {
      if (d.createdBy === req.user.uid) return false; // exclude self-created applications
      if (d.ownerId && d.ownerId === req.user.uid) return true;
      if (userCompany && d.company && d.company.toLowerCase() === userCompany) return true;
      // Default fallback: if no explicit ownerId and not self, include so owner receives it
      return !d.ownerId;
    });

    res.json(requestsForMe);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id — Get specific application
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDoc(`${COLLECTION}/${req.params.id}`, req.user.idToken);
    if (!doc) return res.status(404).json({ error: 'Application not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/applications — Submit application for an opportunity
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      opportunityId,
      opportunityTitle,
      opportunityType,
      ownerId,
      message,
      sector,
      budget,
      company,
      location,
      description,
    } = req.body;

    if (!opportunityTitle) return res.status(400).json({ error: 'opportunityTitle is required' });

    // 1. Prevent duplicate applications
    const existing = await listDocs(COLLECTION, {}, req.user.idToken);
    const hasApplied = existing.some((a) => (
      (a.createdBy === req.user.uid || a.applicantId === req.user.uid) &&
      (a.opportunityId === opportunityId || a.opportunityTitle === opportunityTitle) &&
      a.status !== 'withdrawn'
    ));

    if (hasApplied) {
      return res.status(400).json({ error: 'You have already submitted an application for this opportunity.' });
    }

    // 2. Fetch applicant profile info
    const applicantProfile = await getDoc(`users/${req.user.uid}`, req.user.idToken).catch(() => null);

    // 3. Resolve opportunity owner if not provided
    let resolvedOwnerId = ownerId || '';
    if (!resolvedOwnerId && opportunityId) {
      // Lookup collaboration or supply chain request to find owner
      const collab = await getDoc(`collaborations/${opportunityId}`, req.user.idToken).catch(() => null);
      if (collab?.createdBy) resolvedOwnerId = collab.createdBy;
      if (!resolvedOwnerId) {
        const sc = await getDoc(`supplyChainRequests/${opportunityId}`, req.user.idToken).catch(() => null);
        if (sc?.createdBy) resolvedOwnerId = sc.createdBy;
      }
    }

    // 4. Save centralized application doc
    const doc = await createDoc(COLLECTION, {
      opportunityId: opportunityId || '',
      opportunityTitle,
      opportunityType: opportunityType || 'opportunity',
      ownerId: resolvedOwnerId,
      applicantId: req.user.uid,
      applicantName: applicantProfile?.name || 'Applicant',
      applicantCompany: applicantProfile?.company || 'MSME Enterprise',
      message: message || '',
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      sector: sector || '',
      budget: budget || '',
      company: company || '',
      location: location || '',
      description: description || '',
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, req.user.idToken);

    // 5. Notify opportunity owner if ownerId is set and not self
    if (resolvedOwnerId && resolvedOwnerId !== req.user.uid) {
      await createDoc('notifications', {
        recipientId: resolvedOwnerId,
        title: 'New Application Received',
        desc: `You received a new request for "${opportunityTitle}" from ${applicantProfile?.company || 'an applicant'}.`,
        link: '/requests',
        read: false,
        time: 'Just now',
        createdAt: new Date().toISOString(),
      }, req.user.idToken).catch(() => {});
    }

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status — Accept, Reject, or Withdraw application
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'withdrawn', 'pending'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const docPath = `${COLLECTION}/${req.params.id}`;
    const app = await getDoc(docPath, req.user.idToken);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Authorization check:
    // Only applicant can withdraw
    if (status === 'withdrawn' && app.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'Only the applicant can withdraw this application' });
    }

    // Only owner (or admin) can accept/reject
    if ((status === 'accepted' || status === 'rejected') && app.ownerId && app.ownerId !== req.user.uid && !req.user.isAdmin) {
      const userProfile = await getDoc(`users/${req.user.uid}`, req.user.idToken).catch(() => null);
      const userCompany = userProfile?.company?.toLowerCase() || '';
      if (!userCompany || app.company?.toLowerCase() !== userCompany) {
        return res.status(403).json({ error: 'Only the opportunity owner can accept or reject this request' });
      }
    }

    const updated = await updateDoc(docPath, {
      status,
      updatedAt: new Date().toISOString(),
    }, req.user.idToken);

    // Send notification to applicant if owner accepted or rejected
    if ((status === 'accepted' || status === 'rejected') && app.createdBy && app.createdBy !== req.user.uid) {
      const title = status === 'accepted' ? 'Application Accepted 🎉' : 'Application Status Update';
      const desc = status === 'accepted'
        ? `Your application for "${app.opportunityTitle}" has been accepted.`
        : `Your application for "${app.opportunityTitle}" was not selected.`;

      await createDoc('notifications', {
        recipientId: app.createdBy,
        title,
        desc,
        link: '/applications',
        read: false,
        time: 'Just now',
        createdAt: new Date().toISOString(),
      }, req.user.idToken).catch(() => {});
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
