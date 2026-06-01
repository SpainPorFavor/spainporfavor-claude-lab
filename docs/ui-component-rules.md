# UI Component Rules

> The API and usage rules for the shared UI primitives that future pages should consume. Companion to `docs/design-direction.md` (visual source of truth) and `.claude/skills/spf-premium-brand-system/SKILL.md` (the working playbook).
>
> All primitives live under `client/src/components/ui/`. They are pure presentational components — no data fetching, no router awareness, no analytics. Pages compose them.

---

## 1. The eight primitives

| Component | Purpose | Status |
|---|---|---|
| `<SurfaceCard>` | The recurring white card pattern | Available in PR-5 |
| `<StatusBanner>` | Coloured banner with icon + title + body, used at the top of pages to communicate state | Available in PR-5 |
| `<NextBestAction>` | Single-action card with title, description, and a CTA | Available in PR-5 |
| `<StickyMobileCta>` | Fixed-bottom CTA that appears on scroll on mobile | Available in PR-5 |
| `<EmptyState>` | Icon + headline + body + CTA full-page or inline empty pattern | Available in PR-5 |
| `<ErrorState>` | Icon + headline + body + retry CTA + support link | Available in PR-5 |
| `<JourneyStepper>` | The 5-step activation tracker (horizontal desktop, vertical mobile) | Available in PR-5 |
| `<SectionHeader>` | Section title + optional eyebrow + optional subtitle | Available in PR-5 |

Pages are **not** refactored to use these in PR-5. PR-6 onwards will start the migration. Until then, the legacy hand-rolled patterns in `Home.tsx`, `OrderForm.tsx`, `ApplicationSuccess.tsx`, `DocumentIntake.tsx`, `Portal.tsx` keep working.

---

## 2. `<SurfaceCard>`

The single source of the white card pattern.

```tsx
<SurfaceCard variant="default" className="…">
  …card content…
</SurfaceCard>
```

| Prop | Type | Default | Use |
|---|---|---|---|
| `variant` | `"default" \| "highlighted" \| "success" \| "muted"` | `"default"` | Visual emphasis. `highlighted` = current action; `success` = approved; `muted` = paused/archived. |
| `as` | `"div" \| "section" \| "article"` | `"div"` | Semantic element. |
| `padding` | `"sm" \| "md" \| "lg" \| "none"` | `"md"` | Internal padding. `"none"` for when the card contains its own padded sub-sections. |
| `className` | `string` | — | Composed via `cn()`. |

**Use it for:** card-shaped content blocks on `/portal`, `/application-success`, `/documents/start`, and inside cockpit configs.

**Don't use it for:** the page background, full-bleed sections, or hero areas.

---

## 3. `<StatusBanner>`

Top-of-page banner that names the user's current case state.

```tsx
<StatusBanner
  status="action_required"
  title="Action required"
  body="One or more documents need changes before your case can move forward."
/>
```

| Prop | Type | Use |
|---|---|---|
| `status` | `"collecting" \| "under_review" \| "action_required" \| "ready_for_gestor" \| "completed"` | Drives colour, icon, and aria role. |
| `title` | `string` | One-line headline. |
| `body` | `string` | One-sentence body. |
| `icon` | `LucideIcon` (optional) | Override the default icon. |

**Use it for:** the top of `/portal`, optionally on `/application-success` for non-default states.

**Don't use it for:** generic informational notices — use `<SurfaceCard>` with neutral copy.

---

## 4. `<NextBestAction>`

The single-CTA "what to do next" card.

```tsx
<NextBestAction
  title="Next: Upload your passport"
  description="Start with your passport — it's the quickest document to upload."
  cta={{ label: "Upload", onClick: () => openUploadModal() }}
/>
```

| Prop | Type | Use |
|---|---|---|
| `title` | `string` | The action headline. |
| `description` | `string` | One-sentence rationale. |
| `cta` | `{ label: string; onClick?: () => void; href?: string }` (optional) | The primary CTA. Either `onClick` or `href`. Omit when the action is "wait for our team". |
| `icon` | `LucideIcon` (optional) | Leading icon. |
| `tone` | `"default" \| "urgent" \| "success"` | Tones the CTA colour and ring. |

**Use it for:** the next-best-action card on `/portal`, the post-payment action on `/application-success`.

---

## 5. `<StickyMobileCta>`

Fixed-bottom CTA that appears on scroll.

```tsx
<StickyMobileCta
  label="Upload Passport Now"
  icon={Upload}
  onClick={() => goToUpload()}
  showAfterScrollPx={400}
/>
```

| Prop | Type | Default | Use |
|---|---|---|---|
| `label` | `string` | — | CTA text. |
| `onClick` | `() => void` (optional) | — | Click handler. |
| `href` | `string` (optional) | — | Use instead of `onClick` for plain navigation. |
| `icon` | `LucideIcon` (optional) | — | Trailing icon. |
| `showAfterScrollPx` | `number` | `300` | Hide until the user has scrolled this far. |
| `caption` | `string` (optional) | — | One line of microcopy under the button (e.g. "Step 3 of 5"). |

**Hard requirements** (enforced by `spf-mobile-cx-accessibility`):

