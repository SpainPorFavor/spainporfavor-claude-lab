# Visual QA Checklist

> Every visual PR must satisfy this checklist before merge. Copy it into the PR description and tick the boxes. If a question doesn't apply, write `n/a` and say why.
>
> Companion to `docs/design-direction.md` (visual source of truth) and `.claude/skills/spf-visual-director/SKILL.md`.

---

## 1. Conversion clarity

- [ ] **Does the page have one clear primary CTA?** Only one button uses primary amber above the fold. Other actions are outline or text-link.
- [ ] **Does the user know where they are?** Page has a recognisable title, route-specific framing, and (where applicable) a case ID.
- [ ] **Does the user know what to do next?** The primary CTA names the next concrete action, not a generic "Continue".
- [ ] **Is the next-best action visible without scrolling?** Either above the fold or as a sticky CTA on scroll.
- [ ] **Does the page avoid sending paid buyers back to the homepage?** No primary CTA on `/application-success`, `/documents/start`, or `/portal` routes to `/`.

## 2. Route-specific copy

- [ ] **Does the page preserve route-specific copy?** EU Registration content stays EU. DNV stays DNV. Generic stays generic. Verified by reading the page with each route.
- [ ] **Does the page consume route data from the canonical configs?** No hardcoded "Digital Nomad Visa" or "EU Registration" in the page; pull from `activationRouteConfig`, `portalCockpitConfig`, `documentIntakeConfig`, or `documentRequirementConfig`.
- [ ] **Does the page handle the `unknown` route safely?** Renders the generic copy, never accidentally shows DNV copy.

## 3. 5-step activation model

- [ ] **Does the page preserve the 5-step activation model where relevant?** `/application-success` and `/documents/start` show all five steps. Steps 1 and 2 are complete on first load; step 3 is current.
- [ ] **Does step 3's CTA route to `/documents/start?session_id=…`?** The upload CTA never goes to the portal or the homepage.
- [ ] **Does the page use `<JourneyStepper>` rather than hand-rolled steppers?** (Once PR-6 starts the migration.)

## 4. Mobile

- [ ] **Does mobile work?** Tested at ≤ 414 px wide. No horizontal scroll. Every CTA reachable with a thumb.
- [ ] **Does the sticky CTA avoid covering content?** The last card on the page is visible above the sticky bar (page has `pb-24 md:pb-8` or similar).
- [ ] **Is there only one sticky bar?** No stacked fixed elements at the bottom.
- [ ] **Are tap targets ≥ 44×44 px?** Critical CTAs are `h-12` or `h-14`.
- [ ] **Are forms single-column on mobile?**

## 5. States

- [ ] **Are loading states clear?** A spinner + one-line plain copy ("Loading your application…"), not `null`.
- [ ] **Are error states clear?** Icon + headline + body + retry/next-step CTA + support link. No "Oops! Try again."
- [ ] **Are empty states clear?** Icon + headline + body + a CTA pointing at the way out.
- [ ] **Are async status updates announced?** `aria-live="polite"` on upload progress, validation results, status banner changes.

## 6. Accessibility

- [ ] **Exactly one `<h1>` per page?**
- [ ] **Section hierarchy goes `<h2>` → `<h3>` without skipping?**
- [ ] **Every interactive element has a visible focus ring?**
- [ ] **Every interactive element is reachable by Tab and triggerable by Enter / Space?**
- [ ] **Every icon-only button has an `aria-label`?**
- [ ] **Every image has an `alt` (decorative images use `alt=""` explicitly)?**
- [ ] **Body text contrast ≥ 4.5:1 against its background?**
- [ ] **Critical CTAs use type ≥ 14 px?**

## 7. Trust and compliance

- [ ] **Are claims substantiated?** No approval-rate percentages. No "Guaranteed approval". No "we don't stop until you're approved". No "Bank-grade security".
- [ ] **No fake trust signals?** The compliance sweep test (`client/src/pages/noForbiddenClaims.test.ts`) passes.
- [ ] **No fake actions?** Buttons that toast "Sent" without a backend, mailto links disguised as downloads, consent checkboxes that don't persist — all forbidden.
- [ ] **No fake OCR or fake AI?** The system uses a multimodal LLM for validation — describe it as "automated document checks", never "OCR" or "AI extracts your data".
- [ ] **Refund / resubmission copy is qualified.** "Free resubmission support for fixable document issues, subject to our terms" — not "Free resubmission guarantee — we don't stop until you're approved".

## 8. Design system

- [ ] **Does the page avoid generic SaaS design?** No "Hero + 3-feature grid + pricing + FAQ" cargo cult. Each section earns its place.
- [ ] **Does the page use the design tokens?** No hardcoded `#F59E0B`, `#1A2332`, etc.
- [ ] **Are buttons in their canonical roles?** One primary, the rest outline or text-link.
- [ ] **Do status badges include an icon?** Colour-only badges fail accessibility.
- [ ] **Are shadows soft (`shadow-sm` on cards, `shadow-lg` on sticky/floating, `shadow-xl` only on modals)?**
- [ ] **Does the page use the typography scale?** No `text-[10px]` or smaller for actionable text.

## 9. Process

- [ ] **What viewports did you exercise?** (List explicitly. Say "I could not test in a browser" if that's true.)
- [ ] **Did `pnpm check` pass?**
- [ ] **Did `pnpm test` pass (or only the baseline env-dependent failures remain)?**
- [ ] **Did `noForbiddenClaims.test.ts` pass?**
- [ ] **Did you introduce a new token, primitive, or pattern?** If yes, document it in the PR description and update `docs/design-direction.md` or `docs/ui-component-rules.md` in the same PR.
