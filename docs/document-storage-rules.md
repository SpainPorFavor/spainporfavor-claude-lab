# Document Storage Rules

> Operational rules for how SpainPorFavor handles uploaded passports, criminal records, bank statements, employment letters, and similar regulated documents.
>
> Companion to `docs/AWS_DOCUMENT_STORAGE_SETUP.md` (which is the AWS provisioning runbook) and `docs/compliance-rules.md` (which is the consumer-facing compliance posture).

---

## 1. The One Storage Path

There is **one** document storage destination going forward: the private AWS S3 bucket `spainporfavor-documents-private` in `eu-south-2` (Spain). Configured via these env vars:

| Var | Purpose |
|---|---|
| `AWS_REGION` | Defaults to `eu-south-2` |
| `AWS_S3_DOCUMENT_BUCKET` | Bucket name |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM user with minimal S3 + KMS access |
| `AWS_KMS_KEY_ID` | Optional customer-managed KMS key; without it, falls back to AES-256 (SSE-S3) |

The legacy path through `server/storage.ts` (`storagePut` → Manus Forge) is being retired. **Do not write new code that uploads documents through it.** The existing references will be removed by the rebuild PRs.

The current code has a silent fallback (DocumentIntake.tsx tries S3, then falls back to the legacy path on any error). This is a known bug. The fallback must be removed: if S3 is unavailable, the upload fails loudly.

---

## 2. Bucket Configuration (must remain)

| Setting | Value |
|---|---|
| Public access | Blocked entirely |
| Versioning | Enabled |
| Encryption at rest | SSE-KMS with customer-managed key (or SSE-S3 AES-256 as fallback) |
| CORS | Restricted to production domains only |
| Lifecycle | (today) `STANDARD_IA` at day 90, abort incomplete multipart at day 1. (target) 7-year expiration rule to be added; do not claim 7-year retention in UI until it exists. |
| CloudTrail | Recommended; required before claiming "full audit trail" in copy. |

---

## 3. Upload Flow (canonical)

```
Client (browser) → POST /api/trpc/secureDocuments.initUpload
   │  caseId, documentType, documentSide, fileName, mimeType, fileSize, productType?
   │
   ▼ Server:
   │  - Verify case belongs to user (or, for the public path, verify the session_id resolves to a paid case)
   │  - Validate mime type (PDF, JPG, PNG, WEBP) and size (≤ 20 MB)
   │  - Generate non-guessable storage key: cases/{caseId}/documents/{documentType}/{uuid}.{ext}
   │  - INSERT secureDocuments row with uploadStatus = "upload_started"
   │  - INSERT documentEvents row "upload_initiated"
   │  - Generate presigned PUT URL (TTL ≤ 10 min, ContentType pinned, encryption headers pinned)
   │  - Return { documentId, uploadUrl, storageKey, expiresInSeconds }
   │
   ▼ Client:
   │  PUT bytes directly to S3 using the presigned URL
   │
   ▼ Client → POST /api/trpc/secureDocuments.completeUpload
   │  documentId
   │
   ▼ Server:
   │  - Verify ownership
   │  - HEAD the S3 object to confirm it exists
   │  - UPDATE secureDocuments uploadStatus = "uploaded", reviewStatus = "pending_manual_review"
   │  - INSERT documentEvents row "upload_completed"
   │  - If case.status === "onboarding", advance to "collecting_documents"
```

Storage keys are non-guessable (UUID in the path). The user-facing `originalFileName` is stored in the DB row, never in the S3 key.

---

## 4. Download Flow (staff only)

```
Staff client → POST /api/trpc/secureDocuments.staffGetDownloadUrl { documentId }
   │
   ▼ Server:
   │  - verifyStaffAccess (primary role OR user_roles row)
   │  - Resolve document, verify not deleted
   │  - INSERT documentAccessLogs row (action="download", ipAddress, userAgent)  ← must be non-null
   │  - Generate presigned GET (TTL ≤ 5 min, ResponseContentDisposition with original filename)
   │  - Return { downloadUrl, expiresInSeconds, ... }
```

Today the code logs `null` for `ipAddress` and `userAgent`. That is a known bug and must be fixed before we claim "all staff downloads are logged" in user-facing copy.

---

## 5. EXIF and Metadata

For image uploads (JPG, PNG, WEBP), the server strips EXIF metadata via `sharp` (`.withMetadata({ orientation: undefined })`) before persisting. Rules:

