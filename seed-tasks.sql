-- SPF Go-Live Audit Tasks — Seeded from the Go-Live Audit & Action Plan (21 May 2026)
-- Owner IDs: 1 = John (super_admin)
-- Note: Naomi, Paddy, Caleb don't have accounts yet, so their tasks are unassigned (ownerId NULL)
-- but have explanation fields noting who should own them once invited.

-- ============================================
-- SECTION 5: Critical Remaining Tasks (72h)
-- ============================================

INSERT INTO management_tasks (title, description, priority, status, queue, dueAt, createdBy, explanation, evidenceRequired, label) VALUES
('Claim Stripe test sandbox', 'Visit the Stripe claim URL (https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVFNFS2lQUU1ObDJIZ0dJLDE3Nzg1MTUzMzgv100SCmVTma7) and complete verification. This is a 2-minute action that unblocks the entire payment pipeline.', 'critical', 'new', 'general', '2026-05-22 09:00:00', 'system', 'Payment is gate #1 — nothing works without revenue collection. Escalate if unresolved 24h after due.', 1, 'red'),

('Set up SendGrid account and verify spainporfavor.com domain', 'Create SendGrid account, add SPF/DKIM/DMARC DNS records for spainporfavor.com, and obtain API key. DNS propagation takes hours so starting today is critical.', 'critical', 'new', 'general', '2026-05-22 09:00:00', 'system', 'Emails will never reach clients without this. 1 email already queued and unsent. Assign to: Paddy (tech_compliance). Escalate if unresolved 24h after due.', 1, 'red'),

('Wire SendGrid API to email queue processor', 'Connect the SendGrid API key to the app and implement the email queue processor so queued emails are actually delivered. Test by sending a welcome email to a real inbox.', 'critical', 'new', 'general', '2026-05-23 09:00:00', 'system', 'Email queue has 1+ unsent emails already — queue grows with each payment. Depends on SendGrid account being active. Assign to: Paddy (tech_compliance). Escalate if unresolved 24h after due.', 1, 'red'),

('Identify and contact first gestor (licensed Gestor Administrativo)', 'Find a licensed Gestor Administrativo with immigration experience and Mercurio digital certificate. Questions: Colegio registration? First-review turnaround? Max weekly cases? Rush availability?', 'critical', 'new', 'vendor_gestor', '2026-05-23 09:00:00', 'system', 'Cannot fulfil what is sold — this is the longest lead-time item. Assign to: Naomi (management/case_manager). Escalate to John if unresolved 24h after due.', 1, 'red'),

('Invite Naomi to Command Center', 'Create invite link with roles: management + case_manager. Send to Naomi. Verify she can log in and see the Case Rescue queue.', 'high', 'new', 'general', '2026-05-22 12:00:00', 'system', 'Single point of failure if only John has access. Naomi needs to see and act on her queue. Escalate if unresolved 24h after due.', 1, 'yellow'),

('Invite Paddy to Command Center', 'Create invite link with role: tech_compliance. Send to Paddy. Verify he can log in and see the Security & Compliance queue.', 'high', 'new', 'general', '2026-05-22 12:00:00', 'system', 'Tech issues invisible without Paddy''s access. Escalate if unresolved 24h after due.', 1, 'yellow'),

('Invite Caleb to Command Center', 'Create invite link with role: marketing. Send to Caleb. Verify he can log in and see the dashboard.', 'high', 'new', 'general', '2026-05-22 12:00:00', 'system', 'Marketing decisions need data visibility. Escalate if unresolved 24h after due.', 1, 'yellow'),

('Create GTM container and install snippet', 'Create a Google Tag Manager container for spainporfavor.com. Install the GTM snippet in client/index.html. Verify preview mode shows container active.', 'high', 'new', 'general', '2026-05-23 09:00:00', 'system', 'All tracking (GA4, Meta, Google Ads) depends on GTM being installed first. Assign to: Paddy. Escalate if unresolved 24h after due.', 1, 'yellow'),

('Configure GA4 property via GTM', 'Create GA4 property, add measurement ID to GTM, configure page_view and purchase events. Verify events visible in GA4 real-time.', 'high', 'new', 'general', '2026-05-24 09:00:00', 'system', 'Cannot measure traffic or conversions without GA4. Depends on GTM container being live. Assign to: Paddy. Escalate if unresolved 24h after due.', 1, 'yellow'),

