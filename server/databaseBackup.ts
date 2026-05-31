/**
 * Database Backup Module
 * 
 * Performs daily automated backups of all critical database tables to S3 storage.
 * Each backup is a JSON file containing all rows from each table, timestamped
 * for easy identification and recovery.
 * 
 * Schedule: Every 24 hours (with 10-minute initial delay after server start)
 * Retention: Keeps last 7 daily backups (older ones are overwritten by key rotation)
 * 
 * Tables backed up:
 * - users, leads, cases, document_slots, document_uploads
 * - case_status_history, portal_messages, case_events
 * - escalation_tickets, requerimientos, submissions, resolutions
 * - consent_records, erasure_requests, email_queue
 * - management_tasks, task_comments, case_risks
 * - vendors, vendor_assignments, integration_status, user_roles
 */
import { getDb } from "./db";
import {
  users,
  leads,
  cases,
  documentSlots,
  documentUploads,
  caseStatusHistory,
  portalMessages,
  caseEvents,
  escalationTickets,
  requerimientos,
  submissions,
  resolutions,
  auditLog,
  consentRecords,
  erasureRequests,
  emailQueue,
  managementTasks,
  taskComments,
  caseRisks,
  vendors,
  vendorAssignments,
  integrationStatus,
  userRoles,
} from "../drizzle/schema";
import { storagePut } from "./storage";

// ============================================================
// CONFIGURATION
// ============================================================
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const INITIAL_DELAY_MS = 10 * 60 * 1000; // 10 minutes after server start
const MAX_BACKUPS = 7; // Keep 7 daily backups (rolling window)

let intervalId: ReturnType<typeof setInterval> | null = null;

// In-memory status tracking for the Command Center card
export interface BackupStatus {
  lastBackupAt: string | null;
  lastBackupSuccess: boolean;
  lastBackupKey: string | null;
  lastBackupError: string | null;
  totalRows: number | null;
  tableCount: number | null;
  nextBackupAt: string | null;
}

let lastBackupStatus: BackupStatus = {
  lastBackupAt: null,
  lastBackupSuccess: false,
  lastBackupKey: null,
  lastBackupError: null,
  totalRows: null,
  tableCount: null,
  nextBackupAt: null,
};

export function getBackupStatus(): BackupStatus {
  return { ...lastBackupStatus };
}

// ============================================================
// BACKUP LOGIC
// ============================================================

/**
 * Get the day-of-week index (0-6) for rolling backup keys.
 * This means we keep 7 backups max, overwriting the same day each week.
 */
function getBackupDayKey(): string {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday, 6 = Saturday
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${dateStr}_day${dayIndex}`;
}

export async function runDatabaseBackup(): Promise<{ success: boolean; key?: string; error?: string }> {
  console.log("[DatabaseBackup] Starting daily backup...");
  const startTime = Date.now();

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Export all critical tables
    const backup: Record<string, any[]> = {};

    // Core user/lead data
    backup.users = await db.select().from(users);
    backup.leads = await db.select().from(leads);

    // Case management
    backup.cases = await db.select().from(cases);
    backup.document_slots = await db.select().from(documentSlots);
    backup.document_uploads = await db.select().from(documentUploads);
    backup.case_status_history = await db.select().from(caseStatusHistory);
    backup.portal_messages = await db.select().from(portalMessages);
    backup.case_events = await db.select().from(caseEvents);

    // Escalations & legal
    backup.escalation_tickets = await db.select().from(escalationTickets);
    backup.requerimientos = await db.select().from(requerimientos);
    backup.submissions = await db.select().from(submissions);
    backup.resolutions = await db.select().from(resolutions);

    // GDPR & compliance
    backup.consent_records = await db.select().from(consentRecords);
    backup.erasure_requests = await db.select().from(erasureRequests);

    // Operations
    backup.email_queue = await db.select().from(emailQueue);
    backup.management_tasks = await db.select().from(managementTasks);
    backup.task_comments = await db.select().from(taskComments);
    backup.case_risks = await db.select().from(caseRisks);

    // Vendors
    backup.vendors = await db.select().from(vendors);
    backup.vendor_assignments = await db.select().from(vendorAssignments);

    // Configuration
    backup.integration_status = await db.select().from(integrationStatus);
    backup.user_roles = await db.select().from(userRoles);

    // Audit log (last 1000 entries to keep backup size manageable)
    backup.audit_log = await db.select().from(auditLog).limit(1000);

    // Build metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      tables: Object.keys(backup).length,
      totalRows: Object.values(backup).reduce((sum, rows) => sum + rows.length, 0),
      tableSizes: Object.fromEntries(
        Object.entries(backup).map(([table, rows]) => [table, rows.length])
      ),
    };

    const backupPayload = {
      metadata,
      data: backup,
    };

    // Serialize to JSON
    const jsonData = JSON.stringify(backupPayload, null, 0); // No pretty-print to save space
    const backupBuffer = Buffer.from(jsonData, "utf-8");

    // Upload to S3 with rolling day key
    const dayKey = getBackupDayKey();
    const storageKey = `backups/db-backup-${dayKey}.json`;

    const { key } = await storagePut(storageKey, backupBuffer, "application/json");

    const durationMs = Date.now() - startTime;
    console.log(
      `[DatabaseBackup] Backup complete in ${durationMs}ms. ` +
      `${metadata.tables} tables, ${metadata.totalRows} total rows. ` +
      `Stored as: ${key}`
    );

    // Update in-memory status
    lastBackupStatus = {
      lastBackupAt: new Date().toISOString(),
      lastBackupSuccess: true,
      lastBackupKey: key,
      lastBackupError: null,
      totalRows: metadata.totalRows,
      tableCount: metadata.tables,
      nextBackupAt: new Date(Date.now() + BACKUP_INTERVAL_MS).toISOString(),
    };

    return { success: true, key };
  } catch (error: any) {
    console.error("[DatabaseBackup] Backup failed:", error.message);

    // Update in-memory status with failure
    lastBackupStatus = {
      ...lastBackupStatus,
      lastBackupAt: new Date().toISOString(),
      lastBackupSuccess: false,
      lastBackupError: error.message,
      nextBackupAt: new Date(Date.now() + BACKUP_INTERVAL_MS).toISOString(),
    };

    return { success: false, error: error.message };
  }
}

// ============================================================
// SCHEDULER
// ============================================================

export function startBackupScheduler(): void {
  if (intervalId) {
    console.log("[DatabaseBackup] Scheduler already running, skipping.");
    return;
  }

  console.log(
    `[DatabaseBackup] Scheduler starting. First backup in ${INITIAL_DELAY_MS / 1000}s, ` +
    `then every ${BACKUP_INTERVAL_MS / (60 * 60 * 1000)}h.`
  );

  // Run first backup after initial delay
  setTimeout(async () => {
    await runDatabaseBackup();

    // Then run every 24 hours
    intervalId = setInterval(async () => {
      await runDatabaseBackup();
    }, BACKUP_INTERVAL_MS);
  }, INITIAL_DELAY_MS);
}

export function stopBackupScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[DatabaseBackup] Scheduler stopped.");
  }
}
