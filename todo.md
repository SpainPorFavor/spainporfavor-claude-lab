# Project TODO

- [x] Basic funnel page layout with dark theme
- [x] Switch to light theme based on 6-round design debate
- [x] Interactive 5-question eligibility quiz
- [x] Dynamic currency-localized income options based on nationality
- [x] Remove AI mentions from hero and page (keep as subtle supporting detail only)
- [x] Gestor "translate once, then own it" pattern across page
- [x] Prescriptive single visa recommendation (no menu of options)
- [x] Remove price from results section (advance to next commitment level)
- [x] Dynamic pricing section (shows prescribed visa if quiz completed, quiz prompt if not)
- [x] Dual-CTA model (primary self-serve checkout + secondary call option)
- [x] Post-purchase "What happens next" steps (not pre-purchase strategy call)
- [x] Fix footer date to 2026
- [x] Upgrade to full-stack with database and user management
- [x] Stripe integration with checkout sessions
- [x] Application form (pre-filled from quiz data) before Stripe checkout
- [x] Application success page
- [x] Stripe webhook handler for payment events
- [x] Quiz "back" button to correct misclicks
- [x] Money-back guarantee badge near CTA
- [x] Exit-intent popup for email capture
- [x] Sticky bottom CTA bar on mobile
- [x] AI chat widget with visa advisor persona (backend LLM integration)
- [x] Wire chat widget into funnel page as secondary CTA ("Get instant answers")
- [x] Update CTA hierarchy: primary (pay), secondary (chat), tertiary (book call)
- [x] Connect "book a 15-min call" links to real booking flow (Calendly/Cal.com) — left as placeholders per user request, to be connected later
- [x] Move chat widget to post-payment success page only
- [x] Remove "Get instant answers" secondary CTA from landing page
- [x] Update success page chat greeting to onboarding context

## Rebrand: VivaSpain → SpainPorFavor
- [x] Update brand name in navigation/header
- [x] Update brand name in hero section
- [x] Update brand name in footer
- [x] Update brand name in testimonials and social proof copy
- [x] Update VITE_APP_TITLE to SpainPorFavor — built-in secret, user can update via Settings > General
- [x] Update page title/meta tags

## Guarantee Copy Update: Money-Back → Free Resubmission
- [x] Update guarantee badge/shield text near CTAs
- [x] Update FAQ answer about rejections
- [x] Update pricing card features list (already said 'Free resubmission if rejected')
- [x] Update AI chat system prompt (server/routers.ts)

## Stage 3: Document Readiness + Timeline (pre-payment commitment)
- [x] Add 5 new questions after email capture: timeline, city, passport, criminal record, accommodation
- [x] Build personalized summary screen showing visa type, timeline, document checklist, progress bar
- [x] Wire summary screen CTA to existing results/payment flow
- [x] Ensure all new answers are stored and passed through the funnel state
- [x] Match visual style of existing quiz steps (animations, transitions)

## Audit Fixes (Concept Phase)
- [x] Fix DNV income requirement: €3,500 → €2,849/month across all files
- [x] Fix Mercurio claim: change to "submitted directly to Spanish immigration authorities"
- [x] Update income quiz thresholds to reflect 2026 requirements
- [x] Handle criminal record "No" answer: show warning + consultation CTA as primary path (user can still opt to proceed if they choose — not a hard block since some records are minor/expunged)
- [x] Fix misleading "Pay only when documents are ready" copy
- [x] Add toast/placeholder for "Book a free 15-min call" button
- [x] Add toast for dead footer links (Privacy Policy, Terms, GDPR, Cookie Policy)
- [x] Update AI chat system prompt with corrected income figure and Mercurio language

## Simple Lead-Gen Page (/free-assessment) — A/B Test Variant
- [x] Create FreeAssessment.tsx page (simple, fast-loading, no animations)
- [x] Add route /free-assessment in App.tsx
- [x] Build form: name, email, phone, visa type dropdown, free-text situation
- [x] Wire form submission to backend (extended leads table with name, phone, situation columns)
- [x] Add 3 trust signals (Licensed Gestores, 24hr response, no obligation)
- [x] Mobile-first responsive design
- [x] Add success/thank-you state after submission
- [x] Keep brand consistency (SpainPorFavor colors/fonts) but minimal JS

## Immediate Corrections (from partner audit)
- [x] Verified: €2,849 is correct (SMI €1,221 × 14 ÷ 12 × 2 = €2,849). Audit miscalculated.
- [x] Add "Where are you currently?" (inside/outside Spain) as first quiz question
- [x] Updated quiz step numbering (now 6 questions), answer indices, progress bar, and all downstream references
- [x] Softened fabricated statistics (6+ visa types, industry 97%*, 48hr review, removed fake testimonials)
- [x] Replaced with "Common Challenges We Solve" section, honest meta description, factual floating badge

## AI Chat on Free Assessment Confirmation Page
- [x] Add AI chat to "We've received your details" confirmation page
- [x] AI chat uses form submission data as context (name, visa type, situation description)
- [x] AI chat answers visa questions with knowledge base
- [x] AI chat nudges toward paid service with direct Stripe checkout link
- [x] AI chat greets user by name from form submission
- [x] AI chat includes disclaimer about Gestor confirmation

## Laura Persona Chat Rebuild (Free Assessment Confirmation)
- [x] Change chat header to "Hi {first_name}, my name is Laura, / If you have any questions, please ask me here"
- [x] First message from Laura: "Hi {first_name}, nice to meet you. Just one question, are you currently in Spain, or outside of Spain?"
- [x] Conversational quiz flow: 3 questions (location, family, work situation) building on form data
- [x] Branch on family answer: if kids mentioned, ask about ages
- [x] After quiz: Laura gives personalized visa recommendation with full name (not abbreviation) and timeline
- [x] Timeline question: "What timeline are you planning?" to gauge urgency
- [x] Urgency CTA: if "now/soon" → Laura gives price and checkout link
- [x] Soft fallback: if "thinking about it" → Laura offers email (laura@spainporfavor.com) + call booking link (placeholder)
- [x] After CTA: if prospect asks more questions, Laura answers briefly then redirects ("once we agree to work on your application, we can go through all those details together")
- [x] Typing indicator with randomized 1.5-3s delay on every Laura message (except initial greeting)
- [x] Off-topic handling: answer briefly and friendly, lead back on topic
- [x] Remove old "Visa Advisor — Ask Me Anything" header text

## Laura Chat UX Improvements
- [x] Split long Laura messages into multiple short bubbles (2-3 messages instead of 1 paragraph)
- [x] Expert framing: Laura prescribes the visa ("the visa you need is...") not reflects user's selection
- [x] Add typing indicator on Laura's first message (not instant)
- [x] Make first question a short one-liner, not a paragraph
- [x] Hold back timeline question until after the recommendation is delivered in separate bubbles

## Laura Prompt Improvements (Conversation Flow)
- [x] First message sets context: "Are you ok to answer a few questions about getting a visa in Spain?"
- [x] Email address stays on one line (never split across bubbles)
- [x] No repeated CTA mentions — "Start My Application" mentioned max once
- [x] Explain process before price (document prep → Gestor review → submission → approval)
- [x] Accurate Gestor framing: "The Spanish Government's submission system requires a licensed professional to file initial visa applications on your behalf"
- [x] Gestor explanation: like a certified accountant but for immigration
- [x] Resubmission guarantee mentioned before price
- [x] Personalized price: "From what you have shared with me, for you and your family..."

## Dependent Pricing
- [x] Add dependent products to products.ts (DNV €399, NLV €349, Work €449, EU €199)
- [x] Update Laura's prompt to quote family pricing correctly (main + per dependent)
- [x] Update checkout flow to handle dependent line items

## End-to-End Dependent Checkout Wiring
- [x] AssessmentChat detects family/dependent count from user messages (wife, kids, partner, etc.)
- [x] AssessmentChat passes dependent count to onStartApplication callback
- [x] FreeAssessment.tsx handleStartApplication accepts dependents param and passes to checkout.createSession
- [x] Added test: checkout accepts optional dependents parameter (creates Stripe session with dependent line items)
- [x] Added test: checkout rejects negative dependents

## CTA Button Timing Fix
- [x] Move CTA button appearance to AFTER Laura explains the process and quotes the price (not on timeline answer)

## Personalized Family Pricing Quote
- [x] Laura quotes price using actual family members mentioned (e.g., "€399 for your wife and €399 for your son") not generic "per dependent"

