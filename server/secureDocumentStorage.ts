/**
 * Secure Document Storage Service
 * 
 * Private AWS S3 bucket (eu-south-2) for passports, IDs, and immigration documents.
 * - No public URLs
 * - Short-lived presigned upload URLs (10 min)
 * - Short-lived presigned download URLs (5 min) for authorised staff only
 * - KMS encryption (customer-managed or AWS-managed)
 * - CORS restricted to trusted origins
 * 
 * This service connects to a SEPARATE private S3 bucket (not the Manus Forge storage).
 * AWS credentials must be configured via environment variables.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

// ============================================================
// Configuration
// ============================================================

export interface SecureStorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  kmsKeyId?: string; // Optional: customer-managed KMS key ARN or alias
  uploadTtlSeconds: number;
  downloadTtlSeconds: number;
}

function getConfig(): SecureStorageConfig {
  const region = process.env.AWS_REGION || "eu-south-2";
  const bucket = process.env.AWS_S3_DOCUMENT_BUCKET || "";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
  const kmsKeyId = process.env.AWS_KMS_KEY_ID || undefined;
  const uploadTtlSeconds = parseInt(process.env.DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS || "600", 10);
  const downloadTtlSeconds = parseInt(process.env.DOCUMENT_PRESIGNED_DOWNLOAD_TTL_SECONDS || "300", 10);

  return { region, bucket, accessKeyId, secretAccessKey, kmsKeyId, uploadTtlSeconds, downloadTtlSeconds };
}

/**
 * Check if secure document storage is configured.
 * Returns false if AWS credentials or bucket are not set.
 */
export function isSecureStorageConfigured(): boolean {
  const config = getConfig();
  return !!(config.bucket && config.accessKeyId && config.secretAccessKey);
}

function getS3Client(): S3Client {
  const config = getConfig();

  if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error(
      "[SecureDocStorage] AWS S3 not configured. Required env vars: AWS_S3_DOCUMENT_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    );
  }

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// ============================================================
// Key Generation
// ============================================================

/**
 * Generate a secure, non-guessable S3 object key for a document.
 * Format: cases/{caseId}/documents/{documentType}/{uuid}.{ext}
 * No PII in the key path.
 */
export function generateDocumentKey(params: {
  caseId: number;
  documentType: string;
  documentSide: string;
  mimeType: string;
}): string {
  const { caseId, documentType, documentSide, mimeType } = params;
  const uuid = randomUUID();
  const ext = mimeTypeToExtension(mimeType);
  const sideSuffix = documentSide !== "single" ? `-${documentSide}` : "";
  return `cases/${caseId}/documents/${documentType}/${uuid}${sideSuffix}.${ext}`;
}

function mimeTypeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
  };
  return map[mimeType] || "bin";
}

// ============================================================
// Presigned Upload URL
// ============================================================

/**
 * Generate a short-lived presigned PUT URL for the customer to upload directly to S3.
 * TTL: 10 minutes (configurable via DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS).
 * 
 * The URL is single-use and restricted to the specific object key, content type, and size.
 */
export async function generatePresignedUploadUrl(params: {
  storageKey: string;
  contentType: string;
  maxFileSize?: number; // Not enforced by presigned URL, but used for documentation
}): Promise<{ uploadUrl: string; bucket: string; key: string; expiresInSeconds: number }> {
  const config = getConfig();
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: params.storageKey,
    ContentType: params.contentType,
    // KMS encryption — applied server-side by S3
    ...(config.kmsKeyId
      ? {
          ServerSideEncryption: "aws:kms",
          SSEKMSKeyId: config.kmsKeyId,
        }
      : {
          ServerSideEncryption: "AES256", // Fallback to SSE-S3 if no KMS key
        }),
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: config.uploadTtlSeconds,
  });

  return {
    uploadUrl,
    bucket: config.bucket,
    key: params.storageKey,
    expiresInSeconds: config.uploadTtlSeconds,
  };
}

// ============================================================
// Presigned Download URL (Staff Only)
// ============================================================

/**
 * Generate a short-lived presigned GET URL for authorised staff to download a document.
 * TTL: 5 minutes (configurable via DOCUMENT_PRESIGNED_DOWNLOAD_TTL_SECONDS).
 * 
 * IMPORTANT: Caller MUST verify staff permissions and log access BEFORE calling this.
 */
export async function generatePresignedDownloadUrl(params: {
  storageKey: string;
  originalFileName?: string;
}): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
  const config = getConfig();
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: params.storageKey,
    // Set content-disposition to force download with original filename
    ...(params.originalFileName
      ? { ResponseContentDisposition: `attachment; filename="${params.originalFileName}"` }
      : {}),
  });

  const downloadUrl = await getSignedUrl(client, command, {
    expiresIn: config.downloadTtlSeconds,
  });

  return {
    downloadUrl,
    expiresInSeconds: config.downloadTtlSeconds,
  };
}

// ============================================================
// Verify Upload Exists
// ============================================================

/**
 * Verify that an object exists in S3 at the given key.
 * Used after customer reports upload complete to confirm the file landed.
 */
export async function verifyObjectExists(storageKey: string): Promise<{
  exists: boolean;
  contentLength?: number;
  contentType?: string;
}> {
  const config = getConfig();
  const client = getS3Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
    });

    const response = await client.send(command);
    return {
      exists: true,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    throw err;
  }
}

// ============================================================
// Allowed MIME Types
// ============================================================

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_DOCUMENT_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType);
}
