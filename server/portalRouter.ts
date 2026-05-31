/**
 * Portal Router — tRPC procedures for the client portal and admin views.
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import sharp from "sharp";
import { validateDocument } from "./documentValidation";
import {
  createCaseWithSlots,
  getCaseByUserId,
  getCasesByUserId,
  getCaseWithDocuments,
  getAllCases,
  updateCaseStatus,
  linkCaseToUser,
  createDocumentUpload,
  updateUploadValidation,
  getUnclearUploads,
  getSlotsByCaseId,
  getUploadsBySlotId,
  getCaseById,
} from "./portalDb";
import type { CaseStatus, ValidationStatus } from "../drizzle/schema";
import { fireCaseEvent } from "./eventMessaging";

export const portalRouter = router({
  // ============================================================
  // CLIENT PROCEDURES
  // ============================================================

  /** Get the current user's active case (most recent) */
  getMyCase: protectedProcedure.query(async ({ ctx }) => {
    const caseData = await getCaseByUserId(ctx.user.id);
    if (!caseData) return null;
    return getCaseWithDocuments(caseData.id);
  }),

  /** Get all cases for the current user */
  getMyCases: protectedProcedure.query(async ({ ctx }) => {
    return getCasesByUserId(ctx.user.id);
  }),

  /** Upload a document to a specific slot */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        slotId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64-encoded file data
        mimeType: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the slot belongs to the user's case
      const userCase = await getCaseByUserId(ctx.user.id);
      if (!userCase) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No active case found" });
      }

      const slots = await getSlotsByCaseId(userCase.id);
      const slot = slots.find((s) => s.id === input.slotId);
      if (!slot) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This document slot does not belong to your case" });
      }

      // Validate file size (max 10MB)
      if (input.fileSize > 10 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "File size exceeds 10MB limit" });
      }

      // Validate mime type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File type not supported. Please upload PDF, JPG, PNG, or WEBP files.",
        });
      }

      // Decode base64 and strip EXIF/metadata from images before upload
      let fileBuffer = Buffer.from(input.fileData, "base64");

      // Strip EXIF metadata (GPS, device info, timestamps) from image uploads
      if (input.mimeType.startsWith("image/")) {
        try {
          fileBuffer = Buffer.from(await sharp(fileBuffer)
            .rotate() // Auto-rotate based on EXIF orientation before stripping
            .withMetadata({ orientation: undefined }) // Remove all EXIF/IPTC/XMP metadata
            .toBuffer());
        } catch (err) {
          // If sharp fails (corrupted image), proceed with original buffer
          console.warn("[EXIF Strip] Failed to process image, using original:", err);
        }
      }

      const fileKey = `cases/${userCase.id}/documents/${slot.documentType}/${input.fileName}`;
      const { key } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Create the upload record
      const uploadId = await createDocumentUpload({
        slotId: input.slotId,
        fileKey: key,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        validationStatus: "pending",
      });

      // Trigger AI validation asynchronously (don't block the response)
      // We'll update the status when validation completes
      validateDocumentAsync(uploadId, slot.documentType, key, input.mimeType, userCase.clientName, userCase.visaType);

      // If case is still in onboarding, move to collecting_documents
      if (userCase.status === "onboarding") {
        await updateCaseStatus(userCase.id, "collecting_documents", ctx.user.id, "First document uploaded");
        fireCaseEvent(userCase.id, "status_changed", {
          fromStatus: "onboarding",
          toStatus: "collecting_documents",
        });
      }

      return { uploadId, status: "pending" as const };
    }),

  /** Get validation status for a specific upload */
  getUploadStatus: protectedProcedure
    .input(z.object({ slotId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userCase = await getCaseByUserId(ctx.user.id);
      if (!userCase) return null;

      const uploads = await getUploadsBySlotId(input.slotId);
      return uploads;
    }),

  /** Claim a case by email (link existing case to logged-in user) */
  claimCase: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Security: Only allow claiming cases that match the authenticated user's email
      // This prevents a logged-in user from claiming someone else's case by guessing their email
      if (input.email.toLowerCase() !== ctx.user.email?.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only claim cases associated with your own email address.",
        });
      }

      // Find a case with this email that doesn't have a userId yet
      const allCases = await getAllCases();
      const unclaimedCase = allCases.find(
        (c) => c.clientEmail?.toLowerCase() === input.email.toLowerCase() && !c.userId
      );

      if (!unclaimedCase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No unclaimed case found with this email address.",
        });
      }

            await linkCaseToUser(unclaimedCase.id, ctx.user.id);
      return { caseId: unclaimedCase.id };
    }),

  /** Acknowledge privacy notice — one-time gate before document upload */
  acknowledgePrivacy: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      aiValidationOptIn: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const { cases } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify the case belongs to this user
      const userCase = await getCaseByUserId(ctx.user.id);
      if (!userCase || userCase.id !== input.caseId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Case not found or not yours" });
      }

      await db.update(cases).set({
        privacyAcknowledgedAt: new Date(),
        privacyNoticeVersion: "2026-05-30-v1",
        aiValidationEnabled: input.aiValidationOptIn,
      }).where(eq(cases.id, input.caseId));

      // Also grant the required consents for backward compatibility
      const { consentRecords } = await import("../drizzle/schema");
      const ipAddress = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || ctx.req.socket.remoteAddress || "unknown";
      const userAgent = (ctx.req.headers["user-agent"] as string) || "unknown";
      const CONSENT_TEXTS_MAP: Record<string, string> = {
        data_processing: "I acknowledge that SpainPorFavor will process my personal data (identity documents, financial records) for preparing and submitting my Spanish visa application. Data stored securely, accessed only by authorized personnel.",
        ai_validation: "I opt in to AI-powered document validation to check formatting, dates, and content of my uploads.",
        third_party_sharing: "I acknowledge that my documents will be shared with my assigned Gestor Administrativo for preparing and submitting my visa application.",
      };
      const requiredTypes = ["data_processing", "third_party_sharing"];
      if (input.aiValidationOptIn) requiredTypes.push("ai_validation");

      for (const ct of requiredTypes) {
        const typedCt = ct as "data_processing" | "ai_validation" | "third_party_sharing" | "marketing";
        const existing = await db.select().from(consentRecords).where(
          and(
            eq(consentRecords.userId, ctx.user.id),
            eq(consentRecords.caseId, input.caseId),
            eq(consentRecords.consentType, typedCt),
            eq(consentRecords.granted, 1)
          )
        ).limit(1);
        if (existing.length > 0) continue;
        await db.insert(consentRecords).values({
          userId: ctx.user.id,
          caseId: input.caseId,
          consentType: typedCt,
          consentText: CONSENT_TEXTS_MAP[ct] || "",
          granted: 1,
          ipAddress,
          userAgent,
        });
      }

      return { success: true };
    }),

  // ============================================================
  // ADMIN PROCEDURES
  // ============================================================

  /** Get all cases (admin view) */
  adminGetAllCases: adminProcedure.query(async () => {
    return getAllCases();
  }),

  /** Get a specific case with full document details (admin) */
  adminGetCase: adminProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return getCaseWithDocuments(input.caseId);
    }),

  /** Create a new case manually (admin) */
  adminCreateCase: adminProcedure
    .input(
      z.object({
        visaType: z.string(),
        clientName: z.string().min(1),
        clientEmail: z.string().email(),
        clientPhone: z.string().optional(),
        nationality: z.string().optional(),
        familyComposition: z.string().optional(),
        dependents: z.number().int().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const caseId = await createCaseWithSlots({
        visaType: input.visaType,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone || null,
        nationality: input.nationality || null,
        familyComposition: input.familyComposition || null,
        dependents: input.dependents || 0,
        notes: input.notes || null,
        status: "onboarding",
      });

      return { caseId };
    }),

  /** Update case status (admin) */
  adminUpdateCaseStatus: adminProcedure
    .input(
      z.object({
        caseId: z.number(),
        status: z.enum([
          "onboarding",
          "collecting_documents",
          "ready_for_gestor",
          "with_gestor",
          "submitted",
          "approved",
          "rejected",
        ]),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentCase = await getCaseById(input.caseId);
      const fromStatus = currentCase?.status || "unknown";
      await updateCaseStatus(input.caseId, input.status as CaseStatus, ctx.user.id, input.note);

      // Fire event for Laura to message the client
      fireCaseEvent(input.caseId, "status_changed", {
        fromStatus,
        toStatus: input.status,
        note: input.note,
      });

      return { success: true };
    }),

  /** List all users with gestor role (admin) */
  adminListGestors: adminProcedure.query(async () => {
    const db = await (await import("./db")).getDb();
    if (!db) return [];
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    return db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.role, "gestor"));
  }),

  /** Assign a gestor to a case (admin) */
  adminAssignGestor: adminProcedure
    .input(z.object({ caseId: z.number(), gestorId: z.number().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const db = await (await import("./db")).getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { cases: casesTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await db.update(casesTable).set({ gestorId: input.gestorId }).where(eq(casesTable.id, input.caseId));

      // Fire event so Laura notifies the client
      if (input.gestorId) {
        fireCaseEvent(input.caseId, "status_changed", {
          fromStatus: "collecting_documents",
          toStatus: "with_gestor",
          note: "A licensed Gestor has been assigned to your case.",
        });
      }

      return { success: true };
    }),

  /** Get documents needing manual review (admin) */
  adminGetReviewQueue: adminProcedure.query(async () => {
    return getUnclearUploads();
  }),

  /** Override document validation (admin manual review) */
  adminOverrideValidation: adminProcedure
    .input(
      z.object({
        uploadId: z.number(),
        status: z.enum(["pass", "needs_revision", "manual_override"]),
        feedback: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUploadValidation(
        input.uploadId,
        input.status as ValidationStatus,
        {
          status: input.status,
          issues: input.status === "needs_revision" ? [input.feedback] : [],
          feedback: input.feedback,
        },
        ctx.user.id
      );

      return { success: true };
    }),

  /** Get queued emails for admin review (admin) */
  adminGetEmailQueue: adminProcedure.query(async () => {
    const { getQueuedEmails } = await import("./emailNotifications");
    return getQueuedEmails(100);
  }),

  /** Mark emails as sent after batch sending (admin) */
  adminMarkEmailsSent: adminProcedure
    .input(z.object({ emailIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { markEmailsSent } = await import("./emailNotifications");
      await markEmailsSent(input.emailIds);
      return { success: true };
    }),

  /** Submit all pages to IndexNow for instant indexing by Bing and AI crawlers (admin) */
  adminSubmitIndexNow: adminProcedure.mutation(async () => {
    const { submitAllPagesToIndexNow } = await import("./indexnow");
    await submitAllPagesToIndexNow();
    return { success: true, message: "All pages submitted to IndexNow (Bing, Yandex, and participating engines)" };
  }),
});

/**
 * Async document validation — runs in the background after upload.
 * Updates the upload record when complete.
 */
async function validateDocumentAsync(
  uploadId: number,
  documentType: string,
  fileKey: string,
  mimeType: string,
  clientName: string,
  visaType: string
) {
  try {
    const result = await validateDocument({
      documentType,
      fileKey,
      mimeType,
      clientName,
      visaType,
    });

    await updateUploadValidation(uploadId, result.status as ValidationStatus, result);

    // Fire event so Laura messages the client about the validation result
    // We need to find the case ID from the upload
    const { getDb: getDbInstance } = await import("./db");
    const dbInstance = await getDbInstance();
    if (dbInstance) {
      const { documentUploads, documentSlots } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const upload = await dbInstance.select().from(documentUploads).where(eq(documentUploads.id, uploadId)).then((r: any[]) => r[0]);
      if (upload) {
        const slot = await dbInstance.select().from(documentSlots).where(eq(documentSlots.id, upload.slotId)).then((r: any[]) => r[0]);
        if (slot) {
          // Count completed documents for progress messaging
          const allSlots = await dbInstance.select().from(documentSlots).where(eq(documentSlots.caseId, slot.caseId));
          const allUploads = await Promise.all(
            allSlots.map((s: any) => dbInstance.select().from(documentUploads).where(eq(documentUploads.slotId, s.id)).then((r: any[]) => r[r.length - 1]))
          );
          const completedCount = allUploads.filter((u: any) => u && (u.validationStatus === "pass" || u.validationStatus === "manual_override")).length;
          const totalCount = allSlots.filter((s: any) => s.isRequired === 1).length;

          fireCaseEvent(slot.caseId, "document_validated", {
            documentLabel: slot.label,
            documentType,
            status: result.status,
            feedback: result.feedback,
            completedCount,
            totalCount,
          });

          // Check milestones
          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          if (pct === 50) {
            fireCaseEvent(slot.caseId, "milestone_reached", { milestone: "50_percent", completedCount, totalCount });
          } else if (pct === 75) {
            fireCaseEvent(slot.caseId, "milestone_reached", { milestone: "75_percent", completedCount, totalCount });
          } else if (completedCount === totalCount && totalCount > 0) {
            fireCaseEvent(slot.caseId, "milestone_reached", { milestone: "all_complete", completedCount, totalCount });
            // Auto-advance to ready_for_gestor
            const { updateCaseStatus: updateStatus } = await import("./portalDb");
            await updateStatus(slot.caseId, "ready_for_gestor", 0, "All documents validated");
            fireCaseEvent(slot.caseId, "status_changed", { fromStatus: "collecting_documents", toStatus: "ready_for_gestor" });
          }
        }
      }
    }

    console.log(`[Validation] Upload ${uploadId} (${documentType}): ${result.status}`);
  } catch (error) {
    console.error(`[Validation] Error validating upload ${uploadId}:`, error);
    await updateUploadValidation(uploadId, "unclear", {
      status: "unclear",
      issues: ["Validation error occurred"],
      feedback: "Our automated check encountered an error. Our team will review this manually.",
    });
  }
}