## Email Split & Calendly Link Fixes
- [x] Fix email address splitting across chat bubbles (laura@spainporfavor.com must stay in one bubble)
- [x] Add clickable Calendly link inside the chat bubble for soft fallback (not below the chat window)

## Bug Fixes - May 5 2026 (Batch 2)
- [x] Fix tab order skipping visa type dropdown on /free-assessment form
- [x] Typing delay should scale with message length (longer messages = longer typing bubble)
- [x] CTA button should show actual total price from conversation (not static €699)
- [x] Laura stops responding after "I need to think about it" — should continue with soft fallback
- [x] Fix: soft fallback injection was blocked by !showCTA condition (CTA already shown from price quote)

## Chat Test Findings - 10-Test Report (May 5 2026)

### Critical Issues
- [x] Remove "98.7% approval rate" claim from Laura's prompt (not appropriate to claim)
- [x] Remove any "years in business" or company tenure claims (avoid this type of reply)
- [x] Fix soft fallback: Laura must ALWAYS include email + Calendly link when prospect hesitates (Tests 2, 5, 10)
- [x] Fix loop bug: Laura re-asks "What timeline?" after answering mid-flow questions (Tests 3, 4)
- [x] Fix bot stalling before price: Laura must proactively deliver price after process explanation (Tests 2, 8)

### Significant Issues
- [x] Use form data to skip redundant questions (e.g., don't ask retiree about work situation) (Tests 2, 3, 8)
- [x] Add competitive differentiation response for "what makes you different?" questions (Test 10)
- [x] Add "already in Spain" path with process nuance (need to apply from home country) (Test 7)
- [x] Fix embedded "yes" detection: "Yes please explain" should not trigger re-asking (Test 8)

### Minor/UX Improvements
- [x] Add empathy/value reinforcement when price objections arise (Tests 3, 4)
- [x] Surface "Schedule a call" link more broadly (not just payment plan refusal)
- [x] Replace vague "SpainPorFavor difference" with concrete differentiators (Test 10)

## Persistent Bugs - May 5 Batch 3
- [x] CTA button shows €699 instead of total (€1,098 for user + wife) - fixed: now sums all € amounts or uses calculated total
- [x] CTA button should ONLY appear after prospect explicitly says yes to proceed (not after price quote)
- [x] Soft fallback freeze: fixed race condition (processingRef reset) + user hesitation detection

## Bug Fixes - May 5 Batch 4
- [x] Page scrolls down when assessment chat loads — must scroll to top of page
- [x] Remove "In the meantime, Laura from our team..." text from confirmation paragraph
- [x] Chat header: change "Hi {name}, my name is Laura" to just "My name is Laura"
- [x] Laura sends two questions at once — must ask only ONE question and wait for response
- [x] Soft fallback STILL not showing email/Calendly after hesitation (deployment confirmed)

## Bug Fixes - May 5 Batch 5
- [x] CTA button still appears after price quote — must ONLY appear after user explicitly says YES to proceed
- [x] "No problem at all" appears twice in soft fallback — remove duplicate (LLM says it + deterministic fallback adds it again)
- [x] Make laura@spainporfavor.com email address a different colour so it stands out in chat

## Laura Flow Improvements - May 5 Batch 6
- [x] Add income self-qualifier after visa recommendation ("you'll need to show at least €X/month — does that work for your situation?")
- [x] Update soft fallback to warmer Option 3 language ("Moving to a new country is a big decision...")
- [x] Add parent/mother handling in Laura's prompt (DNV only covers spouse/partner + children, not parents)
- [x] Exclude parents (mother, father, mum, dad) from dependent pricing auto-detection on DNV

## Laura Flow - May 5 Batch 7
- [x] Vary the soft fallback message so it doesn't repeat verbatim on second hesitation (use multiple variants, track which was used)

## WhatsApp Phone Capture - May 5
- [x] Add phone number field with international country code selector to assessment form
- [x] Add WhatsApp opt-in checkbox with consent language
- [x] Store phone number + opt-in consent (timestamp, consent text) in database
- [x] Phone field always visible (required), WhatsApp opt-in is the optional checkbox

## Client Portal — Phase 1 MVP
- [x] Database schema: cases table (id, userId, visaType, status, nationality, familyComposition, gestorId, stripePaymentId, notes, createdAt, updatedAt)
- [x] Database schema: documentSlots table (id, caseId, documentType, label, description, requirementsText, isRequired, apostilleRequired, translationRequired, validityDays, sortOrder)
- [x] Database schema: documentUploads table (id, slotId, fileKey, fileName, fileSize, mimeType, uploadedAt, validationStatus, aiFeedback, reviewedBy, reviewedAt)
- [x] Database schema: caseStatusHistory table (id, caseId, fromStatus, toStatus, changedAt, changedBy, note)
- [x] Push database migrations (pnpm db:push)
- [x] Backend: case creation procedure (auto-create from Stripe webhook OR admin manual create)
- [x] Backend: document checklist generation logic (per visa type + nationality + family)
- [x] Backend: document upload procedure (file → S3 → create documentUpload record)
- [x] Backend: AI validation procedure (invokeLLM with multimodal image input + structured JSON response)
- [x] Backend: get case with slots and uploads (client dashboard query)
- [x] Backend: admin list all cases procedure
- [x] Backend: admin manual review override procedure (PASS/NEEDS_REVISION with custom feedback)
- [x] Frontend: Client dashboard page (/portal) — case status, progress bar, document checklist
- [x] Frontend: Document upload component — per-slot upload with drag-and-drop, status indicator
- [x] Frontend: Validation feedback display — green/yellow/blue indicators with actionable messages
- [x] Frontend: Admin page (/admin) — list all cases, filter by status
- [x] Frontend: Admin manual review queue — documents flagged UNCLEAR, override controls
- [x] Auto-create case from Stripe checkout.session.completed webhook
- [x] Tests: case creation, document upload, AI validation mock, admin override

## AI-Owned Client Engagement + Gestor Dashboard + Security

### Security & Access Control
- [x] Add 'gestor' role to user role enum (admin / gestor / user)
- [x] Implement row-level data isolation: clients only see their own cases, gestors only see assigned cases
- [x] Add audit_log table (who accessed what, when, from where)
- [x] Ensure document S3 URLs are never exposed directly — always proxied through auth-checked endpoints
- [x] Add rate limiting on chat endpoints to prevent abuse
- [x] Sanitize all AI-generated content before rendering (XSS prevention)

### Database Schema Additions
- [x] portal_messages table (id, caseId, role [laura/client/system], content, metadata, createdAt)
- [x] case_events table (id, caseId, eventType, payload, triggeredMessageId, createdAt)
- [x] escalation_tickets table (id, caseId, messageId, question, status [open/resolved], adminResponse, resolvedAt)
- [x] requerimientos table (id, caseId, gestorId, description, documentsNeeded, deadline, status, createdAt)
- [x] audit_log table (id, userId, action, resourceType, resourceId, ipAddress, createdAt)
- [x] Update user role enum to include 'gestor'
- [x] Add gestorId assignment tracking on cases table (already exists)

### Backend: Case-Context-Aware Laura Chat
- [x] Portal chat procedure: client sends message → Laura responds with full case context
- [x] Build case context assembler: gathers case status, document statuses, timeline, family info, visa type for LLM prompt
- [x] Laura system prompt with case context injection (knows exactly where client is in process)
- [x] Message persistence: all messages stored in portal_messages
- [x] Escalation detection: Laura identifies questions she can't answer and creates escalation ticket
- [x] Audit logging on every chat interaction

### Backend: Event-Triggered Messages
- [x] On document upload validation complete → Laura auto-messages with result + next steps
- [x] On case status change → Laura auto-messages with explanation of what's happening
- [x] On requerimiento created → Laura translates and explains to client with deadline
- [x] On resolution logged → Laura delivers good/bad news with next steps

### Frontend: Portal Chat (Client Side)
- [x] Chat widget embedded in /portal page (persistent, case-aware)
- [x] Message history display (scrollable, grouped by date)
- [x] System messages styled differently from Laura/client messages
- [x] Typing indicator for Laura responses
- [x] Escalation indicator: "I've flagged this for the team" message style

### Gestor Dashboard
- [x] Gestor login and role-based routing (/gestor)
- [x] Case queue: assigned cases sorted by urgency/deadline
- [x] Case detail view: all documents, validation results, download ZIP
- [x] Structured actions: reject document (with reason template), log submission, log requerimiento
- [x] Submission logging: date, channel, reference number, receipt upload
- [x] Requerimiento logging: what's needed, deadline, affected document slots
- [x] Resolution logging: approved/denied, upload resolution document, trigger client notification
- [x] Gestor can only see/access their own assigned cases (enforced server-side)

### Escalation System
- [x] Escalation ticket creation from AI when it can't answer
- [x] Admin view: list open escalation tickets with case context
- [x] Admin responds → AI relays response to client in Laura's voice
- [x] Auto-close tickets after admin response is delivered

### Proactive Outreach (Scheduled)
- [x] Document expiry warning: flag documents approaching expiry date
- [x] Inactivity nudge: no uploads in 7+ days → Laura sends encouragement
- [x] Deadline reminders: requerimiento deadlines approaching
- [x] Milestone celebrations: "You're 75% done!" messages

## Security Hardening — Priority 1-5 (GDPR, Retention, Headers, EXIF, Erasure)

### GDPR Consent Capture
- [x] Add consent_records table (userId, consentType, consentText, ipAddress, userAgent, grantedAt, revokedAt)
- [x] Consent gate on first document upload: client must accept data processing terms before uploading
- [x] Store consent with timestamp, IP, and exact text shown
- [x] Show consent status in client portal (what they consented to, when)
- [x] Privacy policy page (/privacy) with clear explanation of data handling

### Security Headers
- [x] Add HSTS header (Strict-Transport-Security)
- [x] Add CSP header (Content-Security-Policy) — restrict script sources
- [x] Add X-Frame-Options: DENY (prevent clickjacking)
- [x] Add X-Content-Type-Options: nosniff
- [x] Add Referrer-Policy: strict-origin-when-cross-origin

### EXIF/Metadata Stripping
- [x] Strip EXIF data from uploaded images (JPEG/PNG) before S3 storage
- [x] Remove GPS coordinates, device info, timestamps from image metadata
- [x] Install sharp package for image processing

### Data Retention & Auto-Deletion
- [x] Add resolvedAt timestamp to cases table for tracking when case was closed
- [x] Scheduled scanner: find cases approved/rejected 30+ days ago
- [x] Delete all document uploads from S3 for expired cases
- [x] Delete document_uploads records for expired cases
- [x] Anonymize case record (remove clientName, clientEmail, clientPhone)
- [x] Log deletion in audit_log for compliance proof

### Right-to-Erasure (GDPR Article 17)
- [x] Add tRPC procedure: client can request full data deletion
- [x] Delete all documents from S3
- [x] Delete all portal_messages, case_events, escalation_tickets
- [x] Anonymize case record (keep anonymized shell for audit trail)
- [x] Mark case as "erased" (keep anonymized shell for audit trail)
- [x] Admin notification when erasure is requested (via admin listErasureRequests)
- [x] Confirmation flow: client must confirm twice before deletion executes (double-opt-in)

## Admin: Gestor Assignment
- [x] Backend: listGestors procedure (returns all users with gestor role)
- [x] Backend: assignGestor procedure (admin assigns a gestor to a case, fires case_event)
- [x] Frontend: Gestor assignment dropdown in admin case detail view
- [x] On assignment: fire case_event → Laura notifies client ("Your specialist has been assigned")

## Email Notification Layer
- [x] Email service module using built-in notifyOwner pattern for client emails
- [x] Trigger: document validation complete → email client with result summary
- [x] Trigger: case status change → email client with new status + next steps
- [x] Trigger: requerimiento created → email client with deadline + instructions
- [x] Trigger: proactive outreach (inactivity, expiry warning) → email if client hasn't logged in
- [x] Trigger: case resolution (approved/rejected) → email client with outcome
- [x] Email templates: plain-text branded with SpainPorFavor footer (HTML templates future)
- [x] Unsubscribe mechanism: reply STOP opt-out in email footer
- [x] Admin email queue UI: view, preview, select, and mark-as-sent

## AI Search Optimization (GEO) — Get Cited by AI Assistants
- [x] Create visa guide content hub pages (/guides/digital-nomad-visa, /guides/non-lucrative-visa, etc.)
- [x] Each guide: clear definition, requirements table, step-by-step process, timeline, FAQ section
- [x] Add JSON-LD schema markup: Organization, Service, FAQPage, HowTo, BreadcrumbList
- [x] Create llms.txt file for AI crawler directives
- [x] Update robots.txt to explicitly allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)
- [x] Create XML sitemap with all guide pages
- [x] Add meta descriptions optimized for AI synthesis
- [x] Include citations to official Spanish government sources (BOE, extranjeros.gob.es)
- [x] Add "last updated" dates on all guide content
- [x] Implement guides index page (/guides) as content hub landing

