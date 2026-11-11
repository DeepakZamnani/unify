// Firestore access without firebase-admin: every call is made over the
// public Firestore REST API, authenticated as the calling user (their own
// Firebase ID token, forwarded as-is) so that firestore.rules — not this
// server — is the actual access-control boundary. Falls back to the public
// API key for routes with no signed-in caller (rules must allow that read).
const { PROJECT_ID, API_KEY } = require('../config/firebase');

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function authHeaders(idToken) {
  return idToken ? { Authorization: `Bearer ${idToken}` } : {};
}

// Builds a Firestore REST URL with query params, adding ?key= when there's no
// caller token (Firestore accepts either a bearer token or the API key).
// `:runQuery`/`:commit` suffixes attach directly with no slash (per the
// Firestore REST API), everything else is a path segment under BASE.
function buildUrl(suffix, params, idToken) {
  const qs = new URLSearchParams(params);
  if (!idToken) qs.set('key', API_KEY);
  const query = qs.toString();
  const path = suffix.startsWith(':') ? `${BASE}${suffix}` : `${BASE}/${suffix}`;
  return `${path}${query ? `?${query}` : ''}`;
}

class FirestoreError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new FirestoreError(res.status, body?.error?.message || `Firestore request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Value encode/decode (JS <-> Firestore REST wire format) ────────────────

function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === 'object') return { mapValue: { fields: encodeFields(v) } };
  throw new Error(`Cannot encode Firestore value: ${v}`);
}

function encodeFields(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => [k, encodeValue(v)]));
}

function decodeValue(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  if ('timestampValue' in v) return v.timestampValue;
  return null;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([k, v]) => [k, decodeValue(v)]));
}

function idFromName(name) {
  return name.split('/').pop();
}

function decodeDoc(doc) {
  return { id: idFromName(doc.name), ...decodeFields(doc.fields) };
}

// ── Public API ───────────────────────────────────────────────────────────

async function getDoc(path, idToken) {
  try {
    const doc = await request(buildUrl(path, {}, idToken), { headers: authHeaders(idToken) });
    return decodeDoc(doc);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

// opts: { orderBy, direction, where: { field, op, value }, limit }
async function listDocs(collectionPath, opts, idToken) {
  const parts = collectionPath.split('/');
  const collectionId = parts.pop();
  const parentPath = parts.join('/');

  const structuredQuery = { from: [{ collectionId }] };
  if (opts?.orderBy) structuredQuery.orderBy = [{ field: { fieldPath: opts.orderBy }, direction: opts.direction || 'ASCENDING' }];
  if (opts?.where) {
    structuredQuery.where = {
      fieldFilter: { field: { fieldPath: opts.where.field }, op: opts.where.op, value: encodeValue(opts.where.value) },
    };
  }
  if (opts?.limit) structuredQuery.limit = opts.limit;

  const url = buildUrl(parentPath ? `${parentPath}:runQuery` : ':runQuery', {}, idToken);
  const results = await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(idToken) },
    body: JSON.stringify({ structuredQuery }),
  });
  return (results || []).filter((r) => r.document).map((r) => decodeDoc(r.document));
}

async function createDoc(collectionPath, data, idToken, { documentId } = {}) {
  const url = buildUrl(collectionPath, documentId ? { documentId } : {}, idToken);
  const doc = await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(idToken) },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  return decodeDoc(doc);
}

// Always sends an explicit updateMask matching `data`'s keys, so this is a
// merge (like admin SDK's .update()/.set({merge:true})), not a full replace.
async function updateDoc(path, data, idToken) {
  const params = new URLSearchParams();
  Object.keys(data).forEach((f) => params.append('updateMask.fieldPaths', f));
  const url = buildUrl(path, params, idToken);
  const doc = await request(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(idToken) },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  return decodeDoc(doc);
}

async function deleteDoc(path, idToken) {
  await request(buildUrl(path, {}, idToken), { method: 'DELETE', headers: authHeaders(idToken) });
}

// writes: [{ path, data }] — each becomes a merge-update write in one atomic commit
async function commitWrites(writes, idToken) {
  const body = {
    writes: writes.map(({ path, data }) => ({
      update: { name: `projects/${PROJECT_ID}/databases/(default)/documents/${path}`, fields: encodeFields(data) },
      updateMask: { fieldPaths: Object.keys(data) },
    })),
  };
  await request(buildUrl(':commit', {}, idToken), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(idToken) },
    body: JSON.stringify(body),
  });
}

module.exports = { getDoc, listDocs, createDoc, updateDoc, deleteDoc, commitWrites };