('Add Meta Pixel via GTM', 'Add Meta Pixel to GTM container. Configure PageView and Purchase events. Verify events visible in Meta Events Manager.', 'high', 'new', 'general', '2026-05-24 09:00:00', 'system', 'Cannot run Meta ads without pixel data. Depends on GTM container being live. Assign to: Paddy. Escalate if unresolved 24h after due.', 1, 'yellow'),

('Identify and contact first sworn translator', 'Find a sworn translator (traductor jurado) certified by MAEC for English-to-Spanish. Confirm language pairs, per-page pricing, turnaround, and capacity.', 'high', 'new', 'vendor_translator', '2026-05-24 09:00:00', 'system', 'Most visa documents require sworn translation. Assign to: Naomi. Escalate to John if unresolved 24h after due.', 1, 'yellow'),

('Verify Calendly booking link works', 'Confirm the Calendly link in the AI chat actually works. Test a booking. Ensure notifications arrive. If broken, update the link or set up a new account.', 'high', 'new', 'general', '2026-05-23 09:00:00', 'system', 'AI chat sends this link to leads — broken link = lost lead. Assign to: Caleb. Escalate if unresolved 24h after due.', 1, 'yellow'),

('Run full DNV test case end-to-end', 'Simulate complete Digital Nomad Visa workflow: payment → case creation → document upload → AI validation → gestor review → submission-ready. Document every step.', 'high', 'blocked', 'case_rescue', '2026-05-26 09:00:00', 'system', 'First real client follows this exact path. Blocked by: gestor onboarded + email working. Assign to: Naomi. Escalate to John if unresolved 24h after due.', 1, 'yellow'),

('Create Google Ads conversion action (Purchase)', 'Link GA4 to Google Ads. Create Purchase conversion action. Verify test conversion visible in Google Ads.', 'high', 'new', 'general', '2026-05-25 09:00:00', 'system', 'Ads cannot optimise for revenue without conversion data. Depends on GA4 property being active. Assign to: Paddy. Escalate if unresolved 24h after due.', 1, 'yellow'),

('Review landing page claims for legal defensibility', 'Audit all claims on the landing page: 98.7% approval rate, processing timelines, "Licensed Gestores" badge. Substantiate each or amend. Document decision.', 'high', 'new', 'approval_required', '2026-05-25 09:00:00', 'system', '98.7% approval rate claim must be substantiated or removed. Regulatory complaint risk (ASA/consumer protection). Assign to: John. Escalate if unresolved 24h after due.', 1, 'yellow');

-- ============================================
-- SECTION 9: Vendor Outreach Tasks
-- ============================================

INSERT INTO management_tasks (title, description, priority, status, queue, dueAt, createdBy, explanation, evidenceRequired, label) VALUES
('Research gestor candidates — shortlist 2-3 with immigration experience', 'Identify 2-3 licensed Gestores Administrativos with immigration experience. Check Colegio Oficial registration. Confirm Mercurio digital certificate access.', 'high', 'new', 'vendor_gestor', '2026-05-23 09:00:00', 'system', 'Gestor onboarding is the longest lead-time item and blocks the end-to-end test. Assign to: Naomi.', 1, NULL),

('First contact with gestor — confirm availability and terms', 'Contact shortlisted gestores. Ask: first-review turnaround? Correction turnaround? Maximum weekly cases? Rush availability? Per-case fee? Dependent surcharge?', 'high', 'new', 'vendor_gestor', '2026-05-24 09:00:00', 'system', 'Need written response with numbers before proceeding. Assign to: Naomi.', 1, NULL),

('Agree gestor commercial terms and create account', 'Finalise per-case fee, payment terms, and exclusivity with chosen gestor. Create gestor account via invite link. Assign test case.', 'high', 'blocked', 'vendor_gestor', '2026-05-25 09:00:00', 'system', 'Blocked by: first contact completed. Assign to: Naomi + John (approval). Evidence: gestor logged in and sees dashboard.', 1, NULL),

('Research translator candidates — shortlist 2-3 sworn translators', 'Identify 2-3 sworn translators (traductor jurado) certified by MAEC for English-to-Spanish. Check certification evidence.', 'high', 'new', 'vendor_translator', '2026-05-24 09:00:00', 'system', 'Translation required for most visa types. Assign to: Naomi.', 1, NULL),

('First contact with translator — confirm pricing and turnaround', 'Contact shortlisted translators. Ask: per-page or per-document pricing? Turnaround per document type? Rush turnaround? Certification stamp included?', 'high', 'new', 'vendor_translator', '2026-05-25 09:00:00', 'system', 'Need written pricing schedule before proceeding. Assign to: Naomi.', 1, NULL),