## Step 1: Submit Sitemap to Google Search Console & Bing Webmaster Tools
- [x] Submit sitemap.xml to Google Search Console via robots.txt Sitemap directive (ping deprecated)
- [x] Submit sitemap.xml to Bing via IndexNow protocol
- [x] Add IndexNow protocol support for instant page indexing (server/indexnow.ts + admin trigger)
- [x] Verify sitemap is accessible at /sitemap.xml

## Step 2: Blog with Long-Tail Keyword Articles
- [x] Build blog infrastructure: routing, layout, article data model
- [x] Article 1: "Can I Work Remotely in Spain as an American in 2026?"
- [x] Article 2: "Spain vs Portugal Digital Nomad Visa Comparison 2026"
- [x] Article 3: "How Much Money Do You Need to Move to Spain in 2026?"
- [x] Article 4: "Spain Digital Nomad Visa Beckham Law Tax Benefits Explained"
- [x] Article 5: "How to Get an NIE Number in Spain: Complete 2026 Guide"
- [x] Blog index page (/blog) with article listing
- [x] JSON-LD Article schema on each blog post
- [x] Update sitemap.xml with blog URLs
- [x] Update llms.txt with blog article summaries
- [x] Internal linking between blog posts and visa guide pages

## Step 3: Backlinks & Directory Submission Strategy
- [x] Research top expat directories and immigration forums for Spain
- [x] Create structured directory listing profiles (InterNations, Expatica, etc.) — see BACKLINK_STRATEGY.md
- [x] Build /about page with structured ProfessionalService schema for directory submissions
- [x] Add SameAs schema linking to directory profiles
- [x] Create BACKLINK_STRATEGY.md with actionable plan, copy-paste listing info, and tracking metrics

## Interactive Beckham Law Tax Calculator
- [x] Build calculator page at /tools/beckham-calculator
- [x] Income input with currency selector (EUR, USD, GBP, CAD, AUD)
- [x] Calculate standard IRPF progressive tax vs Beckham Law flat 24%
- [x] Show annual savings, 6-year total savings, effective tax rate comparison
- [x] Visual bar chart comparing the two tax regimes
- [x] Include social security note and disclaimer
- [x] JSON-LD WebApplication + FAQPage schema for the tool page
- [x] Add to sitemap, llms.txt, and navigation

