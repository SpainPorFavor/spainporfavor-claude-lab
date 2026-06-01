/**
 * Content-level guard: the funnel surface must not ship any forbidden
 * claim defined in docs/compliance-rules.md. This is a grep-style test
 * over the source files of the user-facing funnel pages and the chat
 * advisor prompts. If you intentionally need a phrase that overlaps with
 * one of these, update docs/compliance-rules.md and explain in the PR.
 *
 * Introduced in PR-4 alongside the trust-and-compliance copy cleanup.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "../../..");

const SURFACES = [
  "client/src/pages/Home.tsx",
  "client/src/pages/About.tsx",
  "client/src/pages/OrderForm.tsx",
  "client/src/pages/ApplicationSuccess.tsx",
  "client/src/components/AssessmentChat.tsx",
  "server/routers.ts",
  "server/leadDripEmails.ts",
];

function read(p: string): string {
  return readFileSync(resolve(REPO, p), "utf8");
}

describe("forbidden-claim sweep across funnel surfaces", () => {
  describe("approval-rate numbers — unsupported", () => {
    const FORBIDDEN_PERCENTAGES = [
      "98.7%",
      "97% Industry",
      "95-97% first-time",
      "97% Industry Approval Rate",
      "near-perfect success",
    ];

    for (const surface of SURFACES) {
      it(`${surface} contains none of the forbidden approval-rate phrases`, () => {
        const src = read(surface);
        for (const phrase of FORBIDDEN_PERCENTAGES) {
          expect(
            src,
            `forbidden phrase "${phrase}" still present in ${surface}`
          ).not.toContain(phrase);
        }
      });
    }
  });

  describe("guaranteed-approval language — unsupported", () => {
    const FORBIDDEN_PHRASES = [
      "Guaranteed approval",
      "guaranteed approval",
      "Approved or your money back",
      "we don't stop until you're approved",
      "We don't stop until you're approved",
      "We don't stop until you are approved",
    ];

    for (const surface of SURFACES) {
      it(`${surface} contains no guaranteed-approval phrasing`, () => {
        const src = read(surface);
        for (const phrase of FORBIDDEN_PHRASES) {
          expect(
            src,
            `forbidden phrase "${phrase}" still present in ${surface}`
          ).not.toContain(phrase);
        }
      });
    }
  });

  describe("overbroad security claims — unsupported", () => {
    // GDPR/SSL/etc. still appear inside legal pages (PrivacyPolicy.tsx,
    // CookiePolicy.tsx, GDPRCompliance.tsx) and inside the App.tsx route
    // table — those are legal copy, not marketing badges. The sweep
    // intentionally only covers marketing surfaces.
    const FORBIDDEN_SECURITY_CLAIMS = [
      "bank-grade",
      "Bank-grade",
      "military-grade",
      "Military-grade",
      "zero-retention AI",
      "AI OCR",
      "data never leaves the EU",
      "256-bit SSL Encrypted",
    ];

    for (const surface of SURFACES) {
      it(`${surface} contains no overbroad security claim`, () => {
        const src = read(surface);
        for (const phrase of FORBIDDEN_SECURITY_CLAIMS) {
          expect(
            src,
            `forbidden phrase "${phrase}" still present in ${surface}`
          ).not.toContain(phrase);
        }
      });
    }
  });

  describe("fake actions — no longer present", () => {
    it("ApplicationSuccess.tsx no longer shows the fake 'Portal link has been resent' alert", () => {
      const src = read("client/src/pages/ApplicationSuccess.tsx");
      expect(src).not.toContain("Portal link has been resent");
      // The honest replacement should be present.
      expect(src).toMatch(/Need a portal link or receipt\? Contact support/);
    });

    it("ApplicationSuccess.tsx no longer pretends a mailto is a receipt download", () => {
      const src = read("client/src/pages/ApplicationSuccess.tsx");
      expect(src).not.toContain("Download receipt");
      expect(src).not.toContain("Receipt request - ");
    });

    it("OrderForm.tsx no longer shows the fake promo-code apply button", () => {
      const src = read("client/src/pages/OrderForm.tsx");
      expect(src).not.toContain("Promo codes are applied at Stripe level");
      expect(src).not.toMatch(/value=\{promoCode\}/);
      expect(src).toMatch(/Have a promo code\? Contact support before payment/);
    });

    it("ApplicationSuccess.tsx no longer shows a non-persisted WhatsApp/SMS consent checkbox", () => {
      const src = read("client/src/pages/ApplicationSuccess.tsx");
      // The old `setWhatsappOptIn` state and the old non-persisted handler
      // are gone. The placeholder disabled checkbox communicates the
      // feature isn't available yet.
      expect(src).not.toContain("setWhatsappOptIn");
      expect(src).not.toContain("sms_whatsapp_optin_checked");
      expect(src).toMatch(/SMS or WhatsApp reminders are not available yet/);
    });
  });

  describe("resubmission language softened", () => {
    // The marketing surfaces should no longer say "Free resubmission
    // guarantee" without qualification, and should never say "we don't
    // stop until you're approved".
    for (const surface of [
      "client/src/pages/Home.tsx",
      "client/src/pages/OrderForm.tsx",
      "client/src/pages/About.tsx",
      "client/src/components/AssessmentChat.tsx",
      "server/routers.ts",
      "server/leadDripEmails.ts",
    ]) {
      it(`${surface} qualifies resubmission language`, () => {
        const src = read(surface);
        // The phrase "Free resubmission guarantee" without further
        // qualification is forbidden. The presence test below allows the
        // exact softer phrasings.
        expect(src).not.toContain("Free resubmission guarantee");
        expect(src).not.toContain("Free Resubmission Guarantee");
      });
    }
  });
});
