/**
 * Proactive Outreach Scanner
 * 
 * Runs on a scheduled interval (every 6 hours) to detect conditions that
 * require Laura to proactively message clients:
 * 
 * 1. Document expiry warnings — documents approaching their validity expiry
 * 2. Inactivity nudges — no uploads in 7+ days for active cases
 * 3. Deadline reminders — requerimiento deadlines approaching
 * 4. Milestone celebrations — 50%, 75%, 100% document completion
 * 
 * This module is deterministic (no AI judgment needed to detect triggers).
 * It fires events via the eventMessaging module, which generates Laura messages.
 */

import { getDb } from "./db";
import {
  cases,
  documentSlots,
  documentUploads,
  requerimientos,
  caseEvents,
  portalMessages,
} from "../drizzle/schema";
import { eq, and, inArray, lte, gte, desc, sql } from "drizzle-orm";
import { fireCaseEvent } from "./eventMessaging";

// ============================================================
// SCANNER CONFIGURATION
// ============================================================

const SCAN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const EXPIRY_WARNING_DAYS = 14; // Warn 14 days before expiry
const INACTIVITY_THRESHOLD_DAYS = 7; // Nudge after 7 days of no activity
const DEADLINE_WARNING_DAYS = 3; // Warn 3 days before requerimiento deadline

// Prevent duplicate messages within a time window
const DEDUP_WINDOW_HOURS = 48; // Don't send same event type for same case within 48h

// ============================================================
// MAIN SCANNER
// ============================================================

export async function runProactiveOutreach(): Promise<{
  expiryWarnings: number;
  inactivityNudges: number;
  deadlineReminders: number;
  milestones: number;
}> {
  const results = {
    expiryWarnings: 0,
    inactivityNudges: 0,
    deadlineReminders: 0,
    milestones: 0,
  };

  try {
    const db = await getDb();
    if (!db) {
      console.log("[ProactiveOutreach] No database connection, skipping scan");
      return results;
    }

    // Only scan active cases (collecting_documents, with_gestor, submitted)
    const activeCases = await db
      .select()
      .from(cases)
      .where(inArray(cases.status, ["collecting_documents", "with_gestor", "submitted"]));

    if (activeCases.length === 0) {
      console.log("[ProactiveOutreach] No active cases to scan");
      return results;
    }

    for (const caseRecord of activeCases) {
      // 1. Document Expiry Warnings
      const expiryCount = await checkDocumentExpiry(db, caseRecord);
      results.expiryWarnings += expiryCount;

      // 2. Inactivity Nudges (only for cases in collecting_documents)
      if (caseRecord.status === "collecting_documents") {
        const nudged = await checkInactivity(db, caseRecord);
        if (nudged) results.inactivityNudges++;
      }

      // 3. Deadline Reminders (requerimientos)
      const deadlineCount = await checkDeadlines(db, caseRecord);
      results.deadlineReminders += deadlineCount;

      // 4. Milestone Celebrations (only for collecting_documents)
      if (caseRecord.status === "collecting_documents") {
        const celebrated = await checkMilestones(db, caseRecord);
        if (celebrated) results.milestones++;
      }
    }

    console.log(`[ProactiveOutreach] Scan complete:`, results);
  } catch (err) {
    console.error("[ProactiveOutreach] Scanner error:", err);
  }

  return results;
}

// ============================================================
// INDIVIDUAL CHECKS
// ============================================================

/**
 * Check for documents approaching their validity expiry date.
 * A document's expiry = upload date + validityDays (from the slot).
 */
