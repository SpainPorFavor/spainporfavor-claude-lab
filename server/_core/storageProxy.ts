import type { Express } from "express";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { documentUploads, documentSlots, cases, userRoles, auditLog } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Storage proxy with strict access control for case documents.
 * 
 * - Paths containing "cases/" or "documents/" are case documents (passports, criminal records, etc.)
 *   and REQUIRE authentication + ownership verification (owner, assigned gestor, or admin/super_admin).
 * - All other paths (e.g., static assets, logos) remain publicly accessible.
 */

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // Case documents require authentication + ownership check
    const isCaseDocument = key.includes("cases/") || key.includes("documents/");
    if (isCaseDocument) {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).send("Authentication required to access case documents");
        return;
      }

      // Enforce ownership: resolve the key back to a case and verify access
      const db = await getDb();
      if (!db) {
        res.status(500).send("Database unavailable");
        return;
      }

      // Find the upload record by fileKey
      const [upload] = await db
        .select()
        .from(documentUploads)
        .where(eq(documentUploads.fileKey, key))
        .limit(1);

      if (!upload) {
        res.status(404).send("Document not found");
        return;
      }

      // Get the slot to find the case
      const [slot] = await db
        .select()
        .from(documentSlots)
        .where(eq(documentSlots.id, upload.slotId))
        .limit(1);

      if (!slot) {
        res.status(404).send("Document slot not found");
        return;
      }

      // Get the case to check ownership
      const [caseData] = await db
        .select()
        .from(cases)
        .where(eq(cases.id, slot.caseId))
        .limit(1);

      if (!caseData) {
        res.status(404).send("Case not found");
        return;
      }

      // Check access: owner, assigned gestor, or admin/super_admin (primary or effective role)
      const isOwner = caseData.userId === user.id;
      const isAssignedGestor = caseData.gestorId === user.id;
      const hasAdminPrimaryRole = ADMIN_ROLES.has(user.role);

      let hasAdminEffectiveRole = false;
      if (!isOwner && !isAssignedGestor && !hasAdminPrimaryRole) {
        // Check user_roles table for effective admin/gestor role
        const effectiveRoles = await db
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, user.id));
        
        const roleSet = new Set(effectiveRoles.map(r => r.role));
        hasAdminEffectiveRole = roleSet.has("admin") || roleSet.has("super_admin");
      }

      if (!isOwner && !isAssignedGestor && !hasAdminPrimaryRole && !hasAdminEffectiveRole) {
        res.status(403).send("Access denied — you do not have permission to view this document");
        return;
      }

      // Audit log the access
      try {
        await db.insert(auditLog).values({
          userId: user.id,
          action: "document_download_proxy",
          resourceType: "document_upload",
          resourceId: upload.id,
          metadata: { caseId: caseData.id, fileName: upload.fileName, route: "manus-storage" },
        });
      } catch (err) {
        console.error("[StorageProxy] Audit log failed:", err);
        // Don't block access if audit fails, but log it
      }
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
