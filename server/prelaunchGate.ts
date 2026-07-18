import { parse as parseCookieHeader } from "cookie";

/**
 * Pre-launch waitlist gate — decision logic.
 *
 * The gate is shown to the public on /order INSTEAD of the checkout while we
 * are pre-launch (Stripe still in test mode), but is bypassed for the team via
 * a secret cookie so we can walk the full post-purchase funnel end to end.
 *
 * This flag is fully INDEPENDENT of STRIPE_TEST_MODE. It is read at request
 * time (see resolveGateDecisionFromEnv) so toggling the env var on the host
 * changes behaviour without a redeploy.
 */

/** Name of the httpOnly cookie that bypasses the gate. */
export const PREVIEW_COOKIE_NAME = "spf_preview";
/** Value the bypass cookie must hold to be considered active. */
export const PREVIEW_COOKIE_VALUE = "1";

export type GateDecision = { showGate: boolean };

/**
 * Pure decision function — no env, no I/O — so it can be unit-tested directly.
 *
 * - Gate disabled            → never show the gate (behaves exactly as today).
 * - Gate enabled, no bypass  → show the gate to the public.
 * - Gate enabled, has bypass → hide the gate (team sees the real checkout).
 */
export function resolveGateDecision(opts: {
  prelaunchEnabled: boolean;
  cookieHeader: string | undefined;
}): GateDecision {
  if (!opts.prelaunchEnabled) {
    return { showGate: false };
  }
  const hasBypass = hasPreviewCookie(opts.cookieHeader);
  return { showGate: !hasBypass };
}

/** True when the request carries a valid preview-bypass cookie. */
export function hasPreviewCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[PREVIEW_COOKIE_NAME] === PREVIEW_COOKIE_VALUE;
}

/**
 * Read the flag from the environment at call time (request-time, not build-time)
 * and resolve the decision. Deliberately NOT coupled to STRIPE_TEST_MODE.
 */
export function resolveGateDecisionFromEnv(
  cookieHeader: string | undefined
): GateDecision {
  const prelaunchEnabled = process.env.PRELAUNCH_GATE_ENABLED === "true";
  return resolveGateDecision({ prelaunchEnabled, cookieHeader });
}