## Downloadable PDF Document Checklists
- [x] Server-side PDF generation endpoint for each visa type (server/pdfChecklists.ts)
- [x] Digital Nomad Visa checklist PDF
- [x] Non-Lucrative Visa checklist PDF
- [x] Student Visa checklist PDF
- [x] Work Visa checklist PDF
- [x] EU Registration checklist PDF (N/A — EU citizens don't need a visa, only registration)
- [x] Download page at /tools/checklists with all visa types
- [x] Each PDF: branded header, checklist items with checkboxes, tags, tips, CTA footer
- [x] Add to sitemap, llms.txt, and navigation

## Pre-Purchase Chat Persistence (Privacy-Safe)
- [x] Add funnel_chat_messages table to schema (leadEmail, role, content, sessionId, timestamps)
- [x] Migrate database with new table
- [x] Update chat.send procedure to save each message exchange to DB
- [x] Load prior transcript as internal context for returning visitors (integrated into chat.send)
- [x] Update Laura's system prompt with privacy-safe returning visitor instructions (no private info revealed)
- [x] Update frontend AssessmentChat to pass email and sessionId for context lookup
- [x] Laura acknowledges return visits warmly without repeating private details
- [x] Prior messages NOT shown in UI — only Laura's internal context is enriched

## Admin Auto-Redirect After Login
- [x] Auto-redirect admin users to /admin after OAuth login instead of homepage

## Cost Transparency — No Surprises
- [x] Update Laura's system prompt to proactively mention additional costs (translations, apostilles, gov fees) during assessment
- [x] Add "What's Included / Not Included" section to pricing area on homepage
- [x] Add estimated costs next to Translation/Apostille tags in document checklists (Portal + Visa Guides)
- [x] Update checkout flow with cost disclaimer before payment button

## Post-Partner-Deck Cleanup
- [x] Remove NIE Number Application (€149) from About page services list
- [x] Remove fake aggregateRating schema (4.9 / 127 reviews) from About page structured data

## Company Entity Update — Bayshore Products S.L.
- [x] Update Privacy Policy "Data Controller" to Bayshore Products S.L. (C.I.F.: B70778360)
- [x] Update Home.tsx footer: "SpainPorFavor SL. CIF: B-XXXXXXXX" → "Bayshore Products S.L. C.I.F.: B70778360"
- [x] Update all page footers with correct company entity where appropriate

## Terms of Service Page
- [x] Create Terms of Service page component (TermsOfService.tsx)
- [x] Wire up route /terms in App.tsx
- [x] Update footer "Terms of Service" links to navigate to /terms (remove toast placeholder)

## GDPR Compliance Page
- [x] Create GDPRCompliance.tsx page component at /gdpr
- [x] Wire up route /gdpr in App.tsx
- [x] Update Home.tsx footer: replace GDPR Compliance toast placeholder with real link to /gdpr
- [x] Add /gdpr and /terms to sitemap.xml
- [x] Verify all 81 tests still pass

## Cookie Policy Page
- [x] Create CookiePolicy.tsx page component at /cookies
- [x] Wire up route /cookies in App.tsx
- [x] Update Home.tsx footer: replace Cookie Policy toast placeholder with real link to /cookies
- [x] Add /cookies to sitemap.xml
- [x] Verify all 81 tests still pass

## Open Graph Tags & Canonical URLs
- [x] Generate branded OG image (1200x630px) for social sharing
- [x] Create reusable SEOHead component with OG tags + canonical URL
- [x] Add OG tags to homepage (/)
- [x] Add OG tags to /free-assessment
- [x] Add OG tags to /about
- [x] Add OG tags to /guides hub and all 5 visa guide pages
- [x] Add OG tags to /blog hub and all blog posts
- [x] Add OG tags to /tools/beckham-calculator and /tools/checklists
- [x] Add OG tags to legal pages (/privacy, /terms, /gdpr, /cookies)
- [x] Add canonical tags to all pages
- [x] Add Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image)

## AI Chat Agent Fix
- [x] Fix Laura to only ask ONE question at a time (never bundle multiple questions in a single response)

## SPF Command Center (/management) — Internal Operations Dashboard

### Database Schema Extensions
- [x] Extend user role enum to 10 roles: super_admin, management, case_manager, tech_compliance, marketing, finance, gestor, translator, read_only_advisor, ai_system
- [x] Add objectives table (id, title, description, ownerId, status, priority, startDate, dueDate, metricName, targetValue, currentValue, notes)
- [x] Add management_tasks table (id, title, description, ownerId, createdBy, priority, status, dueAt, linkedObjectiveId, linkedCaseId, linkedVendorId, linkedMetric, sourceEventId, explanation, evidenceRequired, evidenceText, evidenceUrl, evidenceFileId, escalated, escalatedAt, completedAt, queue)
- [x] Add case_risks table (id, caseId, riskLevel, riskReason, ownerId, dueAt, source, createdAt, resolvedAt)
- [x] Add vendors table (id, type, name, email, phone, languagePairs, active, notes, userId)
- [x] Add vendor_assignments table (id, vendorId, caseId, taskId, assignmentType, status, assignedAt, dueAt, completedAt, blockerReason, qualityFlag)
- [x] Add event_log table (id, eventType, sourceSystem, sourceId, payload, createdAt, processedAt)
- [x] Add automation_audit_log table (id, eventLogId, actionType, ruleName, explanation, ownerAssigned, priorityAssigned, taskId, confidence, humanOverrideReason, createdAt)
- [x] Add integration_status table (id, integrationName, status, lastCheckedAt, notes, requiredForLaunch)
- [x] Run pnpm db:push to migrate

### Server-Side Procedures
- [x] Create managementProcedure middleware (requires management-level roles)
- [x] Create managementRouter with task CRUD procedures
- [x] Create objectives CRUD procedures
- [x] Create case-risk query/update procedures
- [x] Create vendor management procedures
- [x] Create vendor assignment procedures
- [x] Create event log query procedures
- [x] Create automation audit log query procedures
- [x] Create integration status CRUD procedures
- [x] Create executive dashboard aggregation procedure
- [x] Create "My Day" personalized task query procedure

### Frontend: Management Layout & Navigation
- [x] Create ManagementLayout component (sidebar with 9+ nav items)
- [x] Add /management routes to App.tsx (nested routing)
- [x] Role-based route protection (server + client)

### Frontend: 9 Screens
- [x] Screen 1: Executive Command Center (go/no-go readiness, red issues, revenue, priorities)
- [x] Screen 2: My Day (personalized priorities, overdue, blocked, newly assigned)
- [x] Screen 3: Team Task Board (Trello-style 8 columns, drag-and-drop)
- [x] Screen 4: Naomi Case Rescue Queue (paid cases without activity, missing docs, delays)
- [x] Screen 5: Paddy Security/Compliance/System Risk Queue
- [x] Screen 6: John Conditional Approval Required Queue
- [x] Screen 7: Vendor Work Queue (gestores + translators see only assigned work)
- [x] Screen 8: Integration Readiness / Launch Checklist
- [x] Screen 9: AI / Rules Audit Log

### Case-Risk Engine & Automation
- [x] Implement deterministic case-risk rules engine (Green/Amber/Red/Black)
- [x] Implement 18-stage case workflow (payment received → post-submission monitoring)
- [x] Implement delay triggers (16 trigger conditions from spec)
- [x] Implement owner assignment defaults (case flow → Naomi, security → Paddy, etc.)
- [x] Implement 24-hour escalation logic
- [x] Implement 10 required automation rules (Stripe event → task, checkout abandoned → task, etc.)
- [x] AI summary layer (optional: summarize red issues, draft priorities)

### Permissions & Security
- [x] Server-side role-based access control for all /management routes
- [x] Vendor isolation: gestores/translators see only assigned work
- [x] Sensitive field masking in AI summaries (passport, NIE, DOB, bank details, etc.)
- [x] All AI/rules actions logged in automation_audit_log

### Seed Data & Testing
- [x] Create seed script with demo data (4 team members, 1 gestor, 1 translator, sample cases/tasks/risks)
- [x] Write vitest tests for management procedures
- [x] Write vitest tests for case-risk engine rules
- [x] Verify all acceptance criteria (20 items from spec)

### Documentation
- [x] Create COMMAND_CENTER_README.md with setup, routes, roles, testing instructions

## Command Center Follow-ups
- [x] Promote owner user to super_admin role in database
- [x] Wire risk engine to heartbeat schedule (daily batch evaluation)
- [x] Add drag-and-drop to Team Task Board (@dnd-kit/core)

## Task Board Enhancements — Trello-style Detail View
- [x] Database: Add task_comments table (id, taskId, authorId, content, createdAt)
- [x] Database: Add task_attachments table (id, taskId, uploaderId, fileName, fileUrl, fileKey, mimeType, size, createdAt)
- [x] Database: Add label column to management_tasks (enum: red, yellow, green, blue, or null)
- [x] Server: Task detail query (get single task with comments + attachments)
- [x] Server: Comments CRUD (add, list, delete)
- [x] Server: File attachment upload + list
- [x] Server: Label update procedure
- [x] Frontend: TaskDetail modal/drawer (opens on card click)
- [x] Frontend: Comments section with add/display
- [x] Frontend: File attachments section with upload
- [x] Frontend: Colour label picker (red, yellow, green, blue)
- [x] Frontend: Show colour labels on board cards

## Task Detail Enhancements — Assignment & Due Date
- [x] Frontend: Task assignment dropdown in detail panel (select team member)
- [x] Frontend: Due date picker in detail panel (calendar widget)
- [x] Frontend: Show assigned user avatar/name in detail header
- [x] Frontend: Show due date with overdue highlighting in detail header

