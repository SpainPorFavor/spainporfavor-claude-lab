# SpainPorFavor — Claude Initial Audit

> Read-only audit produced before PR-0. Used as the basis for the guardrails, skills, and docs in `.claude/` and `/docs`. Recorded here so future work can refer to the starting state.
>
> Files read: `package.json`, `README.md`, `RUN_INSTRUCTIONS.md`, `ENV_VARIABLES.md`, `portal-redesign-spec.md`, `CURRENT_FUNNEL_MAP.md`, `docs/AWS_DOCUMENT_STORAGE_SETUP.md`, `client/src/App.tsx`, `client/src/index.css`, `client/src/main.tsx`, `client/src/pages/{Home,OrderForm,ApplicationSuccess,DocumentIntake,Portal}.tsx`, `client/src/pages/{activationRouteConfig,portalCockpitConfig,documentRequirementConfig,documentIntakeConfig}.ts`, `client/src/components/DocumentUploadModal.tsx`, `server/{routers,products,stripe,portalDb,portalRouter,secureDocumentRouter,secureDocumentStorage,documentChecklists,documentValidation}.ts`, `drizzle/schema.ts` (key tables), `shared/{const,types}.ts`.
>
> `.claude/CLAUDE.md` did NOT exist at the time of the audit; the only doc files were `BRAIN.md`, `CURRENT_FUNNEL_MAP.md`, and `portal-redesign-spec.md` at the repo root, plus `docs/AWS_DOCUMENT_STORAGE_SETUP.md`.

---

## 1. Current Architecture Map

| Layer | Tech | Notes |
|---|---|---|
| Routing | Wouter 3.7 (patched) | Single `App.tsx` `<Switch>` with ~30 routes, no nested layouts except `/management/*` |
| UI | React 19, Tailwind 4, shadcn/ui (Radix), Framer Motion | OKLCH theme tokens in `index.css`, single `--primary` (amber 0.77 0.16 70), dark mode supported but unused by client routes |
| Forms | react-hook-form + zod resolvers | Used sparingly — most forms are hand-rolled `useState` (Home quiz, OrderForm, FreeAssessment) |
| State | TanStack Query via tRPC | `trpc.Provider` in `main.tsx`, batched HTTP link, superjson, `credentials: include` |
| API | tRPC 11 over Express 4 | Single `appRouter` in `server/routers.ts` mounts 8 sub-routers (`portal`, `portalChat`, `gestor`, `consent`, `management`, `teamAuth`, `secureDocuments`, `auth`, `checkout`, `leads`, `chat`) |
| DB | MySQL/TiDB via Drizzle ORM | 945-line `drizzle/schema.ts` with 21 migration files. Separate `_core` tables aren't used here — schema is all custom |
| Auth | Manus OAuth (frontend) + JWT cookie session (`app_session_id`) + bcrypt for team accounts (`teamAuth.ts`) | Two parallel auth systems |
| Payments | Stripe Elements (on-site) + Stripe Checkout fallback (`createSession` exists but unused by main flow) + webhook | Two paths create cases: `payment_intent.succeeded` and `checkout.session.completed` |
| Storage | **TWO storage paths in production** — Manus Forge (`storage.ts`/`storagePut`) and private AWS S3 (`secureDocumentStorage.ts`) | The intake flow tries S3 first, falls back to Forge silently |
| LLM | `server/_core/llm.ts` (Forge proxy) | Used for funnel chat, document "validation" prompts |
| Email | Gmail MCP (`gmailService.ts`) for prospects, Resend (`emailNotifications.ts`) for transactional | Welcome email queued from Stripe webhook |
| Build | Vite 7 (client) + esbuild (server bundle) | Single output `dist/index.js`, externals not bundled |
| Tests | Vitest, 18 test files (mostly server-side) | No frontend tests, no e2e |
| Patches | `wouter@3.7.1` patched via pnpm patch | Patch file in `patches/` — unknown intent |

**Architectural smells**
- Two parallel document upload paths writing to two different stores, with silent fallback (data ends up in different buckets depending on env).
- `Home.tsx` is 91 KB / ~1800 lines (hero + quiz + results + chat + pricing + FAQ + about-snippets + footer). No code splitting beyond Vite defaults.
- 36 root-level docs/MD files (`todo.md` alone is 69 KB, `BRAIN.md` is 44 KB). The repo is half code, half stream-of-consciousness notes.
- Route configs for EU/DNV/Generic are duplicated across 4 files (`activationRouteConfig.ts`, `portalCockpitConfig.ts`, `documentRequirementConfig.ts`, `documentIntakeConfig.ts`) each with its own slug matcher and fallback rules. Drift is already visible.

