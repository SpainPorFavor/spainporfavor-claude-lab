/**
 * Gestor Router — tRPC procedures for the Gestor dashboard.
 * Gestores can only see cases assigned to them.
 * They perform structured actions (not free-text messaging with clients).
 */

import { z } from "zod";
import { router, gestorProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  cases,
  documentSlots,
  documentUploads,
  requerimientos,
  caseStatusHistory,
  auditLog,
} from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { fireCaseEvent } from "./eventMessaging";
import { updateCaseStatus } from "./portalDb";
import type { CaseStatus } from "../drizzle/schema";

export const gestorRouter = router({
  // ============================================================
  // CASE QUEUE
  // ============================================================

  /** Get all cases assigned to this Gestor */
  getMyCases: gestorProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const gestorCases = await db
      .select()
      .from(cases)
      .where(eq(cases.gestorId, ctx.user.id))
      .orderBy(desc(cases.updatedAt));

    return gestorCases;
  }),

  /** Get a specific case with full document details (only if assigned to this Gestor) */
  getCaseDetail: gestorProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify this case belongs to the Gestor
      const [caseData] = await db
        .select()
        .from(cases)
        .where(and(eq(cases.id, input.caseId), eq(cases.gestorId, ctx.user.id)));

      if (!caseData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Case not found or not assigned to you" });
      }

      // Get all document slots with their latest uploads
      const slots = await db
        .select()
        .from(documentSlots)
        .where(eq(documentSlots.caseId, input.caseId));

      const slotsWithUploads = await Promise.all(
        slots.map(async (slot) => {
          const uploads = await db
            .select()
            .from(documentUploads)
            .where(eq(documentUploads.slotId, slot.id))
            .orderBy(desc(documentUploads.uploadedAt));

          return {
            ...slot,
            uploads,
            latestUpload: uploads[0] || null,
          };
        })
      );

      // Get requerimientos for this case
      const caseRequerimientos = await db
        .select()
        .from(requerimientos)
        .where(eq(requerimientos.caseId, input.caseId))
        .orderBy(desc(requerimientos.createdAt));

      // Get status history
      const history = await db
        .select()
        .from(caseStatusHistory)
        .where(eq(caseStatusHistory.caseId, input.caseId))
        .orderBy(desc(caseStatusHistory.changedAt));

      return {
        ...caseData,
        slots: slotsWithUploads,
        requerimientos: caseRequerimientos,
        statusHistory: history,
      };
    }),

  // ============================================================
  // STRUCTURED ACTIONS
  // ============================================================

  /** Reject a document with a specific reason (creates new upload slot requirement) */
  rejectDocument: gestorProcedure
    .input(
      z.object({
        uploadId: z.number(),
        caseId: z.number(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify case ownership
      const [caseData] = await db
        .select()
        .from(cases)
        .where(and(eq(cases.id, input.caseId), eq(cases.gestorId, ctx.user.id)));

      if (!caseData) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Case not assigned to you" });
      }

      // Update the upload status
      await db
        .update(documentUploads)
        .set({
          validationStatus: "needs_revision",
          aiFeedback: { status: "needs_revision", issues: [input.reason], feedback: input.reason },
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(documentUploads.id, input.uploadId));

      // Get the slot label for the event message
      const upload = await db.select().from(documentUploads).where(eq(documentUploads.id, input.uploadId)).then(r => r[0]);
      if (upload) {
        const slot = await db.select().from(documentSlots).where(eq(documentSlots.id, upload.slotId)).then(r => r[0]);
        if (slot) {
          fireCaseEvent(input.caseId, "document_validated", {
            documentLabel: slot.label,
            documentType: slot.documentType,
            status: "needs_revision",
            feedback: input.reason,
            source: "gestor",
          });
        }
      }

      // Audit log
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "gestor_reject_document",
        resourceType: "document_upload",
        resourceId: input.uploadId,
        metadata: { caseId: input.caseId, reason: input.reason },
      });

      return { success: true };
    }),

  /** Log a submission to the government */
  logSubmission: gestorProcedure
    .input(
      z.object({
        caseId: z.number(),
        submissionReference: z.string().optional(),
        submittedVia: z.enum(["mercurio", "consulate", "other"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify case ownership
      const [caseData] = await db
        .select()
        .from(cases)
        .where(and(eq(cases.id, input.caseId), eq(cases.gestorId, ctx.user.id)));

      if (!caseData) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Case not assigned to you" });
      }

      // Update case status to submitted
      await updateCaseStatus(input.caseId, "submitted", ctx.user.id, input.notes || `Submitted via ${input.submittedVia}${input.submissionReference ? ` (Ref: ${input.submissionReference})` : ""}`);

      // Fire event for Laura to notify client
      fireCaseEvent(input.caseId, "status_changed", {
        fromStatus: caseData.status,
        toStatus: "submitted",
        note: input.notes,
        submissionReference: input.submissionReference,
        submittedVia: input.submittedVia,
      });

      // Audit log
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "gestor_log_submission",
        resourceType: "case",
        resourceId: input.caseId,
        metadata: { submittedVia: input.submittedVia, reference: input.submissionReference },
      });

      return { success: true };
    }),

  /** Create a requerimiento (government request for more info) */
  createRequerimiento: gestorProcedure
    .input(
      z.object({
        caseId: z.number(),
        description: z.string().min(1),
        documentsNeeded: z.array(z.string()),
        deadline: z.string().optional(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify case ownership
      const [caseData] = await db
        .select()
        .from(cases)
        .where(and(eq(cases.id, input.caseId), eq(cases.gestorId, ctx.user.id)));

      if (!caseData) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Case not assigned to you" });
      }

      // Create the requerimiento record
      const [result] = await db.insert(requerimientos).values({
        caseId: input.caseId,
        gestorId: ctx.user.id,
        description: input.description,
        documentsNeeded: input.documentsNeeded,
        deadline: input.deadline ? new Date(input.deadline) : null,
        status: "pending",
      });

      // Create new document slots for the required documents
      const existingSlots = await db.select().from(documentSlots).where(eq(documentSlots.caseId, input.caseId));
      const maxSortOrder = Math.max(...existingSlots.map(s => s.sortOrder || 0), 0);

      for (let i = 0; i < input.documentsNeeded.length; i++) {
        await db.insert(documentSlots).values({
          caseId: input.caseId,
          documentType: `requerimiento_${result.insertId}_${i}`,
          label: input.documentsNeeded[i],
          description: `Requested by immigration authorities: ${input.documentsNeeded[i]}`,
          requirementsText: `This document was requested as part of a requerimiento. Deadline: ${input.deadline ? new Date(input.deadline).toLocaleDateString() : "Not specified"}`,
          isRequired: 1,
          apostilleRequired: 0,
          translationRequired: 0,
          sortOrder: maxSortOrder + i + 1,
        });
      }

      // Fire event for Laura to explain to client
      fireCaseEvent(input.caseId, "requerimiento_created", {
        description: input.description,
        documentsNeeded: input.documentsNeeded,
        deadline: input.deadline,
        requerimientoId: Number(result.insertId),
      });

      // Audit log
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "gestor_create_requerimiento",
        resourceType: "requerimiento",
        resourceId: Number(result.insertId),
        metadata: { caseId: input.caseId, documentsNeeded: input.documentsNeeded },
      });

      return { requerimientoId: Number(result.insertId) };
    }),

  /** Log a resolution (approved, denied, silencio administrativo) */
  logResolution: gestorProcedure
    .input(
      z.object({
        caseId: z.number(),
        type: z.enum(["approved", "denied", "silencio_administrativo"]),
        reason: z.string().optional(),
        referenceNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify case ownership
      const [caseData] = await db
        .select()
        .from(cases)
        .where(and(eq(cases.id, input.caseId), eq(cases.gestorId, ctx.user.id)));

      if (!caseData) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Case not assigned to you" });
      }

      // Update case status
      const newStatus: CaseStatus = input.type === "denied" ? "rejected" : "approved";
      await updateCaseStatus(
        input.caseId,
        newStatus,
        ctx.user.id,
        input.reason || `Resolution: ${input.type}`
      );

      // Fire event for Laura to notify client
      fireCaseEvent(input.caseId, "resolution_logged", {
        type: input.type,
        reason: input.reason,
        referenceNumber: input.referenceNumber,
      });

      // Audit log
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "gestor_log_resolution",
        resourceType: "case",
        resourceId: input.caseId,
        metadata: { type: input.type, reason: input.reason, referenceNumber: input.referenceNumber },
      });

      return { success: true };
    }),

  /** Download all approved documents for a case (returns URLs) */
  getDocumentBundle: gestorProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify case ownership
      const [caseData] = await db
        .select()
        .from(cases)
        .where(and(eq(cases.id, input.caseId), eq(cases.gestorId, ctx.user.id)));

      if (!caseData) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Case not assigned to you" });
      }

      // Get all approved uploads
      const slots = await db.select().from(documentSlots).where(eq(documentSlots.caseId, input.caseId));
      const slotIds = slots.map(s => s.id);

      if (slotIds.length === 0) return { documents: [] };

      const uploads = await db
        .select()
        .from(documentUploads)
        .where(inArray(documentUploads.slotId, slotIds));

      const approvedUploads = uploads.filter(
        u => u.validationStatus === "pass" || u.validationStatus === "manual_override"
      );

      const documents = approvedUploads.map(upload => {
        const slot = slots.find(s => s.id === upload.slotId);
        return {
          id: upload.id,
          label: slot?.label || "Unknown",
          documentType: slot?.documentType || "unknown",
          fileName: upload.fileName,
          fileUrl: `/manus-storage/${upload.fileKey}`,
          mimeType: upload.mimeType,
          uploadedAt: upload.uploadedAt,
        };
      });

      return { documents, caseInfo: { clientName: caseData.clientName, visaType: caseData.visaType } };
    }),
});