('Create translator account and assign test document', 'Finalise terms with chosen translator. Create translator account via invite link. Assign test document for translation.', 'high', 'blocked', 'vendor_translator', '2026-05-26 09:00:00', 'system', 'Blocked by: first contact completed. Assign to: Naomi. Evidence: translated document returned within stated turnaround.', 1, NULL);

-- ============================================
-- SECTION 10: Traffic Launch Tasks
-- ============================================

INSERT INTO management_tasks (title, description, priority, status, queue, dueAt, createdBy, explanation, evidenceRequired, label) VALUES
('Install GTM container snippet in client/index.html', 'Add the GTM container code snippet to client/index.html. Verify GTM preview mode shows container active on all pages.', 'high', 'new', 'general', '2026-05-23 09:00:00', 'system', 'All tracking depends on GTM being installed first. Assign to: Paddy.', 1, NULL),

('Create purchase conversion event in GTM', 'Configure a conversion event in GTM that fires on /application-success page. Ensure it sends to both GA4 and Meta Pixel.', 'high', 'new', 'general', '2026-05-25 09:00:00', 'system', 'Test purchase must trigger conversion in both platforms. Depends on GA4 + Meta configured. Assign to: Paddy.', 1, NULL),

('Set daily ad budget cap (50 EUR/day recommended)', 'Configure daily budget in Google Ads and Meta Ads Manager. Recommend starting at 50 EUR/day across both platforms.', 'normal', 'new', 'approval_required', '2026-05-26 09:00:00', 'system', 'Budget must be approved by John before traffic launches. Assign to: John.', 1, NULL),

('Draft first Google Search ad (DNV keyword)', 'Create Google Search ad targeting "digital nomad visa spain" and related keywords. Include headline, description, and landing page URL.', 'normal', 'new', 'general', '2026-05-25 09:00:00', 'system', 'Ads cannot launch without creative. Assign to: Caleb. Needs John approval.', 1, NULL),

('Draft first Meta ad (DNV audience)', 'Create Meta ad targeting remote workers interested in Spain relocation. Include image/video creative and copy.', 'normal', 'new', 'general', '2026-05-25 09:00:00', 'system', 'Ads cannot launch without creative. Assign to: Caleb. Needs John approval.', 1, NULL),

('Test full conversion flow with tracking active', 'Complete a test checkout with GTM active. Verify purchase event visible in GA4 real-time, Meta Events Manager, and Google Ads conversions.', 'high', 'new', 'general', '2026-05-26 09:00:00', 'system', 'Final verification before traffic goes live. Depends on all tracking configured. Assign to: Paddy + Caleb.', 1, 'green'),

('Go/no-go decision for traffic launch', 'Review all gate evidence. Verify: payment works, email works, tracking fires, gestor onboarded, full case tested. Write approval or block decision with reasoning.', 'critical', 'new', 'approval_required', '2026-05-27 09:00:00', 'system', 'Traffic must NOT launch until all gates pass. Assign to: John.', 1, 'red');

-- ============================================
-- SECTION 11: Case Workflow Test Tasks
-- ============================================

INSERT INTO management_tasks (title, description, priority, status, queue, dueAt, createdBy, explanation, evidenceRequired, label) VALUES
('DNV Test: Verify payment creates case with correct document slots', 'Complete a test payment for DNV. Verify case is created with all required slots: passport, remote work contract, income proof, health insurance, criminal record certificate, university degree.', 'high', 'new', 'case_rescue', '2026-05-24 09:00:00', 'system', 'First step in end-to-end workflow validation. Assign to: Naomi.', 1, NULL),

('DNV Test: Upload all required documents and verify AI validation', 'Upload test documents to all DNV slots. Verify each gets AI validation feedback (pass/needs_revision/unclear). Check feedback quality.', 'high', 'blocked', 'case_rescue', '2026-05-25 09:00:00', 'system', 'Blocked by: case created with correct slots. Assign to: Naomi.', 1, NULL),

('DNV Test: Verify failed validation triggers client notification', 'Upload an intentionally bad document. Verify client receives portal message explaining what to fix. Check notification content.', 'high', 'blocked', 'case_rescue', '2026-05-25 09:00:00', 'system', 'Blocked by: email delivery working. Assign to: Naomi.', 1, NULL),

('DNV Test: Verify gestor receives case and can review documents', 'After all docs validated, verify gestor sees case in their dashboard. Confirm document bundle is downloadable and complete.', 'high', 'blocked', 'case_rescue', '2026-05-26 09:00:00', 'system', 'Blocked by: gestor onboarded + all docs validated. Assign to: Naomi.', 1, NULL),

