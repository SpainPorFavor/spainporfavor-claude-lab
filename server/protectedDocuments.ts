/**
 * Protected Document Access — Auth-checked document download route.
 * 
 * Documents in the portal are sensitive (passports, criminal records, etc.)
 * This route verifies:
 * 1. User is authenticated
 * 2. User has access to the document (owns the case, is the assigned gestor, or is admin/super_admin)
 *    — checks both primary role AND effective roles from user_roles table
 * 
 * Usage: /api/documents/:uploadId
 * Returns: 307 redirect to signed S3 URL (same as storage proxy but with auth)
 */

import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { documentUploads, documentSlots, cases, userRoles, auditLog } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export function registerProtectedDocumentRoutes(app: Express) {
  app.get("/api/documents/:uploadId", async (req: Request, res: Response) => {
    try {
      // 1. Authenticate the user
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const uploadId = parseInt(req.params.uploadId, 10);
      if (isNaN(uploadId)) {
        res.status(400).json({ error: "Invalid upload ID" });
        return;
      }

      // 2. Get the upload record
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }

      const [upload] = await db
        .select()
        .from(documentUploads)
        .where(eq(documentUploads.id, uploadId))
        .limit(1);

      if (!upload) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      // 3. Get the slot and case to verify ownership
      const [slot] = await db
        .select()
        .from(documentSlots)
        .where(eq(documentSlots.id, upload.slotId))
        .limit(1);

      if (!slot) {
        res.status(404).json({ error: "Document slot not found" });
        return;
      }

      const [caseData] = await db
        .select()
        .from(cases)
        .where(eq(cases.id, slot.caseId))
        .limit(1);

      if (!caseData) {
        res.status(404).json({ error: "Case not found" });
        return;
      }

      // 4. Check access permissions — primary role + effective roles
      const isOwner = caseData.userId === user.id;
      const isAssignedGestor = caseData.gestorId === user.id;
      const hasAdminPrimaryRole = ADMIN_ROLES.has(user.role);

      let hasAdminEffectiveRole = false;
      if (!isOwner && !isAssignedGestor && !hasAdminPrimaryRole) {
        // Check user_roles table for effective admin/gestor/super_admin role
        const effectiveRoles = await db
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, user.id));
        
        const roleSet = new Set(effectiveRoles.map(r => r.role));
        hasAdminEffectiveRole = roleSet.has("admin") || roleSet.has("super_admin");
      }

      if (!isOwner && !isAssignedGestor && !hasAdminPrimaryRole && !hasAdminEffectiveRole) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      // 5. Log the access
      await db.insert(auditLog).values({
        userId: user.id,
        action: "document_download",
        resourceType: "document_upload",
        resourceId: uploadId,
        metadata: { caseId: caseData.id, fileName: upload.fileName },
      });

      // 6. Proxy to S3 via Forge
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", upload.fileKey);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        res.status(502).json({ error: "Storage backend error" });
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).json({ error: "Empty signed URL" });
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[ProtectedDocuments] Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
