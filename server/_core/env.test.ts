/**
 * Tests for the boot-time environment validation in server/_core/env.ts.
 *
 * The module runs its checks at import time, so each test uses `vi.resetModules()`
 * and re-imports after setting the env vars it wants to exercise.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const REQUIRED_CRITICAL = {
  DATABASE_URL: "mysql://test:test@localhost:3306/test",
  JWT_SECRET: "test-jwt-secret-32-chars-minimum-aaaa",
  VITE_APP_ID: "test-app-id",
  OAUTH_SERVER_URL: "https://oauth.test",
} as const;

const REQUIRED_SECURE_STORAGE = {
  AWS_S3_DOCUMENT_BUCKET: "spainporfavor-documents-test",
  AWS_ACCESS_KEY_ID: "AKIATEST123",
  AWS_SECRET_ACCESS_KEY: "testsecret123",
} as const;

function setEnv(vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) {
    process.env[k] = v;
  }
}

function unsetEnv(keys: readonly string[]) {
  for (const k of keys) {
    delete process.env[k];
  }
}

describe("server/_core/env boot-time validation", () => {
  const originalEnv = { ...process.env };
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset env to a clean slate, then set everything required.
    for (const key of Object.keys(process.env)) {
      if (key in REQUIRED_CRITICAL || key in REQUIRED_SECURE_STORAGE || key === "NODE_ENV") {
        delete process.env[key];
      }
    }
    setEnv(REQUIRED_CRITICAL);
    setEnv(REQUIRED_SECURE_STORAGE);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  describe("secure document storage check", () => {
    it("does not throw or warn when all AWS vars are set (development)", async () => {
      process.env.NODE_ENV = "development";
      await expect(import("./env")).resolves.toBeDefined();
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Secure document storage not configured")
      );
    });

    it("warns but does not throw in development when AWS bucket is missing", async () => {
      process.env.NODE_ENV = "development";
      unsetEnv(["AWS_S3_DOCUMENT_BUCKET"]);
      await expect(import("./env")).resolves.toBeDefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("AWS_S3_DOCUMENT_BUCKET")
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("PRECONDITION_FAILED")
      );
    });

    it("throws in production when AWS bucket is missing", async () => {
      process.env.NODE_ENV = "production";
      unsetEnv(["AWS_S3_DOCUMENT_BUCKET"]);
      await expect(import("./env")).rejects.toThrow(
        /Secure document storage not configured in production/
      );
    });

    it("throws in production when AWS access key id is missing", async () => {
      process.env.NODE_ENV = "production";
      unsetEnv(["AWS_ACCESS_KEY_ID"]);
      await expect(import("./env")).rejects.toThrow(/AWS_ACCESS_KEY_ID/);
    });

    it("throws in production when AWS secret access key is missing", async () => {
      process.env.NODE_ENV = "production";
      unsetEnv(["AWS_SECRET_ACCESS_KEY"]);
      await expect(import("./env")).rejects.toThrow(/AWS_SECRET_ACCESS_KEY/);
    });

    it("lists every missing AWS var in the production error message", async () => {
      process.env.NODE_ENV = "production";
      unsetEnv(["AWS_S3_DOCUMENT_BUCKET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]);
      await expect(import("./env")).rejects.toThrow(
        /AWS_S3_DOCUMENT_BUCKET.*AWS_ACCESS_KEY_ID.*AWS_SECRET_ACCESS_KEY/
      );
    });
  });

  describe("critical-vars check (unchanged behavior)", () => {
    it("still throws in production when DATABASE_URL is missing", async () => {
      process.env.NODE_ENV = "production";
      unsetEnv(["DATABASE_URL"]);
      await expect(import("./env")).rejects.toThrow(/DATABASE_URL/);
    });

    it("still tolerates missing critical vars in development (logs only)", async () => {
      process.env.NODE_ENV = "development";
      unsetEnv(["DATABASE_URL"]);
      await expect(import("./env")).resolves.toBeDefined();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("DATABASE_URL")
      );
    });
  });
});
