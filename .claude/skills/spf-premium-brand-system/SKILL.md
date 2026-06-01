---
name: spf-premium-brand-system
description: Use for visual identity, brand polish, typography, spacing, cards, buttons, colors, shadows, premium feel, and design tokens. Enforces the SpainPorFavor look: premium but calm, modern European, trustworthy, immigration-service appropriate. Not generic SaaS, not cheap agency, not flashy.
---

# spf-premium-brand-system

You are the brand-system enforcer. Your job is to keep the visual identity coherent across every funnel surface. Every new component, every restyle, every token change passes through these rules.

## When this skill applies

- Touching design tokens in `client/src/index.css` (OKLCH colors, radii, font stacks).
- Building or restyling shared primitives (`SurfaceCard`, `StatusBanner`, `JourneyStepper`, etc.).
- Choosing colors, type sizes, weights, shadows, border radii on any funnel page.
- Adjusting headings, body copy hierarchy, microcopy, badges, trust signals.
- Reviewing a visual PR for brand fit.

## When this skill does NOT apply

- Funnel routing, product-route resolution, the 5-step activation contract → use `spf-funnel-architect`.
- Storage, presigned URLs, upload behaviour → use `spf-secure-documents`.
- Conversion-page hierarchy and CTA discipline → use `spf-conversion-ui` (it's a sibling, both can apply).
- Mobile-specific UX, accessibility, sticky CTAs, focus states → use `spf-mobile-cx-accessibility` (also a sibling).

## Brand stance (non-negotiable)

| Trait | What it looks like | What it doesn't |
|---|---|---|
| Premium but calm | Confident type, generous whitespace, restrained colour | Gradients across hero text, neon accents, glass-morphism |
| Modern European | Sober palette, careful spacing, plain language | "Move fast and break things" energy, emoji-heavy copy |
| Trustworthy | Real specifics ("Licensed Gestor", "48-hour review"), honest microcopy | Approval-rate badges, "Award-winning", "Trusted by thousands" |
| Immigration-service appropriate | Adult, professional, clear next step | Confetti, gamification, achievement stickers |
| Not generic SaaS | Each surface earns its layout from the user's job | Standard "Hero + 3-feature grid + pricing + FAQ" cargo cult |
| Not cheap agency | Type respects the reading distance; cards have considered shadows | Stock photography of smiling diverse people pointing at a laptop |
| Not flashy | Animations only where they aid comprehension | Lottie animations on every section |

If a design choice feels novel for its own sake, prefer the calmer alternative.

## Core tokens (single source: `client/src/index.css`)

| Role | Token | Value | Use |
|---|---|---|---|
| Primary brand | `--primary` | `oklch(0.77 0.16 70)` (warm amber) | Primary CTA, active stepper dot, key emphasis only |
| Foreground | `--foreground` | `oklch(0.18 0.03 250)` (dark navy) | Headings and body on light backgrounds |
| Background | `--background` | `oklch(0.985 0.002 250)` (soft warm white) | Page background |
| Card | `--card` | `oklch(1 0 0)` (pure white) | Surface cards |
| Muted text | `--muted-foreground` | `oklch(0.50 0.02 250)` | Helper text, captions, microcopy |
| Border | `--border` | `oklch(0.90 0.005 250)` (very soft grey) | Card borders, dividers |
| Destructive | `--destructive` | `oklch(0.60 0.22 25)` | Error states only |

**Status accent palette** (used on badges and banners; defined as Tailwind utility colors rather than tokens because each one needs both a bg and a text shade):

| Status | bg | text | Where |
|---|---|---|---|
| Complete / success | `emerald-50` | `emerald-700` | Approved doc, completed step, success banner |
| Current / active | `amber-50` | `amber-700` | In-progress step, required-uploading badge |
| Under review / waiting | `blue-50` | `blue-700` | Doc with team, waiting for staff action |
| Needs action / error | `red-50` | `red-700` | Rejected doc, hard error |
| Neutral / optional | `gray-50` | `gray-600` | Optional slot, paused state |

If a new colour is needed, add it to the token file with a rationale comment. Do not hardcode hex or new `oklch(...)` literals inside components.

## Typography

| Use | Family | Weight | Size on desktop | Size on mobile |
|---|---|---|---|---|
| Display (hero headlines) | Outfit | 700–800 | `text-3xl` / `text-4xl` | `text-2xl` |
| Section heading | Outfit | 700 | `text-2xl` | `text-xl` |
| Card heading | Outfit (or DM Sans if dense) | 600 | `text-base` / `text-lg` | `text-base` |
| Body | DM Sans | 400 | `text-base` (16px) | `text-base` |
| Microcopy / helper | DM Sans | 400 | `text-xs` / `text-[13px]` | `text-xs` |
| CTA label | DM Sans | 700 | `text-base` | `text-sm` |

Sizes outside this scale need a reason in the PR description. Never use `text-[10px]` or smaller for anything actionable.

## Cards

The single canonical card pattern:

```
bg-white rounded-xl shadow-sm border border-gray-100 p-6
```

Use `<SurfaceCard>` (see `docs/ui-component-rules.md`) rather than re-typing this string. Variants:

- Default: light shadow, soft border.
- Highlighted (current action): `border-amber-200 ring-1 ring-amber-100/60`.
- Success: `border-emerald-200`.
- Muted (resolved, archived): `opacity-70`.

Avoid: hard shadows (`shadow-xl`), heavy borders (`border-2`), busy gradients on cards.

## Buttons

Three roles, one each per screen:

| Role | Style | Where |
|---|---|---|
| Primary CTA | `bg-amber-500 hover:bg-amber-600 text-white font-semibold` via the `Button` component; brand amber token | Step 3 upload, "Pay & start", "Continue", "Submit" |
| Secondary | `variant="outline"` (Radix shadcn) | "I'll do this later", "View requirements", reversible alternatives |
| Tertiary / text link | Underlined small text, slate muted | "Skip", "Contact support", "Privacy Policy" |

Forbidden:

- Two primary CTAs above the fold on the same screen (see `spf-conversion-ui`).
- Custom `.btn-primary` class in `index.css` mixed with shadcn `<Button>` — pick one. Going forward, use `<Button>` with token-backed classes.

## Status badges and pills

Use the status colour palette above. Format:

```
inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
+ bg-<status>-50 text-<status>-700
```

Always include an icon when the badge communicates state (Lucide `CheckCircle2`, `Clock`, `AlertTriangle`, `AlertCircle`). Never just colour with no glyph — colour-only is an accessibility fail.

## Steppers (5-step activation tracker)

The 5-step activation contract from `docs/funnel-map.md` must be preserved. Visual rules:

- Five dots, always five, never four, never six.
- Status colours: `complete` → emerald check, `current` → amber number, `next`/`goal` → grey outline.
- Desktop: horizontal with a 2px connector line; the connector lights up emerald between completed dots.
- Mobile: vertical with a left-aligned connector line.
- Current step has an `aria-current="step"` attribute.

Use `<JourneyStepper>` (see `docs/ui-component-rules.md`) rather than reinventing it.

## Shadows

| Use | Class |
|---|---|
| Cards | `shadow-sm` |
| Floating CTA / sticky bar | `shadow-lg` |
| Modal | `shadow-xl` |
| Trust badges, microbar | none |

No `shadow-2xl`, no coloured shadows, no neumorphism.

## Spacing

| Surface | Vertical rhythm |
|---|---|
| Marketing sections | `py-16 md:py-24` |
| Page content blocks | `py-8 md:py-12` |
| Card-to-card | `space-y-5` |
| Inside cards | `space-y-3` |

If the page feels tight, add a step in the rhythm before adding text.

## Anti-patterns

- Hardcoding `#F59E0B`, `#D97706`, or `oklch(0.77 0.16 70)` in components. Use `--primary` or the `bg-amber-500` Tailwind alias.
- Spinning a new colour for a new state. Reuse the status palette.
- Adding visual flourishes (animations, hover effects, micro-interactions) to a page that doesn't need them.
- Replacing professional language with copy that sounds like a B2B SaaS tour.
- Building a button that doesn't match the primary/secondary/tertiary roles.

## Process

When asked to style a new surface:

1. Read `docs/design-direction.md` end-to-end. Confirm the change fits the brand stance above.
2. Reuse tokens and primitives. Do not introduce a new card flavour or a new shadow level without a documented reason.
3. Check the change on desktop **and** mobile in the same PR.
4. State explicitly in the PR description if you introduce a new token or a new primitive.
