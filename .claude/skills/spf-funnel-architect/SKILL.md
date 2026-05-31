---
name: spf-funnel-architect
description: Use for any change to funnel routing, product-route resolution, document checklists, the 5-step activation contract, Stripe checkout flow, or case creation. Enforces the rule that EU Registration and Digital Nomad Visa logic never mix.
---

# spf-funnel-architect

You are the funnel architect for SpainPorFavor. Your job is to keep the conversion path coherent and to keep visa routes strictly separated.

## When this skill applies

- Editing routing in `client/src/App.tsx`.
- Editing or consolidating any of the four route-config files:
  `client/src/pages/activationRouteConfig.ts`
  `client/src/pages/portalCockpitConfig.ts`
  `client/src/pages/documentRequirementConfig.ts`
  `client/src/pages/documentIntakeConfig.ts`
- Editing checklists in `server/documentChecklists.ts`.
- Editing case creation in `server/portalDb.ts` (`createCaseWithSlots`).
- Editing Stripe flow in `server/stripe.ts`, `server/products.ts`, or `server/routers.ts` (checkout sub-router).
- Editing `/order`, `/application-success`, `/documents/start`, `/portal` business logic (not just visuals — for visuals, use `spf-visual-director`).

## Canonical funnel (must be preserved)

```
/ (quiz)
  → /order?product=<productId>&...     (Stripe Elements, on-site)
    → webhook payment_intent.succeeded → createCaseWithSlots
    → /application-success?session_id=pi_xxx
      → /documents/start?session_id=pi_xxx     (public, session-id auth)
        → /portal                              (OAuth, ongoing case management)
```

Any change that adds a step, removes a step, or changes the data carried between steps must be flagged in the PR description as a funnel change.

## The 5-step activation contract

After payment, the user must always see five steps:

1. **Payment confirmed** — complete.
2. **Case opened** — complete.
3. **Upload first document** — current. CTA goes to `/documents/start?session_id=…`.
4. **Expert review and application preparation** — next.
5. **Application ready / submitted** — goal.

Step 3's CTA copy varies by route (passport, passport-or-EU-ID, first document) but always goes to the upload page. Do not collapse the 5 steps to 4 or 3, and do not insert a 6th step.

## Hard rules

1. **EU Registration and Digital Nomad Visa never share a checklist, a copy block, or a CTA.** See `docs/product-routes.md` for the canonical separation.
2. **No silent visa-type defaults.** `getChecklistForVisaType` and equivalent functions must throw or return an explicit `UNKNOWN` route, not fall through to DNV. The previous behavior of "default to DNV" is a known bug and must not return.
3. **One product-route resolver, one source of truth.** Over time, the four config files collapse behind one `resolveVisaRoute()` in `shared/`. Until that consolidation lands, every matcher must use the same slug list — do not invent a new matcher with new slugs.
4. **Webhook idempotency.** Both `checkout.session.completed` and `payment_intent.succeeded` may fire. Dedupe by the case's existing `stripeSessionId`. Do not allow two cases for one purchase.
5. **Price is server-authoritative.** `server/products.ts` is the source of truth. The client-side `PRODUCT_INFO` in `OrderForm.tsx` is a display convenience and must agree with the server values. If you change one, change both, and consider eliminating the duplication.
6. **`session_id` is a query param, not a body field, on the success and intake pages.** Do not move it into headers or cookies without coordinating with the public upload path.
7. **No change to Stripe test-mode behavior in `STRIPE_TEST_MODE=true` without explicit approval.** The on-screen yellow test-mode banner must stay visible whenever test mode is active.

## Process

When asked to make a funnel change:

1. Read the relevant slice end-to-end: the route, the tRPC procedure, the DB writer, and the webhook handler if payment is involved.
2. Confirm your change preserves the 5-step model and does not collapse EU Reg and DNV logic.
3. If the change spans server + client, write the server test first (`server/*.test.ts`).
4. State which routes the change touches in the PR description.
5. Verify with `pnpm check` and `pnpm test`. If either fails, fix before reporting done.

## Output expectations

- Server changes must include or update a Vitest test.
- Client changes must include the smallest possible diff to the route or page.
- If you remove a fallback (e.g., the DNV default), state the new failure mode explicitly.
