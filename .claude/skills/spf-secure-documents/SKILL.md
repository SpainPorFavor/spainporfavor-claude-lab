---
name: spf-secure-documents
description: Use for any change to document upload, storage, presigned URLs, encryption, retention, audit logging, or AI document validation. Enforces the rule that sensitive documents only land in the private S3 bucket and that compliance claims match implementation.
---

# spf-secure-documents

You are the secure-document specialist. Your job is to ensure that passports, criminal records, bank statements, and other regulated documents are handled exactly the way `docs/document-storage-rules.md` says they are.

## When this skill applies

- Editing `server/secureDocumentStorage.ts` (S3 client, presigned URLs, key generation).
- Editing `server/secureDocumentRouter.ts` (`initUpload`, `completeUpload`, `staffGetDownloadUrl`, etc.).
- Editing `server/storage.ts` or the legacy `portal.uploadDocument` path.
- Editing `server/documentValidation.ts` (LLM-based document checks).
- Editing `client/src/pages/DocumentIntake.tsx` upload logic or `client/src/components/DocumentUploadModal.tsx`.
- Editing privacy bullets, consent text, or any UI copy that describes how documents are handled.
- Editing `docs/document-storage-rules.md`, `docs/compliance-rules.md`, or `docs/AWS_DOCUMENT_STORAGE_SETUP.md`.

## Hard rules

1. **One storage path: private S3 (`eu-south-2`).** The legacy Manus Forge path (`server/storage.ts` `storagePut`) is being retired. Do not write new code that uploads documents through it. Do not add a "fallback" from S3 to Forge — fail loud instead.
2. **Presigned URLs are short-lived.** Upload TTL ≤ 10 minutes, download TTL ≤ 5 minutes. Do not extend these without a documented reason in `docs/document-storage-rules.md`.
3. **Every staff download is logged.** `documentAccessLogs` must receive an inserted row with non-null `ipAddress` and `userAgent` before the presigned download URL is generated. The previous practice of logging `null` for both is a known bug and must not return.
4. **Never log document contents.** Filenames are fine. EXIF data, file bytes, base64 payloads, OCR text, and LLM responses must not appear in any log line, console output, or error message.
5. **AI validation is opt-in.** `cases.aiValidationEnabled` gates whether the multimodal LLM is invoked. If `false`, do not call `validateDocument` for that case — store status `pending` and leave it to manual review.
6. **The AI vendor must be disclosed** in privacy bullets and consent text whenever AI document validation is enabled. The user has the right to know which third party sees their passport.
7. **No claim of OCR.** The current `documentValidation.ts` uses a multimodal LLM to compare the document against a prompt — it is NOT optical character recognition with a structured extraction pipeline. Do not label this feature "OCR" in code, UI, or docs.
8. **No claim of encryption stronger than what S3 actually provides.** Default is SSE-S3 (AES-256). With `AWS_KMS_KEY_ID` set, it is SSE-KMS with the named customer-managed key. Do not write "end-to-end encrypted" or "zero-knowledge" copy.
9. **EXIF stripping is best-effort but not load-bearing.** It must run for image uploads, but a failure must be visible (warn + flag in the row), not swallowed.
10. **The public upload path (`uploadDocumentBySession`) must accept the session_id as a proof of payment AND verify the case → slot mapping**, not just trust the slot ID. This is already partially enforced; keep it that way.

## Process

When asked to make a storage or upload change:

1. Read the full path: client upload code → tRPC procedure → storage call → DB write → audit log → downstream validation.
2. Confirm the change keeps everything in the private S3 path. If a legacy path is touched, the goal must be removal, not extension.
3. Add a server test that proves the new behavior. Storage code without a test is not allowed to merge.
4. If you change the privacy posture (what's stored, who can see it, how long it's kept), update `docs/document-storage-rules.md` AND `docs/compliance-rules.md` AND the UI privacy bullets in the same PR.
5. Verify with `pnpm check` and `pnpm test`.

## When in doubt

If you cannot determine whether a change is safe (e.g., does this leak the storage key to a public endpoint?), stop and ask. A document storage regression is unrecoverable: once a passport image is in the wrong bucket or in a log file, it's there.
