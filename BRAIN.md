# SpainPorFavor — Project Brain

> This file is the persistent memory of the SpainPorFavor project. It must be read at the start of every session and updated whenever meaningful decisions, context, or rules change. Last updated: 2026-05-30 (Session 9).
>
> **Auto-update rule:** BRAIN.md must be updated at the end of every session (before the final checkpoint) with any new decisions, architecture changes, or context shifts. This is a mandatory step — not optional.

---

## 1. What SpainPorFavor Is

SpainPorFavor is a tech-enabled Spanish visa document preparation service. It is **not** a law firm. It operates as a commercial administrative service that uses AI to automate 95% of the document preparation workflow, with licensed Gestores Administrativos handling the final review and submission to Spanish immigration authorities.

The core thesis: **Immigration is not a legal problem — it is a data-routing and compliance problem.** The vast majority of visa applications (especially the Digital Nomad Visa) are standardized paperwork. Traditional law firms charge €1,500+ and take weeks. SpainPorFavor undercuts at €349–€799 with faster turnaround by automating document extraction, form-filling, and compliance checks.

The business model is: **Acquisition wedge (visa) → System of Record → Lifetime monetization** (renewals, Beckham Law, tax filing, insurance affiliates, banking referrals).

---

## 2. Corporate Entity

| Field | Value |
|-------|-------|
| Company name | Bayshore Products S.L. |
| CIF | B70778360 |
| Location | Málaga, Spain |
| CNAE code needed | 82.10 (Administrative office activities) |
| Domain | spainporfavor.com |
| Brand name | SpainPorFavor (previously VivaSpain, rebranded early in development) |

---

## 3. The Team

### Core Team (Internal)

| Person | System Roles | Real Responsibilities |
|--------|-------------|----------------------|
| **John** (Owner) | super_admin | Founder. Finance/unit economics, tools/admin, final authority over AI priorities. Conditional Approval Required queue. Account email: aron@spainporfavor.com but team knows him as **John**. |
| **Paddy** | management, tech_compliance, admin | Tech, compliance, data/security, Google/Facebook Ads setup. Security/Compliance/System Risk queue. |
| **Naomi** | management, case_manager, translator, gestor, admin | Case flow, **partner/vendor relationships** (gestores, translators), customer success, SEO/content quality. Case Rescue queue. **Note: Naomi is NOT a gestor or translator herself — she manages the relationships with external gestor and translator partners.** |
| **Caleb** | (not yet onboarded) | Marketing/sales, funnel, acquisition. Works with Aron on objectives. |

### External Vendors (V1)

| Role | Status | Notes |
|------|--------|-------|
| Gestores | Awaiting partner confirmation | Wave 1 (5 emails) sent, no replies. Wave 2 (8 candidates) researched and ready. Milanuncios candidates (2 warm leads) identified. Full handoff doc created for Naomi. Need at least 1 confirmed before paid traffic. |
| Translators | Not yet engaged | Sworn translators (traducción jurada) required by Spanish government for foreign documents. |

### Team Authentication

- Aron logs in via Manus OAuth → super_admin
- Paddy and Naomi log in via email + password at /team-login (invite codes with multi-role assignment)
- Paddy's invite code: `46dbfe957ac80efd0c197b9266a55c82` (email: paddy@spainporfavor.com)
- Naomi's invite code: `58963e373f879cc4578d9b78cc4706a4` (email: naomi@spainporfavor.com)
- External gestores/translators will also use invite codes with restricted vendor roles

---

## 4. Pricing

All prices are flat fees (no hourly billing). This is a deliberate competitive positioning against law firms.

| Visa Type | Main Applicant | Per Dependent | Timeline |
|-----------|---------------|---------------|----------|
| EU Registration Certificate | €349 | €199 | 2–3 weeks |
| Digital Nomad Visa (DNV) | €699 | €399 | 4–6 weeks |
| Non-Lucrative Visa (NLV) | €649 | €349 | 6–8 weeks |
| Student Visa | €549 | N/A | 4–6 weeks |
| Work Visa | €799 | €449 | 8–12 weeks |

### Pricing Decisions & Rationale

- **No mandatory sales call.** Evidence from competitors (MigRun sells €530–€1,820 without calls), LegalZoom ($830M/year self-service), and Gartner (67% of buyers prefer rep-free) confirms self-service checkout works at this price point.
- **Dual CTA model:** Primary = self-serve checkout. Secondary = optional 10-minute eligibility review call (rescue path, not gate).
- **Dependent pricing** is quoted by Laura using actual family members mentioned in conversation (e.g., "€399 for your wife and €399 for your son"), not generic "per dependent."
- **Cost transparency:** Laura proactively mentions additional costs (translations, apostilles, government fees) that are NOT included in the flat fee. "What's Included / Not Included" section on homepage.
- **Resubmission guarantee:** If rejected due to a document-prep error on our side, we fix and resubmit at no cost. This replaces the earlier "money-back guarantee" language.

---

## 5. The Funnel

### Current Architecture

```
Ad/SEO/Direct → Landing page (spainporfavor.com)
  → 6-question eligibility quiz (location, purpose, nationality, family, income, employment)
  → Personalized visa recommendation + timeline + document count
  → Pricing section (dynamic based on quiz result)
  → Custom order form (/order) with Stripe Elements (card inline on our domain)
  → Success state → Client portal onboarding
```

