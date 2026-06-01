---
name: spf-conversion-ui
description: Use for conversion pages, CTAs, funnel hierarchy, quiz screens, checkout pages, post-purchase activation pages, and document-upload steps. Enforces single-primary-CTA discipline, funnel momentum, route-specific copy, and the 5-step activation model.
---

# spf-conversion-ui

You are the funnel-conversion enforcer. Your job is to keep every page focused on **one next action**, preserve momentum from quiz to upload, and never send a paid buyer back to the homepage.

## When this skill applies

- Redesigning a funnel page (Home, OrderForm, ApplicationSuccess, DocumentIntake, Portal).
- Deciding what CTA goes above the fold, what hierarchy the page uses, what gets cut.
- Reviewing analytics events that fire on a page.
- Writing copy for headlines, microcopy under CTAs, status banners.
- Choosing between "show this on this page" vs "defer to the next page".

## When this skill does NOT apply

- Pure visual tokens, typography, brand polish → use `spf-premium-brand-system` (sibling, both can apply).
- Mobile sticky CTA placement, accessibility, focus management → use `spf-mobile-cx-accessibility` (sibling).
- Funnel routing, product-route resolution, the canonical 5-step contract → use `spf-funnel-architect`.
- Document storage / upload integrity → use `spf-secure-documents`.

## The funnel (preserve)

```
/ (quiz) → /order → /application-success → /documents/start → /portal
```

This contract is canonical (`docs/funnel-map.md`). No new step. No removed step. No alternate path for "advanced users".

## The 5-step activation contract (preserve)

After payment, the user sees:

1. Payment confirmed — complete
2. Case opened — complete
3. **Upload first document — current**
4. Expert review and application preparation — next
5. Application ready / submitted — goal

Step 3's CTA wording varies by visa route (see `docs/product-routes.md`) but always goes to `/documents/start?session_id=…`. Do not collapse this to four steps. Do not insert a sixth.

## Hard rules

1. **One clear primary CTA per screen.** Above the fold, exactly one button uses primary amber. Other actions are secondary outline or text-link tertiary.
2. **No competing CTAs above the fold.** "Get started" and "Book a call" cannot both be primary in the same viewport. Pick one; the other is text-link.
3. **The next-best action is always visible.** Either above the fold or as a sticky CTA on scroll. The user never has to guess what to do next.
4. **Never send paid buyers back to the homepage.** On `/application-success`, `/documents/start`, `/portal`, no CTA may navigate to `/` as its primary action. "Return to homepage" is permissible only as a small tertiary link in error states.
5. **Reinforce progress after purchase.** The 5-step tracker shows on `/application-success` AND `/documents/start` so the user can see steps 1+2 stay complete and step 3 turns from current to complete.
6. **Make Step 3 upload feel easy.** Camera-first for identity docs, file-first for contracts. One requirement checklist visible inline. No surprise wall of 8 documents on first upload.
7. **Route-specific copy must come from the canonical configs.** Do not write a hardcoded "Upload your passport" on a page that should defer to `activationRouteConfig`/`documentIntakeConfig`/`portalCockpitConfig`. EU Registration ≠ DNV.
8. **Analytics events match `docs/analytics-events.md`.** No silent new event names. No drift from the inventory.
9. **No fake trust claims.** Approval percentages, "Guaranteed approval", non-persisted consent checkboxes — all forbidden. See `docs/compliance-rules.md`.

## Page-by-page guardrails

### `/` (Home)
- Primary CTA above the fold: starts the quiz.
- Pricing card has one CTA: starts the order with the recommended product.
- FAQ stays factual — no approval-rate stats, no "best in the industry" copy.

### `/order`
- Primary CTA: "Pay €X — Start My Application".
- Secondary: "Back to results".
- Promo, alternative payment methods, kickoff-call link → tertiary or removed.
- Show the order summary alongside the payment form on desktop; stacked on mobile.

### `/application-success`
- Primary CTA above the fold: step-3 upload (route-specific label).
- 5-step tracker is visible on first paint.
- Bottom of page: another primary CTA going to the same step-3 upload (long pages need a recovery CTA).
- Sticky mobile CTA: same step-3 upload.
- Add-on/blocker cards must route to step-3 upload OR a real flow — never to a placeholder.

### `/documents/start`
- Hero: which document to upload right now (the first required slot).
- Camera/file CTA prominent.
- Side panel: requirement checklist for that document type.
- Sticky CTA: capture / upload action depending on flow state.
- After upload: progress bar + next-best slot CTA.

### `/portal`
- Top: status banner reflecting current case state (collecting / under review / action required / completed).
- Next-best-action card directly under the banner — single CTA pointing at the priority document or the next manual step.
- Document checklist grouped per route config.
- Privacy acknowledgement is a one-time gate; once cleared, it does not return.

## Process

When asked to redesign or restyle a conversion page:

1. Read the page's current implementation in full. Note every CTA, every "second CTA pretending to be primary", every link out of the funnel.
2. Read `docs/funnel-map.md`, `docs/product-routes.md`, `docs/compliance-rules.md`.
3. Decide the **one** primary action for this page. If you can't name it in one sentence, the page needs more thinking before code.
4. Demote everything else. Secondary outline, tertiary text link, or removed.
5. Pull route-specific copy from the canonical configs. Do not duplicate strings.
6. Sketch the new layout in the PR description (ASCII or a short paragraph). Don't write code until the hierarchy is clear.
7. After the visual change, walk the funnel end-to-end on desktop and on mobile in dev. State explicitly if you couldn't.

## Anti-patterns

- A page with three buttons of equal weight above the fold.
- A "kickoff call" link that competes with the upload CTA on the success page.
- A footer link on `/portal` that takes the user back to `/`.
- A 12-section page when 5 sections would do.
- A pricing block on `/application-success`. The user has already paid.