---

## 2. Full Funnel Route Map

```
ENTRY                           PUBLIC                           AUTHENTICATED
─────                           ──────                           ─────────────
 /          ─── quiz ──┐
 /#quiz                │
 /#results             │
                       ▼
 /order ───────► Stripe Elements (on-site)
   │                   │
   │             webhook: pi.succeeded ─► createCaseWithSlots
   │                                       │
   ▼                                       ▼
 /application-success?session_id=PI_ID  cases row + documentSlots rows
   │                                       │
   ▼                                       ▼
 /documents/start?session_id=PI_ID  ◄──────┘  (PUBLIC — no auth, just session_id)
   │
   │   OR (post-login)
   ▼
 /portal  ── requires OAuth ── claims case by email
   │
   ├── PrivacyAcknowledgement gate (one-time)
   ├── DocumentChecklist (grouped per route config)
   └── DocumentUploadModal ── trpc.portal.uploadDocument (LEGACY base64 → Manus Forge)

SECONDARY
─────────
 /free-assessment              ── lead capture + AI chat "Laura"
 /admin                        ── adminProcedure (Manus OAuth user.role === "admin")
 /gestor                       ── gestor case queue
 /management/*                 ── 12 internal ops pages, share ManagementLayout
 /team-login + /join/:code     ── bcrypt team auth (separate from OAuth)
 /forgot-password + /reset/:token
 /guides /guides/:slug /blog /blog/:slug /about /tools/{beckham-calculator,checklists}
 /privacy /terms /gdpr /cookies
```

The active production checkout is **on-site PaymentIntent** (Elements). `/order` posts to `checkout.createPaymentIntent`. The `/order` page never calls `createSession` — Stripe Checkout redirect path is implemented in `Home.tsx` (`createSession` mutation, lines ~440) but the application-form submit goes through `/order` instead, so two checkout machineries coexist.

---

## 3. Data-Flow Map

```
QUIZ ANSWERS (Home.tsx useState)
   │  recommendation.visa  (string label like "Digital Nomad Visa (DNV)")
   ▼
VISA_NAME_TO_PRODUCT_ID[label] || "digital-nomad-visa"   ◄── silent DNV fallback
   │
   ▼
URLSearchParams → /order
   │
   ▼
OrderForm.tsx PaymentForm → trpc.checkout.createPaymentIntent
   │   amount = product.priceInCents + dep * dependentPriceInCents  (server re-checks)
   ▼
Stripe.paymentIntents.create   (metadata: product_id, customer_*, nationality, dependents)
   │
   ▼  stripe.confirmCardPayment (browser, with billing details)
   ▼  pi succeeded
   │
   ├── browser → /application-success?session_id=pi_xxx
   │
   └── Stripe webhook → pi.succeeded → createCaseWithSlots
                                         │
                                         ├── cases row (visaType = metadata.product_id)
                                         ├── documentSlots rows = getChecklistForVisaType(visaType)
                                         │     ◄── DNV CHECKLIST IS THE DEFAULT FALLBACK
                                         └── queueWelcomeEmail

/application-success
   │  trpc.checkout.verifySession (Stripe API)
   │  trpc.checkout.getCaseBySession  (DB lookup by stripeSessionId, fallback: Stripe → email → case → backfill stripeSessionId)
   ▼
"Upload My Passport Now" → /documents/start?session_id=pi_xxx

/documents/start  (PUBLIC PATH)
   │  trpc.checkout.getCaseBySession
   │  trpc.checkout.getSlotsBySession
   ▼ user selects doc type and uploads
   │  trpc.checkout.uploadDocumentBySession  (base64 → storagePut → Manus Forge)
   │      └── creates documentUploads row, validationStatus = "pending"
   │      └── transitions case onboarding → collecting_documents
   │      └── NO async AI validation kicked off on this path
   │
   │  (AUTHENTICATED PATH only:)
   │  trpc.secureDocuments.initUpload  → presigned PUT to private S3 (eu-south-2)
   │  PUT file directly to S3 by browser
   │  trpc.secureDocuments.completeUpload → HeadObject verify + mark uploaded
   │
   │  ON ERROR → falls back to trpc.portal.uploadDocument (LEGACY Forge path)
   ▼
DocumentChecklist on Portal / DocumentIntake refresh
   │
   ▼
portalRouter.uploadDocument (authenticated)
   │  EXIF-stripped via sharp
   │  storagePut → Manus Forge
   │  createDocumentUpload row, status=pending
   │  validateDocumentAsync (fire-and-forget):
   │      → storageGetSignedUrl
   │      → invokeLLM (multimodal, JSON-schema output)
   │      → updateUploadValidation
   │      → fireCaseEvent("document_validated")
   │      → milestone events (50/75/100%)
   │      → if 100%: auto-transition to "ready_for_gestor"

STAFF
   │
   ▼
secureDocuments.staffGetDownloadUrl
   │  verifyStaffAccess (primary role OR user_roles row)
   │  insert documentAccessLogs row
   │  return presigned GET (5-min TTL)
```

