# Design Direction

> The visual direction for the Claude version of SpainPorFavor. Tone: calm, confident, lightly premium. Not flashy. Not "startup-y". The user just paid €349–€799 to a service handling their immigration papers — the surface must feel like a professional firm, not a SaaS dashboard.

---

## Brand Voice

| Trait | What it looks like | What it doesn't |
|---|---|---|
| Calm | Plain sentences. Short paragraphs. Clear next step. | Emoji-laden, exclamation marks, "Let's go!" |
| Confident | "Your case is open." "We'll review your documents." | "Your case has been opened, with care, by our team!" |
| Specific | "Upload your passport — about 2 minutes." | "Get started in just a few clicks!" |
| Honest | "Final issuance depends on official requirements and appointment availability." | "Guaranteed approval." Any number-based approval claim. |
| Spanish-aware | Use Spanish administrative terms where accurate (padrón, NIE, Gestor, EX-18, Tasa 012). | Translate them away or anglicize. |

If a sentence could appear in a Notion onboarding template, it's wrong for this brand.

---

## Color System

Defined in `client/src/index.css` using OKLCH tokens. Do not hardcode hex or new oklch values in components.

| Role | Token | Value | Use |
|---|---|---|---|
| Primary (brand) | `--primary` | `oklch(0.77 0.16 70)` | Amber. Reserved for the primary CTA and active stepper dot. |
| Foreground | `--foreground` | `oklch(0.18 0.03 250)` | Headings and body text on light backgrounds. |
| Background | `--background` | `oklch(0.985 0.002 250)` | Page background. |
| Card | `--card` | `oklch(1 0 0)` | Surface cards. |
| Muted | `--muted-foreground` | `oklch(0.50 0.02 250)` | Helper text. |
| Destructive | `--destructive` | `oklch(0.60 0.22 25)` | Error states only. Not for "delete" buttons in the funnel — there are none. |

Status colors (used in document badges):

| Status | Bg | Text | Where |
|---|---|---|---|
| Complete | emerald-50 | emerald-700 | Stepper, approved doc badge |
| Current | amber-50 | amber-700 | Stepper, required-uploading badge |
| Under review | blue-50 | blue-600 | Doc waiting for human review |
| Needs action | red-50 | red-700 | Rejected doc |
| Optional / not started | gray-50 | gray-500 | Optional slot |

Tailwind utility colors (`amber-500`, `slate-600`, `gray-200`, etc.) are acceptable for incidental UI but the **brand amber** must always come from `--primary`. If you find yourself writing `bg-amber-500` for a primary CTA, replace with the token.

---

## Typography

| Use | Family | Source | Notes |
|---|---|---|---|
| Body | DM Sans | Local `font-family` declaration | System fallback if not loaded. |
| Display (headings) | Outfit | Local `font-family` declaration | Always paired with `text-[#1A2332]` foreground or the equivalent token. |

Sizes follow Tailwind defaults. `text-2xl md:text-3xl` for hero headlines, `text-base` for body, `text-xs` and `text-[11px]` for fine print and microcopy. Avoid declaring custom font sizes outside this scale.

---

## Layout

| Surface | Container | Background |
|---|---|---|
| Marketing pages (Home, About, Guides) | `max-w-6xl mx-auto px-4` | Page background, section dividers separate blocks |
| Order page | `max-w-6xl mx-auto px-4`, two-column on `lg` | `#FAFBFC` |
| Application success | `max-w-4xl mx-auto px-4 py-8 md:py-12` | `#FAFBFC` |
| Document intake | `max-w-5xl mx-auto px-4 py-6 md:py-10` | `#FAFBFC` |
| Portal | `max-w-4xl mx-auto px-4 py-6` | `bg-gray-50` |

These max-widths are intentional — content stays readable on widescreen monitors without spanning to the edges.

---

## Shared Primitives (build these as we go)

The current pages duplicate the same surface card and sticky-CTA patterns 30+ times. When extracting, use these names:

| Primitive | Purpose | Where to add |
|---|---|---|
| `<SurfaceCard>` | The recurring `bg-white rounded-xl shadow-sm border border-gray-100 p-6` card. | `client/src/components/ui/surface-card.tsx` |
| `<StatusBanner>` | The colored banner with icon + title + body used at the top of `/portal`. | `client/src/components/ui/status-banner.tsx` |
| `<StickyMobileCta>` | The fixed-bottom CTA that appears on scroll on `/application-success`, `/documents/start`, `/portal`. | `client/src/components/ui/sticky-mobile-cta.tsx` |
| `<TrustRow>` | The "GDPR Compliant · Licensed Gestor · Stripe Secure" row used at the bottom of the order page and as a footer microbar. | `client/src/components/ui/trust-row.tsx` |
| `<StepTracker>` | The 5-step horizontal/vertical stepper on `/application-success` and `/documents/start`. | `client/src/components/ui/step-tracker.tsx` |
| `<EmptyState>` / `<ErrorState>` | The icon + headline + body + CTA pattern used in error branches. | `client/src/components/ui/empty-state.tsx` |

Each primitive is added once, in its own PR, after the first page that needs it is being redesigned. Do not preemptively build them.

---

## Motion

- Framer Motion is allowed but used sparingly.
- Stepper, progress bars, and the quiz transitions can animate.
- The order page, success page, and intake page should **not** introduce new animations beyond loading spinners.
- Never animate dollar/euro amounts (looks gimmicky next to a Stripe form).

---

## Microcopy Rules

- CTAs use imperative verbs: "Upload My Passport Now", "Open Client Portal", "Resend my portal link".
- Microcopy under a CTA is permitted (one line, gray text). Use it for time estimates or scope clarification: "Takes about 2 minutes. You can upload the rest later."
- Error messages name the next action: "Please refresh the page and try again." not "Something went wrong."
- "Your documents are stored securely and accessed only by authorised case staff or approved service providers involved in your case" is the canonical privacy bullet. Do not rewrite it without updating `docs/compliance-rules.md`.

---

## Don'ts

- No "Powered by Stripe" badges. The Stripe logo is fine in the security footer microcopy.
- No fake testimonials. The Sarah M. quote on `/order` may stay as a real customer story; do not invent more without source.
- No "limited time offer" banners.
- No countdown timers.
- No exit-intent pop-ups in the post-purchase flow. (Exit-intent is acceptable in pre-purchase marketing surfaces.)

---

## Open Questions (to resolve before locking the system)

1. Do we ship dark mode? Tokens exist; no surface uses them. Recommend dropping until a user asks.
2. Do we keep the `Outfit` display font or replace with a single-family setup using DM Sans weights? Replacing reduces request size.
3. Do we keep the Sarah M. testimonial on `/order`? Replace with a structured TrustRow if not.
