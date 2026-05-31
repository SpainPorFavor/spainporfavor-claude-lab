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
