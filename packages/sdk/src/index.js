const { createRemoteJWKSet, jwtVerify, importJWK, importSPKI } = require('jose');

/**
 * Creates an AaaS verifier instance with cached JWKS.
 */
function createAaaSVerifier(options = {}) {
  const {
    issuer,
    audience,
    jwksUri = issuer ? `${issuer.replace(/\/$/, '')}/.well-known/jwks.json` : null,
    publicKey
  } = options;

  let getKey;

  if (publicKey) {
    if (typeof publicKey === 'object') {
      const keyPromise = importJWK(publicKey);
      getKey = async () => keyPromise;
    } else if (typeof publicKey === 'string') {
      const keyPromise = importSPKI(publicKey, 'RS256');
      getKey = async () => keyPromise;
    }
  } else if (jwksUri) {
    getKey = createRemoteJWKSet(new URL(jwksUri), {
      cacheMaxAge: 600000, // 10 minutes
      cooldownDuration: 30000 // 30 seconds
    });
  } else {
    throw new Error('AaaSVerifier requires either `issuer`, `jwksUri`, or `publicKey`.');
  }

  async function verify(token) {
    if (!token) {
      throw new Error('No token provided');
    }

    const verifyOptions = {};
    if (issuer) verifyOptions.issuer = issuer;
    if (audience) verifyOptions.audience = audience;

    const { payload, protectedHeader } = await jwtVerify(token, getKey, verifyOptions);
    return {
      payload,
      protectedHeader,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role || 'user',
        avatarUrl: payload.avatar_url,
        ...payload
      }
    };
  }

  return {
    verify,
    getKey
  };
}

/**
 * Express / Connect middleware to authenticate requests and enforce roles.
 * 
 * Usage:
 *   app.get('/api/admin', requireAuth({ issuer: 'http://localhost:8787', role: 'admin' }), (req, res) => ...);
 */
function requireAuth(options = {}) {
  const verifier = options.verify ? options : createAaaSVerifier(options);
  const requiredRoles = options.role
    ? (Array.isArray(options.role) ? options.role : [options.role])
    : null;

  return async function aaasAuthMiddleware(req, res, next) {
    try {
      let token = null;

      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (req.cookies && req.cookies['aaas_token']) {
        token = req.cookies['aaas_token'];
      }

      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Access Denied: No Bearer token provided in Authorization header'
        });
      }

      const { user, payload } = await verifier.verify(token);
      req.user = user;
      req.tokenPayload = payload;

      // Check role if specified
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access Denied: Requires one of [${requiredRoles.join(', ')}] role, but user has '${user.role}'`
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: err.message || 'Access Denied: Invalid or expired token'
      });
    }
  };
}

module.exports = {
  createAaaSVerifier,
  requireAuth
};
