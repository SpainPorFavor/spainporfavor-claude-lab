# SpainPorFavor — Pre-Launch Test Plan

**Version:** 1.0  
**Date:** 25 May 2026  
**Environment:** https://spainporfavor.com  
**Test Card:** 4242 4242 4242 4242 (any future expiry, any CVC)

---

## How to Use This Document

Work through each section in order. For every test case, mark the result:

- **PASS** — works as expected
- **FAIL** — broken or incorrect (note what happened)
- **PARTIAL** — mostly works but has a minor issue (note the issue)

If you find a bug, note the **section number**, **what you did**, and **what happened** so we can reproduce and fix it quickly.

---

## 1. Public Website — First Impressions

These tests simulate a cold visitor arriving from Google or a social media link.

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 1.1 | Homepage loads | Visit spainporfavor.com | Hero section visible, "Check Your Eligibility — Free" CTA visible, no console errors | |
| 1.2 | Mobile responsive | Open on phone (or Chrome DevTools → iPhone 14) | Layout adapts, no horizontal scroll, CTA still tappable | |
| 1.3 | Navigation links | Click each top-nav link (Licensed Gestores, etc.) | Scrolls to correct section or navigates correctly | |
| 1.4 | Footer links | Scroll to footer, click Privacy, Terms, GDPR, Cookies | Each legal page loads with content | |
| 1.5 | Page load speed | Open Chrome DevTools → Network tab, hard refresh | Page fully interactive within 3 seconds on broadband | |
| 1.6 | SEO basics | View page source or use Lighthouse | Title tag, meta description, and OG tags present | |

---

## 2. Eligibility Quiz (Sales Funnel)

The core conversion flow. Test every pathway.

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 2.1 | Quiz starts | Click "Check Your Eligibility — Free" on homepage | Quiz modal/section appears with first question (Why are you moving?) | |
| 2.2 | Remote worker path | Select: Remote work → US → Just me → $3,800–$5,500 → Employee | Shows Digital Nomad Visa recommendation with €699 price | |
| 2.3 | Retiree path | Select: Retire → UK → Me + partner → Over £4,300 → Retired | Shows Non-Lucrative Visa recommendation with pricing | |
| 2.4 | Student path | Select: Study → Canada → Just me → Under C$3,000 → Student | Shows Student Visa recommendation | |
| 2.5 | EU citizen path | Select: Any reason → EU Citizen → any → any → any | Shows EU Registration Certificate (simpler process) | |
| 2.6 | Family pricing | Select: Remote work → US → Me + family (kids) → Over $5,500 → Employee | Shows DNV price WITH dependent add-on pricing | |
| 2.7 | Back navigation | Start quiz, answer 2 questions, click Back | Returns to previous question with answer preserved | |
| 2.8 | Quiz on mobile | Complete full quiz on mobile device | All options tappable, no overflow, recommendation readable | |

---

## 3. AI Chat (Lead Qualification)

The AI chat agent qualifies leads and handles objections.

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 3.1 | Chat opens | Click chat icon or "Chat with us" | Chat window opens with greeting message | |
| 3.2 | Basic qualification | Say "I want to move to Spain to work remotely" | Bot asks follow-up about nationality or situation | |
| 3.3 | Income question | When asked, say "I earn about $4000 per month" | Bot confirms eligibility and mentions DNV | |
| 3.4 | Pricing delivery | Continue through qualification flow | Bot eventually presents pricing (€699 for DNV) | |
| 3.5 | Objection handling | Say "That's too expensive" or "I can do it myself" | Bot handles objection professionally, doesn't get defensive | |
| 3.6 | Off-topic handling | Say something unrelated like "What's the weather in Madrid?" | Bot answers briefly then redirects to visa topic | |
| 3.7 | Already in Spain | Say "I'm already in Spain on a tourist visa" | Bot acknowledges urgency and adjusts advice | |
| 3.8 | Parent question | Say "Can I bring my mum?" | Bot explains parents need their own visa (NLV) | |
| 3.9 | Chat on mobile | Open chat on mobile device | Chat is usable, keyboard doesn't obscure messages | |
| 3.10 | Long conversation | Have 15+ message exchange | No crashes, responses stay relevant, no loops | |

---

