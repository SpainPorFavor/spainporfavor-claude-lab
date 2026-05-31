import { describe, it, expect } from "vitest";

describe("Stripe Test Mode Toggle", () => {
  it("STRIPE_TEST_MODE env var is set to 'true'", () => {
    expect(process.env.STRIPE_TEST_MODE).toBe("true");
  });

  it("VITE_STRIPE_TEST_MODE env var is set to 'true'", () => {
    expect(process.env.VITE_STRIPE_TEST_MODE).toBe("true");
  });

  it("test mode uses test secret key starting with sk_test_", () => {
    const isTestMode = process.env.STRIPE_TEST_MODE === "true";
    const STRIPE_TEST_SK = "STRIPE_SECRET_KEY_PLACEHOLDER";
    const key = isTestMode ? STRIPE_TEST_SK : process.env.STRIPE_SECRET_KEY;
    expect(key).toBeDefined();
    expect(key!.startsWith("sk_test_")).toBe(true);
  });
});
