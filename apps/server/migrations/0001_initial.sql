-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Signing Keys Table (stores JWK key pairs for asymmetric RS256/ES256)
CREATE TABLE IF NOT EXISTS signing_keys (
  kid TEXT PRIMARY KEY,
  public_jwk TEXT NOT NULL,
  private_jwk TEXT NOT NULL,
  alg TEXT NOT NULL DEFAULT 'RS256',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Registered Client Applications
CREATE TABLE IF NOT EXISTS clients (
  client_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  redirect_uris TEXT NOT NULL, -- JSON string array
  secret TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