**Key data tables**
- `cases` (privacyAcknowledgedAt, privacyNoticeVersion, aiValidationEnabled, stripeSessionId)
- `documentSlots` (per-case from checklist template)
- `documentUploads` (legacy Forge path, fileKey is plaintext)
- `secureDocuments` (S3 path, storageKey + uploadStatus + reviewStatus)
- `documentEvents` / `documentAccessLogs` (audit trail for S3 path only — Forge uploads have no parallel audit table)
- `consentRecords` (data_processing, ai_validation, third_party_sharing, marketing) — created on privacy acknowledgement
- `caseEvents`, `portalMessages`, `escalationTickets` — Laura AI engagement
- `requerimientos`, `submissions`, `resolutions` — gestor workflow

---

## 4. Visual Design Audit

| Area | Finding |
|---|---|
| Design tokens | `index.css` defines OKLCH tokens. Dark mode tokens exist but `<ThemeProvider defaultTheme="light">` and no toggle in user-facing pages → dark mode is dead code surface area. |
| Typography | DM Sans body, Outfit display. Imported via `font-family: 'DM Sans'` only (no `<link>` to Google Fonts visible in `index.html` — would fall back to system if not loaded elsewhere). Headings hardcode `color: oklch(0.18 0.03 250)` — overrides the theme. |
| Color usage | Pages mix two systems: theme tokens (`bg-background`, `text-foreground`) AND hardcoded hex/oklch (`#1A2332`, `#FAFBFC`, `bg-amber-500`). Amber/`#F59E0B`/`#D97706` is the brand accent, slate is the chrome. Brand color is duplicated in 4+ forms. |
| Spacing | Consistent Tailwind (`py-16 md:py-24` for sections, `px-4` mobile, `max-w-5xl` content). No issues. |
| Buttons | `Button` shadcn component + custom `.btn-primary` in `index.css` + ad-hoc `bg-amber-500 hover:bg-amber-600 text-white` classes used directly on `<Button>`. Three button styling conventions. |
| Cards | shadcn `Card` available but largely unused. Manual `bg-white rounded-xl shadow-sm border border-gray-100 p-6` recurs 30+ times. Should be a single `<SurfaceCard>` primitive. |
| Iconography | Lucide. Stable. |
| Motion | Framer Motion imported but used minimally (one progress bar in Home). |
| Mobile | Sticky CTAs implemented manually in 3 places (`ApplicationSuccess`, `DocumentIntake`, `Portal`). Patterns are similar but not unified. |
| Accessibility | `aria-current="step"` used in stepper. No skip links, no `aria-live` regions on upload states, no focus traps in `DocumentUploadModal` (custom modal, no Radix Dialog). |
| Empty/error states | Inconsistent: some pages show full-page hero, some show inline alert. No shared `<EmptyState>` / `<ErrorState>`. |

**Net visual debt**: there's a coherent color palette and type system but no enforced design system — pages drift toward bespoke styling. The recent Cockpit/Activation/Intake configs are the only places where copy and structure are centralized.

---

## 5. Conversion-Risk Audit

