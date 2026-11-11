const { jwtVerify, createRemoteJWKSet } = require('jose');
const { PROJECT_ID } = require('../config/firebase');

// Firebase ID tokens are Google-signed JWTs — verifiable with Google's public
// signing keys, no service account required. See:
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Verifies the Firebase ID token sent by the frontend and attaches the
// caller's uid/email/isAdmin (and the raw token, needed to make Firestore
// REST calls on the caller's behalf) to req.user.
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const idToken = authHeader.slice('Bearer '.length);
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });

    const email = payload.email || '';
    req.user = { uid: payload.sub, email, isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()), idToken };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
