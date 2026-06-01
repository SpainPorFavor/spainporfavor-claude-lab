---
name: spf-mobile-cx-accessibility
description: Use for mobile UX, sticky CTAs, upload flows, forms, modals, accessibility, tap targets, focus states, loading states, and error states. Enforces mobile-first layout, accessible contrast, and clear states. The funnel is paid for on phones; mobile is not the small-screen afterthought.
---

# spf-mobile-cx-accessibility

You are the mobile and accessibility enforcer. The funnel is paid for on phones (passport photos are taken on phones, IDs are uploaded from phones). Mobile is the primary surface; desktop is the larger version of the same layout, not the other way around.

## When this skill applies

- Any new layout that needs to work on a phone, tablet, and desktop.
- Sticky CTAs, mobile menus, slide-overs, drawers.
- Forms with multiple inputs, especially the order form and the document intake.
- Modals (`DocumentUploadModal`, future modals).
- Camera capture flows, file picker flows.
- Focus-state, tab-order, aria attribute decisions.
- Loading skeletons, spinners, "we couldn't load your case" error UI.

## When this skill does NOT apply

- Pure brand polish unrelated to layout/state → use `spf-premium-brand-system`.
- CTA hierarchy across the whole page → use `spf-conversion-ui`.
- Funnel routing or 5-step contract changes → use `spf-funnel-architect`.

## Hard rules

### Layout

1. **Mobile-first.** Default styles target the phone. Use `md:` / `lg:` to add desktop variants. Never the reverse.
2. **No horizontal scrolling on mobile.** Any element wider than the viewport is a bug, not a feature.
3. **Tap targets are at least 44×44 px** (or `h-11 w-11` in Tailwind terms). Critical CTAs are larger (`h-12` or `h-14`).
4. **The viewport meta tag is set** (already present in `client/index.html`) — do not let a redesign drop it.
5. **Safe-area-inset** on bottom-fixed elements when needed: `pb-[env(safe-area-inset-bottom)]` or the existing `safe-area-inset-bottom` utility.

### Sticky CTAs

1. **Sticky CTA only when helpful.** If the page fits in one viewport, no sticky CTA. If the user has to scroll past the primary action, sticky.
2. **Sticky CTA must not cover content** that the user is trying to read or act on. Provide bottom padding (`pb-24 md:pb-8`) so the last card isn't hidden under the sticky bar.
3. **One sticky CTA at a time.** Never two simultaneous fixed bars (one on top of the other).
4. **Mobile-only by default.** Desktop usually has the CTA visible without needing a sticky duplicate. Exceptions: long success pages, long portal pages.
5. **The sticky CTA mirrors the page's primary action**, not a side action. If the page's primary is "Upload passport", the sticky CTA is "Upload passport" — not "Book a call".
6. **Use `<StickyMobileCta>` once it lands.** Don't reinvent the fixed-bottom pattern per page.

### Forms

1. **Single column on mobile**, multi-column only when sensible on `md:` and up.
2. **`autocomplete` attributes** on every input: `name`, `email`, `tel`, `address-line1`, `postal-code`, `country`. Saves the user keystrokes; required for accessibility.
3. **`inputMode` on numeric inputs**: `inputMode="numeric"` for postal code, `inputMode="tel"` for phone, `inputMode="email"` for email.
4. **Labels are always visible**, not just placeholders. Placeholders disappear on focus and are missed by screen readers.
5. **Errors are announced**, not just coloured. Pair the red border with an `aria-describedby` linking to a visible text error.
6. **Disabled buttons explain why** (tooltip or inline microcopy). A grey button with no reason is a dead-end.

### Modals

1. **Focus is trapped** inside the modal when open.
2. **Escape closes the modal.** Click-outside closes the modal unless the modal owns unsaved state.
3. **`aria-modal="true"`** and `role="dialog"` set.
4. **The body doesn't scroll** behind the open modal.
5. **`DocumentUploadModal`** currently uses a custom modal pattern. When restyling, migrate to Radix `Dialog` so these come for free.

### Camera capture (document intake)

1. **Permission denial is graceful**, not silent. Show the existing "Camera access was blocked. You can still upload a file." fallback.
2. **The capture button is reachable with one thumb.** Bottom-centred, large tap target.
3. **The capture preview shows a frame indicator** so the user knows the doc is within bounds.
4. **After capture, the user can retake without losing the slot**. Don't redirect them back to the doc-type chooser.

### States (loading / empty / error)

1. **Loading**: a centred spinner with one line of plain copy ("Loading your application…"). Not a skeleton mosaic unless the content map is obvious.
2. **Empty**: an icon + a one-line headline + a body line + a CTA. Use `<EmptyState>` when it lands.
3. **Error**: an icon + a one-line headline + a body line + a retry CTA + a support link. Use `<ErrorState>` when it lands.
4. **Avoid "Something went wrong."** Always name the next step the user can take.

### Accessibility

1. **One `<h1>` per page.** Sections use `<h2>`, sub-sections use `<h3>`. No skipping levels.
2. **Colour contrast ≥ 4.5:1** for body text against its background. Brand amber (`oklch(0.77 0.16 70)`) on white text has marginal contrast — confirm with a checker if used for type.
3. **Visible focus ring** on every interactive element. The shadcn default `focus-visible:ring-2` is sufficient; don't override with `outline-none` and nothing else.
4. **Keyboard-navigable.** Every interactive element must be reachable by Tab and triggerable by Enter or Space.
5. **`alt` on every image.** Decorative images get `alt=""` explicitly, not no alt.
6. **`aria-current="step"`** on the active stepper item.
7. **`aria-live="polite"`** on async status updates (upload progress, validation results) so screen readers announce them.
8. **No critical action with text smaller than 14px.** "Continue" cannot be `text-[10px]`.

## Anti-patterns

- A sticky CTA covering the form field the user is filling in.
- Two fixed bars at the bottom of the screen (one with social proof, one with the CTA).
- An icon-only button without an `aria-label`.
- A custom modal without focus management.
- A camera flow that doesn't offer a file-upload fallback.
- A loading state that just shows `null` for two seconds.
- An error state that says "Oops! Try again." with no action.

## Process

When asked to redesign or restyle a page:

1. Open the page on a phone-sized viewport (≤ 414px wide) first. Build / restyle there.
2. Confirm every CTA is reachable with a thumb, and no horizontal scroll appears.
3. Tab through the page from the URL bar. Confirm every interactive element gets focus, in a sensible order, with a visible ring.
4. Confirm there is exactly one `<h1>`, and section hierarchy is correct.
5. Confirm every async state has a loading and an error fallback with a real next step.
6. State in the PR description what device / viewport you exercised, and explicitly call out anything you could not test.
