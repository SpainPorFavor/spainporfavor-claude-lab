# Analytics Events

> The current funnel emits analytics events via `gtag('event', name, params)` (Google Analytics) plus an internal `trackEvent` helper. This document is the canonical inventory of events the funnel emits today and the events the Claude rebuild is permitted to add.
>
> Do not invent new event names without adding them here first. Drift in event names is the most common source of broken funnels in tools like Mixpanel and GA4.

---

## 1. Naming Convention

- `snake_case`.
- Format: `<surface>_<action>` or `<surface>_<noun>_<verb>`.
- Tense: past tense for completed actions (`viewed`, `clicked`, `completed`), present for state changes (`flow_started`).
- Avoid product abbreviations in event names. The product is carried as a parameter (`product_type`), not as a prefix.

---

## 2. Current Inventory (do not rename)

These events are already emitted today. Names are stable; do not rename without coordinating the analytics dashboard side.

### Application Success page (`ApplicationSuccess.tsx`)

| Event | Where | Params |
|---|---|---|
| `payment_success_page_viewed` | Page load (after verification) | `product_type`, `product_name`, `amount` |
| `success_page_error_state_viewed` | Verification failed branch | `reason` |
| `case_activation_cta_clicked` | Hero primary CTA | `product_type` |
| `step_3_upload_clicked` | Hero CTA, vertical stepper CTA, sticky CTA, bottom CTA | `product_type` |
| `kickoff_call_clicked` | Calendly link | `product_type` |
| `portal_link_resend_clicked` | Resend portal link button (TODO: actually persist) | `product_type` |
| `receipt_download_clicked` | Mailto receipt link | `product_type` |
| `sms_whatsapp_optin_checked` | WhatsApp opt-in checkbox (TODO: persist consent) | `product_type` |
| `addon_card_clicked` | Blocker card click | `addon`, `product_type` |
| `sticky_cta_clicked` | Sticky CTA on scroll | `product_type` |
| `support_clicked` | Footer support link | `product_type` |
| Google Ads `conversion` | Verified payment | `send_to`, `value`, `currency`, `transaction_id` |

### Document Intake page (`DocumentIntake.tsx` — emits via `track()` helper that wraps `gtag`)

| Event | Where | Params |
|---|---|---|
| `document_upload_page_viewed` | Page load, preselected doc | `product_type`, `case_id`, `document_type?`, `source?` |
| `document_upload_primary_cta_clicked` | Primary upload/scan CTA, doc-type selection | `product_type`, `document_type` |
| `document_upload_secondary_cta_clicked` | Secondary CTA (file vs camera) | `product_type`, `document_type` |
| `camera_scan_started` | `getUserMedia` success | `product_type`, `document_type` |
| `camera_permission_denied` | `getUserMedia` permission denied | `product_type`, `document_type` |
| `file_selected` | After file-picker selection | `product_type`, `document_type`, `file_count` |
| `document_submit_for_review_clicked` | Preview-card submit | `product_type`, `document_type` |
| `document_upload_completed` | Upload success (any path) | `product_type`, `document_type`, `upload_method?` |
| `document_upload_failed` | Secure upload failed (no legacy fallback after PR-1). Emitted from `DocumentIntake.tsx` catch. | `product_type`, `document_type`, `reason` |
| `back_to_checklist_clicked` | Back link | `product_type`, `document_type` |
| `ask_laura_document_clicked` | Help link to Laura chat | `product_type`, `document_type` |
| `template_downloaded` | (DNV employment template) | `document_type` |

### Portal, Home, OrderForm

Today these pages emit minimal analytics beyond the Google Ads conversion above. The Claude rebuild may add events from §3 as long as it adds them to this document in the same PR.

---

## 3. Approved New Events (rebuild may add these)

Use these names; do not invent variants.

### Funnel entry / Home

| Event | Trigger | Required params |
|---|---|---|
| `home_hero_cta_clicked` | "Start the quiz" CTA at top of `/` | — |
| `quiz_started` | First question answered | — |
| `quiz_step_completed` | Each question answered | `step`, `answer` |
| `quiz_email_submitted` | Email step submitted | — |
| `quiz_results_viewed` | Results screen rendered | `product_type` |
| `quiz_start_application_clicked` | Results "Start My Application" CTA | `product_type` |
| `pricing_card_clicked` | A pricing card on `/` | `product_type` |
| `faq_item_opened` | FAQ accordion expand | `question_id` |

### Order page

| Event | Trigger | Required params |
|---|---|---|
| `order_page_viewed` | Page load | `product_type`, `dependents` |
| `order_field_completed` | Each field blur with valid value | `field` |
| `order_promo_code_attempted` | Apply promo code button | — |
| `order_payment_started` | Stripe `confirmCardPayment` called | `product_type`, `amount` |
| `order_payment_failed` | Stripe returned error | `product_type`, `error_code` |
| `order_payment_succeeded` | Stripe returned success | `product_type`, `amount` |

### Portal

| Event | Trigger | Required params |
|---|---|---|
| `portal_viewed` | Page load (post-login, case loaded) | `product_type`, `case_status` |
| `portal_privacy_acknowledged` | Privacy gate submitted | `product_type`, `ai_validation_enabled` |
| `portal_document_upload_started` | Modal opened | `product_type`, `document_type` |
| `portal_document_upload_completed` | Upload success in modal | `product_type`, `document_type` |
| `portal_help_clicked` | "Ask Laura" / contact support | `product_type` |

---

## 4. Standard Params

Every funnel event should include `product_type` when the user has been associated with a product (post-quiz or post-payment). Standard values:

```
"eu-registration"
"digital-nomad-visa"
"non-lucrative-visa"
"student-visa"
"work-visa"
"unknown"   // pre-quiz or unmappable
```

Do not pass display names (`"Digital Nomad Visa (DNV)"`) as `product_type`. Always the slug.

---

## 5. PII Rules

Never include in event params:

- Email addresses (use a hashed user_id if needed)
- Phone numbers
- Names
- Document file names
- Document file bytes or base64
- Stripe PaymentIntent IDs in user-visible event logs (acceptable in Google Ads `transaction_id` only)
- Stripe customer IDs

Do include:

- Case IDs (internal integers, no PII)
- Slot IDs
- Document types (as enum values, e.g. `"passport"`, not `"john_doe_passport.pdf"`)
- Product type (slug)
- Amounts in cents (numeric)
- Currency code (`"eur"`)

---

## 6. Implementation

There is a `trackEvent` helper in `client/src/lib/tracking.ts` (referenced by `ApplicationSuccess.tsx`). All new tracking should go through one helper — do not call `gtag` directly from page components. If the helper does not yet cover GA4, Mixpanel, and any future destination, extend it in one PR rather than scattering destination logic across pages.

---

## 7. Open Questions

1. Is GA4 the only destination, or is there a server-side analytics layer planned? If server-side, the `trackEvent` helper should also POST to a backend endpoint.
2. Do we want session-level joins between the public path (no auth) and the portal path (authed)? If yes, we need a consistent `funnel_session_id` cookie set on first visit.
3. Should we move Google Ads conversion firing to the server (after webhook confirmation) to avoid client-side blocking? Today it fires from `ApplicationSuccess.tsx` after `data.verified`.
