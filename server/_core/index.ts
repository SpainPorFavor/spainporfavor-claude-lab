import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe";
import { registerProtectedDocumentRoutes } from "../protectedDocuments";
import { registerChecklistRoutes } from "../pdfChecklists";
import { registerPreviewAccess } from "../previewAccess";
import { startProactiveOutreach } from "../proactiveOutreach";
import { startRetentionScheduler } from "../dataRetention";
import { startRiskEngineScheduler } from "../riskEngine";
import { startBackupScheduler } from "../databaseBackup";
import { startLeadDripScheduler } from "../leadDripEmails";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers — applied to all responses
  app.use((_req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Control referrer information
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Prevent XSS in older browsers
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Strict Transport Security (1 year, include subdomains)
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    // Content Security Policy
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://manus-analytics.com https://www.googletagmanager.com https://www.google.com https://googleads.g.doubleclick.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://*.cloudfront.net https://*.amazonaws.com https://www.googletagmanager.com https://googleads.g.doubleclick.net https://www.google.com",
        "connect-src 'self' https://api.stripe.com https://*.amazonaws.com https://manus-analytics.com https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.google.com",
        "frame-src https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    );
    // Permissions Policy — restrict browser features
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(self)"
    );
    next();
  });

  // Stripe webhook MUST be registered before body parsers for raw body access
  app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
  registerStripeWebhook(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerProtectedDocumentRoutes(app);
  registerChecklistRoutes(app);
  registerOAuthRoutes(app);
  // Preview-access bypass route — must be registered before the SPA catch-all
  // (Vite/static) so /preview-access is not swallowed by the client router.
  registerPreviewAccess(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start proactive outreach scanner (document expiry, inactivity, deadlines, milestones)
    startProactiveOutreach();
    // Start data retention scheduler (30-day post-resolution cleanup)
    startRetentionScheduler();
    // Start risk engine scheduler (daily batch evaluation of all active cases)
    startRiskEngineScheduler();
    // Start daily database backup scheduler (exports to S3)
    startBackupScheduler();
    // Start lead drip email scheduler (Day 1/3/7 nurture for unconverted leads)
    startLeadDripScheduler();
  });
}

startServer().catch(console.error);