## Team Authentication — Email + Password with Invite Codes
- [x] DB: Add passwordHash column to users table
- [x] DB: Add invite_codes table (id, code, email, role, createdBy, usedBy, usedAt, expiresAt, status)
- [x] Server: Team login procedure (email + password → JWT session cookie)
- [x] Server: Register via invite code procedure (validate code, create user with role, hash password)
- [x] Server: Create invite procedure (admin generates invite link with role)
- [x] Server: List/revoke invites procedure
- [x] Frontend: /team-login page (email + password form)
- [x] Frontend: /join/:code page (registration form with pre-filled role)
- [x] Frontend: Team Management screen in /management (create invites, see team, manage roles)
- [x] Keep Manus OAuth as super_admin login path
- [x] Tests: Team auth procedures

## Multi-Role Support & Password Reset
- [x] DB: Add user_roles junction table (userId, role) for multiple roles per user
- [x] DB: Add password_reset_tokens table (id, userId, token, expiresAt, usedAt)
- [x] Server: Update role-checking middleware to check user_roles table (fallback to users.role for backwards compat)
- [x] Server: Multi-role invite creation (accept array of roles)
- [x] Server: Password reset request (generate token, send email via notification)
- [x] Server: Password reset verification + password update
- [x] Frontend: Multi-role selector in invite creation form
- [x] Frontend: Display multiple role badges on team members
- [x] Frontend: Forgot password page (/forgot-password)
- [x] Frontend: Reset password page (/reset-password/:token)
- [x] Patch ManagementLayout role check to use multi-role

## Multi-Role Invite Fix & Owner Role Reversion Fix
- [x] DB: Add `roles` JSON column to invite_codes table for storing multiple roles per invite
- [x] Server: Update register procedure to read roles JSON array and assign all roles on registration
- [x] Server: Update createInvite procedure to store full roles array in JSON column
- [x] Server: Update validateInvite to return roles array to frontend
- [x] DB: Update Paddy's invite (46dbfe957ac80efd0c197b9266a55c82) with roles: management, tech_compliance, admin
- [x] DB: Update Naomi's invite (58963e373f879cc4578d9b78cc4706a4) with roles: management, case_manager, translator, gestor, admin
- [x] Fix owner role reversion: upsertUser no longer overwrites super_admin to admin on OAuth re-login
- [x] Fix OAuth callback redirect: super_admin/admin/management → /management instead of /admin
- [x] Ensure owner (user ID 1) remains super_admin permanently in both users table and user_roles table
- [x] Fix /join/:code page: email field was passing empty string instead of invite's locked email to register mutation
- [x] Fix /join/:code page: show all roles (not just primary) when invite has multiple roles
- [x] Fix /join/:code page: parse Zod validation errors into human-readable messages instead of raw JSON

## Task Board UX Fixes
- [x] Sort tasks by priority within each column: red (high) at top, yellow (medium) in middle, green (low) at bottom
- [x] Fix "Move To" dropdown being truncated/cut off by container overflow

## Analytics Fix
- [x] Fix analytics not tracking: CSP was blocking manus-analytics.com — added to script-src and connect-src directives

## Code Audit Fixes (May 23 2026)

### Critical Bugs
- [x] Fix suggested questions in AssessmentChat (stale closure) — N/A, chips were already removed in refactor
- [x] Fix Stripe webhook: checkout.session.completed — already fixed (creates case, doc slots, queues welcome email)
- [x] Fix ApplicationSuccess page: now verifies Stripe session_id server-side before showing success
- [x] Fix SameSite=None cookie: now uses 'lax' when not secure, 'none' only when secure
- [x] Delete phantom server/index.ts stub entry point — removed

### High-Impact Issues
- [x] Add /free-assessment link to homepage — already exists in footer nav
- [x] Fix invokeLLM ignoring maxTokens param — now honors caller's maxTokens/max_tokens
- [x] Address exit-intent/email-capture false promises — copy updated to honest "eligibility summary" language
- [x] Verify Stripe API version "2026-04-22.dahlia" — confirmed valid (matches SDK v22.1.0 built-in version)
- [x] Add lead capture deduplication — now checks email+source before insert, updates if exists

### Smaller Bugs / Code Smells
- [x] Pin wouter version to match pnpm patch — pinned to exact 3.7.1
- [x] Fix inconsistent income figure in chat.test.ts — corrected to €2,849
- [x] Fix chat.test.ts mislabeled test — renamed to "handles empty messages array gracefully"
- [x] Fix getAdjustedTimeline referencing recommendation before declaration — moved after declaration
- [x] Fix h-13 Tailwind class — N/A, Tailwind v4 auto-generates all integer spacing (h-13 = 3.25rem)

## Command Center Bug Report (May 23, 2026)

### Critical
- [x] BUG-001: "New Task" button crashes page to white screen (fixed: SheetTitle always rendered)
- [x] BUG-002: Launch Checklist crashes on scroll (fixed: overflow-x-hidden on main content)
- [x] BUG-003: Automation rule paid_no_docs_72h fires without deduplication (previously fixed)

### High
- [x] BUG-004: Sidebar CSS breaks on scroll (fixed: overflow-x-hidden on main content area)
- [x] BUG-005: Task board filter bar (fixed: added priority/queue/assignee filter bar)
- [x] BUG-006: "Command Center" nav link (verified working correctly)
- [x] BUG-007: Launch Checklist status out of sync (fixed: removed duplicate entries, corrected statuses)
- [x] BUG-008: Vendor Queue shows 0 (fixed: added pending vendor tasks section showing 8 tasks)
- [x] BUG-009: "My Day" shows "All clear" (fixed: admin now sees unassigned critical/overdue tasks)

### Medium
- [x] BUG-010: Date format inconsistency (fixed: all dates now DD/MM/YYYY)
- [x] BUG-011: Readiness labels ambiguous (fixed: dynamic labels like "8 tasks overdue" / "No overdue tasks")
- [x] BUG-012: Command Center alert (verified correct: 1 red/black + 2 amber = 3 total unresolved)
- [x] BUG-013: Test data artifacts (previously fixed)
- [x] BUG-014: My Day empty for admin (fixed: same as BUG-009)
- [x] BUG-015: Audit Log pagination (fixed: added pagination with 25 items per page)
- [x] BUG-016: Blocked column truncation (working as designed: kanban scrolls horizontally)
- [x] BUG-017: Risk resolve doesn't update Command Center (fixed: invalidate executive.summary)

### Low
- [x] BUG-018: Case detail panel (deferred: feature gap, not a bug — no case detail panel exists yet)
- [x] BUG-019: Approvals page (verified working: shows 3 pending approvals)

## Daily Database Backups (Disaster Recovery)
- [x] Create databaseBackup.ts module with S3 export of all critical tables
- [x] Register backup scheduler in server startup (24h interval, 10min initial delay)
- [x] Add manual backup trigger endpoint (super_admin only via management.backup.trigger)
- [x] Rolling 7-day backup retention (overwrites same day-of-week key)
- [x] Add "Backup Status" card to Command Center showing last backup time and row counts

## Remove WhatsApp Integration
- [x] Remove WhatsApp API from Launch Checklist (integration_status table)
- [x] Remove WhatsApp opt-in checkbox from Free Assessment form
- [x] Remove WhatsApp logic from leads.capture mutation
- [x] Remove WhatsApp test reference from management.test.ts

## Phone Country Code Auto-Detection
- [x] Add IP geolocation to auto-detect visitor country and default phone country code dropdown

## Google Ads Conversion Tracking
- [x] Install gtag.js snippet (AW-18188838081) in client/index.html
- [x] Add googletagmanager.com, google-analytics.com, doubleclick.net to CSP policy
- [x] Fire conversion event on Free Assessment form submission
- [x] Fire conversion event on successful payment (ApplicationSuccess page)

## Team Resources Page (/management/resources)
- [x] DB: Create team_resources table (title, url, category, notes, has_bitwarden_creds, file_key, file_name, created_by, created_at)
- [x] Server: CRUD procedures for team resources (list, create, update, delete)
- [x] Server: File upload endpoint for document attachments (S3)
- [x] Frontend: Team Resources page with categories, quick links, document uploads, notes
- [x] Frontend: Pre-populate with existing tools (Stripe, Google Ads, Resend, Bitwarden, domain registrar)
- [x] Navigation: Add Resources entry to management sidebar
- [x] Access control: Management/admin roles only

## Task Board — Search & Archive Features
- [x] Add `archived` boolean column to managementTasks schema
- [x] Run pnpm db:push to migrate schema
- [x] Update tasks.list backend to exclude archived tasks by default (add `includeArchived` param)
- [x] Add tasks.archive mutation (sets archived = true)
- [x] Add tasks.unarchive mutation (sets archived = false)
- [x] Update getMyDay and riskEngine to exclude archived tasks
- [x] Add search input to TaskBoard UI (client-side filter by title/description)
- [x] Add Archive button to task cards / task detail panel
- [x] Add "Show Archived" toggle/tab to see archived tasks
- [x] Write vitest tests for archive functionality

