export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Boot-time validation of critical environment variables
const CRITICAL_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "VITE_APP_ID",
  "OAUTH_SERVER_URL",
] as const;

const missing = CRITICAL_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `[ENV] FATAL: Missing critical environment variables: ${missing.join(", ")}. Server may not function correctly.`
  );
  if (ENV.isProduction) {
    throw new Error(`Missing critical environment variables: ${missing.join(", ")}`);
  }
}

// Boot-time validation of secure document storage (S3) configuration.
// Required in production because the upload path no longer falls back to legacy
// storage. See docs/document-storage-rules.md and docs/AWS_DOCUMENT_STORAGE_SETUP.md.
const SECURE_STORAGE_VARS = [
  "AWS_S3_DOCUMENT_BUCKET",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
] as const;

const missingSecureStorage = SECURE_STORAGE_VARS.filter((key) => !process.env[key]);
if (missingSecureStorage.length > 0) {
  if (ENV.isProduction) {
    console.error(
      `[ENV] FATAL: Secure document storage not configured. Missing: ${missingSecureStorage.join(", ")}. See docs/AWS_DOCUMENT_STORAGE_SETUP.md.`
    );
    throw new Error(
      `Secure document storage not configured in production. Missing: ${missingSecureStorage.join(", ")}`
    );
  }
  console.warn(
    `[ENV] Secure document storage not configured (missing: ${missingSecureStorage.join(", ")}). Document upload requests will fail with PRECONDITION_FAILED until these are set. See docs/AWS_DOCUMENT_STORAGE_SETUP.md.`
  );
}
