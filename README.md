# SpainPorFavor

Tech-enabled Spanish visa document preparation service. AI-powered funnel qualifies leads, collects payment via Stripe, and guides clients through secure document upload — all managed by licensed Gestores Administrativos.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, Wouter (routing), shadcn/ui |
| Backend | Express 4, tRPC 11, Superjson |
| Database | MySQL / TiDB (via Drizzle ORM) |
| Payments | Stripe (Elements on-site, webhooks) |
| Auth | Manus OAuth + JWT sessions |
| AI | LLM integration (chat qualification, document validation) |
| Storage | S3 (documents), Manus Forge Storage (general assets) |
| Email | Gmail MCP (prospect emails), Resend (transactional) |
| Testing | Vitest |

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
#    See ENV_VARIABLES.md for the full list of required variables.
#    Create a .env file with your values.

# 3. Push database schema
pnpm db:push

# 4. Start development server
pnpm dev

# 5. Run tests
pnpm test
```

The dev server starts on `http://localhost:3000` with Vite HMR for the frontend and tsx watch for the backend.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server (HMR + backend watch) |
| `pnpm build` | Build frontend (Vite) + bundle server (esbuild) |
| `pnpm start` | Run production build |
| `pnpm test` | Run Vitest test suite |
| `pnpm check` | TypeScript type checking |
| `pnpm format` | Prettier formatting |
| `pnpm db:push` | Generate and run Drizzle migrations |

---

## Project Structure

```
client/
  src/
    pages/           ← Page components (Home, OrderForm, Portal, DocumentIntake, etc.)
    components/      ← Reusable UI components (shadcn/ui, AIChatBox, DashboardLayout)
    _core/hooks/     ← Auth hook
    lib/             ← tRPC client binding
server/
  routers.ts         ← tRPC procedures (all API endpoints)
  db.ts              ← Database query helpers
  storage.ts         ← S3 storage helpers
  products.ts        ← Stripe product/price definitions
  gmailService.ts    ← Email sending via Gmail
  leadDripEmails.ts  ← Automated nurture email scheduler
  secureDocumentStorage.ts  ← AWS S3 presigned URL service
  secureDocumentRouter.ts   ← Document management procedures
  _core/             ← Framework plumbing (auth, OAuth, LLM, env, notifications)
drizzle/
  schema.ts          ← All database tables (Drizzle ORM)
  relations.ts       ← Table relationships
  migrations/        ← Generated SQL migrations
shared/
  const.ts           ← Shared constants
  types.ts           ← Shared TypeScript types
```

---

## Documentation

| File | Contents |
|------|----------|
| `CURRENT_FUNNEL_MAP.md` | Complete route map of the conversion funnel |
| `RUN_INSTRUCTIONS.md` | Detailed local setup instructions |
| `ENV_VARIABLES.md` | All environment variables with descriptions |
| `BRAIN.md` | Project memory: decisions, architecture, team, open questions |
| `todo.md` | Feature tracking with completion status |

---

## Key Flows

1. **Lead Qualification:** Homepage quiz → AI chat (Laura persona) → personalized visa recommendation
2. **Payment:** Custom order form → Stripe Elements → webhook creates Case + Document Slots
3. **Document Upload:** Public path (no login, uses Stripe session ID) or authenticated Portal path
4. **Case Management:** Client portal with progress tracking, admin/gestor dashboards for review

---

## License

Proprietary. All rights reserved by Bayshore Products S.L.
