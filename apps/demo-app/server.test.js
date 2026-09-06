const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const express = require('express');
const { requireAuth } = require('@aaas/sdk');

describe('Demo App Protected Routes', async () => {
  let server;
  let baseUrl;
  let privateKey;
  let publicKeyJwk;

  before(async () => {
    // Generate test signing keys
    const keyPair = await generateKeyPair('RS256');
    privateKey = keyPair.privateKey;
    publicKeyJwk = await exportJWK(keyPair.publicKey);
    publicKeyJwk.alg = 'RS256';

    const app = express();
    app.use(express.json());

    // Public route
    app.get('/api/public', (req, res) => {
      res.json({ message: 'public' });
    });

    // Profile route (any authenticated user)
    app.get('/api/profile', requireAuth({
      publicKey: publicKeyJwk,
      issuer: 'http://mock-auth'
    }), (req, res) => {
      res.json({ user: req.user });
    });

    // Admin route (admin role only)
    app.get('/api/admin', requireAuth({
      publicKey: publicKeyJwk,
      issuer: 'http://mock-auth',
      role: 'admin'
    }), (req, res) => {
      res.json({ admin: true, user: req.user });
    });

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  async function createToken(payload = {}) {
    return await new SignJWT({
      role: 'user',
      name: 'Test User',
      email: 'user@example.com',
      ...payload
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer('http://mock-auth')
      .setSubject(payload.sub || 'usr_test123')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);
  }

  test('GET /api/public returns 200 without credentials', async () => {
    const res = await fetch(`${baseUrl}/api/public`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.message, 'public');
  });

  test('GET /api/profile returns 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/api/profile`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/profile returns 200 with valid user token', async () => {
    const token = await createToken({ name: 'Bob', role: 'user' });
    const res = await fetch(`${baseUrl}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.name, 'Bob');
    assert.strictEqual(data.user.role, 'user');
  });

  test('GET /api/admin returns 403 when user is not admin', async () => {
    const userToken = await createToken({ name: 'Bob', role: 'user' });
    const res = await fetch(`${baseUrl}/api/admin`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(res.status, 403);
  });

  test('GET /api/admin returns 200 when user is admin', async () => {
    const adminToken = await createToken({ name: 'Alice', role: 'admin' });
    const res = await fetch(`${baseUrl}/api/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.admin, true);
    assert.strictEqual(data.user.role, 'admin');
  });
});