| # | Risk | Where | Impact |
|---|---|---|---|
| C1 | **Auto-route to DNV** when quiz returns an unmapped visa label (`Home.tsx:473`) | Quiz → /order | User pays for DNV when they wanted something else. Refund risk. |
| C2 | **DNV checklist served as default** in `getChecklistForVisaType` (line 442–445) | Case creation | Wrong-visa documents requested. Confused client, churn. |
| C3 | Promo code field is a fake — `toast.info("Promo codes are applied at Stripe level. Contact us for discount codes.")` (`OrderForm.tsx:558`) | Order form | Friction on click, broken trust. PaymentIntent flow doesn't support Stripe promo codes — only Checkout Sessions do. |
| C4 | "Resend my portal link" button does `alert("Portal link has been resent…")` with **no backend call** (`ApplicationSuccess.tsx:272`) | Success page | User believes the email was resent; it wasn't. |
| C5 | "Download receipt" is a `mailto:` link (`ApplicationSuccess.tsx:279`) | Success page | Receipts should be one-click from Stripe; this kicks support load. |
| C6 | "Book kickoff call" hardcoded to `https://calendly.com/spainporfavor/kickoff` (`ApplicationSuccess.tsx:25`, TODO comment) | Success page | URL may be wrong; no fallback if Calendly account differs. |
| C7 | Add-on "blocker cards" on success page all `goToDocuments(sessionId)` — they don't lead to an add-on purchase flow (TODO comment) | Success page | Cards look like products; clicking them silently routes to upload. Misleading. |
| C8 | WhatsApp opt-in checkbox writes nothing to backend (`TODO: persist consent…`) (`ApplicationSuccess.tsx:444`) | Success page | Compliance & UX risk — consent vanishes on reload. |
| C9 | OrderForm shows "98.7% Approval Rate" badge (`OrderForm.tsx:384`) — directly contradicts the AI advisor system prompt which says "NEVER claim a specific approval rate" (`routers.ts:77`). Other pages claim 95%/97%/98.7% inconsistently. | Order, Home, About | Regulatory + reputational. See §7. |
| C10 | `goToDocuments(sessionId!)` is called in the no-session-id error branch when `sessionId` is null (`ApplicationSuccess.tsx:79`). The `!` assertion masks a runtime crash. | Success page | Edge case — user lands on `/application-success` with no params. |
| C11 | Public success page can be hit without payment if someone crafts a session_id, but `verifySession` checks Stripe → so it's safe; however `getCaseBySession` returns case data BEFORE verification finishes (race window). Minor. | Success page | Low. |
| C12 | The Portal `DocumentUploadModal` uses **base64 over tRPC** (`portal.uploadDocument`) — 10 MB cap; the secure S3 path supports 20 MB. Mismatch between paths. | Portal upload | Larger files rejected on portal but accepted on intake page. Confusing. |
| C13 | `/portal` `refetchInterval: 15000` keeps a polling loop forever | Portal | Wasteful; should be SSE/WebSocket or only on focus. |
| C14 | Quiz commitment questions (`COMMITMENT_QUESTIONS`) gate the results view — adds 5+ clicks before user sees pricing. Worth A/B-ing. | Home quiz | Possibly hurting funnel completion. |
| C15 | "Trust mode" notice on test mode (`OrderForm.tsx:654`) renders a yellow bar in production if `STRIPE_TEST_MODE=true`. Easy footgun. | Order | Operational. |
| C16 | OrderForm's `Promo` section visually implies a promo path but the underlying PaymentIntent flow can't apply codes (Stripe Checkout-only). | Order | C3 root cause. |
| C17 | `Pay €X` button label uses `totalPrice` from a CLIENT-side `PRODUCT_INFO` constant (`OrderForm.tsx:36`) — separate from `server/products.ts`. They agree today but will drift. Price mismatch → 400 from server. | Order | Latent. |

---

## 6. Route-Mismatch Risks (EU Registration vs DNV vs Generic)

The owner explicitly forbade mixing EU Registration and DNV logic. There are at least **four** independent matcher functions that each have their own slug list and fallback:

| File | Function | Fallback when no match |
|---|---|---|
| `server/documentChecklists.ts` | `getChecklistForVisaType(visaType)` | **DNV CHECKLIST** (line 442–445) ← biggest risk |
| `client/src/pages/activationRouteConfig.ts` | `getRouteConfig(productId)` | `genericConfig` |
| `client/src/pages/portalCockpitConfig.ts` | `getCockpitConfig(visaType)` | `genericCockpitConfig` |
| `client/src/pages/documentRequirementConfig.ts` | `resolveProductType(raw)` | `"generic"` |
| `client/src/pages/documentIntakeConfig.ts` | `getIntakeRouteConfig(productId)` | `GENERIC_CONFIG` |

