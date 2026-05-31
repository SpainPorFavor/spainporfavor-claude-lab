# Claude Instructions for SpainPorFavor

This repository is the **Claude working copy** of SpainPorFavor — a tech-enabled Spanish visa document preparation service. The goal of this branch line is to produce a **visually improved, higher-converting version of the existing funnel** while preserving the current funnel logic end-to-end.

You are working alongside the human owner. Treat every change as if it will ship to real applicants in Spain.

---

## 1. Non-Negotiable Rules

These rules override anything else in this repo. If a rule conflicts with a task instruction, stop and ask.

1. **Preserve the funnel.** The conversion path is:
   `/` (homepage + quiz) → `/order` (Stripe Elements) → `/application-success` → `/documents/start` → `/portal`.
   Do not reorder, remove, or restructure these routes.
2. **Preserve the 5-step activation model.** After payment the user is shown:
   1. Payment confirmed (complete)
   2. Case opened (complete)
   3. Upload first document (current — passport / EU ID / first required doc)
   4. Expert review and application preparation (next)
   5. Application ready / submitted (goal)
   The CTA on the success page must always push the user to step 3 (upload).
3. **Never mix EU Registration and Digital Nomad Visa logic.** They are separate products with separate checklists, separate copy, separate CTAs, and separate badges. See `docs/product-routes.md` for the canonical separation. Any new logic that branches on visa type must handle them as independent cases, not fall through to a shared default.
4. **Never fake OCR, AI, security, or legal compliance.** If a feature is not actually implemented, say so in the UI and code. Do not ship copy that claims approval rates, document-scanning accuracy, encryption guarantees, or legal outcomes that the system does not deliver.
5. **Do not modify production secrets.** `.env*` files are gitignored. Do not commit real Stripe keys, AWS credentials, OAuth client secrets, or database connection strings — even in test files or examples.
6. **Do not connect to live customer data.** No live database queries, no real S3 buckets, no live Stripe charges. Work against test mode and seed data.
7. **Do not write code in PR-0.** PR-0 is documentation and guardrails only. Application code changes start at PR-1, after the human approves the plan.

---

## 2. Scope of the Claude Rebuild

**In scope (over time):**
- Visual and conversion improvements to: `Home.tsx`, `OrderForm.tsx`, `ApplicationSuccess.tsx`, `DocumentIntake.tsx`, `Portal.tsx`.
- Consolidating the four duplicate route-config files (`activationRouteConfig.ts`, `portalCockpitConfig.ts`, `documentRequirementConfig.ts`, `documentIntakeConfig.ts`) behind one resolver.
- Tightening the document-upload flow to a single storage path (private S3) with no silent fallback.
- Removing unsubstantiated claims from the funnel copy.
- A shared design-system pass (`<SurfaceCard>`, `<StatusBanner>`, `<StickyMobileCta>`, etc.).

**Out of scope for now:**
- `/management/*` (12 internal ops pages).
- `/gestor` dashboard.
- `/admin` dashboard.
- The Laura AI chat surface (`PortalChat`, `AIChatBox`, `AssessmentChat`).
- Blog, guides, Beckham calculator, checklists hub.
- Database schema changes that aren't strictly required by an approved PR.

---

## 3. How to Work in This Repo

- **Always work on a branch** named `claude/pr-N-<short-slug>`. Do not push to `main`.
- **One concern per PR.** PRs should be small enough to review in under 30 minutes. If a change touches storage, routing, AND copy, split it.
- **Read before writing.** This repo has 91 KB of `Home.tsx` and 4 parallel route-config files — assume duplication. Before adding a new helper, grep for an existing one.
- **Never delete `BRAIN.md`, `todo.md`, `CURRENT_FUNNEL_MAP.md`, or `portal-redesign-spec.md` without asking.** They are the owner's working notes.
- **Tests are not optional for storage, payment, or auth changes.** Vitest is configured (`pnpm test`). If you change how a document is stored, add a server-side test that proves the new path.
- **Type-check before reporting "done"**: `pnpm check`.

---

## 4. Skills Available

When a task fits one of these skills, use it (or invoke the corresponding agent prompt):

| Skill | When to use |
|---|---|
| `spf-visual-director` | Any visual / UX / copy / design-token change to the funnel pages. |
| `spf-funnel-architect` | Any routing, product-route resolution, checklist, or 5-step activation change. |
| `spf-secure-documents` | Any upload, storage, presigned-URL, encryption, retention, or audit-log change. |

Skill files live at `.claude/skills/<skill-name>/SKILL.md`.

---

## 5. Compliance and Copy

Bayshore Products S.L. (the legal entity behind SpainPorFavor) operates in Spain. The funnel makes statements about visa outcomes, document accuracy, and data handling. These statements are regulated.

- See `docs/compliance-rules.md` for what you may and may not claim.
- See `docs/document-storage-rules.md` for the privacy posture.
- When in doubt: remove the claim, do not soften it.

---

## 6. When You Get Stuck

If you cannot complete a task without violating a rule above, **stop and report**. Do not work around the rule. The human owner would rather pause for a clarification than ship a regression.
