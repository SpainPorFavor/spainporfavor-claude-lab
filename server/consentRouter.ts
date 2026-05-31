/**
 * Consent Router — GDPR consent management
 * 
 * Handles:
 * - Consent gate check (has user given required consents?)
 * - Grant consent (with full audit trail)
 * - Revoke consent
 * - View consent history
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  consentRecords,
  CONSENT_TYPES,
  erasureRequests,
  cases,
  documentSlots,
  documentUploads,
  portalMessages,
  auditLog,
} from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { storageDelete } from "./storage";

// The exact consent texts shown to users
export const CONSENT_TEXTS = {
  data_processing: `I consent to SpainPorFavor processing my personal data (including identity documents, financial records, and personal information) for the purpose of preparing and submitting my Spanish visa application. This data will be stored securely and accessed only by authorized personnel (your assigned Gestor and SpainPorFavor administrators). Data processing is necessary for the performance of our service contract (GDPR Article 6(1)(b)).`,
  
  ai_validation: `I consent to SpainPorFavor using AI-powered document analysis to validate my uploaded documents for completeness, accuracy, and compliance with Spanish immigration requirements. Document images are processed by our AI system to check formatting, dates, and content. No document data is retained by the AI system after processing.`,
  
  third_party_sharing: `I consent to SpainPorFavor sharing my documents and personal information with my assigned Gestor Administrativo (licensed immigration specialist) for the purpose of preparing and submitting my visa application to Spanish immigration authorities. The Gestor is bound by professional confidentiality obligations under Spanish law.`,
  
  marketing: `I consent to receiving occasional updates from SpainPorFavor about immigration news, visa regulation changes, and service updates relevant to my situation. I understand I can withdraw this consent at any time.`,
};

// Required consents before document upload is allowed
const REQUIRED_CONSENTS: (typeof CONSENT_TYPES)[number][] = [
  "data_processing",
  "ai_validation",
  "third_party_sharing",
];

export const consentRouter = router({
  /**
   * Check if user has all required consents for document upload.
   * Returns which consents are missing.
   */
  checkConsent: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { hasAllRequired: false, missing: REQUIRED_CONSENTS, granted: [] };

      const records = await db
        .select()
        .from(consentRecords)
        .where(
          and(
            eq(consentRecords.userId, ctx.user.id),
            eq(consentRecords.caseId, input.caseId),
            eq(consentRecords.granted, 1)
          )
        );

      const grantedTypes = records.map((r) => r.consentType);
      const missing = REQUIRED_CONSENTS.filter((t) => !grantedTypes.includes(t));

      return {
        hasAllRequired: missing.length === 0,
        missing,
        granted: grantedTypes,
      };
    }),

  /**
   * Grant consent — records the exact text, IP, user agent, and timestamp.
   */
  grantConsent: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        consentType: z.enum(CONSENT_TYPES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const consentText = CONSENT_TEXTS[input.consentType];
      if (!consentText) throw new Error("Invalid consent type");

      // Check if already granted
      const existing = await db
        .select()
        .from(consentRecords)
        .where(
          and(
            eq(consentRecords.userId, ctx.user.id),
            eq(consentRecords.caseId, input.caseId),
            eq(consentRecords.consentType, input.consentType),
            eq(consentRecords.granted, 1)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { success: true, alreadyGranted: true };
      }

      // Extract IP and user agent from request
      const ipAddress =
        (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        ctx.req.socket.remoteAddress ||
        "unknown";
      const userAgent = (ctx.req.headers["user-agent"] as string) || "unknown";

      await db.insert(consentRecords).values({
        userId: ctx.user.id,
        caseId: input.caseId,
        consentType: input.consentType,
        consentText,
        granted: 1,
        ipAddress,
        userAgent,
      });

      return { success: true, alreadyGranted: false };
    }),

  /**
   * Grant all required consents at once (convenience for the consent gate UI).
   */
  grantAllRequired: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const ipAddress =
        (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        ctx.req.socket.remoteAddress ||
        "unknown";
      const userAgent = (ctx.req.headers["user-agent"] as string) || "unknown";

      for (const consentType of REQUIRED_CONSENTS) {
        // Check if already granted
        const existing = await db
          .select()
          .from(consentRecords)
          .where(
            and(
              eq(consentRecords.userId, ctx.user.id),
              eq(consentRecords.caseId, input.caseId),
              eq(consentRecords.consentType, consentType),
              eq(consentRecords.granted, 1)
            )
          )
          .limit(1);

        if (existing.length > 0) continue;

        await db.insert(consentRecords).values({
          userId: ctx.user.id,
          caseId: input.caseId,
          consentType,
          consentText: CONSENT_TEXTS[consentType],
          granted: 1,
          ipAddress,
          userAgent,
        });
      }

      return { success: true };
    }),

  /**
   * Revoke a specific consent.
   */
  revokeConsent: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        consentType: z.enum(CONSENT_TYPES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(consentRecords)
        .set({ granted: 0, revokedAt: new Date() })
        .where(
          and(
            eq(consentRecords.userId, ctx.user.id),
            eq(consentRecords.caseId, input.caseId),
            eq(consentRecords.consentType, input.consentType),
            eq(consentRecords.granted, 1)
          )
        );

      return { success: true };
    }),

  /**
   * Get full consent history for the current user (for transparency).
   */
  getConsentHistory: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const records = await db
        .select()
        .from(consentRecords)
        .where(
          and(
            eq(consentRecords.userId, ctx.user.id),
            eq(consentRecords.caseId, input.caseId)
          )
        )
        .orderBy(desc(consentRecords.grantedAt));

      return records.map((r) => ({
        id: r.id,
        consentType: r.consentType,
        consentText: r.consentText,
        granted: r.granted === 1,
        grantedAt: r.grantedAt,
        revokedAt: r.revokedAt,
      }));
    }),

  /**
   * Get the consent texts (for displaying in the consent gate UI).
   */
  getConsentTexts: protectedProcedure.query(() => {
    return {
      required: REQUIRED_CONSENTS.map((type) => ({
        type,
        text: CONSENT_TEXTS[type],
      })),
      optional: [
        {
          type: "marketing" as const,
          text: CONSENT_TEXTS.marketing,
        },
      ],
    };
  }),

  // ============================================================
  // RIGHT TO ERASURE (GDPR Article 17)
  // ============================================================

  /**
   * Client requests data erasure. Creates a pending request.
   * Client must confirm within 72 hours for the deletion to proceed.
   */
  requestErasure: protectedProcedure
    .input(
      z.object({
        caseId: z.number().optional(), // Specific case, or all data if omitted
        reason: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if there's already a pending request
      const existing = await db
        .select()
        .from(erasureRequests)
        .where(
          and(
            eq(erasureRequests.userId, ctx.user.id),
            eq(erasureRequests.status, "pending")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { success: true, requestId: existing[0].id, alreadyPending: true };
      }

      const [result] = await db.insert(erasureRequests).values({
        userId: ctx.user.id,
        caseId: input.caseId || null,
        reason: input.reason || null,
        status: "pending",
      });

      // Audit log
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "erasure_requested",
        resourceType: "user",
        resourceId: ctx.user.id,
        metadata: JSON.stringify({ caseId: input.caseId, reason: input.reason }),
        createdAt: new Date(),
      });

      return { success: true, requestId: result.insertId, alreadyPending: false };
    }),

  /**
   * Client confirms the erasure request (double-opt-in for safety).
   * After confirmation, the system executes the deletion.
   */
  confirmErasure: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify the request belongs to this user
      const [request] = await db
        .select()
        .from(erasureRequests)
        .where(
          and(
            eq(erasureRequests.id, input.requestId),
            eq(erasureRequests.userId, ctx.user.id),
            eq(erasureRequests.status, "pending")
          )
        )
        .limit(1);

      if (!request) {
        throw new Error("Erasure request not found or already processed");
      }

      // Mark as confirmed
      await db
        .update(erasureRequests)
        .set({ status: "confirmed", confirmedAt: new Date() })
        .where(eq(erasureRequests.id, input.requestId));

      // Execute the deletion
      const deletedResources = await executeErasure(db, ctx.user.id, request.caseId);

      // Mark as completed
      await db
        .update(erasureRequests)
        .set({
          status: "completed",
          completedAt: new Date(),
          deletedResources: JSON.stringify(deletedResources),
        })
        .where(eq(erasureRequests.id, input.requestId));

      // Audit log
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "erasure_completed",
        resourceType: "user",
        resourceId: ctx.user.id,
        metadata: JSON.stringify(deletedResources),
        createdAt: new Date(),
      });

      return { success: true, deletedResources };
    }),

  /**
   * Cancel a pending erasure request.
   */
  cancelErasure: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(erasureRequests)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(erasureRequests.id, input.requestId),
            eq(erasureRequests.userId, ctx.user.id),
            eq(erasureRequests.status, "pending")
          )
        );

      return { success: true };
    }),

  /**
   * Get the user's erasure request status.
   */
  getErasureStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { requests: [] };

    const requests = await db
      .select()
      .from(erasureRequests)
      .where(eq(erasureRequests.userId, ctx.user.id))
      .orderBy(desc(erasureRequests.requestedAt));

    return { requests };
  }),

  // ============================================================
  // ADMIN: View erasure requests
  // ============================================================

  /**
   * Admin: list all erasure requests for oversight.
   */
  listErasureRequests: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(erasureRequests)
      .orderBy(desc(erasureRequests.requestedAt));
  }),
});

