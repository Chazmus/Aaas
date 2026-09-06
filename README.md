# Authentication as a Service (AaaS) 2.0

> **The 60-Second Serverless Auth Backend for Indie Developers**  
> Powered by Cloudflare Workers (Edge Compute) and Cloudflare D1 (Serverless SQLite). Zero servers, zero maintenance, and $0/month on the free tier.

---

## Why AaaS?

When building side projects and web apps, developers usually face two extremes:
1. **Third-party SaaS (Auth0, Clerk)**: Easy to start, but brings vendor lock-in, proprietary databases, and eventual pricing cliffs.
2. **Rolling your own auth**: Tedious and error-prone (managing database schemas, OAuth redirects, session cookies, JWT signing, refresh tokens, and admin panels).

**AaaS** gives you your own private authentication server on your own Cloudflare account. You own your data in SQLite, it boots in milliseconds at the edge worldwide, and it includes a built-in admin dashboard out of the box.

---

## Features

- ⚡ **100% Serverless & Edge-Native**: Built with [Hono](https://hono.dev) for Cloudflare Workers. Sub-millisecond execution and 0ms cold starts.
- 🗄️ **Serverless SQLite (Cloudflare D1)**: Stores users and roles in an ACID-compliant SQLite database you control.
- 🔑 **Asymmetric JWTs & JWKS**: Signs tokens with RSA (RS256) and exposes `/.well-known/jwks.json`. Client apps verify tokens offline using public keys—no constant server callbacks.
- 👑 **Embedded Admin Dashboard**: Manage registered users, toggle active/suspended status, and change RBAC roles (`admin`, `user`, etc.) directly from the built-in `/admin` web interface.
- 🧪 **Instant Dev Mode**: Test locally right away with 1-click mock logins (e.g. Alice the Admin or Bob the User) without configuring Google/GitHub OAuth credentials first.
- 📦 **Drop-in Client SDK (`@aaas/sdk`)**: Protect routes in Express, Hono, or Node with a single middleware function.

---

## Repository Structure

```text
AaaS/
├── apps/
│   ├── server/         # Cloudflare Worker (AaaS Core)
│   │   ├── src/        # Hono app, OAuth flows, D1 queries, Admin UI
│   │   └── migrations/ # D1 SQLite schemas (users, signing_keys)
│   │
│   └── demo-app/       # Example client web app
│       ├── server.js   # Express server using @aaas/sdk
│       └── public/     # SPA demonstrating login and role-gated routes
│
└── packages/
    └── sdk/            # Universal client SDK & Express middleware
```

---

## Quickstart (Local Development)

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-repo/AaaS.git
cd AaaS
npm install
```

### 2. Run Tests

All components (Server, SDK, and Demo App) include comprehensive test suites running on Node's native test runner:

```bash
npm test
```

### 3. Start the Local Auth Server

Start the Cloudflare Worker with local D1 emulation:

```bash
npm run dev:server
```
The server will be running at `http://localhost:8787`. You can visit:
- **Server Home**: `http://localhost:8787`
- **Login Portal**: `http://localhost:8787/auth/login`
- **Admin Console**: `http://localhost:8787/admin`
- **JWKS Endpoint**: `http://localhost:8787/.well-known/jwks.json`

### 4. Start the Demo Client App

In a separate terminal:

```bash
npm run dev:demo
```
Open `http://localhost:3000` to test the client application flow, login redirection, and role permissions.

---

## Integrating with Your Own Web App

Install the SDK in your project:

```bash
npm install @aaas/sdk
```

Protect routes in Express:

```javascript
const express = require('express');
const { requireAuth } = require('@aaas/sdk');

const app = express();
const AAAS_URL = 'https://your-auth-server.workers.dev';

// Open to anyone
app.get('/api/public', (req, res) => {
  res.json({ message: 'Hello world' });
});

// Any authenticated user
app.get('/api/profile', requireAuth({ issuer: AAAS_URL }), (req, res) => {
  res.json({ user: req.user });
});

// Admin-only route
app.get('/api/admin', requireAuth({ issuer: AAAS_URL, role: 'admin' }), (req, res) => {
  res.json({ message: 'Welcome, administrator!' });
});
```

---

## Deploying to Cloudflare Workers

### 1. Create your D1 Database

```bash
cd apps/server
npx wrangler d1 create aaas-db
```
Copy the `database_id` returned by Cloudflare into `apps/server/wrangler.toml`.

### 2. Run Database Migrations

```bash
npx wrangler d1 execute aaas-db --remote --file=./migrations/0001_initial.sql
```

### 3. Set OAuth Secrets (Optional)

If using Google or GitHub OAuth:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

### 4. Deploy

```bash
npx wrangler deploy
```

Your serverless authentication platform is now live at `https://aaas-server.<your-subdomain>.workers.dev`!

---

## License

MIT
