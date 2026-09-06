import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { jwtVerify, importJWK } from 'jose';
import app from '../src/index.ts';

// Simple in-memory mock of Cloudflare D1 for testing Hono handlers
function createMockD1() {
  const users = [];
  const signingKeys = [];

  return {
    prepare(query) {
      return {
        _params: [],
        bind(...params) {
          this._params = params;
          return this;
        },
        async first() {
          if (query.includes('FROM signing_keys')) {
            return signingKeys[0] || null;
          }
          if (query.includes('FROM users WHERE email = ?')) {
            const [email] = this._params;
            return users.find(u => u.email === email) || null;
          }
          if (query.includes('FROM users WHERE id = ?')) {
            const [id] = this._params;
            return users.find(u => u.id === id) || null;
          }
          if (query.includes('SELECT COUNT(*) as c FROM users')) {
            return { c: users.length };
          }
          return null;
        },
        async all() {
          if (query.includes('FROM users')) {
            return { results: [...users] };
          }
          return { results: [] };
        },
        async run() {
          if (query.includes('INSERT INTO signing_keys')) {
            const [kid, public_jwk, private_jwk, alg] = this._params;
            signingKeys.push({ kid, public_jwk, private_jwk, alg, created_at: new Date().toISOString() });
            return { success: true };
          }
          if (query.includes('INSERT INTO users')) {
            const [id, email, name, avatar_url, role, provider, provider_id, status] = this._params;
            users.push({ id, email, name, avatar_url, role, provider, provider_id, status, created_at: new Date().toISOString() });
            return { success: true };
          }
          if (query.includes('UPDATE users SET role = ?')) {
            const [role, id] = this._params;
            const u = users.find(x => x.id === id);
            if (u) u.role = role;
            return { success: true };
          }
          if (query.includes('UPDATE users SET status = ?')) {
            const [status, id] = this._params;
            const u = users.find(x => x.id === id);
            if (u) u.status = status;
            return { success: true };
          }
          return { success: true };
        }
      };
    }
  };
}

describe('AaaS Server Endpoints', async () => {
  let mockEnv;

  before(async () => {
    mockEnv = {
      DB: createMockD1(),
      APP_NAME: 'Test AaaS',
      DEV_MODE: 'true',
      JWT_ISSUER: 'https://test-auth.workers.dev'
    };
  });

  test('GET / returns 200 HTML home page', async () => {
    const res = await app.fetch(new Request('http://localhost/'), mockEnv);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Test AaaS'));
    assert.ok(text.includes('JWKS (Public Keys)'));
  });

  test('GET /.well-known/openid-configuration returns valid OIDC metadata', async () => {
    const res = await app.fetch(new Request('http://localhost/.well-known/openid-configuration'), mockEnv);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.issuer, 'https://test-auth.workers.dev');
    assert.strictEqual(data.jwks_uri, 'http://localhost/.well-known/jwks.json');
  });

  test('GET /.well-known/jwks.json initializes and returns public key', async () => {
    const res = await app.fetch(new Request('http://localhost/.well-known/jwks.json'), mockEnv);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.keys));
    assert.strictEqual(data.keys.length, 1);
    assert.strictEqual(data.keys[0].kty, 'RSA');
    assert.strictEqual(data.keys[0].alg, 'RS256');
  });

  test('POST /auth/dev-login issues a valid signed JWT with role', async () => {
    const formData = new FormData();
    formData.append('preset', 'admin');
    formData.append('redirect_uri', 'http://localhost:3000/callback');

    const res = await app.fetch(new Request('http://localhost/auth/dev-login', {
      method: 'POST',
      body: formData
    }), mockEnv);

    // Expect redirect
    assert.strictEqual(res.status, 302);
    const location = res.headers.get('location');
    assert.ok(location);
    const redirectUrl = new URL(location);
    assert.strictEqual(redirectUrl.origin, 'http://localhost:3000');
    assert.strictEqual(redirectUrl.pathname, '/callback');

    const token = redirectUrl.searchParams.get('token');
    assert.ok(token);

    // Verify token against the JWKS public key
    const jwksRes = await app.fetch(new Request('http://localhost/.well-known/jwks.json'), mockEnv);
    const jwks = await jwksRes.json();
    const publicKey = await importJWK(jwks.keys[0], 'RS256');

    const { payload } = await jwtVerify(token, publicKey, {
      issuer: 'https://test-auth.workers.dev'
    });

    assert.strictEqual(payload.email, 'alice@example.com');
    assert.strictEqual(payload.role, 'admin');
  });

  test('GET /admin displays registered users', async () => {
    const res = await app.fetch(new Request('http://localhost/admin'), mockEnv);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Admin Console'));
    assert.ok(html.includes('alice@example.com'));
  });

  test('GET /admin on pristine uninitialized database auto-creates schema and returns 200', async () => {
    const pristineEnv = {
      DB: createMockD1(),
      APP_NAME: 'Fresh AaaS',
      DEV_MODE: 'true',
      JWT_ISSUER: 'https://fresh-auth.workers.dev'
    };
    const res = await app.fetch(new Request('http://localhost/admin'), pristineEnv);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Fresh AaaS Admin Console'));
    assert.ok(html.includes('Total Users'));
    assert.ok(html.includes('No users have registered yet'));
  });
});
