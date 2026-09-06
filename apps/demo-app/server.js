const express = require('express');
const path = require('path');
const { requireAuth } = require('@aaas/sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const AAAS_ISSUER = process.env.AAAS_ISSUER || 'http://localhost:8787';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Client app config (tells frontend where the AaaS server lives)
app.get('/api/config', (req, res) => {
  res.json({
    authUrl: `${AAAS_ISSUER}/auth/login`,
    issuer: AAAS_ISSUER
  });
});

// Public route - anyone can access
app.get('/api/public', (req, res) => {
  res.json({
    status: 'success',
    message: 'This is public data. No authentication required.'
  });
});

// Authenticated route - any logged-in user can access
app.get('/api/profile', requireAuth({ issuer: AAAS_ISSUER }), (req, res) => {
  res.json({
    status: 'success',
    message: `Hello ${req.user.name || req.user.email}! You are authenticated.`,
    user: req.user
  });
});

// Admin-only route - strictly requires role: 'admin'
app.get('/api/admin', requireAuth({ issuer: AAAS_ISSUER, role: 'admin' }), (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the Admin Vault! You have verified "admin" privileges.',
    user: req.user
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Demo app running at http://localhost:${PORT}`);
    console.log(`Using AaaS Auth Server at ${AAAS_ISSUER}`);
  });
}

module.exports = { app };
