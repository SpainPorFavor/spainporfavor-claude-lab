# Run Instructions — SpainPorFavor

How to run the SpainPorFavor application locally for development.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22.x | https://nodejs.org/ |
| pnpm | 10.x | `npm install -g pnpm` |
| MySQL / TiDB | 8.x+ | Local install or cloud (PlanetScale, TiDB Cloud, etc.) |

---

## 1. Clone the Repository

```bash
git clone git@github.com:SpainPorFavor/spain-visa-funnel.git
cd spain-visa-funnel
```

---

## 2. Install Dependencies

```bash
pnpm install
```

---

## 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

At minimum, you need:

- `DATABASE_URL` — MySQL connection string (e.g., `mysql://user:pass@localhost:3306/spainporfavor`)
- `JWT_SECRET` — Any random 32+ character string for session signing
- `VITE_APP_ID` — Manus OAuth app ID (or leave empty if not using OAuth locally)
- `OAUTH_SERVER_URL` — Manus OAuth server URL (or leave empty)
- `STRIPE_SECRET_KEY` — Stripe secret key (use `sk_test_...` for development)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (use `pk_test_...`)

See `.env.example` for the full list of available variables.

---

## 4. Set Up the Database

Push the Drizzle schema to your MySQL database:

```bash
pnpm db:push
```

This runs `drizzle-kit generate && drizzle-kit migrate` to create all tables.

---

## 5. Start the Development Server

```bash
pnpm dev
```

The app starts on `http://localhost:3000` (or the next available port). The server runs Express + tRPC on the backend and Vite HMR for the React frontend.

---

## 6. Run Tests

```bash
pnpm test
```

Runs the Vitest test suite (166 tests across 18 files).

---

## 7. Build for Production

```bash
pnpm build
pnpm start
```

`pnpm build` compiles the Vite frontend and bundles the server with esbuild. `pnpm start` runs the production bundle.

---

## Project Structure (Key Directories)

```
client/src/          → React frontend (pages, components, hooks)
server/              → Express + tRPC backend (routers, db helpers, services)
server/_core/        → Framework plumbing (auth, OAuth, LLM, storage proxy)
drizzle/             → Database schema and migrations
shared/              → Types and constants shared between client/server
```

---

## Common Issues

**Port already in use:** The dev server will find the next available port automatically.

**Database connection errors:** Ensure your MySQL server is running and `DATABASE_URL` is correct. TiDB Cloud requires `?ssl={"rejectUnauthorized":true}` in the connection string.

**OAuth not working locally:** OAuth requires the Manus platform. For local development without OAuth, you can create test users directly in the database.

**Stripe webhooks locally:** Use the Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