**Specific scenarios that violate the rule:**

| R1 | An EU Registration case where `cases.visaType` is stored as `"EU Registration Certificate"` (the display name, not the slug) lands in the **DNV checklist** because `getChecklistForVisaType` switch-case only handles a few exact strings, then defaults to DNV. The Stripe webhook stores `metadata.product_id` which is the slug `"eu-registration"` — that path is OK — but **`adminCreateCase` accepts any `visaType` string from the admin form** (`portalRouter.ts:251`) with no validation. If staff types "EU Registration Certificate", the case gets DNV's 8-doc checklist. |
| R2 | `routes config` matchers in `activationRouteConfig.ts` use `slug.includes("nomad") || slug.includes("dnv")` and `slug.includes("eu-reg") || slug.includes("certificado")` — partial-match heuristics. If a future product is named `"eu-digital-nomad"` (unlikely but possible), it matches both branches; current order returns DNV first. |
| R3 | `portalCockpitConfig.ts` matcher requires `slug.includes("eu") && (slug.includes("reg") || slug.includes("certificado"))` — slightly different from the activation matcher. Drift between the two configs means the SAME case could see "EU Registration" copy on `/application-success` and "Visa Application" (generic) copy on `/portal` if the slug is "eu-residence-cert" or similar. |
| R4 | The `documentRequirementConfig.ts` `ROUTE_COPY` map has **EU Registration entries for: passport, eu_national_id, employment_contract, proof_of_address, health_insurance_policy, bank_statements, ex18, modelo_790_012** — but DNV-specific docs like `company_registration_certificate`, `criminal_record_certificate`, `university_degree_or_experience`, `passport_photo` have **DNV entries only**. If a DNV-only doc is shown on an EU case via a route-mismatched checklist, the user sees a "Digital Nomad Visa · Required" badge on what they bought as EU Registration. |
| R5 | `documentChecklists.ts` EU_REGISTRATION_CHECKLIST uses doc types `proof_of_address`, `employment_evidence`, `fee_payment`, `ex18_form` — but `resolveDocumentType` in `documentRequirementConfig.ts` doesn't have a case for `employment_evidence` and would return `null`. The DocumentIntake type-selection screen filters slots through `resolveDocumentType` (`DocumentIntake.tsx:1076-1083`) — slots with unresolvable types render the button **disabled** with no explanation. EU users see broken slots on intake. |
| R6 | The secure storage key is `cases/{caseId}/documents/{documentType}/{uuid}.{ext}` (`secureDocumentStorage.ts:91`) — `documentType` here is whatever string came in. Legacy and S3 paths produce divergent key shapes (`storagePut` uses raw fileName) so dual-storage `LIST` operations later cannot reconcile them. |

---

## 7. Document / Security / Compliance Risks