### Alternative Entry: /free-assessment

```
Ad → /free-assessment (simple form: name, email, phone, visa type, situation)
  → Confirmation page with Laura AI chat
  → Laura qualifies conversationally (3 questions: location, family, work)
  → Laura prescribes visa + quotes price
  → CTA button appears ONLY after user explicitly says yes to proceed
  → Custom order form (/order) with pre-populated data
```

### Custom Order Form (/order)

Replaced Stripe Checkout redirect (May 28, 2026). Prospects now pay directly on spainporfavor.com:
- Two-column layout: order summary + trust signals (left), form (right)
- Pre-populates name, email, phone, nationality from quiz/chat data
- Collects billing address (country, address, city, zip)
- Stripe Elements for card input (PCI-compliant, no redirect)
- Specific CTA: "Pay €X — Start My Application"
- On success: creates case + sends welcome email automatically
- No header nav or footer — distraction-free checkout page
- **Test mode:** Frontend fetches Stripe publishable key from server at runtime via `trpc.checkout.getStripeConfig`. When STRIPE_TEST_MODE=true, server returns test key and frontend shows yellow TEST MODE banner. No rebuild needed to switch modes.

### Key Funnel Rules

1. Laura asks **ONE question at a time** and waits for a response.
2. CTA button appears **only after** the user explicitly agrees to proceed (not after price quote).
3. If user hesitates ("I need to think"), Laura gives a warm soft fallback with email + Calendly link. Multiple variants exist to avoid repetition.
4. Laura **prescribes** the visa ("the visa you need is...") — she does not reflect back what the user selected.
5. Quiz first question is "Where are you currently?" (inside/outside Spain) — this affects the process (some visas must be applied from home country).
6. Income thresholds are currency-localized based on nationality selection.
7. Criminal record "No" answer shows warning + consultation CTA (not a hard block — some records are minor/expunged).

---

## 6. Laura — The AI Chat Agent

Laura is the AI persona used across the platform. She appears on:
- `/free-assessment` confirmation page (pre-purchase qualification)
- Client portal `/portal` (post-purchase case management)

### Laura's Core Rules

| Rule | Detail |
|------|--------|
| Personality | Friendly, knowledgeable, professional. Not overly casual. |
| Message format | Short messages (under 60 words). Multiple things → split with `||` into separate bubbles. |
| Expert framing | Laura prescribes, she does not reflect. "The visa you need is..." not "Since you're interested in..." |
| One question at a time | NEVER bundle multiple questions. Ask one, wait for response. |
| Form data awareness | Do NOT re-ask what the user already provided in the form. Skip known answers. |
| Income self-qualifier | After recommending a visa, Laura asks "you'll need to show at least €X/month — does that work?" |
| Process before price | Explain the process (document prep → Gestor review → submission → approval) BEFORE quoting price. |
| Resubmission guarantee | Mention before price. |
| Personalized price | "From what you have shared with me, for you and your family..." then itemize. |
| No specific claims | Do NOT claim "98.7% approval rate", years in business, or specific review counts. |
| Parent handling | DNV only covers spouse/partner + children, NOT parents. Exclude parents from dependent pricing. |
| Typing delay | Randomized 1.5–3s, scales with message length. |
| Off-topic | Answer briefly and friendly, then lead back on topic. |
| Soft fallback variants | Multiple warm variants tracked to avoid repetition on second hesitation. |
| Email formatting | laura@spainporfavor.com must stay on one line (never split across bubbles), displayed in accent color. |

### Laura in Portal (Post-Purchase)

- Has full case context (status, documents, timeline, family info, visa type)
- Auto-messages on events: document validation complete, status change, requerimiento created, resolution
- Escalates questions she can't answer → creates escalation ticket for admin
- Proactive outreach: inactivity nudge (7+ days no uploads), document expiry warning, deadline reminders, milestone celebrations

---

## 7. The Gestor Model

**Critical understanding:** In Spain, immigration document preparation and submission is handled by licensed **Gestores Administrativos** — not lawyers. They are registered with the Colegio Oficial de Gestores Administrativos and submit directly through Spain's official systems using their digital certificates.

### How it works in SpainPorFavor

1. AI prepares the complete application package (OCR, form-filling, compliance checks)
2. Human reviewer checks AI output (mandatory — no AI-only submissions)
3. Licensed Gestor reviews the final packet
4. Gestor submits via official channels using their digital certificate
5. Post-submission monitoring

### Key facts about Gestores