- Only renders on mobile (`md:hidden`).
- Includes `pb-[env(safe-area-inset-bottom)]`.
- The page that uses it must add `pb-24 md:pb-8` so the last card isn't hidden under the bar.
- Never paired with another sticky bar.

---

## 6. `<EmptyState>`

For full-page or inline empty states.

```tsx
<EmptyState
  icon={FileText}
  title="No Application Found"
  body="We couldn't find an active application linked to your account."
  cta={{ label: "Start your application", href: "/" }}
/>
```

| Prop | Type | Use |
|---|---|---|
| `icon` | `LucideIcon` | Visual cue. |
| `title` | `string` | One-line headline. |
| `body` | `string` | One-line body. |
| `cta` | `{ label, onClick?, href? }` (optional) | Primary action. |
| `secondaryCta` | same shape (optional) | Tertiary action. |

---

## 7. `<ErrorState>`

For full-page or inline error states. Same shape as `<EmptyState>` but tinted red and always includes a retry CTA + a support link.

```tsx
<ErrorState
  title="We could not load your case."
  body="Your payment may still be processing. Please refresh in a moment."
  onRetry={() => refetch()}
/>
```

| Prop | Type | Use |
|---|---|---|
| `title` | `string` | One-line headline. |
| `body` | `string` | One-line body. |
| `onRetry` | `() => void` (optional) | If present, renders a retry button. |
| `supportEmail` | `string` | Default: `support@spainporfavor.com`. |
| `subject` | `string` (optional) | Mailto subject. |

---

## 8. `<JourneyStepper>`

The 5-step activation tracker.

```tsx
<JourneyStepper
  title="Your 5-step Digital Nomad Visa journey"
  steps={[
    { label: "Payment confirmed", body: "Your payment was successful.", status: "complete" },
    { label: "Case opened", body: "…", status: "complete" },
    { label: "Upload your passport", body: "…", status: "current", cta: { label: "Upload My Passport Now", onClick: goToUpload } },
    { label: "Expert review", body: "…", status: "next" },
    { label: "Application ready / submitted", body: "…", status: "goal", note: "Final outcome depends on the competent authority." },
  ]}
/>
```

| Prop | Type | Use |
|---|---|---|
| `title` | `string` (optional) | Stepper heading. |
| `steps` | `StepConfig[]` | Always five entries. The component will warn at runtime if not. |
| `orientation` | `"auto" \| "horizontal" \| "vertical"` | Default `"auto"` (horizontal on `md:` and up, vertical below). |

`StepConfig` matches the existing shape in `client/src/pages/activationRouteConfig.ts` (`label`, `body`, `status`, `cta?`, `note?`). Don't fork the type — import from there.

**Hard requirements:**

- Five steps. Always five. The activation contract (`docs/funnel-map.md`) is enforced.
- The current step has `aria-current="step"`.
- The component never claims a step is `complete` that isn't.

---

## 9. `<SectionHeader>`

Plain section title used inside marketing pages and inside cards.

```tsx
<SectionHeader
  eyebrow="Step 3 of 5"
  title="Upload your passport"
  subtitle="Start with one identity document so we can verify your case details."
/>
```

| Prop | Type | Use |
|---|---|---|
| `eyebrow` | `string` (optional) | Small label above the title. |
| `title` | `string` | The section heading (renders as `<h2>` by default). |
| `subtitle` | `string` (optional) | One-line body under the title. |
| `as` | `"h1" \| "h2" \| "h3"` | Default `"h2"`. Only one `<h1>` per page; reserve for hero. |
| `align` | `"left" \| "center"` | Default `"left"`. |

---

## 10. Naming and import conventions

- Filenames: kebab-case (`surface-card.tsx`, `journey-stepper.tsx`). Matches shadcn convention.
- Exports: PascalCase (`SurfaceCard`, `JourneyStepper`).
- Imports: `@/components/ui/<name>` — the existing alias in `tsconfig.json`.
- All primitives are server-render-safe (no `useEffect` for first paint). Where state is needed, document the hook clearly.

---

## 11. What the primitives are not

- **Not data-aware.** They don't call tRPC, don't read URL params, don't fire analytics. Pages do that and pass props in.
- **Not router-aware.** They take `href` and `onClick` but don't import wouter. The page wires the navigation.
- **Not full pages.** `<JourneyStepper>` is the stepper. `<ApplicationSuccess>` composes a `<JourneyStepper>` plus its own sections.

If you find yourself wanting a primitive to "know" about a route or a tRPC query, that's a sign the logic belongs in the page or in a hook, not in the primitive.

---

## 12. When to add a new primitive

A new primitive is justified when:

1. The same JSX structure is repeated in three or more places.
2. The structure has enough variance that a CSS class isn't sufficient.
3. There's a clear API surface that won't change every PR.

A new primitive is **not** justified when:

1. The pattern appears in exactly one place (then it's a section, not a primitive).
2. The pattern has too many variations to API cleanly (then the variations should be reduced, not abstracted).
3. The pattern is page-specific (the order page's two-column checkout shell, the home page's hero — those stay in their respective pages).

When adding one, update this document in the same PR.