| # | Risk | Severity |
|---|---|---|
| S1 | **Dual storage path with silent fallback**: `DocumentIntake.tsx:441-471` tries `secureDocuments.initUpload`, on ANY error falls back to `portal.uploadDocument` (base64 → Manus Forge). If the AWS env is mid-rotation or the bucket is unreachable, sensitive passport/criminal-record uploads land in **non-encrypted shared storage with no audit log table** — and the user never knows. | HIGH |
| S2 | **`uploadDocumentBySession` is a fully public endpoint** that writes file bytes for a case keyed only on a Stripe PaymentIntent ID. A leaked or guessed `pi_*` (sometimes shared via URLs or screenshots) lets anyone upload arbitrary files under that case ID. There is no rate limit on this endpoint. | HIGH |
| S3 | **`getSlotsBySession` and `getCaseBySession`** return `clientName`, `clientEmail`, `dependents`, `visaType` to anyone holding the session_id (`routers.ts:159-166`). Stripe session IDs are not designed to be capability tokens. | HIGH |
| S4 | **No CSRF token** on tRPC mutations. The httpBatchLink uses cookies (`credentials: include`); same-site cookies on the auth cookie are the only defence. `getSessionCookieOptions` not read here — verify SameSite=strict + secure in prod. | MED |
| S5 | `secureDocuments.staffGetDownloadUrl` logs `ipAddress: null, userAgent: null` (`secureDocumentRouter.ts:395-396`). The audit log claim ("All staff downloads logged in `document_access_logs`" in the AWS docs) is therefore **half-true**. | MED |
| S6 | `getDocuments` query has `// Don't show deleted documents` as a comment but the WHERE clause has no filter — it filters in app code (`secureDocumentRouter.ts:341-346`). Works for paging but leaks count info. | LOW |
| S7 | `validateDocumentAsync` builds a signed URL from `storagePut`'s legacy storage and sends it to an LLM. The LLM provider sees passport bio pages and criminal records. **The privacy bullets shown to the user do not name the AI vendor** (`portalCockpitConfig.ts` privacyBullets are vague). For GDPR Art. 13/14 this is a material disclosure gap. | HIGH |
| S8 | AI validation prompt for `criminal_record` (`documentValidation.ts:170`) asks the LLM to read names and authority info. If the LLM responds with raw extracted PII, it's stored as JSON in `documentUploads.aiFeedback`. The `feedback` string is sanitized in the UI (`sanitizeAIFeedback`) — but the database stores the unsanitized payload. | MED |
| S9 | **Hardcoded Stripe test publishable key** in `server/routers.ts:304` is fine (publishable keys aren't secret) but is exposed when `STRIPE_TEST_MODE=true`. `server/stripe.ts:8` has `STRIPE_TEST_SK = "STRIPE_SECRET_KEY_PLACEHOLDER"` — if `STRIPE_TEST_MODE=true` is ever set in prod without a real test SK env var, `getStripe()` will instantiate with the placeholder and **crash on first API call**. Better to throw fast at boot if test mode is on without an explicit test SK env var. | MED |
| S10 | **Both webhook events create cases** — `checkout.session.completed` AND `payment_intent.succeeded`. Dedupe is per-event-id (`stripeSessionId`) but `cs_*` and `pi_*` are different IDs. If both fire for the same purchase (Checkout Session + its underlying PI), you get two cases. | MED |
| S11 | EXIF stripping is best-effort (try/catch with `console.warn`) (`portalRouter.ts:88-98`, `routers.ts:269-279`). If sharp fails for any reason, the original bytes (including GPS coords on phone photos) are uploaded. No retry, no warning to the user. | LOW |
| S12 | `acknowledgePrivacy` inserts consent records keyed to `consentRecords.userId`, `caseId`, `consentType`, `granted=1` and dedupes — but uses `ctx.req.headers["x-forwarded-for"]` without sanitization. A spoofed header survives all the way into audit logs. | LOW |
| S13 | Compliance copy claims "Industry Approval Rate*" 97% (`Home.tsx:705`) and "98.7%" (`About.tsx:124`, `OrderForm.tsx:384`) while the AI advisor system prompt says "NEVER claim a specific approval rate or success rate percentage" (`routers.ts:77`). This is an internal contradiction that could lead to regulator/consumer-protection action in Spain — Bayshore Products S.L. (per README license) would be on the hook. | HIGH |
| S14 | "Free resubmission guarantee" is stated as an unqualified promise (`OrderForm.tsx:65`, FAQ Home.tsx:325) but no contract / TOS language ties it to documented client misrepresentation grounds. Likely fine, but the marketing copy ought to be reviewed by counsel against terms. | MED |
| S15 | Document retention policy claim "7-year default, GDPR deletion on request" (`docs/AWS_DOCUMENT_STORAGE_SETUP.md:15`) — the lifecycle config in the same doc only sets `STANDARD_IA` transition at day 90 and aborts incomplete multipart at day 1. **There is no 7-year expiration rule, and no automated GDPR erasure pipeline beyond an `erasureRequests` table** (`drizzle/schema.ts:365`). Claim is aspirational, not implemented. | HIGH |
| S16 | CORS allowlist for the S3 bucket includes a Manus-hosted preview URL (`vivaspain-zhzm5zou.manus.space`). Acceptable for staging but leaks the preview hostname publicly. | LOW |
| S17 | No `Content-Length` enforcement on the presigned PUT (`secureDocumentStorage.ts:117`) — `maxFileSize` parameter is accepted but unused. A client could PUT > 20 MB once the presigned URL is issued. | MED |

---

## 8. Recommended Rebuild Plan

> Premise: preserve the funnel, preserve the 5-step activation, never mix EU Registration and DNV, never fake OCR/AI/security/compliance, never touch live secrets or customer data.

**Phase 0 — Stabilise (1 PR, ~1 day)**
Freeze the dual-checkout and dual-storage drift before redesigning anything. Add a hard guard that the secure S3 path either succeeds or the upload fails loudly. Remove the silent fallback. Add boot-time env validation that rejects start-up if the bucket+key+secret aren't all set when `NODE_ENV=production`.

**Phase 1 — One Source of Truth for Visa Routes (1 PR, 1–2 days)**
Replace the four matcher functions with a single `shared/visaRoutes.ts` enum (`EU_REGISTRATION`, `DIGITAL_NOMAD_VISA`, `NON_LUCRATIVE_VISA`, `STUDENT_VISA`, `WORK_VISA`, `UNKNOWN`). All four current configs (activation, cockpit, requirements, intake) consume one resolver. **Remove the DNV fallback in `getChecklistForVisaType` — unknown visaType should throw, not silently DNV-ify.** Add a server-side zod enum on `adminCreateCase`'s `visaType` field.

**Phase 2 — Single Storage Path (1 PR, 2 days)**
Make S3 the only document path. Delete `portal.uploadDocument` and `checkout.uploadDocumentBySession`. The session-based public upload becomes a presigned-PUT issued by a `secureDocuments.initUploadBySession` mutation that verifies the Stripe session **and** issues a short-TTL one-time upload token. Migrate any existing Forge uploads to S3 with a one-shot script (out of scope for codebase, document the runbook).

**Phase 3 — Compliance Cleanup (1 PR, 2 days)**
- Remove every numeric approval-rate claim from the UI (Home, About, OrderForm) until there is an auditable basis.
- Name the AI vendor in privacy bullets and consent text.
- Wire up the WhatsApp consent persistence; remove the "Resend portal link" alert; either implement Stripe receipt link or remove the button.
- Implement S3 lifecycle policy for 7-year retention OR remove the claim. Implement an erasure cron that processes `erasureRequests`.

**Phase 4 — Cockpit + Activation Unification (1–2 PRs, 3–5 days)**
Promote `portalCockpitConfig.ts` and `activationRouteConfig.ts` to live alongside the visa enum from Phase 1. Replace the home-grown sticky-CTA / status-banner / next-best-action code with shared primitives (`<NextBestAction>`, `<StatusBanner>`, `<StickyMobileCta>`). Test EU and DNV side-by-side at every step.

**Phase 5 — Design System Pass (longer-running)**
Extract `<SurfaceCard>`, `<EmptyState>`, `<ErrorState>` primitives. Pick ONE button style convention (kill `.btn-primary` or kill the ad-hoc `bg-amber-500` overrides). Decide whether dark mode ships or gets removed.

**Out of scope until later**: management/* redesign, gestor dashboard, blog/guides, Beckham calculator.

---

## 9. The First 5 Pull Requests Recommended

> Strict ordering. Each is small, reversible, and unblocks the next.

| # | PR | Why first | Acceptance check |
|---|---|---|---|
| **PR-1** | **Remove silent fallback from secure document upload; fail loud if S3 not configured.** Delete the `catch → legacyUploadMutation` block in `DocumentIntake.tsx:441-471`. Add `isSecureStorageConfigured()` check at server boot in production. | Stops sensitive docs leaking to non-private storage. Cheapest fix for the highest single risk. | Manual: with bad AWS creds, intake page shows an error and **no** file is written to Forge. |
| **PR-2** | **Kill the DNV default in `getChecklistForVisaType`; introduce `shared/visaRoutes.ts` enum; validate `visaType` on every write path.** Throw `BAD_REQUEST` for unknown visa types in `adminCreateCase` and the Stripe webhook. | Eliminates the biggest route-mismatch source (R1). Prevents EU clients getting DNV checklists. | Server unit tests: webhook with `product_id="eu-registration"` produces EU slots, with `"unknown"` throws. |
| **PR-3** | **Consolidate the 4 route matchers behind one resolver.** Make `activationRouteConfig`, `portalCockpitConfig`, `documentRequirementConfig`, `documentIntakeConfig` import the same `resolveVisaRoute()` from `shared/`. Remove all `slug.includes("...")` heuristics. | Locks in the rule "never mix EU and DNV" at the type level. Prevents future drift. | Type test: switching on `VisaRoute` is exhaustive (`never` branch). |
| **PR-4** | **Compliance copy sweep.** Remove `"98.7%"`, `"95%"`, `"97%"` numeric approval-rate claims from `Home.tsx`, `OrderForm.tsx`, `About.tsx`. Disable the "Resend portal link" alert (replace with disabled state + "coming soon" or wire the endpoint). Replace the fake promo input with a link to "Contact support for promo codes". Make the WhatsApp checkbox call a real `consent.grant` mutation. | Stops the funnel from making claims that cannot be substantiated. Low risk, high trust. | Grep for the percentages returns zero matches; checkbox writes a `consentRecords` row. |
| **PR-5** | **Audit-log fidelity.** Pass IP and User-Agent from tRPC context into `documentAccessLogs` inserts in `secureDocuments.staffGetDownloadUrl` and `staffUpdateReviewStatus` (they currently log `null`). Add the same log for the public-session upload path. Add a one-shot zod check + bounds enforcement on presigned PUT (`Content-Length` constraint). | Brings the audit trail in line with what the AWS doc and consent text already promise. Defensive, not visible to users. | Manual: download a doc as staff → row appears in `document_access_logs` with non-null ip/ua. |

---

## 10. Questions That Must Be Answered Before Coding

Grouped by what blocks what.

**A. Scope of the rebuild**
1. Is this a **redesign** (UI/UX overhaul of the same flows) or a **re-platform** (different stack)? The audit assumes the former.
2. Which routes are in scope vs preserved as-is? `/management/*` and the gestor dashboard are large surfaces — touch or leave?
3. Are we keeping the public no-login upload path (`/documents/start?session_id=…`) or requiring auth even for the first upload? This decision changes S2/S3/PR-1 significantly.

**B. Visa routes**
4. Confirm the canonical visa enum: is it exactly `{eu-registration, digital-nomad-visa, non-lucrative-visa, student-visa, work-visa}` or is anything coming/going?
5. For EU Registration specifically: is the **5-step activation model identical** to DNV (Payment → Case opened → Upload → Expert review → Appointment-ready) or does EU collapse some steps? Today both configs use 5 steps but with different labels.
6. If `cases.visaType` is unknown, what should happen? (a) Block creation, (b) Create with an `UNKNOWN` checklist requiring manual staff assignment, (c) Allow legacy DNV default? Recommended: (b).

**C. Storage and compliance**
7. Has the production S3 bucket (`spainporfavor-documents-private`, eu-south-2) been created, has the IAM user been issued credentials, and is CloudTrail enabled? PR-1 assumes the answer is yes — otherwise a stub-aware fallback is needed.
8. Who is the AI vendor used by `invokeLLM` (Manus Forge → which underlying model)? Required for §S7 disclosure.
9. Is the "7-year retention" claim aspirational, contractual, or required by Spanish law for visa case data? Drives PR for lifecycle config.
10. Is there an existing legal review of the homepage approval-rate claims, or is removal the safer default?

**D. Money flow**
11. Are we sticking with on-site Stripe Elements (`PaymentIntent`) OR moving to Stripe Checkout (`Checkout Session`)? Promo codes work natively in the latter; in the former they're impossible without manual coupons. Today the code has BOTH machineries.
12. Should `payment_intent.succeeded` AND `checkout.session.completed` both create cases, or only one? The dedupe is incomplete today.
13. Refund / cancellation flow — none visible in code. Need to decide before customers ask.

**E. Auth model**
14. Should clients log in with the same Manus OAuth as staff, or move to email-magic-link (avoids the "no case found" friction when OAuth email ≠ checkout email)?
15. Are team-auth accounts (bcrypt, `teamAuth.ts`) staying as a second system, or merging into OAuth?

**F. AI engagement**
16. Is "Laura" (the AI advisor / portal chat) a launched product feature or experimental? Affects whether to polish or hide it during the rebuild.
17. Should AI document validation be turned **off by default** (only-opt-in)? Today it's opt-in via privacy gate, but the legacy `portal.uploadDocument` path **always** runs `validateDocumentAsync` regardless of `aiValidationEnabled` (`portalRouter.ts:115`). Bug or intent?

**G. Practical setup**
18. Can the audit author have a non-production DB seed and Stripe test mode confirmed before the first PR? `seed-tasks.sql` is in the repo but has not been run.
19. The `wouter@3.7.1` pnpm patch — what does it change? It's silent in the audit; if it's load-bearing, the next React/Wouter bump could regress.
