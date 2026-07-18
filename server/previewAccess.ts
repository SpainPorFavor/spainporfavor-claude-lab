import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";
import { PREVIEW_COOKIE_NAME, PREVIEW_COOKIE_VALUE } from "./prelaunchGate";

/**
 * /preview-access — the ONLY route that carries the preview secret.
 *
 *   /preview-access?key=SECRET          → sets the httpOnly bypass cookie, redirects to /
 *   /preview-access?key=SECRET&clear=1  → clears the bypass cookie, redirects to /
 *
 * The bypass cookie (spf_preview) lets the team skip the pre-launch waitlist
 * gate and reach the real checkout + full post-purchase funnel. It is httpOnly,
 * so client JS never reads it — the gate decision is computed server-side.
 *
 * Security posture:
 *  - If PREVIEW_ACCESS_KEY is unset/empty, the route ALWAYS 404s (no empty-key
 *    bypass is ever possible).
 *  - A missing or wrong key returns a plain 404, so the route does not reveal
 *    its own existence or act as an oracle.
 *  - The secret only ever appears on this one route, never in any other URL.
 */

// ~180 days — long enough to survive a full pre-launch testing window.
const PREVIEW_COOKIE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

function safeEqual(a: string, b: string): boolean {
  // Length-independent constant-time-ish compare. The secret is high-entropy,
  // so this is belt-and-braces rather than strictly necessary.
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function registerPreviewAccess(app: Express): void {
  app.get("/preview-access", (req: Request, res: Response) => {
    const expected = process.env.PREVIEW_ACCESS_KEY;

    // No key configured → the bypass is disabled entirely.
    if (!expected) {
      return res.status(404).type("text/plain").send("Not found");
    }

    const provided = typeof req.query.key === "string" ? req.query.key : "";
    if (!provided || !safeEqual(provided, expected)) {
      return res.status(404).type("text/plain").send("Not found");
    }

    const cookieOptions = getSessionCookieOptions(req);
    const clearing = req.query.clear === "1" || req.query.clear === "true";

    if (clearing) {
      // Clear with the same attributes used to set it, so the browser matches it.
      res.clearCookie(PREVIEW_COOKIE_NAME, cookieOptions);
    } else {
      res.cookie(PREVIEW_COOKIE_NAME, PREVIEW_COOKIE_VALUE, {
        ...cookieOptions,
        maxAge: PREVIEW_COOKIE_MAX_AGE_MS,
      });
    }

    // Redirect to home (no secret in the destination URL). The tester then
    // walks the funnel normally; the cookie bypasses the gate at /order.
    return res.redirect(302, "/");
  });
}
