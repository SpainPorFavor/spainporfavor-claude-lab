# Design Direction (Canonical)

> The visual source of truth for the SpainPorFavor funnel rebuild. Companion to `.claude/skills/spf-premium-brand-system/SKILL.md` (the working playbook for Claude) and `docs/ui-component-rules.md` (the API for the shared primitives).
>
> Tone, in one line: calm, confident, lightly premium. Not flashy. Not "startup-y". The user just paid €349–€799 to a service handling their immigration papers — the surface must feel like a professional firm, not a SaaS dashboard.

---

## 1. Visual Principles

These principles dominate any local design call. Re-read them before redesigning a page.

1. **Confidence beats flair.** A confident sentence and one CTA beats three CTAs and an animation. If a hover effect doesn't aid comprehension, cut it.
2. **Specificity beats marketing.** "Licensed Gestor Administrativo", "48-hour document review", "EX-18 form" — these are trust signals because they are specific. "Best in the industry" is not.
3. **Each surface earns its layout from the user's job.** The success page exists to push the user to step 3. The portal exists to surface the next-best document. Layouts that don't help that job get cut.
4. **Mobile-first.** The user takes the passport photo on a phone. Build mobile, scale to desktop.
5. **One source of truth per token.** Brand amber lives in `--primary`. Card structure lives in `<SurfaceCard>`. Route copy lives in the canonical configs from PR-3. Duplication is the path to drift.
6. **Never claim what we can't substantiate.** No approval rates, no "guaranteed" outcomes, no fake consent capture. The compliance sweep test (PR-4) enforces this.
7. **Honest copy travels with the user.** EU Registration users see EU language end-to-end. DNV users see DNV language end-to-end. Never mix the two.

---

## 2. Typography Rules

| Use | Family | Weight | Desktop size | Mobile size |
|---|---|---|---|---|
| Display (hero headline) | Outfit | 700–800 | `text-3xl` / `text-4xl` | `text-2xl` |
| Section heading | Outfit | 700 | `text-2xl` | `text-xl` |
| Card heading | Outfit or DM Sans | 600 | `text-base` / `text-lg` | `text-base` |
| Body | DM Sans | 400 | `text-base` (16px) | `text-base` |
| Helper / microcopy | DM Sans | 400 | `text-xs` / `text-[13px]` | `text-xs` |
| CTA label | DM Sans | 700 | `text-base` | `text-sm` |

- Headings hardcode the dark-navy foreground (`oklch(0.18 0.03 250)` or `--foreground`). Body uses the same on light backgrounds.
- Never use `text-[10px]` or smaller for anything actionable.
- One `<h1>` per page. Nested sections use `<h2>` then `<h3>`. Never skip a level.
- Sentence-case headlines. Title Case only on product names: "Digital Nomad Visa", "EU Registration Certificate".

---

## 3. Color Rules

All colours live in `client/src/index.css` as OKLCH tokens. Components reference tokens, not hex.

| Role | Token | OKLCH | Use |
|---|---|---|---|
| Primary brand | `--primary` | `oklch(0.77 0.16 70)` (warm amber) | Primary CTA, active stepper dot, key emphasis only |
| Foreground | `--foreground` | `oklch(0.18 0.03 250)` (dark navy) | Headings, body |
| Background | `--background` | `oklch(0.985 0.002 250)` | Page background |
| Card | `--card` | `oklch(1 0 0)` | Surface cards |
| Muted text | `--muted-foreground` | `oklch(0.50 0.02 250)` | Helper, caption, microcopy |
| Border | `--border` | `oklch(0.90 0.005 250)` | Card borders, dividers |
| Destructive | `--destructive` | `oklch(0.60 0.22 25)` | Error states only |

**Status accent palette** (Tailwind utility colours — each needs a bg + a text):

| Status | bg | text | Use |
|---|---|---|---|
| Complete / success | `emerald-50` | `emerald-700` | Approved doc, completed step |
| Current / active | `amber-50` | `amber-700` | In-progress step, required-uploading badge |
| Under review / waiting | `blue-50` | `blue-700` | Doc with team, awaiting staff action |
| Needs action / error | `red-50` | `red-700` | Rejected doc, hard error |
| Neutral / optional | `gray-50` | `gray-600` | Optional slot, paused |

**Hardcoded values that must NOT appear in components:**

- `#F59E0B`, `#D97706`, `#1A2332`, `#FAFBFC`, or new `oklch(...)` literals — use the token or a Tailwind alias.
- A new status colour. Reuse the palette above.

---

## 4. Card Rules

The single canonical card pattern:

```
bg-white rounded-xl shadow-sm border border-gray-100 p-6
```

Always use `<SurfaceCard>` (see `docs/ui-component-rules.md`) rather than retyping. Variants:

| Variant | Effect | When |
|---|---|---|
| `default` | Soft shadow, soft border | Most cards |
| `highlighted` | `border-amber-200 ring-1 ring-amber-100/60` | Current action ("next document to upload") |
| `success` | `border-emerald-200` | Approved / completed |
| `muted` | `opacity-70` | Resolved, archived, paused |

Forbidden: hard shadows (`shadow-xl` on cards), heavy borders (`border-2`), gradient backgrounds.