## 4. Free Assessment Page

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 4.1 | Page loads | Navigate to /free-assessment | Assessment form/chat loads correctly | |
| 4.2 | Complete assessment | Fill in all required fields and submit | Confirmation shown, lead captured | |
| 4.3 | Validation | Try submitting with empty required fields | Error messages shown, form doesn't submit | |
| 4.4 | Email format | Enter invalid email (e.g., "notanemail") | Validation error shown | |

---

## 5. Stripe Payment Flow

**Important:** Use test card 4242 4242 4242 4242, any future expiry, any CVC.

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 5.1 | Checkout triggers | Complete quiz → click "Start My Application" or payment CTA | Stripe Checkout opens in new tab | |
| 5.2 | Checkout prefill | Check the Stripe Checkout page | Email should be pre-filled if user provided it | |
| 5.3 | Successful payment | Enter test card 4242..., complete payment | Redirected to /application-success page | |
| 5.4 | Success page content | After payment, check success page | Shows confirmation, next steps, and what to expect | |
| 5.5 | Declined card | Use card 4000 0000 0000 0002 (decline) | Stripe shows decline message, user can retry | |
| 5.6 | Cancel payment | Click back/cancel on Stripe Checkout | Returns to site without error | |
| 5.7 | Webhook fires | After successful test payment, check admin dashboard | Payment should appear in system (check Stripe Dashboard → Developers → Events) | |
| 5.8 | Promotion codes | If promo codes enabled, try entering one | Discount applied correctly | |

---

## 6. Client Portal (Post-Payment)

These tests require a logged-in user with an active case.

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 6.1 | Portal access | Navigate to /portal after login | Shows case dashboard with status | |
| 6.2 | Case status visible | Check portal main view | Current case status displayed (e.g., "Documents Required") | |
| 6.3 | Document upload | Click upload on a document slot, select a PDF | File uploads, shows "Pending review" status | |
| 6.4 | File size limit | Try uploading a file > 10MB | Error message shown, upload rejected | |
| 6.5 | File type check | Try uploading a .exe or .zip file | Error message shown, only PDF/JPG/PNG/WEBP accepted | |
| 6.6 | Multiple documents | Upload documents to 3+ different slots | Each slot shows its own upload status independently | |
| 6.7 | Portal messages | Check if any messages from gestor are visible | Messages display with timestamps | |
| 6.8 | Portal on mobile | Access portal on phone | Document slots visible, upload button works | |

---

## 7. Gestor Dashboard

Requires a user with gestor role. Access via /gestor or team login.

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 7.1 | Gestor login | Login via /team-login with gestor credentials | Gestor dashboard loads | |
| 7.2 | Case list | Check assigned cases | Shows list of cases assigned to this gestor | |
| 7.3 | Case detail | Click into a case | Shows client info, document slots, upload statuses | |
| 7.4 | Document review | View an uploaded document | Can see the document and its validation status | |
| 7.5 | Reject document | Click reject on a document, enter reason | Document marked as "needs_revision", client notified | |
| 7.6 | Approve document | Approve a valid document | Status changes to approved | |

---

## 8. Management Dashboard (Command Center)

Access via /management. Requires super_admin role.

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 8.1 | Command Center loads | Navigate to /management | KPI grid, alerts, readiness checks all visible | |
| 8.2 | Go/No-Go badge | Check top-right badge | Shows "NOT READY" (red) or "GO LIVE READY" (green) accurately | |
| 8.3 | Critical alerts | Check alert banner | Shows correct count of red/black risks and overdue tasks | |
| 8.4 | Backup status card | Check bottom-right card | Shows backup status or "No backups yet" message | |
| 8.5 | Run backup manually | Click "Run Now" on backup card | Toast confirms success, card updates with timestamp | |
| 8.6 | Sidebar navigation | Click each sidebar link | Each page loads without error | |
| 8.7 | Sign out | Click "Sign out" at bottom of sidebar | Logged out, redirected to login | |

---

