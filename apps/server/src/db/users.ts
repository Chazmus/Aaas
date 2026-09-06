import type { Env, User } from '../types.ts';

let schemaInitialized = false;

export async function ensureSchema(env: Env): Promise<void> {
  if (schemaInitialized) return;
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding 'DB' is missing from environment. Check wrangler.toml.");
  }

  // Create tables if they do not exist
  await env.DB.prepare(`
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
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS signing_keys (
      kid TEXT PRIMARY KEY,
      public_jwk TEXT NOT NULL,
      private_jwk TEXT NOT NULL,
      alg TEXT NOT NULL DEFAULT 'RS256',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      redirect_uris TEXT NOT NULL,
      secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  schemaInitialized = true;
}

export async function upsertUser(
  env: Env,
  data: {
    email: string;
    name?: string | null;
    avatar_url?: string | null;
    provider: string;
    provider_id: string;
    forceRole?: string;
  }
): Promise<User> {
  await ensureSchema(env);
  // Check if user already exists
  const existing = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(data.email)
    .first<User>();

  if (existing) {
    const updatedName = data.name !== undefined ? data.name : existing.name;
    const updatedAvatar = data.avatar_url !== undefined ? data.avatar_url : existing.avatar_url;
    const updatedRole = data.forceRole || existing.role;

    await env.DB.prepare(
      `UPDATE users 
       SET name = ?, avatar_url = ?, role = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(updatedName, updatedAvatar, updatedRole, existing.id).run();

    return {
      ...existing,
      name: updatedName,
      avatar_url: updatedAvatar,
      role: updatedRole
    };
  }

  // Determine initial role: if first user in DB, make them admin!
  let role = data.forceRole || 'user';
  if (!data.forceRole) {
    const count = await env.DB.prepare('SELECT COUNT(*) as c FROM users').first<{ c: number }>();
    if (count && count.c === 0) {
      role = 'admin';
    }
  }

  const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

  await env.DB.prepare(
    `INSERT INTO users (id, email, name, avatar_url, role, provider, provider_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
  ).bind(
    id,
    data.email,
    data.name || null,
    data.avatar_url || null,
    role,
    data.provider,
    data.provider_id
  ).run();

  const created = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  return created!;
}

export async function getAllUsers(env: Env): Promise<User[]> {
  await ensureSchema(env);
  try {
    const result = await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all<User>();
    return (result && Array.isArray(result.results)) ? result.results : [];
  } catch (err) {
    console.error('Failed to query users from D1:', err);
    return [];
  }
}

export async function getUserById(env: Env, id: string): Promise<User | null> {
  return await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
}

export async function updateUserRole(env: Env, id: string, role: string): Promise<boolean> {
  const res = await env.DB.prepare(
    'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(role, id).run();
  return res.success;
}

export async function toggleUserStatus(env: Env, id: string): Promise<User | null> {
  const user = await getUserById(env, id);
  if (!user) return null;
  const newStatus = user.status === 'active' ? 'suspended' : 'active';
  await env.DB.prepare(
    'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(newStatus, id).run();
  return { ...user, status: newStatus };
}
