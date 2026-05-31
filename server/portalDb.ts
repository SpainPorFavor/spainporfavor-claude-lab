/**
 * Database helpers for the client portal — cases, document slots, uploads.
 */

import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  cases,
  documentSlots,
  documentUploads,
  caseStatusHistory,
  InsertCase,
  InsertDocumentSlot,
  InsertDocumentUpload,
  InsertCaseStatusHistory,
  CaseStatus,
  ValidationStatus,
} from "../drizzle/schema";
import { getChecklistForVisaType } from "./documentChecklists";

// ============================================================
// CASES
// ============================================================

export async function createCase(data: InsertCase): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cases).values(data);
  const insertId = (result as any)[0]?.insertId;
  return insertId;
}

export async function createCaseWithSlots(data: InsertCase): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create the case
  const result = await db.insert(cases).values(data);
  const caseId = (result as any)[0]?.insertId;

  // Generate document slots based on visa type
  const checklist = getChecklistForVisaType(data.visaType);
  for (const slot of checklist) {
    await db.insert(documentSlots).values({
      caseId,
      documentType: slot.documentType,
      label: slot.label,
      description: slot.description,
      requirementsText: slot.requirementsText,
      isRequired: slot.isRequired ? 1 : 0,
      apostilleRequired: slot.apostilleRequired ? 1 : 0,
      translationRequired: slot.translationRequired ? 1 : 0,
      validityDays: slot.validityDays,
      sortOrder: slot.sortOrder,
    });
  }

  // Record initial status
  await db.insert(caseStatusHistory).values({
    caseId,
    fromStatus: "onboarding",
    toStatus: "onboarding",
    note: "Case created",
  });

  return caseId;
}

export async function findCaseByStripeSessionId(stripeSessionId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(cases).where(eq(cases.stripeSessionId, stripeSessionId)).limit(1);
  return result[0] || null;
}

export async function findCaseByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(cases)
    .where(eq(cases.clientEmail, email))
    .orderBy(desc(cases.createdAt))
    .limit(1);
  return result[0] || null;
}

/**
 * Update the stripeSessionId for a case (used when we discover the correct mapping
 * between a checkout session and a case via Stripe API fallback).
 */
export async function updateCaseStripeSessionId(caseId: number, stripeSessionId: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(cases).set({ stripeSessionId }).where(eq(cases.id, caseId));
}

export async function getCaseById(caseId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  return result[0] || null;
}

export async function getCaseByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(cases)
    .where(eq(cases.userId, userId))
    .orderBy(desc(cases.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function getCasesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(cases)
    .where(eq(cases.userId, userId))
    .orderBy(desc(cases.createdAt));
}

export async function getAllCases() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(cases).orderBy(desc(cases.createdAt));
}

export async function updateCaseStatus(caseId: number, newStatus: CaseStatus, changedBy?: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getCaseById(caseId);
  if (!existing) throw new Error("Case not found");

  await db.update(cases).set({ status: newStatus }).where(eq(cases.id, caseId));

  await db.insert(caseStatusHistory).values({
    caseId,
    fromStatus: existing.status,
    toStatus: newStatus,
    changedBy: changedBy || null,
    note: note || null,
  });
}

export async function linkCaseToUser(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cases).set({ userId }).where(eq(cases.id, caseId));
}

// ============================================================
// DOCUMENT SLOTS
// ============================================================

export async function getSlotsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(documentSlots)
    .where(eq(documentSlots.caseId, caseId))
    .orderBy(documentSlots.sortOrder);
}

// ============================================================
// DOCUMENT UPLOADS
// ============================================================

export async function createDocumentUpload(data: InsertDocumentUpload): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documentUploads).values(data);
  return (result as any)[0]?.insertId;
}

export async function getUploadsBySlotId(slotId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(documentUploads)
    .where(eq(documentUploads.slotId, slotId))
    .orderBy(desc(documentUploads.uploadedAt));
}

export async function getUploadsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all slots for this case, then get uploads for each
  const slots = await getSlotsByCaseId(caseId);
  const slotIds = slots.map((s) => s.id);

  if (slotIds.length === 0) return [];

  // Get all uploads for all slots in this case
  const allUploads = [];
  for (const slotId of slotIds) {
    const uploads = await getUploadsBySlotId(slotId);
    allUploads.push(...uploads);
  }

  return allUploads;
}

export async function updateUploadValidation(
  uploadId: number,
  status: ValidationStatus,
  feedback: { status: string; issues: string[]; feedback: string },
  reviewedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    validationStatus: status,
    aiFeedback: feedback,
  };

  if (reviewedBy) {
    updateData.reviewedBy = reviewedBy;
    updateData.reviewedAt = new Date();
  }

  await db.update(documentUploads).set(updateData).where(eq(documentUploads.id, uploadId));
}

export async function getUnclearUploads() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(documentUploads)
    .where(eq(documentUploads.validationStatus, "unclear"))
    .orderBy(desc(documentUploads.uploadedAt));
}

// ============================================================
// CASE STATUS HISTORY
// ============================================================

export async function getCaseHistory(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(caseStatusHistory)
    .where(eq(caseStatusHistory.caseId, caseId))
    .orderBy(desc(caseStatusHistory.changedAt));
}

// ============================================================
// CASE + SLOTS + UPLOADS (Full view)
// ============================================================

export async function getCaseWithDocuments(caseId: number) {
  const caseData = await getCaseById(caseId);
  if (!caseData) return null;

  const slots = await getSlotsByCaseId(caseId);

  // For each slot, get the latest upload
  const slotsWithUploads = await Promise.all(
    slots.map(async (slot) => {
      const uploads = await getUploadsBySlotId(slot.id);
      return {
        ...slot,
        uploads,
        latestUpload: uploads[0] || null,
      };
    })
  );

  // Calculate progress
  const totalRequired = slotsWithUploads.filter((s) => s.isRequired === 1).length;
  const completedRequired = slotsWithUploads.filter(
    (s) => s.isRequired === 1 && s.latestUpload?.validationStatus === "pass"
  ).length;

  return {
    ...caseData,
    slots: slotsWithUploads,
    progress: {
      total: totalRequired,
      completed: completedRequired,
      percentage: totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0,
    },
  };
}
