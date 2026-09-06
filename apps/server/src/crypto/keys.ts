import { generateKeyPair, exportJWK, importJWK, SignJWT, jwtVerify } from 'jose';
import type { Env, SigningKeyRecord, User } from '../types.ts';
import { ensureSchema } from '../db/users.ts';

let cachedPrivateKey: any = null;
let cachedPublicJwk: any = null;
let cachedKid: string | null = null;

/**
 * Retrieves the active signing key from D1, or generates a new RS256 key pair on first boot.
 */
export async function getSigningKey(env: Env) {
  if (cachedPrivateKey && cachedPublicJwk && cachedKid) {
    return {
      privateKey: cachedPrivateKey,
      publicJwk: cachedPublicJwk,
      kid: cachedKid
    };
  }

  await ensureSchema(env);

  // Check if a key already exists in D1
  const existing = await env.DB.prepare(
    'SELECT * FROM signing_keys ORDER BY created_at ASC LIMIT 1'
  ).first<SigningKeyRecord>();

  if (existing) {
    const publicJwk = JSON.parse(existing.public_jwk);
    const privateJwk = JSON.parse(existing.private_jwk);
    const privateKey = await importJWK(privateJwk, existing.alg);

    cachedPrivateKey = privateKey;
    cachedPublicJwk = publicJwk;
    cachedKid = existing.kid;

    return { privateKey, publicJwk, kid: existing.kid };
  }

  // Generate new RSA-2048 keypair
  const kid = 'aaas-key-' + Date.now().toString(36);
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });

  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = kid;
  publicJwk.use = 'sig';
  publicJwk.alg = 'RS256';

  const privateJwk = await exportJWK(privateKey);
  privateJwk.kid = kid;
  privateJwk.use = 'sig';
  privateJwk.alg = 'RS256';

  await env.DB.prepare(
    'INSERT INTO signing_keys (kid, public_jwk, private_jwk, alg) VALUES (?, ?, ?, ?)'
  ).bind(kid, JSON.stringify(publicJwk), JSON.stringify(privateJwk), 'RS256').run();

  cachedPrivateKey = privateKey;
  cachedPublicJwk = publicJwk;
  cachedKid = kid;

  return { privateKey, publicJwk, kid };
}

/**
 * Returns the public JWKS for standard token verification.
 */
export async function getJWKS(env: Env) {
  const { publicJwk } = await getSigningKey(env);
  return {
    keys: [publicJwk]
  };
}

/**
 * Signs a JWT for a user with their role and profile claims.
 */
export async function issueUserToken(user: User, env: Env, options: { audience?: string; issuer?: string } = {}) {
  const { privateKey, kid } = await getSigningKey(env);
  const issuer = options.issuer || env.JWT_ISSUER || 'https://aaas.workers.dev';

  const jwt = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    avatar_url: user.avatar_url,
    status: user.status
  })
    .setProtectedHeader({ alg: 'RS256', kid })
    .setIssuer(issuer)
    .setAudience(options.audience || 'default')
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(privateKey);

  return jwt;
}