---

## 5. Button Rules

Three roles. **One primary CTA per screen above the fold.**

| Role | Style | Example use |
|---|---|---|
| Primary | `Button` with `bg-amber-500 hover:bg-amber-600 text-white font-semibold` | "Upload My Passport Now", "Pay €699" |
| Secondary | `Button variant="outline"` | "I'll do this later", "View requirements" |
| Tertiary / text link | Underlined slate text | "Skip", "Contact support" |

Forbidden:

- Two primary buttons of equal weight above the fold.
- Mixing the legacy `.btn-primary` CSS class with shadcn `<Button>`. Pick `<Button>` going forward.
- Custom hover effects that conflict with the shadcn focus-visible ring.

---

## 6. Status Badge Rules

Format:

```
inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
+ bg-<status>-50 text-<status>-700
```

Always pair a status colour with an icon (Lucide `CheckCircle2`, `Clock`, `AlertTriangle`, `AlertCircle`, `Circle`). Colour-only badges fail accessibility.

---

## 7. Stepper Rules (5-step activation)

The 5-step activation tracker on `/application-success` and `/documents/start` is canonical. Visual rules:

- Five dots, always five.
- States: `complete`, `current`, `next`, `goal`. Map to the status palette: complete → emerald check, current → amber numbered dot with `border-2 border-amber-400`, next/goal → grey outline.
- Desktop layout: horizontal, with a 2px connector line behind the dots. The connector lights up emerald between completed dots.
- Mobile layout: vertical stack with a left-aligned connector line; each step shows label + short body + optional CTA + optional note.
- Current step has `aria-current="step"`.
- Always use `<JourneyStepper>` rather than reinventing it.

---

## 8. Sticky CTA Rules

Sticky CTAs are powerful and dangerous. Rules:

1. **Only when helpful.** If the page fits in one viewport, don't sticky.
2. **Mobile-only by default.** Desktop usually doesn't need a sticky.
3. **One at a time.** Never stack two fixed bars.
4. **Mirrors the page's primary action**, not a side action.
5. **Doesn't cover content.** The page needs bottom padding (`pb-24`) so the last card isn't hidden.
6. **Safe-area-aware** on phones with home-bar gestures.
7. Use `<StickyMobileCta>` once it lands.

---

## 9. Mobile Rules

- Mobile-first CSS. Add `md:` / `lg:` to layer desktop.
- Tap targets ≥ 44×44 px. Critical CTAs `h-12` or `h-14`.
- No horizontal scroll on mobile.
- Single-column forms on mobile; multi-column only `md:` and up.
- `inputMode` and `autocomplete` set on every input.
- Labels visible; placeholders are not enough.

---

## 10. Accessibility Rules

- One `<h1>` per page; section levels go `<h2>` → `<h3>` without skipping.
- Colour contrast ≥ 4.5:1 for body text. Brand amber on white text needs a check; prefer amber as background with dark text.
- Visible focus ring on every interactive element. Don't `outline-none` without a replacement.
- Keyboard-reachable interactive elements with sensible tab order.
- `alt` on every `<img>`. Decorative images use `alt=""` explicitly.
- `aria-current="step"` on the active stepper item.
- `aria-live="polite"` on async status updates (upload progress, validation result).
- No critical action with text smaller than 14px.

---

## 11. Anti-patterns (do not ship)

- Approval-rate percentages or "Industry approval rate*" badges. Compliance sweep (PR-4) blocks reintroduction.
- "GDPR Compliant" / "Bank-grade security" / "256-bit SSL Encrypted" badges on marketing surfaces. Use the softer "Secure document handling", "Secure checkout".
- Fake actions: a button that toasts "Sent" without a backend call.
- A consent checkbox that doesn't persist.
- A page that sends a paid buyer back to `/` as its primary action.
- Two primary CTAs above the fold.
- Hardcoded brand colours in components.
- A new card style or shadow flavour without a rationale.
- A loading state that renders `null`.
- An error state that says "Oops! Try again."
- A "stay tuned for our launch" countdown timer.
- Confetti, gamification, achievement badges.
- Stock photography of smiling people pointing at laptops.

---

## 12. Open Questions

These are still unresolved at the design-direction level. Don't commit to either choice without buy-in.

1. **Dark mode.** Tokens exist; no surface uses them. Recommendation: drop until a user asks.
2. **Outfit display font.** Whether to keep paired with DM Sans, or move to a single-family setup with DM Sans weights. Keeping until a designer says otherwise.
3. **The Sarah M. testimonial on `/order`.** Real client or invented? If invented, replace with a structured `<TrustRow>` instead.
4. **Hero photography on Home.** No hero photo today. If one is added, it must be plausibly Spanish, not a stock smile.

---

## 13. Process for any visual PR

Before merging a visual change:

1. The Visual QA checklist in `docs/visual-qa-checklist.md` must pass.
2. The PR description must call out any new token, primitive, or pattern introduced.
3. The PR description must say what viewport(s) you exercised (or explicitly that you could not).
4. The compliance sweep test (`client/src/pages/noForbiddenClaims.test.ts`) must still pass.
