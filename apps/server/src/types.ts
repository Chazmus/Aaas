export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  JWT_ISSUER?: string;
  DEV_MODE?: string;
  ADMIN_SECRET?: string;
  APP_NAME?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
  provider: string;
  provider_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SigningKeyRecord {
  kid: string;
  public_jwk: string;
  private_jwk: string;
  alg: string;
  created_at: string;
}
