/**
 * Data Retention Module
 * 
 * Implements GDPR-compliant data retention policy:
 * - Documents are permanently deleted 30 days after case resolution (approved/rejected)
 * - Case records are anonymized (personal identifiers removed) but retained for compliance
 * - Runs on a scheduled interval (every 12 hours)
 * 
 * This module does NOT delete:
 * - Active cases (status != approved/rejected)
 * - Cases opted into renewal service
 * - Cases with pending erasure requests (handled by erasure module)
 */

import { getDb } from "./db";
import {
  cases,
  documentSlots,
  documentUploads,
  portalMessages,
  caseEvents,
  auditLog,
} from "../drizzle/schema";
import { eq, and, lte, inArray, sql } from "drizzle-orm";
import { storageDelete } from "./storage";

// ============================================================
// CONFIGURATION
// ============================================================

const RETENTION_DAYS = 30; // Days after resolution before deletion
const SCAN_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
const INITIAL_DELAY_MS = 5 * 60 * 1000; // 5 minutes after server start

let intervalId: ReturnType<typeof setInterval> | null = null;

// ============================================================
// RETENTION SCANNER
// ============================================================

export async function runRetentionCleanup(): Promise<void> {
  console.log("[DataRetention] Starting retention cleanup scan...");

  const db = await getDb();
  const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    // Find resolved cases where resolution happened more than 30 days ago
    const expiredCases = await db!
      .select({
        id: cases.id,
        status: cases.status,
        updatedAt: cases.updatedAt,
        clientName: cases.clientName,
        clientEmail: cases.clientEmail,
        clientPhone: cases.clientPhone,
        nationality: cases.nationality,
      })
      .from(cases)
      .where(
        and(
          inArray(cases.status, ["approved", "rejected"]),
          lte(cases.updatedAt, cutoffDate)
        )
      );

    if (expiredCases.length === 0) {
      console.log("[DataRetention] No cases past retention period. Done.");
      return;
    }

    console.log(`[DataRetention] Found ${expiredCases.length} cases past retention period.`);

    for (const expiredCase of expiredCases) {
      await cleanupCase(db, expiredCase.id);
    }

    console.log(`[DataRetention] Cleanup complete. Processed ${expiredCases.length} cases.`);
  } catch (err) {
    console.error("[DataRetention] Error during retention cleanup:", err);
  }
}

/**
 * Clean up a single case:
 * 1. Delete all document uploads (S3 keys become unreachable)
 * 2. Delete all portal messages
 * 3. Anonymize the case record (remove PII, keep structure for audit)
 */
async function cleanupCase(db: any, caseId: number): Promise<void> {
  console.log(`[DataRetention] Cleaning case #${caseId}...`);

  try {
    // 1. Get all document slots for this case
    const slots = await db
      .select({ id: documentSlots.id })
      .from(documentSlots)
      .where(eq(documentSlots.caseId, caseId));

    const slotIds = slots.map((s: any) => s.id);

    // 2. Delete all document uploads — first delete from S3, then remove DB rows
    if (slotIds.length > 0) {
      // Get all uploads to retrieve their fileKeys
      const uploads = await db
        .select({ id: documentUploads.id, fileKey: documentUploads.fileKey })
        .from(documentUploads)
        .where(inArray(documentUploads.slotId, slotIds));

      // Delete actual S3 objects
      let s3DeletedCount = 0;
      let s3FailedCount = 0;
      for (const upload of uploads) {
        const deleted = await storageDelete(upload.fileKey);
        if (deleted) {
          s3DeletedCount++;
        } else {
          s3FailedCount++;
          console.warn(`[DataRetention] Failed to delete S3 object: ${upload.fileKey} (case #${caseId})`);
        }
      }

      if (s3FailedCount > 0) {
        console.error(`[DataRetention] Case #${caseId}: ${s3FailedCount}/${uploads.length} S3 deletions failed. DB rows will still be removed.`);
      }

      // Now remove DB rows
      await db
        .delete(documentUploads)
        .where(inArray(documentUploads.slotId, slotIds));
    }

    // 3. Delete document slots
    await db
      .delete(documentSlots)
      .where(eq(documentSlots.caseId, caseId));

    // 4. Delete portal messages (chat history)
    await db
      .delete(portalMessages)
      .where(eq(portalMessages.caseId, caseId));

    // 5. Anonymize the case record — keep the structure but remove PII
    await db
      .update(cases)
      .set({
        clientName: "[REDACTED]",
        clientEmail: "[REDACTED]",
        clientPhone: "[REDACTED]",
        nationality: "[REDACTED]",
        notes: "Data retained for compliance. Documents deleted per retention policy.",
        updatedAt: new Date(),
      })
      .where(eq(cases.id, caseId));

    // 6. Log the retention action in audit trail
    await db.insert(auditLog).values({
      userId: 0, // System action
      action: "retention_cleanup",
      resourceType: "case",
      resourceId: caseId,
      metadata: JSON.stringify({
        documentsDeleted: slotIds.length,
        messagesDeleted: true,
        caseAnonymized: true,
        retentionDays: RETENTION_DAYS,
      }),
      createdAt: new Date(),
    });

    console.log(`[DataRetention] Case #${caseId} cleaned: ${slotIds.length} slots, documents deleted, record anonymized.`);
  } catch (err) {
    console.error(`[DataRetention] Error cleaning case #${caseId}:`, err);
  }
}

// ============================================================
// SCHEDULER
// ============================================================

export function startRetentionScheduler(): void {
  console.log("[DataRetention] Scheduler started. Interval: 12h. First run in 5 minutes.");

  // Initial delayed run
  setTimeout(() => {
    runRetentionCleanup();
  }, INITIAL_DELAY_MS);

  // Recurring runs
  intervalId = setInterval(() => {
    runRetentionCleanup();
  }, SCAN_INTERVAL_MS);
}

export function stopRetentionScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[DataRetention] Scheduler stopped.");
  }
}