- A single Gestor using RPA can process ~1,400 cases/month (up from ~380 manually)
- Average salary: ~€33K/year in Spain
- They are like "certified accountants but for immigration" (Laura's framing)
- The Spanish Government's submission system requires a licensed professional to file initial visa applications

### The Mercurio Claim (CORRECTED)

Early materials claimed "submitted via Mercurio platform." This was corrected during audit to: **"submitted directly to Spanish immigration authorities"** — because the specific portal name may change and we should not over-specify.

---

## 8. Income Requirements (2026)

The DNV income requirement is **€2,849/month** for the main applicant. This was verified and confirmed correct during the partner audit:

> Calculation: SMI (Salario Mínimo Interprofesional) €1,221 × 14 payments ÷ 12 months × 2 = €2,849/month

The earlier figure of €3,500/month was incorrect and was corrected across all files, the quiz, Laura's prompt, and the visa guides.

### Income thresholds by visa type

| Visa | Main Applicant | Per Dependent |
|------|---------------|---------------|
| DNV | €2,849/month | +€1,012/month |
| NLV | €2,400/month | Varies |
| Student | €600/month | N/A |

---

## 9. Competitive Positioning

### Direct Competitors

| Competitor | Model | Price Range | Key Difference from SPF |
|-----------|-------|-------------|------------------------|
| Balcells Group | Law firm, consultation-led | €150–€3,000+ | Slow, opaque, human-heavy |
| Lexidy | Law firm, "free consultation" gate | Custom quotes | Consultation-first funnel |
| MigRun | Tech-forward, self-service checkout | €530–€1,820 | Closest model to SPF. No AI chat. |
| MySpainVisa | Lawyer-led, online appointments | Custom | Experience-focused, not tech |
| Hoply | AI + law firm (Google-backed) | €895 DNV | End-to-end but expensive |
| immigro.ai | AI case prep only | £49–£299 | Does NOT submit — leaves user stranded |
| StartAbroad | Relocation planning + coaching | $2,145+ | Bundles visa + rental + coaching |
| MovingToSpain | Planning packages | €450–€1,895 | Consultations + community |

### SpainPorFavor's Positioning

> "The fastest clear path from eligibility to submitted Spanish visa application — transparent price, AI-guided checklist, licensed gestor submission, optional human reassurance."

### Unfair Advantages

1. AI chat qualification (Laura) — far more engaging than static forms
2. Licensed Gestores, not lawyers — faster, cheaper, specialist-positioned
3. Transparent flat-fee pricing with no hidden costs
4. Real-time case tracking in client portal
5. Family applications handled together with dynamic dependent pricing
6. AI document validation before human review (catches errors early)

---

## 10. The Platform (What's Built)

### Public-Facing

- Landing page with 6-question eligibility quiz
- /free-assessment (simple lead-gen form + Laura chat)
- /guides (5 visa guide pages with JSON-LD schema)
- /blog (5 long-tail SEO articles)
- /tools/beckham-calculator (interactive tax calculator)
- /tools/checklists (downloadable PDF document checklists per visa type)
- /about (structured ProfessionalService schema)
- Legal pages: /privacy, /terms, /gdpr, /cookies
- Sitemap, robots.txt, llms.txt, JSON-LD schema throughout
- Open Graph tags + Twitter Cards on all pages

### Client Portal (/portal)

- Case status with progress bar
- Document upload with drag-and-drop per slot
- AI document validation (multimodal — reads uploaded images)
- Laura chat (case-context-aware, persistent messages)
- GDPR consent gate before first upload
- Right-to-erasure (Article 17) self-service

### Management Center (/management)

- Executive Command Center (go/no-go readiness, red issues, revenue)
- My Day (personalized priorities per user)
- Team Task Board (Trello-style with labels, comments, attachments, due dates)
- Naomi's Case Rescue Queue
- Paddy's Security/Compliance/System Risk Queue
- Aron's Conditional Approval Required Queue
- Vendor Work Queue (gestores + translators see only assigned work)
- Integration Readiness / Launch Checklist
- Team Resources (tools, credentials, external services inventory)
- Leads Management (with auto-summarized chat notes via LLM)
- Team Management (invite creation, role management)

### Admin Dashboard (/admin)

- All cases list with filters
- Manual review queue (documents flagged UNCLEAR)
- Gestor assignment
- Email notification queue

### Security & Compliance

- GDPR consent capture with timestamp, IP, exact text
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- EXIF/metadata stripping from uploaded images
- Data retention: auto-delete documents 30 days after case closure
- Row-level data isolation (clients see own cases, gestors see assigned only)
- Audit logging on all sensitive actions
- Rate limiting on chat endpoints
- XSS prevention on AI-generated content

---

## 11. Key Business Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| No mandatory sales call | Evidence shows self-service converts better at this price point. Calls are rescue path only. |
| Flat fees, not hourly | Competitive differentiation vs law firms. Transparency builds trust. |
| AI-first, human-rescue | Laura handles 90%+ of qualification. Humans only for escalations. |
| Gestor model, not lawyer | Faster, cheaper, legally correct for document preparation + submission. |
| Light theme on landing page | 6-round design debate concluded light bg (#FAFBFC) + navy text (#1A2332) + amber CTAs (#F59E0B) converts better. |
| Prescriptive single visa recommendation | Don't give users a menu — tell them what they need. Reduces decision paralysis. |
| Remove price from quiz results | Advance to next commitment level before showing price. |
| Quiz before pricing | Users who complete the quiz are more invested → higher checkout rate. |
| "Where are you currently?" as Q1 | Critical for process — some visas must be applied from home country. |
| Softened statistics | Removed fake "98.7% approval rate" and fabricated testimonials. Replaced with honest framing. |
| No AI mentions in hero | Keep AI as subtle supporting detail. Lead with outcome, not technology. |
| Resubmission guarantee over money-back | More accurate to what we actually offer. |
| €2,849 income threshold | Verified: SMI €1,221 × 14 ÷ 12 × 2. Partner audit initially questioned this but calculation confirmed correct. |

---

## 12. Launch Blockers (as of May 28, 2026)

| Blocker | Status | Owner |
|---------|--------|-------|
| No gestor partner confirmed | Wave 1 (5 emails, no reply). Wave 2 (8 researched, not contacted). Milanuncios (2 warm). Handoff doc created for Naomi. | Naomi |
| Stripe test mode active | **CONFIRMED WORKING** — Test payment €349 succeeded (pi_3Tc8cePQMNl2HgGI17dD4x7g, Case #30001). Production deployed with runtime key fetching. Go live: set STRIPE_TEST_MODE=false in Settings → Secrets. | John |
| No end-to-end DNV case tested | Need one full case through the pipeline (can now test with 4242 card) | All |

### Resolved Since Last Update

| Item | Resolution | Date |
|------|-----------|------|
| Stripe Checkout UX | Replaced with custom order form (Stripe Elements on-site) | May 28 |
| Stripe test mode toggle | STRIPE_TEST_MODE env var + runtime key fetching. No rebuild needed to switch modes. | May 28 |
| Email system | Gmail MCP via laura@spainporfavor.com (SendGrid deprecated) | May 25 |
| Command Center counting archived tasks | Fixed — excludes archived from open count | May 28 |
| Phone country code defaulting wrong | Fixed — uses quiz nationality answer | May 27 |
| Meta Pixel / SendGrid in launch checklist | Removed — focusing on Google Ads only | May 27 |
| Gestor outreach handoff | Consolidated all research into single GESTOR-AND-OUTREACH-HANDOFF.md for Naomi | May 28 |
| Stripe live key in production build | Root cause: old deployed build had hardcoded pk_live_ key. Fixed by publishing latest code with runtime getStripeConfig. | May 28 |
| Auto-capitalize form fields | Shared `autoCapitalize()` in utils.ts. Applied to name/address/city across OrderForm, Home, FreeAssessment, JoinTeam. | May 28 |
| Test payment end-to-end | €349 EU Registration payment succeeded. Case #30001 created for paddymcc2004@gmail.com. Webhook fired correctly. | May 28 |

---

## 13. Future Revenue Streams (Post-Visa)

The visa is the acquisition wedge. Lifetime value per client: €9,000–€13,500 over 5 years.

| Timing | Service | Revenue |
|--------|---------|---------|
| Day 0 | Health insurance affiliate | €100–€300 |
| Day 0 | Banking/transfer affiliate (Wise, N26) | €10–€50 |
| Day 60 | Beckham Law application | €500–€1,500 |
| Monthly | Autónomo tax filing subscription | €100/month |
| Years 2–5 | Visa renewals | €300–€500 every 1–3 years |
| Future | ETIAS processing (top-of-funnel) | €39–€49 per application |

### ETIAS Strategy

When ETIAS launches in 2026, offer "assisted ETIAS application" for €39–€49 (government fee is €20). This is a massive top-of-funnel lead gen tool — captures contact info from millions entering Europe, then nurture toward long-stay visa services. Should be a **separate pan-European brand** (not under SpainPorFavor) because ETIAS is country-agnostic.

### Portfolio Strategy

- **SpainPorFavor.com** = flagship country brand for long-stay Spanish immigration (keep as-is)
- **Separate pan-European brand** (TBD) = ETIAS + short-stay travel services
- Future country expansion (FranceSilVousPlait, ItalyPerFavore) only after Spain is profitable and proven

---

## 14. Marketing & Acquisition Strategy

### Channels (Launch Focus)

| Channel | Budget Allocation | Notes |
|---------|------------------|-------|
| Google Ads | 60% | High-intent search. CPCs €15–30 but 30%+ conversion. **Primary channel for launch.** |
| SEO/GEO | 30% | Blog, guides, calculator, checklists. AI search optimization (llms.txt, JSON-LD). |
| B2B Partnerships | 10% | Relocation companies, HR departments, language schools. |

**Decision (May 27):** Meta Ads deprioritized for launch. Risk of EU "social issue" flagging + algorithm instability makes it unreliable for initial traction. Will revisit after proving unit economics on Google Ads.

### Facebook Ad Rules (Critical)

- Immigration services are NOT a Special Ad Category (no restrictions on targeting)
- BUT algorithm frequently flags immigration content as "political/social issues" → **banned in EU since Oct 2025**
- Must frame everything as commercial service: "We help you prepare your Spanish visa paperwork" ✓
- Never: "Spain's immigration system is broken" ✗
- Never assert personal attributes: "Are you an immigrant?" ✗ → "Planning a move to Spain?" ✓
- Never promise outcomes: "Guaranteed visa approval" ✗ → "Expert document preparation" ✓
- Lead forms: cannot request government ID numbers, immigration status, race/ethnicity

### Recommended Funnel Test Plan

1. **Test landing page angles:** DNV Fast Track vs Transparent Alternative vs Family Move
2. **Test CTA hierarchy:** "Check Eligibility" only vs + "See Pricing" vs + "Book 10-Min Review"
3. **Test offer ladder:** Document Check (€349) / Full Application (€699–€899) / Family Priority (€1,199)
4. **Test trust signal placement:** Above quiz vs below quiz

---

## 15. Unit Economics (Target)

| Metric | Target | Source |
|--------|--------|--------|
| Customer Acquisition Cost (CAC) | €85–€114 | Blended across channels |
| Revenue per visa (average) | €700 | Core service |
| Gross margin | 83% | After gestor/translator costs |
| Lead-to-customer conversion | 22% | Quiz funnel benchmark |
| Cost per lead (Meta) | €25 | Optimized quiz funnel target |
| Lifetime value (5-year) | €9,000–€13,500 | Visa + renewals + tax + affiliates |

---

## 16. Technical Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Tailwind 4 + shadcn/ui |
| Backend | Express 4 + tRPC 11 |
| Database | MySQL/TiDB (Drizzle ORM) — Manus-managed, no separate credentials |
| Auth | Manus OAuth (owner) + email/password with invite codes (team) |
| Payments | Stripe Elements (custom order form). **Test mode active** (STRIPE_TEST_MODE=true). Frontend fetches publishable key from server at runtime — not baked at build time. Yellow TEST MODE banner shown. To go live: set STRIPE_TEST_MODE=false in Settings → Secrets. |
| AI | Built-in LLM via invokeLLM helper (chat, document validation, lead summaries) |
| Email | Gmail MCP via laura@spainporfavor.com (connected MCP, labels: SPF/Prospects, SPF/Clients) |
| File storage | S3 via storagePut/storageGet + CloudFront CDN |
| Hosting | Manus platform (spainporfavor.com custom domain) |
| Scheduled jobs | Heartbeat (risk engine daily, proactive outreach, data retention, DB backup) |
| SEO | Google Search Console + IndexNow (Bing/Yandex) + sitemap.xml |

### Email Strategy

- **laura@spainporfavor.com** is the connected Gmail MCP. All automated emails (prospect follow-ups, client welcome, case updates) send from this address.
- **Resend.com** account is activated but will NOT be used for the first 60 days of launch. Gmail MCP handles everything for now.
- **info@spainporfavor.com** is the single public contact email shown on all legal pages and the website footer. privacy@ and hello@ were removed.
- Gmail labels: `SPF/Prospects` (pre-purchase), `SPF/Clients` (post-purchase). Auto-relabeled on conversion.

### Phone Country Code Logic

- Primary: Uses the quiz nationality answer to pre-populate the country code (US→+1, UK→+44, CA→+1, AU→+61, EU→+34)
- Fallback: IP geolocation (unreliable — was defaulting to UK for users browsing from Spain, hence the fix)

### Lead Notes Auto-Summary

- When a lead has chat history but no notes, the system auto-generates a brief summary on first view
- Uses LLM to extract key info: location, visa type, family situation, income bracket, timeline, employment
- Format: ultra-concise (e.g., "NYC, couple, DNV, freelancer, €4k/mo, move Sept, quoted €1098")
- Only runs once — never overwrites existing notes

---

## 16b. Tools & Services Inventory

| Tool | Category | Purpose | Credentials |
|------|----------|---------|-------------|
| Gmail (laura@spainporfavor.com) | Operations | All automated emails, prospect/client communication | Bitwarden |
| Stripe | Payments | Custom order form via Stripe Elements. Test mode toggle via STRIPE_TEST_MODE env var. Runtime key fetching (no rebuild to switch). | Manus-managed env vars (Settings → Secrets) |
| Google Ads | Marketing | Primary paid acquisition channel (AW-16909894540) | Bitwarden |
| Google Search Console | SEO | Site submitted, verified, sitemap indexed | Google account |
| Google Analytics / Umami | Analytics | Traffic tracking | Manus-managed |
| TiDB Cloud Database | Tech | MySQL-compatible DB, Manus-managed | No separate creds — auto-injected |
| GitHub | Tech | Code backup repository | Manus-managed remote |
| Bitwarden | Security | Team password vault | Master password with John |
| Resend.com | Tech | Email service (activated, NOT used for 60 days) | Bitwarden |
| CloudFront / S3 | Tech | Image CDN + file storage | Manus-managed |
| IndexNow | SEO | Instant indexing for Bing/Yandex | API key in code |
| Calendly | Operations | Optional consultation booking (secondary CTA) | Bitwarden |
| GoDaddy | Domain | spainporfavor.com domain registration | Bitwarden |
| Manus Dashboard | Platform | Hosting, deployment, DB panel, secrets | OAuth login |

### Key Project Files (Outside Codebase)

These files live in `/home/ubuntu/` (not in the project repo) and contain operational research:

| File | Purpose |
|------|---------|
| `GESTOR-AND-OUTREACH-HANDOFF.md` | **Master handoff doc** — all gestor contacts, status, templates, backlink targets in one file |
| `gestor-outreach-wave2.md` | 8 researched Wave 2 candidates (not yet contacted) |
| `gestor-outreach-program.md` | Email templates (ES/EN/WhatsApp) + send sequence |
| `gestor-registry-list.md` | 50 names from official Consejo General registry |
| `gestor-research.md` | Fiverr + Milanuncios candidates + competitor pricing |
| `gestor-onboarding-plan.md` | Full strategy: ideal profile, compensation, vetting, 7-day sprint |
| `backlink-outreach-emails.md` | 8 draft partnership/directory emails |
| `backlink-outreach-targets.md` | Blog/resource page owners for link building |

---

## 17. Case Workflow (18 Stages)

```
Payment Received → Case Created → Document Checklist Generated →
Documents Uploading → AI Validation → Human Review →
Translation Required → Translation In Progress → Translation Complete →
Gestor Review → Submission Ready → Submitted →
Post-Submission Monitoring → Requerimiento (if any) →
Requerimiento Resolved → Approved / Denied → Post-Approval → Closed
```

### Case Risk Engine (Deterministic Rules)

- **Green:** On track, no issues
- **Amber:** Minor delay or missing non-critical document
- **Red:** Deadline approaching, critical document missing, or requerimiento
- **Black:** Case at risk of failure (missed deadline, denial pending)

16 trigger conditions fire automatically. 24-hour escalation if unresolved.

---

## 18. Things to NEVER Do

1. Never claim specific approval rates (e.g., "98.7% success rate")
2. Never claim years in business or company tenure
3. Never store full card numbers, CVV, or raw webhook payloads
4. Never let AI update official case status without human confirmation
5. Never show passport/NIE/DOB/bank details in AI summaries (sensitive field masking)
6. Never frame ads as immigration policy commentary (EU ban)
7. Never promise guaranteed visa approval in any marketing material
8. Never re-ask questions Laura already has answers to from the form
9. Never show CTA button before user explicitly agrees to proceed
10. Never bundle multiple questions in a single Laura message

---

## 19. Things to ALWAYS Do

1. Always read this file at the start of every session
2. Always update this file when meaningful decisions change
3. Always ask ONE question at a time in Laura's chat
4. Always mention additional costs (translations, apostilles, gov fees) before checkout
5. Always explain the process before quoting the price
6. Always mention the resubmission guarantee before the price
7. Always personalize the price quote with actual family members mentioned
8. Always log AI/automation actions in the audit log
9. Always require human review before gestor submission
10. Always strip EXIF data from uploaded images before S3 storage
11. Always update BRAIN.md at the end of every session before the final checkpoint
12. Always read BRAIN.md at the start of every new session before making changes

---

## 20. Glossary

| Term | Meaning |
|------|---------|
| Gestor Administrativo | Licensed Spanish professional who submits immigration applications. Not a lawyer. |
| Mercurio | Spain's official immigration submission platform (name may change — use "Spanish immigration authorities" in client-facing copy) |
| DNV | Digital Nomad Visa — Spain's visa for remote workers. 3-year residency. |
| NLV | Non-Lucrative Visa — retirement/passive income visa. No work allowed. |
| NIE | Número de Identidad de Extranjero — foreigner ID number in Spain |
| TIE | Tarjeta de Identidad de Extranjero — physical ID card |
| Cita Previa | Government appointment (8–14 week waits currently) |
| Traducción Jurada | Sworn/certified translation required by Spanish government |
| Apostille | International document authentication (Hague Convention) |
| SMI | Salario Mínimo Interprofesional — Spain's minimum wage (€1,221/month in 2026) |
| Beckham Law | Tax regime allowing eligible expats to pay flat 24% on Spanish income up to €600K |
| Autónomo | Self-employed registration in Spain |
| ETIAS | European Travel Information and Authorisation System (launching 2026, €20 gov fee) |
| Requerimiento | Official request from Spanish authorities for additional documents/information |
| CNAE | Spanish business activity classification code |
| RPA | Robotic Process Automation (used to speed up gestor submissions) |

---

## 21. Decision Log (Chronological)

| Date | Decision | Why |
|------|----------|-----|
| Early May 2026 | Switch from dark to light theme | 6-round design debate — light converts better for this audience |
| Early May 2026 | Remove AI mentions from hero | Lead with outcome, not technology |
| Early May 2026 | Rebrand VivaSpain → SpainPorFavor | Better brand fit |
| May 4 2026 | Set DNV price at €699 | Undercuts lawyers (€1,500+), above DIY (€49–€530) |
| May 4 2026 | Add dependent pricing | Family applications are common; itemized pricing builds trust |
| May 5 2026 | Fix income to €2,849 (not €3,500) | Verified calculation: SMI × 14 ÷ 12 × 2 |
| May 5 2026 | Remove fake testimonials | Audit found fabricated quotes. Replaced with honest framing. |
| May 5 2026 | Add "Where are you currently?" as Q1 | Affects process — some visas require application from home country |
| May 5 2026 | CTA only after explicit yes | Users felt pressured when button appeared immediately after price |
| May 5 2026 | Laura asks one question at a time | Multiple questions confused users in testing |
| May 5 2026 | Exclude parents from DNV dependents | DNV only covers spouse/partner + children |
| May 18 2026 | 30-day launch plan created | Structured go-to-market with gates |
| May 19 2026 | Funnel strategy: self-service + human rescue | Based on competitor analysis and conversion evidence |
| May 20 2026 | Build Command Center | Pre-launch internal ops system for team coordination |
| May 21 2026 | Multi-role invites for Paddy/Naomi | Single invite assigns all needed roles on registration |
| May 21 2026 | Fix owner role reversion | OAuth login was overwriting super_admin to admin |
| May 21 2026 | Task board: sort by priority + fix dropdown | UX improvements for team usability |
| May 25 2026 | Gmail MCP replaces SendGrid | laura@spainporfavor.com sends all emails. SendGrid kept but unused for 60 days. |
| May 27 2026 | Remove Meta Pixel from launch | Focus on Google Ads only. Meta too risky for EU immigration content. |
| May 27 2026 | Phone country code from quiz nationality | IP geolocation was unreliable (defaulted UK for users in Spain). |
| May 27 2026 | Standardize all emails to info@spainporfavor.com | Removed hello@ and privacy@ references. Single contact email. |
| May 28 2026 | Custom order form replaces Stripe Checkout | Stripe Elements on-site. No redirect. Higher expected conversion. |
| May 28 2026 | Command Center excludes archived tasks | Bug fix — was counting archived as open. |
| May 28 2026 | Lead notes auto-summarized from chat | LLM generates brief summary on first view if notes are empty. |
| May 28 2026 | BRAIN.md auto-update rule | Must be updated at end of every session before final checkpoint. |
| May 28 2026 | Stripe test mode: runtime key fetching | Frontend fetches publishable key from server at runtime (not build-time VITE_ env). Ensures test mode works in production without rebuild. Yellow banner shows when active. |
| May 28 2026 | Gestor outreach handoff created | Consolidated all gestor research (Wave 1 contacted, Wave 2 researched, Milanuncios warm leads, registry pool) into single handoff doc for Naomi/colleague. |
| May 28 2026 | Stripe test mode root cause found | Production had old build with hardcoded pk_live_ key. No code fix needed — just publish latest code with runtime getStripeConfig endpoint. |
| May 28 2026 | Auto-capitalize across entire funnel | Shared `autoCapitalize()` helper in utils.ts. Applied to all name/address/city fields in OrderForm, Home (visa pathway), FreeAssessment, JoinTeam. NOT applied to email/phone/postcode. |
| May 28 2026 | Stripe transaction confirmed working | Test payment €349 (EU Registration) succeeded: pi_3Tc8cePQMNl2HgGI17dD4x7g. Case #30001 created. Visible in Stripe Dashboard under main account (not sandbox view). |
| May 29 2026 | Lead drip email scheduler implemented | `server/leadDripEmails.ts` — scans every 2h, sends Day 1/3/7 nurture emails to unconverted leads. Dedupes via email_queue count. Uses `sendProspectEmail()` with type `prospect_nurture`. |
| May 29 2026 | Convert-to-Case one-click button | `management.leads.convertToCase` mutation — creates case with document slots, links lead, marks status `converted`, re-labels Gmail threads from Prospects → Clients. |
| May 29 2026 | Back-to-results link on order form | Chevron link above payment grid on `/order` page, navigates to `/#results` so prospects can review their recommendation. |
| May 29 2026 | Route-specific Case Activation Page | `ApplicationSuccess.tsx` rebuilt: DNV, EU Registration, and Generic fallback routes each get product-specific hero, stepper labels, checklist, blocker cards, CTA copy, and case ID prefix. No more EU-only content shown to DNV buyers. |
| May 29 2026 | Secure Document Intake page (Step 3) | New `/documents/start` page with camera capture, file upload fallback, quality checklist, EU ID front/back flow, route-specific content (DNV/EU/Generic), and full upload success state. Connected from Case Activation Page CTAs. Reuses existing `portal.uploadDocument` tRPC + `documentSlots`/`documentUploads` tables. |
| May 30 2026 | Private AWS S3 document storage | Separate from Manus Forge storage. New `secure_documents`, `document_access_logs`, `document_events` tables. `secureDocumentStorage.ts` service generates presigned PUT/GET URLs (10min/5min TTL). `secureDocumentRouter.ts` with `initUpload`, `completeUpload`, `staffGetDownloadUrl`, `staffListDocuments`, `staffUpdateReviewStatus`. KMS encryption (customer-managed or AES256 fallback). Frontend uses presigned flow with legacy base64 fallback when AWS not configured. |
| May 30 2026 | Portal Application Cockpit redesign | `Portal.tsx` rebuilt as route-specific Application Cockpit. Privacy acknowledgement gate (one-time per case/version, required consent + optional AI opt-in). Document checklist grouped by route config (DNV: Identity/Employment/Living; EU: Identity/Residence/Admin). Status banner, progress bar, next-best-action card, mobile sticky CTA. Fixed EU Registration case showing DNV documents (DB slots regenerated). `portalCockpitConfig.ts` drives all route-specific content. |
| May 30 2026 | Post-payment CTAs redirect to /portal via OAuth login flow | `/documents/start` and `/portal` both require auth. After Stripe checkout, user isn't logged in. Fix: `getLoginUrl(returnPath)` stores path in localStorage, sends user through OAuth, then `LoginReturnRedirect` component in App.tsx picks up the stored path and redirects to `/portal` after login completes. All CTAs on ApplicationSuccess.tsx use `goToPortal()`. Portal.tsx "Sign In" button also passes returnPath. |
| May 30 2026 | Reverted: public document upload flow (no login) | The login-first approach was wrong. Users should upload documents IMMEDIATELY after payment without creating an account. New public procedures: `checkout.uploadDocumentBySession`, `checkout.getSlotsBySession`. DocumentIntake.tsx has dual mode: auth path (logged-in users) + public session path (post-payment, uses session_id). |
| May 30 2026 | Session ID mismatch fix: Stripe API fallback | DB stores one session/payment intent ID but URL may have a different one (new payment). Fix: all public procedures now fallback to Stripe API → get customer email → find case by email → auto-update stored session ID. Functions: `findCaseByEmail()`, `updateCaseStripeSessionId()`. |
| May 30 2026 | Post-upload continuity bug identified | After uploading passport on public path, success screen shows static config text and resets to same page. No progression through remaining documents. Fix needed: derive remaining checklist from live `sessionSlotData.slots` (which already has `hasUpload` and `latestUploadStatus` per slot), show next required document, and provide clear progression. |
| May 30 2026 | Post-upload continuity FIXED | Success screen now shows dynamic checklist from live slot data: progress bar (X of Y uploaded), per-slot status badges (uploaded/required/optional), and primary CTA named after the specific next document ("Upload Employment Certificate"). When all required docs uploaded, shows completion state. |
| May 30 2026 | Next-document CTA skips to capture | Clicking "Upload [Next Document]" auto-creates a `DocumentTypeOption` from slot metadata (`label`, `description`, `requirementsText`) and jumps directly to the capture screen. Hero headline updates dynamically to "Upload your [Document Name]" with the document's description. No more looping back to passport selection. |
| May 30 2026 | Document upload flow architecture (final) | **Public path** (post-payment, no login): `/documents/start?session_id=X` → fetch case by session → show capture → upload via `checkout.uploadDocumentBySession` → refetch slots → show next document. **Auth path** (logged-in Portal users): same UI but uses `portal.uploadDocument` + `portal.getMyCase`. Both paths share the same `DocumentIntake.tsx` component with `isPublicPath` flag. |
| May 30 2026 | Document-specific upload page redesign | Full rewrite of `DocumentIntake.tsx` per pasted_content_8.txt spec. New `documentRequirementConfig.ts` drives all copy/behavior. Route-aware (EU Reg vs DNV vs Generic), document-specific (passport vs employment contract vs bank statements). Camera-first ONLY for passport/EU ID; file-first for everything else. Structured requirement checklists (not paragraphs). Multi-file support for contracts/statements/certificates. EU ID front+back flow. Preview/confirmation step ("Review before uploading"). Success → "Under review" (never "Approved"). Desktop two-column layout (requirements left, upload right). Mobile sticky CTA. "Ask Laura about this document" contextual help. Trust note without fake claims. Analytics events stubbed. |

---

## 22. Open Questions / Decisions Pending

- [ ] Which gestor partner will be confirmed first? (Naomi managing outreach — handoff doc delivered May 28)
- [x] ~~When will Stripe sandbox be claimed?~~ → Resolved: Sandbox provisioned. Test mode active (STRIPE_TEST_MODE=true). Go live by setting to false in Settings → Secrets.
- [x] ~~Does Stripe test mode actually work end-to-end?~~ → Resolved: Yes. €349 test payment succeeded (May 28). Case #30001 created. Visible in Stripe Dashboard (main account, not sandbox view).
- [ ] When will live Stripe keys be activated? (Set STRIPE_TEST_MODE=false when ready for real payments)
- [ ] What Calendly/booking link URL to use for the secondary CTA?
- [ ] Should Caleb be onboarded with an invite code? What roles?
- [ ] When to start paid traffic (Google Search first, per strategy)?
- [ ] Final offer ladder: single price vs 3-tier (Document Check / Full / Priority)?
- [ ] ETIAS brand name and domain selection
- [x] ~~SendGrid integration~~ → Resolved: Using Gmail MCP via laura@spainporfavor.com. SendGrid account exists but will NOT be used for launch (60 days).
- [x] ~~Stripe Checkout UX~~ → Resolved: Custom order form with Stripe Elements on-site.
- [x] ~~Drip email sequence (Day 1/3/7) for leads who don't purchase immediately~~ → Resolved: `server/leadDripEmails.ts` runs every 2h. Day 1 (check-in), Day 3 (common mistakes), Day 7 (last nudge). Dedupes via email_queue prospect_nurture count.
- [x] ~~"Convert to Case" one-click button in lead detail panel~~ → Resolved: `management.leads.convertToCase` mutation. Creates case + slots, links lead, marks converted, re-labels Gmail.
- [ ] Promo code for first real client (Stripe Dashboard)
- [ ] Post-upload state on activation page (requires backend upload tracking to toggle step 3 → complete)
- [x] ~~"Back to checklist" button on capture screen~~ → Resolved: Header now shows "← Back to document checklist" link. Capture screen has "← Back to document checklist" at bottom. Success screen primary CTA is "Back to document checklist" when all done.
- [ ] Email magic link after upload (so users can return later to finish remaining documents without bookmarking URL)
- [x] ~~Post-upload continuity~~ → Resolved: Success screen derives checklist from live `sessionSlotData.slots`. Shows progress bar, per-slot status, and named CTA for next required document. Clicking CTA skips to capture with correct document instructions.
- [ ] Staff document review UI (backend procedures exist: `staffListDocuments`, `staffUpdateReviewStatus` — no admin page yet)
- [ ] Upload confirmation email to client after document upload
- [ ] "Create account" prompt after successful document upload on public path (optional, for Portal access later)

---

## 23. BRAIN.md Update Protocol

**When to update:** At the end of every working session, before the final checkpoint is saved.

**What to update:**
1. Bump the "Last updated" date in the header
2. Add new entries to the Decision Log (Section 21)
3. Update any section where facts have changed (pricing, architecture, team, blockers)
4. Move resolved Open Questions to [x] with resolution note
5. Add new Open Questions discovered during the session

**Trigger:** If a checkpoint is being saved and BRAIN.md has not been updated during this session, update it first.

---

*End of BRAIN.md — This file is automatically updated at the end of every session. If you are reading this at the start of a new session, trust it as the current source of truth.*
