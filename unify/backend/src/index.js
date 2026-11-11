require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const opportunitiesRoutes = require('./routes/opportunities');
const applicationsRoutes = require('./routes/applications');
const supplyChainRoutes = require('./routes/supplyChain');
const collaborationsRoutes = require('./routes/collaborations');
const govContractsRoutes = require('./routes/govContracts');
const govTendersRoutes = require('./routes/govTenders');
const messagesRoutes = require('./routes/messages');
const notificationsRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Global Middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    callback(null, true);
  }, 
  credentials: true 
}));
app.use(morgan('dev'));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/supply-chain', supplyChainRoutes);
app.use('/api/collaborations', collaborationsRoutes);
app.use('/api/gov-contracts', govContractsRoutes);
app.use('/api/gov-tenders', govTendersRoutes);
app.use('/api/conversations', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/profile', profileRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// Listen only when run directly (node/nodemon). On Vercel the app is imported
// by api/index.js and served as a serverless function instead.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`UNIFY backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
