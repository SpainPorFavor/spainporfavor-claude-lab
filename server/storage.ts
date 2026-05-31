// Preconfigured storage helpers for Manus WebDev templates
// Uploads via Forge Server presigned URL to S3 (PUT direct).
// Downloads return /manus-storage/{key} paths served via 307 redirect.

import { ENV } from "./_core/env";
import { randomUUID } from "node:crypto";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  // Use full UUID for stronger entropy (fixes Medium G: key randomness)
  const hash = randomUUID().replace(/-/g, "");
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));

  // 1. Get presigned PUT URL from Forge
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  // 2. PUT file directly to S3
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

/**
 * Delete a file from S3 storage.
 * Returns true if deletion succeeded, false if it failed (logged but not thrown).
 */
export async function storageDelete(relKey: string): Promise<boolean> {
  try {
    const { forgeUrl, forgeKey } = getForgeConfig();
    const key = normalizeKey(relKey);

    const deleteUrl = new URL("v1/storage/presign/delete", forgeUrl + "/");
    deleteUrl.searchParams.set("path", key);

    const presignResp = await fetch(deleteUrl, {
      headers: { Authorization: `Bearer ${forgeKey}` },
    });

    if (!presignResp.ok) {
      // If presign/delete endpoint doesn't exist, fall back to direct DELETE via presigned GET URL
      // Some Forge versions may not have a delete presign — try direct S3 delete
      console.warn(`[StorageDelete] Presign delete returned ${presignResp.status} for key: ${key}`);
      
      // Alternative: get a presigned URL and issue DELETE
      const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
      getUrl.searchParams.set("path", key);
      const getResp = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${forgeKey}` },
      });
      if (!getResp.ok) {
        console.error(`[StorageDelete] Cannot get presign URL for deletion: ${key}`);
        return false;
      }
      const { url: s3Url } = (await getResp.json()) as { url: string };
      // Issue DELETE to S3 directly
      const deleteResp = await fetch(s3Url, { method: "DELETE" });
      if (!deleteResp.ok && deleteResp.status !== 204 && deleteResp.status !== 404) {
        console.error(`[StorageDelete] S3 DELETE failed (${deleteResp.status}) for key: ${key}`);
        return false;
      }
      return true;
    }

    const { url: deleteS3Url } = (await presignResp.json()) as { url: string };
    if (deleteS3Url) {
      const deleteResp = await fetch(deleteS3Url, { method: "DELETE" });
      if (!deleteResp.ok && deleteResp.status !== 204 && deleteResp.status !== 404) {
        console.error(`[StorageDelete] S3 DELETE failed (${deleteResp.status}) for key: ${key}`);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error(`[StorageDelete] Error deleting key ${relKey}:`, err);
    return false;
  }
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}
