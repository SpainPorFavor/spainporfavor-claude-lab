# SpainPorFavor — Funnel Map

This document describes the user-facing funnel flow from first visit through document submission.

---

## Primary Conversion Funnel

| Step | Route | Page | Purpose |
|------|-------|------|---------|
| 1 | `/` | Homepage | Landing page with split hero, trust signals, eligibility quiz entry CTA, pricing section, FAQ |
| 2 | `/#quiz` (section) | Quiz | 6-question interactive quiz embedded in homepage: location, purpose, nationality, family, income, employment |
| 3 | `/#results` (section) | Results | Personalized visa recommendation with timeline, document checklist preview, and "Start My Application" CTA |
| 4 | `/order` | Checkout | Custom order form with Stripe Elements (on-site payment, no redirect). Shows line items, dependent pricing, promo codes |
| 5 | `/application-success` | Payment Success | Route-specific activation page (DNV vs EU Registration vs Generic). 3-step stepper, case ID, blocker cards, CTA to upload documents |
| 6 | `/documents/start?session_id=X` | Document Intake | Document-specific upload page. Camera-first for passport/ID, file-first for contracts. Requirement checklists, preview/confirm, progress tracking |
| 7 | `/portal` | Application Portal | Authenticated client cockpit. Privacy acknowledgement gate, document checklist grouped by category, status banner, progress bar |

---

## Secondary Entry Points

| Route | Page | Purpose |
|-------|------|---------|
| `/free-assessment` | Free Assessment | Lead-gen form (name, email, phone, visa type, situation). Submits to leads table. Confirmation page launches AI chat with "Laura" persona for qualification |

---

## Internal / Admin Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | Admin Dashboard | Case list, document review queue, user management |
| `/gestor` | Gestor Dashboard | Assigned cases, document review, submission tracking |
| `/management` | Command Center | Internal ops: tasks, leads, team, vendors, approvals, audit, launch plan |
| `/team-login` | Team Login | Email/password login for internal team (not OAuth) |
| `/join/:code` | Join Team | Invite code registration for new team members |

---

## Content / SEO Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/guides` | Guides Hub | Visa guide index (DNV, NLV, Student, Work, EU Registration) |
| `/guides/:slug` | Visa Guide | Individual long-form visa guide |
| `/blog` | Blog Hub | Blog post index |
| `/blog/:slug` | Blog Post | Individual blog article |
| `/about` | About | Company info, team, mission |
| `/tools/beckham-calculator` | Beckham Calculator | Interactive tax savings calculator |
| `/tools/checklists` | Checklists | Downloadable document checklists by visa type |

---

## Legal Pages

| Route | Page |
|-------|------|
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/gdpr` | GDPR Compliance |
| `/cookies` | Cookie Policy |

---

## Data Flow Summary

```
Homepage Quiz → Results → /order (Stripe payment)
    → Stripe webhook creates Case + Document Slots
    → /application-success (shows case ID, next steps)
    → /documents/start?session_id=X (public upload, no login required)
    → /portal (authenticated, full case management)
```

The public document upload path (`/documents/start`) works without authentication using the Stripe session ID. The portal (`/portal`) requires OAuth login and provides ongoing case management.
