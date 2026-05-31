/**
 * Secure Document Router — tRPC procedures for private document storage.
 * 
 * Client procedures:
 * - secureDocuments.initUpload — create record + presigned upload URL
 * - secureDocuments.completeUpload — verify upload landed, mark as uploaded
 * - secureDocuments.getDocuments — list documents for the user's case
 * 
 * Staff procedures:
 * - secureDocuments.staffGetDownloadUrl — permission-checked presigned download
 * - secureDocuments.staffListDocuments — list all documents for a case
 * - secureDocuments.staffUpdateReviewStatus — accept/reject a document
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  secureDocuments,
  documentAccessLogs,
  documentEvents,
  cases,
  userRoles,
  SECURE_DOC_TYPES,
  SECURE_DOC_SIDES,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  generateDocumentKey,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  verifyObjectExists,
  isSecureStorageConfigured,
  isAllowedMimeType,
  MAX_DOCUMENT_FILE_SIZE,
  ALLOWED_DOCUMENT_MIME_TYPES,
} from "./secureDocumentStorage";

// Staff/admin roles that can access documents
const STAFF_ROLES = new Set(["admin", "super_admin", "case_manager", "gestor", "management"]);

function isStaffRole(role: string): boolean {
  return STAFF_ROLES.has(role);
}

async function verifyStaffAccess(userId: number, primaryRole: string): Promise<boolean> {
  if (isStaffRole(primaryRole)) return true;

  // Check effective roles from user_roles table
  const db = await getDb();
  if (!db) return false;

  const effectiveRoles = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  return effectiveRoles.some((r) => isStaffRole(r.role));
}

export const secureDocumentRouter = router({
  // ============================================================
  // CLIENT: Initialize Upload
  // ============================================================

  /**
   * Step 1: Client requests a presigned upload URL.
   * Creates a document record in DB and returns a short-lived presigned PUT URL.
   * The client uploads directly to S3 using this URL.
   */
  initUpload: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        documentType: z.enum(SECURE_DOC_TYPES),
        documentSide: z.enum(SECURE_DOC_SIDES).default("single"),
        fileName: z.string().min(1).max(255),
        mimeType: z.string(),
        fileSize: z.number().min(1),
        productType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate secure storage is configured
      if (!isSecureStorageConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Secure document storage is not configured. Please contact support.",
        });
      }

      // Validate mime type
      if (!isAllowedMimeType(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File type not supported. Allowed: ${ALLOWED_DOCUMENT_MIME_TYPES.join(", ")}`,
        });
      }

      // Validate file size
      if (input.fileSize > MAX_DOCUMENT_FILE_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File too large. Maximum size: ${MAX_DOCUMENT_FILE_SIZE / (1024 * 1024)}MB`,
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Verify the case exists and belongs to this user
      const [caseData] = await db
        .select()
        .from(cases)
        .where(eq(cases.id, input.caseId))
        .limit(1);

      if (!caseData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
      }

      if (caseData.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this case" });
      }

      // Generate a secure, non-guessable storage key
      const storageKey = generateDocumentKey({
        caseId: input.caseId,
        documentType: input.documentType,
        documentSide: input.documentSide,
        mimeType: input.mimeType,
      });

      const config = {
        bucket: process.env.AWS_S3_DOCUMENT_BUCKET || "",
      };

      // Create the document record (status: upload_started)
      const [insertResult] = await db.insert(secureDocuments).values({
        caseId: input.caseId,
        applicantId: ctx.user.id,
        productType: input.productType || caseData.visaType,
        documentType: input.documentType,
        documentSide: input.documentSide,
        originalFileName: input.fileName,
        fileMimeType: input.mimeType,
        fileSize: input.fileSize,
        storageProvider: "aws_s3",
        storageBucket: config.bucket,
        storageKey,
        uploadStatus: "upload_started",
        qualityStatus: "not_checked",
        extractionStatus: "not_started",
        reviewStatus: "not_reviewed",
        uploadedBy: ctx.user.id,
      });

      const documentId = insertResult.insertId;

      // Log the upload initiation event
      await db.insert(documentEvents).values({
        documentId,
        caseId: input.caseId,
        eventType: "upload_initiated",
        eventPayload: {
          documentType: input.documentType,
          documentSide: input.documentSide,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
        },
        createdBy: ctx.user.id,
      });

      // Generate presigned upload URL
      const { uploadUrl, expiresInSeconds } = await generatePresignedUploadUrl({
        storageKey,
        contentType: input.mimeType,
        maxFileSize: input.fileSize,
      });

      return {
        documentId,
        uploadUrl,
        storageKey,
        expiresInSeconds,
      };
    }),

  // ============================================================
  // CLIENT: Complete Upload
  // ============================================================

  /**
   * Step 2: Client reports upload complete.
   * Verifies the object exists in S3, marks document as uploaded,
   * sets review status to pending_manual_review.
   */
  completeUpload: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get the document record
      const [doc] = await db
        .select()
        .from(secureDocuments)
        .where(eq(secureDocuments.id, input.documentId))
        .limit(1);

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      // Verify ownership
      if (doc.applicantId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Verify the document is in the right state
      if (doc.uploadStatus !== "upload_started") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Document is in state '${doc.uploadStatus}', expected 'upload_started'`,
        });
      }

      // Verify the object actually exists in S3
      if (doc.storageKey) {
        try {
          const verification = await verifyObjectExists(doc.storageKey);
          if (!verification.exists) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Upload not found in storage. Please try uploading again.",
            });
          }
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          // If verification fails due to network/config, still mark as uploaded
          // but log the issue — manual review will catch it
          console.warn("[SecureDoc] Could not verify object existence:", err.message);
        }
      }

      // Update document status
      await db
        .update(secureDocuments)
        .set({
          uploadStatus: "uploaded",
          reviewStatus: "pending_manual_review",
          uploadedAt: new Date(),
        })
        .where(eq(secureDocuments.id, input.documentId));

      // Log the upload completion event
      await db.insert(documentEvents).values({
        documentId: input.documentId,
        caseId: doc.caseId,
        eventType: "upload_completed",
        eventPayload: {
          storageKey: doc.storageKey,
          fileSize: doc.fileSize,
          mimeType: doc.fileMimeType,
        },
        createdBy: ctx.user.id,
      });

      // If case is still in onboarding, advance to collecting_documents
      const [caseData] = await db
        .select()
        .from(cases)
        .where(eq(cases.id, doc.caseId))
        .limit(1);

      if (caseData && caseData.status === "onboarding") {
        await db
          .update(cases)
          .set({ status: "collecting_documents" })
          .where(eq(cases.id, doc.caseId));
      }

      return {
        success: true,
        documentId: input.documentId,
        status: "uploaded" as const,
        reviewStatus: "pending_manual_review" as const,
      };
    }),

  // ============================================================
  // CLIENT: Get My Documents
  // ============================================================

  getDocuments: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      // Verify case ownership
      const [caseData] = await db
        .select()
        .from(cases)
        .where(eq(cases.id, input.caseId))
        .limit(1);

      if (!caseData || caseData.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const docs = await db
        .select({
          id: secureDocuments.id,
          documentType: secureDocuments.documentType,
          documentSide: secureDocuments.documentSide,
          originalFileName: secureDocuments.originalFileName,
          fileMimeType: secureDocuments.fileMimeType,
          fileSize: secureDocuments.fileSize,
          uploadStatus: secureDocuments.uploadStatus,
          qualityStatus: secureDocuments.qualityStatus,
          reviewStatus: secureDocuments.reviewStatus,
          uploadedAt: secureDocuments.uploadedAt,
          createdAt: secureDocuments.createdAt,
        })
        .from(secureDocuments)
        .where(
          and(
            eq(secureDocuments.caseId, input.caseId),
            // Don't show deleted documents
          )
        )
        .orderBy(desc(secureDocuments.createdAt));

      // Filter out deleted documents in application code
      return docs.filter((d) => d.uploadStatus !== "deleted");
    }),

  // ============================================================
  // STAFF: Get Download URL
  // ============================================================

  /**
   * Staff-only: Generate a short-lived presigned download URL.
   * Requires staff authentication, logs access.
   */
  staffGetDownloadUrl: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify staff access
      const hasAccess = await verifyStaffAccess(ctx.user.id, ctx.user.role);
      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [doc] = await db
        .select()
        .from(secureDocuments)
        .where(eq(secureDocuments.id, input.documentId))
        .limit(1);

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      if (!doc.storageKey) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Document has no storage key" });
      }

      if (doc.uploadStatus === "deleted") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document has been deleted" });
      }

      // Log the access BEFORE generating the URL
      await db.insert(documentAccessLogs).values({
        documentId: input.documentId,
        caseId: doc.caseId,
        staffUserId: ctx.user.id,
        action: "download",
        ipAddress: null, // Would need to pass from context/request
        userAgent: null,
      });

      // Generate presigned download URL
      const { downloadUrl, expiresInSeconds } = await generatePresignedDownloadUrl({
        storageKey: doc.storageKey,
        originalFileName: doc.originalFileName || undefined,
      });

      return {
        downloadUrl,
        expiresInSeconds,
        documentId: input.documentId,
        fileName: doc.originalFileName,
      };
    }),

  // ============================================================
  // STAFF: List Documents for a Case
  // ============================================================

  staffListDocuments: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await verifyStaffAccess(ctx.user.id, ctx.user.role);
      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
      }

      const db = await getDb();
      if (!db) return [];

      const docs = await db
        .select()
        .from(secureDocuments)
        .where(eq(secureDocuments.caseId, input.caseId))
        .orderBy(desc(secureDocuments.createdAt));

      return docs;
    }),

  // ============================================================
  // STAFF: Update Review Status
  // ============================================================

  staffUpdateReviewStatus: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        reviewStatus: z.enum(["approved", "rejected", "needs_resubmission"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await verifyStaffAccess(ctx.user.id, ctx.user.role);
      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [doc] = await db
        .select()
        .from(secureDocuments)
        .where(eq(secureDocuments.id, input.documentId))
        .limit(1);

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      // Update the review status
      const newUploadStatus = input.reviewStatus === "approved"
        ? "accepted"
        : input.reviewStatus === "rejected"
          ? "rejected"
          : "replacement_requested";

      await db
        .update(secureDocuments)
        .set({
          reviewStatus: input.reviewStatus,
          uploadStatus: newUploadStatus,
        })
        .where(eq(secureDocuments.id, input.documentId));

      // Log the review event
      const eventType = input.reviewStatus === "approved"
        ? "accepted"
        : input.reviewStatus === "rejected"
          ? "rejected"
          : "replacement_requested";

      await db.insert(documentEvents).values({
        documentId: input.documentId,
        caseId: doc.caseId,
        eventType,
        eventPayload: {
          reviewStatus: input.reviewStatus,
          reason: input.reason,
          reviewedBy: ctx.user.id,
        },
        createdBy: ctx.user.id,
      });

      // Log staff access
      await db.insert(documentAccessLogs).values({
        documentId: input.documentId,
        caseId: doc.caseId,
        staffUserId: ctx.user.id,
        action: "view_metadata",
        ipAddress: null,
        userAgent: null,
      });

      return { success: true, documentId: input.documentId, newStatus: input.reviewStatus };
    }),
});