// ============================================================
// ERASURE EXECUTION
// ============================================================

async function executeErasure(
  db: any,
  userId: number,
  caseId: number | null
): Promise<Record<string, number>> {
  const stats = {
    documentsDeleted: 0,
    slotsDeleted: 0,
    messagesDeleted: 0,
    casesAnonymized: 0,
    consentsRevoked: 0,
  };

  // Get cases to process
  let casesToProcess: { id: number }[];
  if (caseId) {
    casesToProcess = [{ id: caseId }];
  } else {
    casesToProcess = await db
      .select({ id: cases.id })
      .from(cases)
      .where(eq(cases.userId, userId));
  }

  for (const c of casesToProcess) {
    // Delete document uploads
    const slots = await db
      .select({ id: documentSlots.id })
      .from(documentSlots)
      .where(eq(documentSlots.caseId, c.id));

    const slotIds = slots.map((s: any) => s.id);

    if (slotIds.length > 0) {
      // Get all uploads to retrieve fileKeys for S3 deletion
      const uploads = await db
        .select({ id: documentUploads.id, fileKey: documentUploads.fileKey })
        .from(documentUploads)
        .where(inArray(documentUploads.slotId, slotIds));

      // Delete actual S3 objects first
      for (const upload of uploads) {
        const deleted = await storageDelete(upload.fileKey);
        if (!deleted) {
          console.warn(`[GDPR Erasure] Failed to delete S3 object: ${upload.fileKey} (case #${c.id})`);
        }
      }

      // Then remove DB rows
      const [uploadResult] = await db
        .delete(documentUploads)
        .where(inArray(documentUploads.slotId, slotIds));
      stats.documentsDeleted += (uploadResult as any)?.affectedRows || 0;
    }

    // Delete document slots
    await db.delete(documentSlots).where(eq(documentSlots.caseId, c.id));
    stats.slotsDeleted += slotIds.length;

    // Delete portal messages
    const [msgResult] = await db
      .delete(portalMessages)
      .where(eq(portalMessages.caseId, c.id));
    stats.messagesDeleted += (msgResult as any)?.affectedRows || 0;

    // Anonymize case
    await db
      .update(cases)
      .set({
        clientName: "[ERASED]",
        clientEmail: "[ERASED]",
        clientPhone: "[ERASED]",
        nationality: "[ERASED]",
        notes: "Data erased per GDPR Article 17 request.",
        updatedAt: new Date(),
      })
      .where(eq(cases.id, c.id));
    stats.casesAnonymized++;
  }

  // Revoke all consents
  await db
    .update(consentRecords)
    .set({ granted: 0, revokedAt: new Date() })
    .where(and(eq(consentRecords.userId, userId), eq(consentRecords.granted, 1)));
  stats.consentsRevoked++;

  return stats;
}