## 9. Task Board

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 9.1 | Board loads | Navigate to /management/tasks | Kanban columns visible with task cards | |
| 9.2 | Create task | Click "New Task", fill form, submit | Task appears in "New" column | |
| 9.3 | Drag task | Drag a task card to "Doing" column | Task moves, toast confirms | |
| 9.4 | Task detail | Click a task card | Detail sheet opens with title, description, comments | |
| 9.5 | Edit task title | In detail sheet, click title to edit | Can edit and save title | |
| 9.6 | Add comment | In detail sheet, type a comment and submit | Comment appears in thread | |
| 9.7 | Filter by priority | Click Filter → select "Critical" priority | Only critical tasks shown | |
| 9.8 | Filter by queue | Select a specific queue filter | Only tasks in that queue shown | |
| 9.9 | Clear filters | Reset all filters to "All" | All tasks visible again | |
| 9.10 | Horizontal scroll | Scroll right to see Blocked column | All columns accessible via scroll | |
| 9.11 | No test data | Check all columns | No "Test task from vitest" entries visible | |

---

## 10. My Day

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 10.1 | Page loads | Navigate to /management/my-day | Shows overdue and critical tasks | |
| 10.2 | Tasks displayed | Check task list | Shows overdue tasks with due dates, critical tasks with priority badges | |
| 10.3 | Date format | Check all dates on page | All dates in DD/MM/YYYY format (European) | |
| 10.4 | Click task | Click a task from the list | Navigates to task board or opens detail | |

---

## 11. Case Rescue (Risk Matrix)

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 11.1 | Page loads | Navigate to /management/case-rescue | Risk list visible with severity badges | |
| 11.2 | Risk details | Check a risk entry | Shows case ID, severity (red/amber/green), description | |
| 11.3 | Resolve risk | Click resolve on a risk | Risk disappears from list, toast confirms | |
| 11.4 | Command Center updates | After resolving, go back to Command Center | Unresolved risk count decreased by 1 | |

---

## 12. Launch Checklist

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 12.1 | Page loads | Navigate to /management/launch | Integration list with status dropdowns | |
| 12.2 | Status display | Check each integration | Status matches description (no contradictions) | |
| 12.3 | Change status | Change a dropdown from "Not Configured" to "Ready" | Saves successfully, persists on refresh | |
| 12.4 | Scroll works | Scroll down through all integrations | No crash, all items visible | |
| 12.5 | Required vs optional | Check visual distinction | Required integrations clearly marked vs optional | |

---

## 13. Vendor Queue

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 13.1 | Page loads | Navigate to /management/vendors | Shows pending vendor tasks section | |
| 13.2 | Pending tasks | Check "Pending Vendor Tasks" section | Shows tasks in vendor_gestor/vendor_translator queues | |
| 13.3 | Task count | Verify count matches header | Number in header matches actual items listed | |

---

## 14. Approvals

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 14.1 | Page loads | Navigate to /management/approvals | Shows pending approval items | |
| 14.2 | Approve item | Click approve on a pending item | Item removed from queue, status updated | |
| 14.3 | Reject item | Click reject on a pending item | Item rejected with reason | |

---

## 15. Audit Log

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 15.1 | Page loads | Navigate to /management/audit | Shows list of audit events | |
| 15.2 | Pagination | Click "Next" to go to page 2 | Shows next 25 items, page indicator updates | |
| 15.3 | Previous page | Click "Previous" from page 2 | Returns to page 1 | |
| 15.4 | Date format | Check timestamps | All in DD/MM/YYYY HH:MM format | |

---

## 16. Team Management

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 16.1 | Page loads | Navigate to /management/team | Shows team members list | |
| 16.2 | Invite member | Click invite, fill email and role | Invitation sent/created | |
| 16.3 | Role assignment | Check role badges on team members | Roles displayed correctly | |

---

## 17. Content Pages

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 17.1 | Guides hub | Navigate to /guides | List of visa guides visible | |
| 17.2 | Individual guide | Click a guide (e.g., Digital Nomad Visa) | Full guide content loads with CTA | |
| 17.3 | Blog hub | Navigate to /blog | List of blog posts visible | |
| 17.4 | Blog post | Click a blog post | Full article loads | |
| 17.5 | About page | Navigate to /about | Company info and team section | |
| 17.6 | Beckham Calculator | Navigate to /tools/beckham-calculator | Calculator loads and accepts input | |
| 17.7 | Checklists | Navigate to /tools/checklists | Visa checklists display | |

---