- The strip happens server-side, on the legacy base64 path. For the presigned S3 path, the bytes are uploaded directly by the browser, so the server cannot strip — **the S3 path needs a post-upload Lambda or background worker to re-process and replace the object**, OR the client must strip client-side before upload.
- Today there is no such worker. Image uploads via the secure path retain EXIF. This is a known gap. Until it is fixed, the privacy bullets must not claim "we strip metadata from your uploads".

---

## 6. AI Document Validation

The current `server/documentValidation.ts` sends the document (via a short-lived signed URL) to a multimodal LLM with a per-document-type prompt and asks for a structured JSON validation result.

Rules:

1. **Opt-in only.** `cases.aiValidationEnabled` must be `true` for that case. The legacy `portal.uploadDocument` path runs validation unconditionally today; this must change to gate on the flag.
2. **The third-party LLM vendor must be named** in the consent text. The current text ("AI pre-checks help catch simple upload issues faster") is too vague. Replace with the vendor name once known.
3. **The result is advisory.** `validationStatus = "pass"` is not a clearance to submit. The Gestor's manual review is the source of truth. Internal UI may show the AI status; the user-facing copy should always say "Under review by our team".
4. **Never call the LLM "OCR".** It is a multimodal language model performing a structured judgment task, not an optical character recognition pipeline.
5. **Never log the LLM response body or the document image bytes.** The structured result is stored in `documentUploads.aiFeedback`; do not also log it.

---

## 7. Public Upload Path (`uploadDocumentBySession`)

This endpoint is intentionally public — it lets a new buyer upload before completing OAuth. Hardening rules:

1. The session_id must resolve to a paid Stripe PaymentIntent or Checkout Session whose status is `succeeded` / `paid`.
2. The slot ID must belong to the case associated with that session. No cross-case writes.
3. Rate limit: pending — until added, this endpoint is a known DoS vector. The rebuild must add a rate limiter (per IP and per session_id).
4. File size ≤ 10 MB on this path today (lower than the secure path's 20 MB) — align both limits to 20 MB when this path is moved onto the presigned S3 flow.
5. The endpoint must not leak case data on slot-mismatch errors — return a generic 403, not "slot X belongs to case Y".

---

## 8. Audit Tables

| Table | Populated by | Purpose |
|---|---|---|
| `secureDocuments` | initUpload / completeUpload | Document record with full lifecycle status |
| `documentEvents` | initUpload, completeUpload, staff actions | Append-only event log per document |
| `documentAccessLogs` | staffGetDownloadUrl, staffUpdateReviewStatus | Per-access record with IP/UA |
| `caseStatusHistory` | status transitions | Case state machine log |
| `consentRecords` | privacy acknowledgement | User consent grants |

The legacy `documentUploads` table does NOT have an equivalent `documentEvents` table — another reason to retire it.

---

## 9. Retention

| Class | Retention |
|---|---|
| Document object (S3) | Target 7 years. **Not implemented today**; do not claim in UI. |
| `secureDocuments` row | Indefinite until erasure request resolved |
| `documentAccessLogs` | Indefinite until erasure or operational purge |
| Consent records | Indefinite — legally required for proof of consent |

When the erasure pipeline ships:

1. The `erasureRequests` row is created via a user-initiated action.
2. The staff confirms or rejects.
3. On confirmation, a worker:
   - Deletes the S3 objects (including all versions, since the bucket is versioned).
   - Soft-deletes the DB rows (`uploadStatus = "deleted"`, redact PII fields).
   - Preserves consent records and audit logs (legal basis: contractual / legal obligation).

Until that pipeline exists, the funnel must not promise on-demand deletion.

---

## 10. Boot-Time Checks

In production (`NODE_ENV === "production"`), the server must verify at startup:

- `AWS_S3_DOCUMENT_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` are all set.
- A `HeadBucket` call to the configured bucket succeeds.

If either check fails, the server logs an error and either refuses to start (preferred) or surfaces a degraded-state indicator that the storage-dependent endpoints check before accepting traffic.

Today neither check exists. Add when retiring the silent fallback.

---

## 11. What This Document Is Not

This document is operational rules for code that handles documents. It is not:

- A consumer-facing privacy policy. That lives at `/privacy`.
- A legal contract. That lives at `/terms`.
- An AWS runbook. That lives at `docs/AWS_DOCUMENT_STORAGE_SETUP.md`.
- A GDPR DPIA. That is a separate exercise.
