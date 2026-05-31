# Compliance Rules

> SpainPorFavor is operated by **Bayshore Products S.L.**, a Spanish entity. The funnel makes statements about visa outcomes, document accuracy, professional services, and personal-data handling. These statements are subject to:
>
> - Spanish consumer protection law (LGDCU, Real Decreto Legislativo 1/2007)
> - The Spanish unfair competition act (LCD) — claims must be substantiable
> - GDPR (Regulation 2016/679) and the Spanish data protection act (LOPDGDD)
> - The regulated nature of immigration advice — only licensed Gestores Administrativos may act on behalf of the client in the Spanish administrative process
>
> This document is the playbook for what the funnel may and may not claim. When in doubt, **remove the claim**, do not soften it.

---

## 1. Forbidden Claims (must not appear anywhere in code, UI, copy, or chat output)

| Claim | Why forbidden | What to say instead |
|---|---|---|
| Any specific approval rate ("97%", "98.7%", "99%") | Unverifiable, no audited basis, regulator risk | "Documents are reviewed by specialists before submission." Nothing about outcome percentages. |
| "Guaranteed approval" / "Visa guaranteed" | Outcomes depend on Spanish authorities, never on us | "Free resubmission if your case is rejected for fixable document reasons." (Plus the qualifications in §3.) |
| "Certified by [agency]" unless we hold the certification | Misrepresentation | Cite only the actual licensure of the Gestor Administrativo handling the case. |
| "End-to-end encrypted" / "zero-knowledge" | Not what S3 SSE provides | "Documents encrypted at rest in a private storage bucket." |
| "Automatic OCR" / "AI extracts your data" | Current system uses an LLM with a validation prompt; it is not a structured OCR pipeline | "An automated check looks for blurry, incomplete, or incorrectly formatted documents before our team reviews them." |
| Specific years in business / "Founded in [year]" | Not documented; AI advisor system prompt explicitly forbids inventing this | "We've helped many people successfully move to Spain." |
| Comparisons to competitors by name | LCD risk | Speak only about our own service. |
| "Bank-grade security" / "Military-grade encryption" | Meaningless puffery; regulators dislike it | "Stored in a private bucket in the EU. Access logged." |
| "Your data never leaves the EU" | Only true if we say no to LLM vendor data routing — verify before claiming | If unsure, omit. |

---

## 2. Required Disclosures

| Disclosure | Where it must appear |
|---|---|
| The legal entity ("Bayshore Products S.L.") | Footer of every page or in `/about` and `/terms`, with registered address |
| Government filing fees, sworn translations, and apostille costs are NOT included in the price | Order page (already present), checkout button microcopy, FAQ |
| AI document validation is opt-in and uses a third-party LLM provider | Privacy bullets on `/portal`, consent text on first upload |
| The Gestor Administrativo is licensed in Spain | Anywhere "Gestor" appears as a benefit |
| Refund / cancellation policy | Terms of Service, order page (currently partial — "If we determine you're ineligible after document review, you receive a full refund.") |
| Data retention period | Privacy Policy and the privacy bullets on `/portal` |
| GDPR rights summary (access, rectification, erasure, portability, objection) | `/privacy` and `/gdpr` |

---

## 3. Conditional / Cautious Claims

These claims are permitted but require care:

| Claim | Condition |
|---|---|
| "Free resubmission guarantee" | Only when the rejection is for fixable document reasons, not for client misrepresentation. The Terms must spell out the carve-outs; the order page should not promise more than the Terms deliver. |
| "Documents reviewed within 48 hours" | Only if internal ops can actually meet 48h. If review SLA slips, the copy must be removed or updated. |
| "Industry approval rate" with asterisk citing third-party data | Only with a real, cited source and the asterisked footnote visible on the same page. Default position: don't use it. |
| "Licensed Gestor" | True. The service uses licensed Gestores Administrativos. Use this phrase rather than "Spanish immigration lawyer" (which would be a different profession). |

---

## 4. Data Handling Principles (mirror in `docs/document-storage-rules.md`)

1. **Document storage:** documents are written to a single private S3 bucket in `eu-south-2`. No fallback to alternative storage. No legacy Forge path for new uploads.
2. **Access:** presigned URLs only, short-lived (≤ 10 min upload, ≤ 5 min download). Every staff download logged with IP and user agent.
3. **AI validation:** opt-in via the privacy gate. The third-party LLM vendor must be named in the consent text.
4. **Retention:** the claim in `docs/AWS_DOCUMENT_STORAGE_SETUP.md` of "7-year default, GDPR deletion on request" is aspirational. Until S3 lifecycle policies and an automated erasure pipeline are implemented, the UI must not state a retention period. Either implement it or remove the claim.
5. **PII in logs:** never log file bytes, base64 payloads, EXIF data, OCR text, LLM responses, or the full content of `aiFeedback`. Log identifiers only.
6. **Right to erasure:** the `erasureRequests` table exists. The UI flow to file a request, the staff workflow to action it, and the storage-purge job all need to exist before we claim users can delete their data on demand.

---

## 5. Consent Capture

Consent records (`consentRecords` table) are written when the user acknowledges the privacy notice on `/portal`. Today the consent types are:

| Type | Required for | When recorded |
|---|---|---|
| `data_processing` | All cases | On privacy acknowledgement |
| `third_party_sharing` | All cases | On privacy acknowledgement (covers sharing with assigned Gestor) |
| `ai_validation` | Cases that opt into AI checks | On privacy acknowledgement if the AI checkbox is ticked |
| `marketing` | Future | Not yet collected |

Rules:

- Consent text shown to the user **must match** the text stored in `consentRecords.consentText`.
- The text version is identified by `privacyNoticeVersion` (currently `"2026-05-30-v1"`). Bump the version when you change the text; do not silently update users.
- If the user did not opt into AI validation, `validateDocumentAsync` must not run for their case. Today the legacy `portal.uploadDocument` path runs it unconditionally — that is a known bug.

---

## 6. WhatsApp / SMS Reminders

The current `/application-success` page renders a WhatsApp opt-in checkbox that writes nothing to the backend (`TODO`). Until the consent persistence is wired up:

- Do not send any WhatsApp or SMS message, even in testing.
- Hide the checkbox, OR keep it visible but disabled with a "coming soon" microcopy.
- When persistence ships, treat it as a new consent type (`whatsapp_reminders` or similar), with its own text, its own consent row, and its own withdrawal path.

---

## 7. Refund Promises

The order page says: "Your card is charged immediately. If we determine you're ineligible after document review, you receive a full refund."

This is a substantive promise. Today there is no documented internal process for issuing the refund. Before the Claude rebuild ships this copy unchanged:

- Confirm the refund process exists in operations.
- Confirm the Terms of Service mention it.
- Decide whether the refund clock starts at payment or at our ineligibility determination.

If any of the above is unresolved, the copy should be softened to remove the implied automatic refund.

---

## 8. Escalation

If you (Claude) encounter a copy change that would touch any of the items above, **do not ship the change without explicit human approval**, and note the rule it triggers in the PR description. The owner of this repo is the only person who can sign off on compliance copy.