## Leads Management Page
- [x] Add status, notes, linkedCaseId columns to leads schema
- [x] Run pnpm db:push to migrate schema
- [x] Create leads management backend procedures (list, getDetail, updateStatus, updateNotes, getChatTranscript, getStats)
- [x] Build Leads table page with search, filters (source, visa type, nationality, status), and summary stats bar
- [x] Build Lead detail side panel with profile, status dropdown, notes editor, chat transcript view, activity timeline
- [x] Add Leads entry to management sidebar navigation
- [x] Add /management/leads route to App.tsx
- [x] Write vitest tests for leads management procedures

## Email System — Gmail MCP via Laura
- [x] Create SPF/Prospects and SPF/Clients Gmail labels
- [x] Build server-side email service that sends via Gmail MCP (exec manus-mcp-cli)
- [x] Wire email sending into lead capture flow (welcome/follow-up emails)
- [x] Wire email sending into case creation flow (onboarding emails)
- [x] Add automatic labeling (prospect vs client) on send
- [x] Add re-labeling logic when prospect converts to client
- [x] Write vitest tests for email service
- [x] Fix Stripe checkout popup blocker — use window.location.href instead of window.open
- [x] Fix phone country code to use quiz nationality answer instead of unreliable geo-detection
- [x] Replace all hello@ and privacy@ email addresses with info@spainporfavor.com across the site

## Management Dashboard Cleanup — May 27
- [x] Remove all tasks from management_tasks table
- [x] Remove SendGrid from Launch Checklist integrations
- [x] Remove Meta/Pixel from Launch Checklist integrations
- [x] Remove all audit log entries
- [x] Auto-summarize chat history into lead Notes for prospects with chat transcripts

## Custom Order Form — May 28
- [x] Backend: Create PaymentIntent endpoint that accepts amount, billing details, and metadata
- [x] Backend: Webhook handler for payment_intent.succeeded to create case + send welcome email
- [x] Frontend: Custom order form page with Stripe Elements (card field inline)
- [x] Frontend: Two-column layout — order summary left, form right
- [x] Frontend: Pre-populate name, email, phone, nationality, visa type from quiz/chat data
- [x] Frontend: Billing address fields (country, address, city, zip)
- [x] Frontend: Trust signals (SSL badge, guarantee, approval rate, Stripe badge)
- [x] Frontend: Specific CTA button with price ("Pay €X — Start My Application")
- [x] Frontend: Success state after payment
- [x] Route integration: Replace Stripe Checkout redirect with new order form page

## Bug Report Fixes — May 28
- [x] HIGH #1: Fix super_admin locked out of adminProcedure and gestorProcedure
- [x] HIGH #2: Fix privilege escalation — restrict invite creation to admin/super_admin only
- [x] HIGH #3: Fix Stripe client crash on missing key — lazy init or guard
- [x] MED #4: Make Stripe webhook idempotent — dedupe by stripeSessionId before creating case
- [x] MED #5: Resolve dual role model — super_admin already in MANAGEMENT_ROLES, adminProcedure fixed
- [x] MED #6: Fix risk engine dedupe collision — dedupe by rule name, not just severity
- [x] MED #7: Fix risk engine document check — check all slots, not just one
- [x] MED #8: Fix checkout button hang on non-succeeded payment status
- [x] LOW #10: Add Zod validation on LLM document validation output
- [x] LOW #11: Fix login timing attack — dummy bcrypt on not-found path
- [x] LOW #12: Fix password reset — send directly to user, not via owner
- [x] LOW #13: Validate critical env vars at boot with clear errors
- [x] LOW #15: Add max bound on dependents in payment intent (max 10)

## Document Security Fixes — May 28
- [x] CRITICAL A: Fix IDOR on /manus-storage proxy — add ownership check for document paths
- [x] CRITICAL B: Implement storageDelete helper and wire into retention + GDPR erasure
- [x] HIGH C: Fix super_admin excluded from document access in protectedDocuments.ts
- [x] HIGH D: Use effective roles (user_roles table) in document access control
- [x] MEDIUM E: Fix claimCase — require email match to authenticated user
- [x] MEDIUM F: Fix crypto import in storage.ts
- [x] MEDIUM G: Increase key entropy from 8-hex to full UUID

## Stripe Test Mode — Runtime Key Fetching (May 28, Session 2)
- [x] Backend: Add getStripeConfig tRPC endpoint that returns correct publishable key based on STRIPE_TEST_MODE env var
- [x] Frontend: OrderForm fetches publishable key from server at runtime (not build-time VITE_ env)
- [x] Frontend: Show yellow TEST MODE banner when server reports test mode active
- [x] Ensure no rebuild needed to switch between test/live modes — just change env var in Settings → Secrets
- [x] Vitest: stripeTestMode.test.ts passes (3 tests)

## Gestor Outreach Handoff (May 28, Session 2)
- [x] Search BRAIN.md and todo.md for gestor contact lists
- [x] Locate all gestor research files in /home/ubuntu/ (6 files found)
- [x] Locate all backlink outreach files in /home/ubuntu/ (3 files found)
- [x] Create consolidated GESTOR-AND-OUTREACH-HANDOFF.md with full status of all contacts
- [x] Document: Wave 1 (5 contacted, no reply), Wave 2 (8 researched, not contacted), Milanuncios (2 warm), Registry pool (50 names)
- [x] Document: Backlink/directory targets (8 targets, emails drafted, not sent)
- [x] Deliver handoff doc to user for colleague

## BRAIN.md & Todo.md Updates (May 28, Session 2)
- [x] Update BRAIN.md header date to Session 2
- [x] Update launch blockers with current gestor outreach status
- [x] Update Stripe blocker to reflect test mode active (not "sandbox unclaimed")
- [x] Add Stripe test mode toggle to Resolved items
- [x] Add gestor outreach handoff to Resolved items
- [x] Update Technical Architecture payments row with runtime key fetching detail
- [x] Update Tools Inventory Stripe entry
- [x] Add Key Project Files section listing all operational research docs
- [x] Add 2 new Decision Log entries (runtime key fetching, gestor handoff)
- [x] Resolve "Stripe sandbox claimed" open question
- [x] Add "When will live Stripe keys be activated?" as new open question
- [x] Update todo.md with all session 2 work

## Still Pending (Carried Forward)
- [x] Drip email sequence (Day 1/3/7) for leads who don't purchase — server/leadDripEmails.ts, runs every 2h, dedupes via email_queue
- [x] "Convert to Case" one-click button in lead detail panel — creates case with slots, links lead, marks converted, re-labels Gmail
- [x] "Back to results" link on order form — chevron link above payment grid, links to /#results
- [x] Test full purchase flow end-to-end with 4242 card on spainporfavor.com — CONFIRMED WORKING (May 28)
- [x] Onboard first gestor partner (Naomi — handoff doc delivered) — MANUAL: requires human onboarding, doc already delivered

## Stripe Test Mode Fix — Server-Side Key Mismatch (May 28, Session 2)
- [x] Investigate server-side Stripe SDK initialization (which secret key is used)
- [x] Fix: When STRIPE_TEST_MODE=true, server must use test secret key (sk_test_...) — ALREADY CORRECTLY IMPLEMENTED in code
- [x] Root cause: Production has OLD build with hardcoded pk_live_ key. New code uses runtime getStripeConfig endpoint.
- [x] Solution: Publish latest code (checkpoint saved). No code changes needed — just deploy.
- [x] Verify test card 4242 works end-to-end on checkout AFTER publishing — CONFIRMED: €349 payment succeeded (pi_3Tc8cePQMNl2HgGI17dD4x7g), Case #30001 created

## Auto-Capitalization Across Entire Funnel (May 28, Session 2)
- [x] Add shared autoCapitalize() helper in client/src/lib/utils.ts
- [x] OrderForm.tsx: Full Name, Address, City fields
- [x] Home.tsx (Visa Pathway page): appName field in application form
- [x] FreeAssessment.tsx: name field
- [x] JoinTeam.tsx: name field
- [x] Do NOT apply to: email, postcode/ZIP, phone, country selector
- [x] Ensure submitted value is actually capitalized (not just CSS visual)
- [x] Auto-capitalize prefilled name from URL params on initial load

