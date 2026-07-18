import { describe, it, expect } from "vitest";
import {
  resolveGateDecision,
  resolveGateDecisionFromEnv,
  hasPreviewCookie,
  PREVIEW_COOKIE_NAME,
  PREVIEW_COOKIE_VALUE,
} from "./prelaunchGate";

const BYPASS_COOKIE = `${PREVIEW_COOKIE_NAME}=${PREVIEW_COOKIE_VALUE}`;

describe("Pre-launch waitlist gate decision", () => {
  // These three cases protect the launch: they lock the behaviour of the
  // /order page under every combination of flag + bypass cookie.

  it("(a) flag OFF → normal checkout, gate never shows", () => {
    expect(
      resolveGateDecision({ prelaunchEnabled: false, cookieHeader: undefined })
    ).toEqual({ showGate: false });
    // Even a stray bypass cookie cannot turn the gate on when the flag is off.
    expect(
      resolveGateDecision({ prelaunchEnabled: false, cookieHeader: BYPASS_COOKIE })
    ).toEqual({ showGate: false });
  });

  it("(b) flag ON + no bypass cookie → gate shows", () => {
    expect(
      resolveGateDecision({ prelaunchEnabled: true, cookieHeader: undefined })
    ).toEqual({ showGate: true });
    expect(
      resolveGateDecision({ prelaunchEnabled: true, cookieHeader: "other=1; foo=bar" })
    ).toEqual({ showGate: true });
  });

  it("(c) flag ON + bypass cookie → normal checkout shows", () => {
    expect(
      resolveGateDecision({ prelaunchEnabled: true, cookieHeader: BYPASS_COOKIE })
    ).toEqual({ showGate: false });
    // Bypass cookie alongside other cookies is still honoured.
    expect(
      resolveGateDecision({
        prelaunchEnabled: true,
        cookieHeader: `session=abc; ${BYPASS_COOKIE}; theme=dark`,
      })
    ).toEqual({ showGate: false });
  });

  it("only the exact bypass value counts", () => {
    expect(hasPreviewCookie(`${PREVIEW_COOKIE_NAME}=0`)).toBe(false);
    expect(hasPreviewCookie(`${PREVIEW_COOKIE_NAME}=true`)).toBe(false);
    expect(hasPreviewCookie(`${PREVIEW_COOKIE_NAME}=`)).toBe(false);
    expect(hasPreviewCookie(undefined)).toBe(false);
    expect(hasPreviewCookie(BYPASS_COOKIE)).toBe(true);
  });
});

describe("resolveGateDecisionFromEnv reads the flag at request time", () => {
  const original = process.env.PRELAUNCH_GATE_ENABLED;

  it("flag absent → gate off", () => {
    delete process.env.PRELAUNCH_GATE_ENABLED;
    try {
      expect(resolveGateDecisionFromEnv(undefined)).toEqual({ showGate: false });
    } finally {
      restore();
    }
  });

  it("flag 'true' + no cookie → gate on", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "true";
    try {
      expect(resolveGateDecisionFromEnv(undefined)).toEqual({ showGate: true });
    } finally {
      restore();
    }
  });

  it("flag 'true' + bypass cookie → gate off", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "true";
    try {
      expect(resolveGateDecisionFromEnv(BYPASS_COOKIE)).toEqual({ showGate: false });
    } finally {
      restore();
    }
  });

  it("any value other than 'true' → gate off (not coupled to truthiness)", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "1";
    try {
      expect(resolveGateDecisionFromEnv(undefined)).toEqual({ showGate: false });
    } finally {
      restore();
    }
  });

  function restore() {
    if (original === undefined) delete process.env.PRELAUNCH_GATE_ENABLED;
    else process.env.PRELAUNCH_GATE_ENABLED = original;
  }
});
