import { describe, it, expect } from "vitest";

/**
 * Validates the RESEND_API_KEY by calling the Resend API domains endpoint.
 * This is a lightweight read-only call that confirms the key is valid.
 */
describe("Resend API Key Validation", () => {
  it("should have a valid Resend API key format", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(0);
    // Resend keys start with 're_'
    expect(apiKey!.startsWith("re_")).toBe(true);
  });

  it("should be able to call the Resend send endpoint (restricted key)", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    // The key is restricted to sending only — verify by checking that
    // the domains endpoint returns 'restricted_api_key' (not 'invalid_api_key')
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();
    // A restricted key returns 401 with name 'restricted_api_key'
    // An invalid key returns 401 with name 'missing_api_key' or different error
    // This confirms the key IS valid but just restricted to sending
    expect(data.name).toBe("restricted_api_key");
    expect(data.message).toContain("send emails");
  });
});