async function checkDocumentExpiry(db: any, caseRecord: any): Promise<number> {
  let count = 0;

  const slots = await db
    .select()
    .from(documentSlots)
    .where(eq(documentSlots.caseId, caseRecord.id));

  for (const slot of slots) {
    if (!slot.validityDays) continue; // No expiry constraint

    // Get the latest passing upload for this slot
    const uploads = await db
      .select()
      .from(documentUploads)
      .where(
        and(
          eq(documentUploads.slotId, slot.id),
          eq(documentUploads.validationStatus, "pass")
        )
      )
      .orderBy(desc(documentUploads.uploadedAt))
      .limit(1);

    if (uploads.length === 0) continue;

    const upload = uploads[0];
    const uploadDate = new Date(upload.uploadedAt);
    const expiryDate = new Date(uploadDate.getTime() + slot.validityDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (daysRemaining <= EXPIRY_WARNING_DAYS && daysRemaining > 0) {
      // Check dedup — don't warn again within 48h
      const isDuplicate = await isRecentEvent(db, caseRecord.id, "expiry_warning", slot.id);
      if (!isDuplicate) {
        await fireCaseEvent(caseRecord.id, "expiry_warning", {
          documentLabel: slot.label,
          documentType: slot.documentType,
          expiresAt: expiryDate.toISOString(),
          daysRemaining,
          slotId: slot.id,
        });
        count++;
      }
    }
  }

  return count;
}

/**
 * Check for client inactivity — no uploads or messages in N days.
 */
async function checkInactivity(db: any, caseRecord: any): Promise<boolean> {
  const thresholdDate = new Date(Date.now() - INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  // Check last upload across all slots for this case
  const slots = await db
    .select({ id: documentSlots.id })
    .from(documentSlots)
    .where(eq(documentSlots.caseId, caseRecord.id));

  if (slots.length === 0) return false;

  const slotIds = slots.map((s: any) => s.id);

  const recentUploads = await db
    .select()
    .from(documentUploads)
    .where(
      and(
        inArray(documentUploads.slotId, slotIds),
        gte(documentUploads.uploadedAt, thresholdDate)
      )
    )
    .limit(1);

  if (recentUploads.length > 0) return false; // Active recently

  // Also check last client message
  const recentMessages = await db
    .select()
    .from(portalMessages)
    .where(
      and(
        eq(portalMessages.caseId, caseRecord.id),
        eq(portalMessages.role, "client"),
        gte(portalMessages.createdAt, thresholdDate)
      )
    )
    .limit(1);

  if (recentMessages.length > 0) return false; // Active via chat

  // Check dedup
  const isDuplicate = await isRecentEvent(db, caseRecord.id, "inactivity_detected", null);
  if (isDuplicate) return false;

  // Calculate progress
  const allUploads = await db
    .select()
    .from(documentUploads)
    .where(inArray(documentUploads.slotId, slotIds));

  const passedSlotIds = new Set(
    allUploads
      .filter((u: any) => u.validationStatus === "pass")
      .map((u: any) => u.slotId)
  );

  const totalSlots = slots.length;
  const completedCount = passedSlotIds.size;

  // Calculate days since last activity
  const lastUpload = await db
    .select()
    .from(documentUploads)
    .where(inArray(documentUploads.slotId, slotIds))
    .orderBy(desc(documentUploads.uploadedAt))
    .limit(1);

  const lastActivity = lastUpload.length > 0
    ? new Date(lastUpload[0].uploadedAt)
    : new Date(caseRecord.createdAt);

  const daysSinceLastActivity = Math.ceil(
    (Date.now() - lastActivity.getTime()) / (24 * 60 * 60 * 1000)
  );

  await fireCaseEvent(caseRecord.id, "inactivity_detected", {
    daysSinceLastActivity,
    completedCount,
    totalCount: totalSlots,
  });

  return true;
}

/**
 * Check for requerimiento deadlines approaching.
 */
async function checkDeadlines(db: any, caseRecord: any): Promise<number> {
  let count = 0;

  const pendingReqs = await db
    .select()
    .from(requerimientos)
    .where(
      and(
        eq(requerimientos.caseId, caseRecord.id),
        eq(requerimientos.status, "pending")
      )
    );

  for (const req of pendingReqs) {
    if (!req.deadline) continue;

    const deadline = new Date(req.deadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (daysRemaining <= DEADLINE_WARNING_DAYS && daysRemaining > 0) {
      const isDuplicate = await isRecentEvent(db, caseRecord.id, "requerimiento_created", req.id);
      if (!isDuplicate) {
        // Fire as a system message directly (not requerimiento_created which is for new ones)
        await db.insert(portalMessages).values({
          caseId: caseRecord.id,
          role: "laura" as const,
          content: `⚠️ Reminder: You have a government deadline in **${daysRemaining} day${daysRemaining > 1 ? "s" : ""}** (${deadline.toLocaleDateString()}). Please make sure you've uploaded the requested documents. If you need help, just ask me here.`,
          metadata: { trigger: "deadline_reminder", requerimientoId: req.id },
        });
        count++;
      }
    }
  }

  return count;
}

/**
 * Check for milestone celebrations (50%, 75%, 100% completion).
 */
async function checkMilestones(db: any, caseRecord: any): Promise<boolean> {
  const slots = await db
    .select()
    .from(documentSlots)
    .where(eq(documentSlots.caseId, caseRecord.id));

  if (slots.length === 0) return false;

  const slotIds = slots.map((s: any) => s.id);
  const requiredSlots = slots.filter((s: any) => s.isRequired === 1);
  const totalRequired = requiredSlots.length;

  if (totalRequired === 0) return false;

  // Get all passing uploads
  const allUploads = await db
    .select()
    .from(documentUploads)
    .where(
      and(
        inArray(documentUploads.slotId, slotIds),
        eq(documentUploads.validationStatus, "pass")
      )
    );

  // Count unique slots with passing uploads
  const passedSlotIds = new Set(allUploads.map((u: any) => u.slotId));
  const requiredPassedCount = requiredSlots.filter((s: any) => passedSlotIds.has(s.id)).length;
  const completionPercent = Math.round((requiredPassedCount / totalRequired) * 100);

  // Determine which milestone to celebrate
  let milestone: string | null = null;
  if (completionPercent >= 100) {
    milestone = "all_complete";
  } else if (completionPercent >= 75) {
    milestone = "75_percent";
  } else if (completionPercent >= 50) {
    milestone = "50_percent";
  }

  if (!milestone) return false;

  // Check if this milestone was already celebrated
  const isDuplicate = await isRecentMilestone(db, caseRecord.id, milestone);
  if (isDuplicate) return false;

  await fireCaseEvent(caseRecord.id, "milestone_reached", {
    milestone,
    completedCount: requiredPassedCount,
    totalCount: totalRequired,
  });

  return true;
}

// ============================================================
// DEDUPLICATION HELPERS
// ============================================================

/**
 * Check if a similar event was already fired recently (within DEDUP_WINDOW_HOURS).
 */
async function isRecentEvent(
  db: any,
  caseId: number,
  eventType: string,
  resourceId: number | null
): Promise<boolean> {
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000);

  const recent = await db
    .select()
    .from(caseEvents)
    .where(
      and(
        eq(caseEvents.caseId, caseId),
        eq(caseEvents.eventType, eventType as any),
        gte(caseEvents.createdAt, cutoff)
      )
    )
    .limit(1);

  return recent.length > 0;
}

/**
 * Check if a milestone was already celebrated (ever — milestones are one-time).
 */
async function isRecentMilestone(db: any, caseId: number, milestone: string): Promise<boolean> {
  const events = await db
    .select()
    .from(caseEvents)
    .where(
      and(
        eq(caseEvents.caseId, caseId),
        eq(caseEvents.eventType, "milestone_reached" as any)
      )
    );

  // Check if any event has this milestone in its payload
  return events.some((e: any) => {
    const payload = typeof e.payload === "string" ? JSON.parse(e.payload) : e.payload;
    return payload?.milestone === milestone;
  });
}

// ============================================================
// SCHEDULER — Starts the periodic scan
// ============================================================

let scanInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the proactive outreach scanner.
 * Runs immediately on startup, then every SCAN_INTERVAL_MS.
 */
export function startProactiveOutreach(): void {
  console.log(`[ProactiveOutreach] Starting scanner (interval: ${SCAN_INTERVAL_MS / 1000 / 60 / 60}h)`);

  // Run first scan after a 30-second delay (let server finish starting)
  setTimeout(() => {
    runProactiveOutreach().catch(console.error);
  }, 30_000);

  // Then run every SCAN_INTERVAL_MS
  scanInterval = setInterval(() => {
    runProactiveOutreach().catch(console.error);
  }, SCAN_INTERVAL_MS);
}

/**
 * Stop the proactive outreach scanner (for testing/shutdown).
 */
export function stopProactiveOutreach(): void {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
    console.log("[ProactiveOutreach] Scanner stopped");
  }
}