## Case Activation Page — Replace Post-Purchase Success Page (May 29)
- [x] Replace current ApplicationSuccess.tsx with 5-step Case Activation Page
- [x] Hero section: green check + "Payment confirmed — you're 2 steps into your Spain registration process"
- [x] Primary CTA: "Continue to Step 3: Upload Your First Document" → links to /portal
- [x] 5-step progress tracker (Steps 1-2 complete, Step 3 active, Steps 4-5 upcoming)
- [x] Case snapshot card (dynamic: service, applicant, status, case ID, masked email)
- [x] "After you upload your first document" section (5 bullets)
- [x] Starting document checklist section
- [x] Reassurance block (3 cards: Licensed Gestor, Document review, Secure handling)
- [x] Communication preferences checkbox (SMS/WhatsApp reminders) — persisted via consent system
- [x] Optional add-on module below fold (padrón, insurance, appointment, translations)
- [x] Secondary links: Book kickoff call, Resend portal link, Download receipt
- [x] Footer: support, privacy, terms
- [x] URL security: strip PII from URL using history.replaceState on load
- [x] Analytics tracking events (payment_success_page_viewed, case_activation_cta_clicked, etc.)
- [x] Responsive: horizontal stepper desktop, vertical stepper mobile
- [x] Accessibility: semantic headings, aria-current="step", keyboard nav, focus states
- [x] Loading/error states (loading, confirmed, not found, not confirmed)
- [x] Remove "Return to Homepage" as main CTA
- [x] No unsupported claims (no approval rates, no guaranteed submission)
- [x] Dual-mode session verification (cs_xxx Checkout Sessions + pi_xxx PaymentIntents)
- [x] OrderForm redirects to /application-success?session_id=pi_xxx after payment
- [x] New getCaseBySession endpoint for fetching case data by Stripe session/PI ID
- [x] Tests: 143 passing (new caseActivation.test.ts with 8 tests)

## Session 5: Route-Specific Case Activation Page Rebuild

- [x] Route-specific content config (DNV, EU Registration, Generic fallback)
- [x] Product-specific hero headline, subheadline, CTA, microcopy
- [x] Stronger 5-step progress tracker (horizontal desktop, vertical mobile)
- [x] Enhanced case snapshot card with route-specific fields
- [x] Route-specific starting checklist (DNV vs EU Registration)
- [x] Route-specific blocker/add-on cards
- [x] Route-specific "After upload" section
- [x] Reassurance block (updated copy per spec)
- [x] Sticky mobile CTA
- [x] Post-upload state (step 3 → complete, step 4 → current) — implemented in DocumentIntake success flow; activation page would need a separate refetch after upload
- [x] Upload modal or portal redirect (portal redirect implemented)
- [x] Analytics events (all spec events tracked)
- [x] URL cleanup (strip PII, use session_id only)
- [x] Reminder checkbox hidden if consent cannot be persisted (TODO flag in code)
- [x] Loading/error states per spec
- [x] No guaranteed-approval language
- [x] Case ID format route-specific (SPF-DNV-xxx, SPF-EU-xxx)

## Session 5b: Secure Document Intake Page (Step 3)

- [x] Backend: documents table in schema — reusing existing documentSlots + documentUploads tables
- [x] Backend: tRPC procedures — reusing existing portal.uploadDocument + portal.getMyCase
- [x] Frontend: DocumentIntake page at /documents/start
- [x] Route-aware hero (EU Registration / DNV / Generic)
- [x] Compact 5-step journey stepper with Step 3 current
- [x] Document type selector cards (route-specific options)
- [x] Camera capture module with permission handling
- [x] File upload fallback (JPG, PNG, PDF, max 20MB)
- [x] Document preview with quality checklist
- [x] EU ID front/back flow (two-sided capture)
- [x] Upload success state (Step 3 complete, step 4 current)
- [x] Full checklist reveal after first upload (route-specific)
- [x] Reassurance/security block
- [x] "Not ready to upload?" fallback section
- [x] Sticky mobile CTA
- [x] Analytics events (all spec events tracked or stubbed)
- [x] Connect success page CTA to this page
- [x] Loading/error states per spec
- [x] No PII in URLs
- [x] Responsive design (mobile camera-first, desktop centered)

## Bug Fix: Document Intake page shows error when case not linked to user

- [x] Fix: DocumentIntake page auto-claims case when user is logged in (claimCase mutation on mount), shows "Linking your case" state, and graceful fallback if claim fails
- [x] Fix: Page now works in product-only mode — shows full UI with product param even if case not yet linked, upload shows helpful message if case still pending

## Session 6: Secure Private Document Storage (AWS S3 eu-south-2)
- [x] Database: Create `secure_documents` table with full metadata (24 columns)
- [x] Database: Create `document_access_logs` table (8 columns)
- [x] Database: Create `document_events` table (7 columns)
- [x] Backend: AWS S3 client service with presigned upload URL generation (10min TTL) — server/secureDocumentStorage.ts
- [x] Backend: AWS S3 presigned download URL generation (5min TTL) for staff only
- [x] Backend: KMS encryption configuration (customer-managed key or AWS-managed AES256 fallback)
- [x] Backend: tRPC procedure `secureDocuments.initUpload` — verify case, create record, return presigned URL
- [x] Backend: tRPC procedure `secureDocuments.completeUpload` — verify object exists via HeadObject, mark uploaded
- [x] Backend: tRPC procedure `secureDocuments.staffGetDownloadUrl` — permission check, log access, return presigned URL
- [x] Backend: Document access logging on every staff view/download (document_access_logs table)
- [x] Frontend: DocumentIntake uses presigned upload flow with legacy base64 fallback
- [x] Environment variables: AWS_REGION, AWS_S3_DOCUMENT_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_KMS_KEY_ID (+ TTL vars)
- [x] Security: No public URLs, no PII in keys, no frontend AWS secrets, presigned URLs only
- [x] Retention: retention_until + deletion_status fields on secure_documents table
- [x] Manual AWS setup instructions for user (bucket, KMS, CORS, IAM, CloudTrail) — docs/AWS_DOCUMENT_STORAGE_SETUP.md

## Session 7: Portal Application Cockpit Redesign
- [x] Route-specific document requirements config (EU Registration vs DNV vs Generic) — portalCockpitConfig.ts
- [x] Fix route mismatch: EU Registration must NOT show DNV documents — DB slots fixed + config-driven grouping
- [x] Schema: Add privacy_acknowledged_at, privacy_notice_version, aiValidationEnabled to cases table
- [x] Backend: Privacy acknowledgement tRPC procedure (acknowledgePrivacy with consent records)
- [x] Page header: minimal (back link, route label, case ID)
- [x] Status banner: dynamic based on case status (onboarding/collecting/ready_for_gestor/with_gestor/submitted/approved/rejected)
- [x] Next-best-action card: dynamic priority based on upload/approval state
- [x] Progress summary: progress bar with uploaded/approved counts
- [x] Privacy acknowledgement: one-time gate per case, required checkbox + optional AI opt-in
- [x] Document checklist: grouped by route config (Identity/Employment/Living for DNV, Identity/Residence/Admin for EU)
- [x] Document cards: title, description, tags (apostille/translation/validity), status badge, upload/re-upload CTA
- [x] Upload modal: existing DocumentUploadModal with slot context
- [x] Ask Laura contextual: PortalChat widget present on page
- [x] Mobile: sticky bottom CTA for next upload
- [x] Analytics events: tracked via existing tracking system
- [x] Error states: auth fail, no case, loading states all handled
- [x] No fake AI/security/compliance claims
- [x] Desktop: centered max-w-4xl, status + next action at top

## Bug Fix: Post-payment redirect sends unauthenticated user to /documents/start
- [x] Fix: All CTAs on ApplicationSuccess.tsx now redirect to /portal instead of /documents/start
- [x] The /portal page handles auth properly (redirects to login if needed, then back to portal)
- [x] Case Activation page (/application-success) remains unauthenticated — uses session_id to verify payment

## Bug Fix: Post-payment CTA sends user to login wall (Session 8)
- [x] Update getLoginUrl() to accept a returnPath parameter (stores in localStorage)
- [x] Add consumeLoginReturnPath() helper to retrieve and clear stored path
- [x] Add LoginReturnRedirect component in App.tsx (redirects to stored path after login)
- [x] ApplicationSuccess CTAs now call goToPortal() which triggers login with returnPath=/portal
- [x] Portal.tsx "Sign In to Continue" button passes returnPath=/portal
- [x] Global auth redirect in main.tsx passes current path as returnPath
- [x] OAuth callback unchanged (returnPath handled entirely client-side via localStorage)

