# Funnel Map (Canonical)

> This is the source of truth for the SpainPorFavor conversion funnel. The Claude rebuild must preserve every step shown here. Visual and copy improvements are welcome; structural changes require explicit approval.

---

## Primary Funnel (the only one the rebuild touches)

| Step | Route | Page | Purpose | Owner |
|---|---|---|---|---|
| 1 | `/` | Home | Hero, trust row, embedded quiz, results, pricing, FAQ | `pages/Home.tsx` |
| 2 | `/#quiz` (anchor) | Quiz | 6-question interactive quiz: location, purpose, nationality, family, income, employment | `pages/Home.tsx` |
| 3 | `/#results` (anchor) | Results | Personalized visa recommendation, timeline, doc preview, "Start My Application" CTA | `pages/Home.tsx` |
| 4 | `/order` | OrderForm | Two-column checkout: order summary + Stripe Elements payment form | `pages/OrderForm.tsx` |
| 5 | `/application-success?session_id=…` | ApplicationSuccess | Route-specific activation page. **5-step tracker** (steps 1+2 complete, 3 current, 4+5 upcoming). Case ID, blocker cards, primary CTA → upload | `pages/ApplicationSuccess.tsx` |
| 6 | `/documents/start?session_id=…` | DocumentIntake | Public upload (no login required, session-id auth). Camera-first for ID docs, file-first for contracts. Requirement checklists, preview/confirm, progress tracking | `pages/DocumentIntake.tsx` |
| 7 | `/portal` | Portal | Authenticated client cockpit. Privacy gate, grouped document checklist, status banner, progress bar, Laura chat widget | `pages/Portal.tsx` |

---

## Data Carried Between Steps

| From → To | Carried via | Fields |
|---|---|---|
| Quiz → `/order` | Query string | `product`, `name`, `email`, `phone`, `nationality`, `dependents` |
| `/order` → Stripe | Server call (`createPaymentIntent`) | productId, customer*, dependents, billingAddress |
| Stripe webhook → DB | `payment_intent.succeeded` metadata | product_id, customer_name, customer_email, customer_phone, nationality, dependents |
| `/order` → `/application-success` | Query string | `session_id=pi_xxx` |
| `/application-success` → `/documents/start` | Query string | `session_id=pi_xxx` |
| `/documents/start` → DB | tRPC `checkout.uploadDocumentBySession` (today) or `secureDocuments.initUploadBySession` (future) | sessionId, slotId, file |

The `session_id` is the **Stripe PaymentIntent ID** (`pi_xxx`) when the on-site Elements flow is used, and a **Stripe Checkout Session ID** (`cs_xxx`) when the redirect flow is used. Both must be handled.

---

## The 5-Step Activation Model (Step 5 of the Funnel)

This is the contract for `/application-success`. It must not change:

| Step | Label | Status on first view | Status after first upload |
|---|---|---|---|
| 1 | Payment confirmed | complete | complete |
| 2 | Case opened | complete | complete |
| 3 | Upload first document | **current** | complete |
| 4 | Expert review and application preparation | next | current |
| 5 | Application ready / submitted | goal | goal |

Step 3's label and CTA vary by visa route (see `docs/product-routes.md`). The number of steps does not.

---

## Secondary Entry Points (not in Claude rebuild scope for now)

| Route | Purpose |
|---|---|
| `/free-assessment` | Lead capture form → Laura AI qualification chat |
| `/guides`, `/guides/:slug`, `/blog`, `/blog/:slug` | SEO content |
| `/about`, `/tools/beckham-calculator`, `/tools/checklists` | Content / tools |
| `/privacy`, `/terms`, `/gdpr`, `/cookies` | Legal pages |
| `/admin`, `/gestor`, `/management/*` | Internal staff dashboards |
| `/team-login`, `/join/:code`, `/forgot-password`, `/reset-password/:token` | Team auth |

These exist and must keep working, but the Claude rebuild does not redesign them in the current phase.

---

## Non-Goals of the Funnel Rebuild

- **Do not introduce a new step between payment and upload.** No "verify your email", no "schedule a consultation", no "create an account" gate.
- **Do not move document upload behind authentication on first upload.** The session-id-authed public path is intentional — it lets new buyers start uploading immediately, before any OAuth flow.
- **Do not replace the quiz with a different qualification mechanism** without explicit approval. The quiz outputs map directly to the product IDs in `docs/product-routes.md`.
