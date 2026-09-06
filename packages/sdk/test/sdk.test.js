const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const { createAaaSVerifier, requireAuth } = require('../src/index.js');

describe('AaaS SDK & Middleware', async () => {
  let publicKeyJwk;
  let privateKey;
  let verifier;

  before(async () => {
    const keyPair = await generateKeyPair('RS256');
    privateKey = keyPair.privateKey;
    publicKeyJwk = await exportJWK(keyPair.publicKey);
    publicKeyJwk.alg = 'RS256';

    verifier = createAaaSVerifier({
      publicKey: publicKeyJwk,
      issuer: 'https://auth.example.com',
      audience: 'test-client'
    });
  });

  async function createToken(payload = {}, options = {}) {
    return await new SignJWT({
      role: 'user',
      name: 'Test User',
      email: 'user@example.com',
      ...payload
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(options.issuer !== undefined ? options.issuer : 'https://auth.example.com')
      .setAudience(options.audience !== undefined ? options.audience : 'test-client')
      .setSubject(payload.sub || 'user_123')
      .setIssuedAt()
      .setExpirationTime(options.exp || '2h')
      .sign(privateKey);
  }

  test('verify valid token returns parsed user', async () => {
    const token = await createToken({ name: 'Alice', email: 'alice@example.com', role: 'admin' });
    const result = await verifier.verify(token);

    assert.strictEqual(result.user.id, 'user_123');
    assert.strictEqual(result.user.name, 'Alice');
    assert.strictEqual(result.user.email, 'alice@example.com');
    assert.strictEqual(result.user.role, 'admin');
  });

  test('requireAuth rejects request without token', async () => {
    const middleware = requireAuth({
      publicKey: publicKeyJwk,
      issuer: 'https://auth.example.com',
      audience: 'test-client'
    });

    let statusCode = 0;
    let jsonBody = null;
    let nextCalled = false;

    const req = { headers: {} };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      }
    };
    const next = () => { nextCalled = true; };

    await middleware(req, res, next);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonBody.error, 'Unauthorized');
  });

  test('requireAuth rejects invalid token', async () => {
    const middleware = requireAuth({
      publicKey: publicKeyJwk,
      issuer: 'https://auth.example.com',
      audience: 'test-client'
    });

    let statusCode = 0;
    let jsonBody = null;
    let nextCalled = false;

    const req = { headers: { authorization: 'Bearer invalid.token.payload' } };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      }
    };
    const next = () => { nextCalled = true; };

    await middleware(req, res, next);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCode, 401);
  });

  test('requireAuth permits valid token without role requirement', async () => {
    const token = await createToken({ name: 'Bob', role: 'user' });
    const middleware = requireAuth({
      publicKey: publicKeyJwk,
      issuer: 'https://auth.example.com',
      audience: 'test-client'
    });

    let nextCalled = false;
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = () => { nextCalled = true; };

    await middleware(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.name, 'Bob');
    assert.strictEqual(req.user.role, 'user');
  });

  test('requireAuth enforces role requirement', async () => {
    const userToken = await createToken({ name: 'Bob', role: 'user' });
    const adminToken = await createToken({ name: 'Alice', role: 'admin' });

    const adminMiddleware = requireAuth({
      publicKey: publicKeyJwk,
      issuer: 'https://auth.example.com',
      audience: 'test-client',
      role: 'admin'
    });

    // Test with regular user token -> 403 Forbidden
    let statusCode = 0;
    let jsonBody = null;
    let nextCalled = false;

    const req1 = { headers: { authorization: `Bearer ${userToken}` } };
    const res1 = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      }
    };

    await adminMiddleware(req1, res1, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonBody.error, 'Forbidden');

    // Test with admin token -> next() called
    nextCalled = false;
    const req2 = { headers: { authorization: `Bearer ${adminToken}` } };
    const res2 = {};

    await adminMiddleware(req2, res2, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req2.user.role, 'admin');
  });
});
