/**
 * Tests for Secure Document Storage service and router.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AWS SDK before importing the module
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({
      ContentLength: 1024,
      ContentType: "image/jpeg",
    }),
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://s3.eu-south-2.amazonaws.com/bucket/presigned-url"),
}));

describe("secureDocumentStorage", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AWS_REGION = "eu-south-2";
    process.env.AWS_S3_DOCUMENT_BUCKET = "spainporfavor-documents-private";
    process.env.AWS_ACCESS_KEY_ID = "AKIATEST123";
    process.env.AWS_SECRET_ACCESS_KEY = "testsecret123";
    process.env.AWS_KMS_KEY_ID = "arn:aws:kms:eu-south-2:123456789:key/test-key";
  });

  describe("isSecureStorageConfigured", () => {
    it("returns true when all required env vars are set", async () => {
      const { isSecureStorageConfigured } = await import("./secureDocumentStorage");
      expect(isSecureStorageConfigured()).toBe(true);
    });

    it("returns false when bucket is missing", async () => {
      delete process.env.AWS_S3_DOCUMENT_BUCKET;
      const { isSecureStorageConfigured } = await import("./secureDocumentStorage");
      expect(isSecureStorageConfigured()).toBe(false);
    });

    it("returns false when access key is missing", async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      const { isSecureStorageConfigured } = await import("./secureDocumentStorage");
      expect(isSecureStorageConfigured()).toBe(false);
    });
  });

  describe("generateDocumentKey", () => {
    it("generates a key with correct structure", async () => {
      const { generateDocumentKey } = await import("./secureDocumentStorage");
      const key = generateDocumentKey({
        caseId: 30001,
        documentType: "passport",
        documentSide: "single",
        mimeType: "image/jpeg",
      });

      expect(key).toMatch(/^cases\/30001\/documents\/passport\/[a-f0-9-]+\.jpg$/);
    });

    it("includes side suffix for front/back", async () => {
      const { generateDocumentKey } = await import("./secureDocumentStorage");
      const key = generateDocumentKey({
        caseId: 30001,
        documentType: "eu_national_id",
        documentSide: "front",
        mimeType: "image/png",
      });

      expect(key).toMatch(/^cases\/30001\/documents\/eu_national_id\/[a-f0-9-]+-front\.png$/);
    });

    it("handles PDF mime type", async () => {
      const { generateDocumentKey } = await import("./secureDocumentStorage");
      const key = generateDocumentKey({
        caseId: 30002,
        documentType: "criminal_record",
        documentSide: "single",
        mimeType: "application/pdf",
      });

      expect(key).toMatch(/^cases\/30002\/documents\/criminal_record\/[a-f0-9-]+\.pdf$/);
    });

    it("generates unique keys for same params", async () => {
      const { generateDocumentKey } = await import("./secureDocumentStorage");
      const params = {
        caseId: 30001,
        documentType: "passport",
        documentSide: "single",
        mimeType: "image/jpeg",
      };
      const key1 = generateDocumentKey(params);
      const key2 = generateDocumentKey(params);
      expect(key1).not.toBe(key2);
    });
  });

  describe("isAllowedMimeType", () => {
    it("allows PDF", async () => {
      const { isAllowedMimeType } = await import("./secureDocumentStorage");
      expect(isAllowedMimeType("application/pdf")).toBe(true);
    });

    it("allows JPEG", async () => {
      const { isAllowedMimeType } = await import("./secureDocumentStorage");
      expect(isAllowedMimeType("image/jpeg")).toBe(true);
    });

    it("allows PNG", async () => {
      const { isAllowedMimeType } = await import("./secureDocumentStorage");
      expect(isAllowedMimeType("image/png")).toBe(true);
    });

    it("allows WebP", async () => {
      const { isAllowedMimeType } = await import("./secureDocumentStorage");
      expect(isAllowedMimeType("image/webp")).toBe(true);
    });

    it("rejects HEIC", async () => {
      const { isAllowedMimeType } = await import("./secureDocumentStorage");
      expect(isAllowedMimeType("image/heic")).toBe(false);
    });

    it("rejects arbitrary types", async () => {
      const { isAllowedMimeType } = await import("./secureDocumentStorage");
      expect(isAllowedMimeType("application/zip")).toBe(false);
      expect(isAllowedMimeType("text/html")).toBe(false);
    });
  });

  describe("generatePresignedUploadUrl", () => {
    it("returns a presigned URL with expected fields", async () => {
      const { generatePresignedUploadUrl } = await import("./secureDocumentStorage");
      const result = await generatePresignedUploadUrl({
        storageKey: "cases/30001/documents/passport/test-uuid.jpg",
        contentType: "image/jpeg",
      });

      expect(result.uploadUrl).toContain("https://");
      expect(result.bucket).toBe("spainporfavor-documents-private");
      expect(result.key).toBe("cases/30001/documents/passport/test-uuid.jpg");
      expect(result.expiresInSeconds).toBe(600);
    });
  });

  describe("generatePresignedDownloadUrl", () => {
    it("returns a presigned download URL", async () => {
      const { generatePresignedDownloadUrl } = await import("./secureDocumentStorage");
      const result = await generatePresignedDownloadUrl({
        storageKey: "cases/30001/documents/passport/test-uuid.jpg",
        originalFileName: "my-passport.jpg",
      });

      expect(result.downloadUrl).toContain("https://");
      expect(result.expiresInSeconds).toBe(300);
    });
  });

  describe("MAX_DOCUMENT_FILE_SIZE", () => {
    it("is 20MB", async () => {
      const { MAX_DOCUMENT_FILE_SIZE } = await import("./secureDocumentStorage");
      expect(MAX_DOCUMENT_FILE_SIZE).toBe(20 * 1024 * 1024);
    });
  });
});