('DNV Test: Verify gestor can request correction (requerimiento)', 'Have gestor create a requerimiento. Verify client is notified, slot is re-opened for re-upload. Test the correction loop.', 'high', 'blocked', 'case_rescue', '2026-05-26 09:00:00', 'system', 'Blocked by: gestor has access to case. Assign to: Naomi.', 1, NULL),

('DNV Test: Verify gestor can mark case submission-ready', 'Have gestor mark case as ready for submission. Verify case status changes. Verify submission is logged.', 'high', 'blocked', 'case_rescue', '2026-05-27 09:00:00', 'system', 'Blocked by: correction loop tested. Final step in end-to-end validation. Assign to: Naomi.', 1, NULL);

-- ============================================
-- SECTION 12: Red-Issue Simulation Tasks
-- ============================================

INSERT INTO management_tasks (title, description, priority, status, queue, dueAt, createdBy, explanation, evidenceRequired, label) VALUES
('Simulation: Verify abandoned checkout creates follow-up task', 'Create a checkout session but do not complete it. Wait 24h. Verify the system creates a follow-up task for Caleb.', 'normal', 'new', 'general', '2026-05-26 09:00:00', 'system', 'Validates abandoned checkout automation. Assign to: Paddy.', 1, NULL),

('Simulation: Verify translation overdue creates escalation', 'Create a vendor assignment with a past due date. Run risk engine. Verify escalation task is created in Vendor Work Queue.', 'normal', 'new', 'general', '2026-05-26 09:00:00', 'system', 'Validates vendor SLA enforcement. Assign to: Paddy.', 1, NULL),

('Simulation: Verify welcome email arrives after payment', 'Complete a test payment. Verify welcome email arrives in real inbox within 5 minutes. Check it does not land in spam.', 'high', 'blocked', 'general', '2026-05-24 09:00:00', 'system', 'Blocked by: SendGrid connected and working. Critical trust signal for paying clients. Assign to: Paddy.', 1, 'yellow');

-- ============================================
-- LAUNCH CHECKLIST (integration_status table)
-- ============================================

INSERT INTO integration_status (integrationName, status, requiredForLaunch, notes, lastCheckedAt) VALUES
('Stripe Payment Processing', 'not_configured', 1, 'Test mode works. Sandbox needs to be claimed at provided URL. KYC required for live mode.', NOW()),
('SendGrid Email Delivery', 'not_configured', 1, 'No account created. Domain verification required. SPF/DKIM/DMARC DNS records needed.', NOW()),
('Google Tag Manager', 'not_configured', 1, 'No container created. Required before GA4 and Meta Pixel can be configured.', NOW()),
('Google Analytics 4', 'not_configured', 1, 'No property created. Depends on GTM container being installed.', NOW()),
('Meta Pixel / CAPI', 'not_configured', 1, 'No pixel ID configured. Depends on GTM container being installed.', NOW()),
('Google Ads Conversion', 'not_configured', 1, 'No conversion action defined. Depends on GA4 property being linked.', NOW()),
('Gestor Onboarded', 'not_configured', 1, 'Zero gestores in system. Longest lead-time item.', NOW()),
('Translator Onboarded', 'not_configured', 0, 'Zero translators in system. Required for most visa types but not day-1 blocker.', NOW()),
('Calendly Booking', 'warning', 0, 'Hardcoded link exists in AI chat. Unverified if account is active and bookings work.', NOW()),
('DNV End-to-End Test', 'not_configured', 1, 'No case has ever completed full workflow. Critical validation before traffic.', NOW()),
('Manus OAuth (Owner Login)', 'ready', 0, 'Working. John can log in via Manus OAuth.', NOW()),
('Team Auth (Invite Codes)', 'ready', 0, 'Working. Email + password with invite codes and multi-role support.', NOW()),
('AI Document Validation', 'ready', 0, 'Working. Multimodal LLM validates uploaded documents with type-specific prompts.', NOW()),
('Case Risk Engine', 'ready', 0, 'Working. 4 rules running on 24h schedule. Already created 1 automated task.', NOW()),
('GDPR Consent Gate', 'ready', 0, 'Working. Consent collected before data processing. Erasure requests supported.', NOW()),
('Security Headers & EXIF Strip', 'ready', 0, 'Working. CSP, HSTS, X-Frame-Options, EXIF stripping all active.', NOW());