## 18. Legal & Compliance

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 18.1 | Privacy Policy | Navigate to /privacy | Full privacy policy text loads | |
| 18.2 | Terms of Service | Navigate to /terms | Full terms text loads | |
| 18.3 | GDPR page | Navigate to /gdpr | GDPR compliance info loads | |
| 18.4 | Cookie Policy | Navigate to /cookies | Cookie policy text loads | |
| 18.5 | Cookie consent | First visit (clear cookies) | Cookie consent banner appears | |
| 18.6 | Consent recording | Accept cookies | Consent recorded (check via /gdpr or consent API) | |

---

## 19. Security & Edge Cases

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 19.1 | 404 page | Navigate to /nonexistent-page | Custom 404 page shown (not blank white screen) | |
| 19.2 | Direct URL access | Paste /management directly without login | Redirected to login or access denied | |
| 19.3 | Portal without case | Login as user with no case, visit /portal | Shows appropriate empty state (not crash) | |
| 19.4 | XSS attempt | In chat, type `<script>alert('xss')</script>` | Text rendered as plain text, no script execution | |
| 19.5 | SQL injection | In search/filter, type `'; DROP TABLE users; --` | No error, input treated as text | |
| 19.6 | Large file upload | Try uploading exactly 10MB file | Should succeed (at the limit) | |
| 19.7 | Concurrent sessions | Open site in two tabs, perform actions | Both tabs work independently | |
| 19.8 | Browser back button | Navigate through quiz, press back | Doesn't break the app or show stale state | |
| 19.9 | Slow network | Chrome DevTools → Network → Slow 3G | Loading states shown, no timeouts under 30s | |

---

## 20. Cross-Browser & Device Testing

| # | Test Case | Browser/Device | Expected Result | Result |
|---|-----------|----------------|-----------------|--------|
| 20.1 | Chrome Desktop | Chrome latest | All features work | |
| 20.2 | Safari Desktop | Safari latest (Mac) | All features work | |
| 20.3 | Firefox Desktop | Firefox latest | All features work | |
| 20.4 | Chrome Mobile | Android Chrome | Responsive, all tappable | |
| 20.5 | Safari Mobile | iPhone Safari | Responsive, all tappable | |
| 20.6 | Tablet | iPad Safari or Android tablet | Layout adapts appropriately | |

---

## 21. Performance & Reliability

| # | Test Case | Steps | Expected Result | Result |
|---|-----------|-------|-----------------|--------|
| 21.1 | Lighthouse score | Run Lighthouse on homepage | Performance > 80, Accessibility > 90 | |
| 21.2 | No console errors | Open DevTools console, navigate through site | No red errors (warnings acceptable) | |
| 21.3 | Image optimization | Check Network tab for images | Images served in WebP, reasonable sizes (< 500KB each) | |
| 21.4 | API response times | Monitor Network tab during normal use | All API calls respond within 2 seconds | |
| 21.5 | Memory leaks | Navigate between pages 20+ times | No increasing memory usage in Task Manager | |

---

## Test Accounts Needed

| Role | Purpose | How to Create |
|------|---------|---------------|
| **Visitor** (no account) | Test public pages, quiz, chat | Just visit the site |
| **Client** (logged in, has case) | Test portal, document upload | Complete payment flow with test card |
| **Gestor** | Test gestor dashboard | Create via /management/team with gestor role |
| **Admin / Super Admin** | Test management dashboard | Your existing account (John O'Dowd) |

---

## Post-Test Checklist

After completing all tests:

- [ ] All FAIL items documented with reproduction steps
- [ ] All PARTIAL items documented with the specific issue
- [ ] Critical path (quiz → payment → portal) has zero FAILs
- [ ] Management dashboard has zero FAILs
- [ ] No test data artifacts visible to real users
- [ ] Legal pages all load (GDPR compliance)
- [ ] Mobile experience is acceptable for all critical flows

---

## Priority Levels for Bugs Found

| Priority | Definition | Example |
|----------|-----------|---------|
| **P0 — Blocker** | Cannot launch until fixed | Payment doesn't work, site crashes |
| **P1 — Critical** | Major feature broken | Portal can't upload documents, chat doesn't respond |
| **P2 — High** | Important but workaround exists | Filter doesn't work, wrong date format |
| **P3 — Medium** | Cosmetic or minor UX issue | Alignment off on mobile, slow loading |
| **P4 — Low** | Nice to have | Animation missing, tooltip unclear |

---

*Report all findings back and we'll fix them before go-live.*