## Fix: Restore direct document upload after payment (no login required)
- [x] Create a public `checkout.uploadDocumentBySession` procedure that validates by session_id instead of auth
- [x] Create a public `checkout.getSlotsBySession` procedure that returns document slots by session_id
- [x] Update DocumentIntake.tsx to work without auth — use session_id from URL params to fetch case and upload
- [x] Revert ApplicationSuccess.tsx CTAs from goToDocuments(sessionId) to /documents/start?session_id=X
- [x] Skip auth gates on DocumentIntake when session_id is present (isPublicPath)
- [x] Add public-path error state for when session_id doesn't resolve to a case
- [x] Keep the Portal page (requires auth) as the long-term cockpit — but immediate post-payment flow must not require login
- [x] Fix session_id mismatch: getCaseBySession/getSlotsBySession/uploadDocumentBySession now fallback to Stripe API → email lookup when direct DB lookup fails
- [x] Add findCaseByEmail and updateCaseStripeSessionId helpers to portalDb.ts
- [x] Auto-update stripeSessionId in DB when fallback succeeds (so future lookups work directly)

## Portal Cockpit Redesign (from pasted prompt)
- [x] Apply the full Application Cockpit redesign from pasted_content_7.txt to Portal.tsx
- [x] Route-specific document checklists (EU Registration vs DNV vs Generic)
- [x] Privacy acknowledgement redesign (one-time, required + optional AI)
- [x] Next-best-action card (dynamic: rejected > missing > under review > all approved)
- [x] Progress summary (approved / under review / missing / needs action)
- [x] Document card design with tags, status badges, expand/collapse requirements
- [x] Upload modal per document type (existing DocumentUploadModal reused)
- [x] Mobile sticky CTA
- [x] Error states (no case, loading, privacy failure)
- [x] Status banner (dynamic: collecting, action required, under review, ready for gestor, completed)
- [x] Privacy bullets fixed (removed unverified claims about encryption, EU data centre, deletion)
- [x] Ask Laura contextual support (widget + help section)

## Bug Fix: Success CTAs on public session path navigate to /portal (requires auth)
- [x] On public session path (isPublicPath), success CTAs should NOT navigate to /portal
- [x] Primary CTA: "Upload Next Document" - resets to select_type (stays on same page with session_id)
- [x] Tertiary CTA: "Return to Case Overview" - links back to /application-success?session_id=X
- [x] Secondary CTA: "Upload Another Document" - already correct (resets flow state)

## Bug Fix: Post-upload continuity — user sees same page instead of progressing (Session 9)
- [x] After uploading a document, success screen shows REMAINING documents from live slot data
- [x] Replace static `config.checklistItems` with dynamic slot-derived checklist (live slots sorted by sortOrder)
- [x] Show which slots are uploaded (✓ green) vs required-missing (amber) vs optional-missing (gray)
- [x] Primary CTA: "Upload [Next Required Document Name]" — dynamically named from nextRequiredSlot.label
- [x] After ALL required docs uploaded, show completion state ("All documents uploaded — you're all set!")
- [x] Progress indicator: "X of Y documents uploaded" with progress bar
- [x] Refetch `sessionSlotData` after each upload (already wired in publicUploadMutation.onSuccess)
- [x] Status badges per slot: "Required" (amber), "Under review" (blue), "Approved" (green)
- [x] "I'll finish later" tertiary CTA (goes to /application-success?session_id=X)

## Architecture Note: Post-Payment Document Flow (Session 9)
The correct flow is:
1. User pays → lands on /application-success?session_id=X (no auth)
2. User clicks CTA → /documents/start?session_id=X (no auth)
3. DocumentIntake.tsx operates in PUBLIC SESSION MODE:
   - Fetches case via `checkout.getCaseBySession` (public procedure)
   - Fetches slots via `checkout.getSlotsBySession` (public procedure, returns slot list with hasUpload/latestUploadStatus)
   - Uploads via `checkout.uploadDocumentBySession` (public procedure)
   - After upload success: refetches slots, shows REMAINING checklist from live data
   - User progresses through each required document until all are uploaded
4. After all docs uploaded → prompt to create account (optional) for Portal access later
5. Portal (/portal) is the AUTHENTICATED cockpit — only accessible after login

Key files:
- `server/routers.ts` (checkout router): public procedures for session-based case/slot/upload
- `client/src/pages/DocumentIntake.tsx`: dual-mode (auth + public session)
- `client/src/pages/documentIntakeConfig.ts`: static config (DO NOT use for dynamic checklist)
- `client/src/pages/ApplicationSuccess.tsx`: entry point, passes session_id to /documents/start
- `server/portalDb.ts`: findCaseByStripeSessionId, findCaseByEmail, getSlotsByCaseId, getUploadsByCaseId

## Bug Fix: Next-document CTA loops back to passport page instead of showing relevant document type
- [x] After uploading passport, clicking "Upload Employment Certificate" shows the capture page configured for that document
- [x] Fix: CTA now auto-creates a DocumentTypeOption from slot metadata (label, description, requirementsText) and skips directly to capture
- [x] Each document type shows its own instructions (from slot.requirementsText) on the capture screen
- [x] Hero headline dynamically updates to "Upload your [Document Name]" with the document's description as subheadline
- [x] No mapping needed — slot metadata from the backend IS the document type config

## Current State Summary (End of Session 9, May 30 2026)

### Document Upload Flow — WORKING:
1. User pays → lands on `/application-success?session_id=X` (no auth, uses `checkout.verifySession`)
2. Clicks "Upload My Passport" → goes to `/documents/start?session_id=X` (no auth, uses `checkout.getCaseBySession`)
3. Selects document type → capture screen with camera/file upload
4. Uploads → success screen with LIVE progress checklist (from `checkout.getSlotsBySession`)
5. Clicks "Upload [Next Document]" → capture screen pre-configured for that document (skips type selection)
6. Repeats until all required docs uploaded → shows completion state
7. "I'll finish later" → returns to `/application-success?session_id=X`

### Key Architecture Decisions:
- Public session path uses `session_id` (Stripe payment intent/checkout session ID) as auth token
- If session_id doesn't match DB, Stripe API fallback finds case by customer email
- `DocumentIntake.tsx` is dual-mode: `isPublicPath` (session_id in URL) vs auth path (logged-in user)
- Success screen derives checklist from LIVE `sessionSlotData.slots` (not static config)
- Next-document CTA creates `DocumentTypeOption` from slot metadata and skips to capture

### Remaining Work (Prioritized):
- [ ] "Back to checklist" button on capture screen (let users choose which document to upload)
- [ ] Email magic link after upload (return later without bookmarking URL)
- [ ] "Create account" prompt on completion screen (for Portal access)
- [ ] Post-upload state on activation page (step 3 shows complete)
- [ ] Staff document review UI (admin page for gestores)
- [ ] Upload confirmation email to client

## Document-Specific Upload Page Redesign (from pasted_content_8.txt)
- [x] Create documentRequirementConfig.ts with per-document checklists, upload modes, route-specific copy
- [x] Dynamic hero: badge (route + required/optional), headline, subheadline based on productType + documentType
- [x] Requirement summary card: structured checklist (not paragraph) per document type
- [x] Adaptive upload method: camera-first for passport/ID, file-first for contracts/statements/certificates
- [x] Multi-file support for bank_statements, employment_contract, company_registration_certificate, etc.
- [x] EU ID front/back flow (separate sides, not random multiple files)
- [x] Preview/confirmation step before submit ("Review before uploading")
- [x] Success state: "Document uploaded — we'll review it next" + Back to checklist CTA
- [x] Error states: unsupported file, too large, upload failed, camera denied, network error
- [x] Contextual help: "Ask Laura about this document", "View example", "Download template" where available
- [x] Trust/privacy note near upload card (no fake claims)
- [x] Mobile sticky CTA (file-first for non-ID, scan for ID)
- [x] Dynamic stepper: step 3 label changes based on current document (not always "Upload passport or EU ID")
- [x] "← Back to document checklist" link in header
- [x] Desktop two-column layout: requirements/help left, upload card right
- [x] Analytics events stubbed (document_upload_page_viewed, file_selected, etc.)
- [x] Route-specific copy: EU Registration pages never show DNV copy, DNV pages never show EU copy
