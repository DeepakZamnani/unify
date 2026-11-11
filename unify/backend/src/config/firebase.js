// No service account available — we talk to Firebase over its public REST
// APIs instead of firebase-admin. See lib/firestoreRest.js and
// middleware/auth.js for how these two values get used.
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const API_KEY = process.env.FIREBASE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  throw new Error('FIREBASE_PROJECT_ID and FIREBASE_API_KEY must be set in backend/.env');
}

module.exports = { PROJECT_ID, API_KEY };
