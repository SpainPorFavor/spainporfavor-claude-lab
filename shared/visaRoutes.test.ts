/**
 * Tests for the canonical visa route resolver.
 *
 * The resolver is intentionally strict: only the 5 known paid product slugs
 * resolve to themselves, everything else resolves to "unknown". There are
 * NO heuristics — display names, partial matches, and abbreviations all
 * resolve to "unknown" and the caller is responsible for explicit mapping.
 */
import { describe, it, expect } from "vitest";
import {
  PAID_VISA_PRODUCTS,
  VISA_ROUTES,
  isPaidVisaProduct,
  resolveVisaRoute,
  routeGroupOf,
  resolveRouteGroup,
  ROUTE_METADATA,
  getRouteMetadata,
  type VisaRoute,
} from "./visaRoutes";

describe("PAID_VISA_PRODUCTS / VISA_ROUTES", () => {
  it("contains exactly the 5 canonical paid products", () => {
    expect(PAID_VISA_PRODUCTS).toEqual([
      "eu-registration",
      "digital-nomad-visa",
      "non-lucrative-visa",
      "student-visa",
      "work-visa",
    ]);
  });

  it("VISA_ROUTES extends PAID_VISA_PRODUCTS with generic and unknown", () => {
    expect(VISA_ROUTES).toEqual([
      "eu-registration",
      "digital-nomad-visa",
      "non-lucrative-visa",
      "student-visa",
      "work-visa",
      "generic",
      "unknown",
    ]);
  });
});

describe("isPaidVisaProduct", () => {
  it("accepts each of the 5 paid product slugs", () => {
    for (const slug of PAID_VISA_PRODUCTS) {
      expect(isPaidVisaProduct(slug)).toBe(true);
    }
  });

  it("rejects generic and unknown", () => {
    expect(isPaidVisaProduct("generic")).toBe(false);
    expect(isPaidVisaProduct("unknown")).toBe(false);
  });

  it("rejects display names and partial matches", () => {
    // The pre-PR-2 matchers used `includes("nomad") || includes("dnv")` —
    // these tests pin that heuristics are gone for good.
    expect(isPaidVisaProduct("Digital Nomad Visa (DNV)")).toBe(false);
    expect(isPaidVisaProduct("EU Registration Certificate")).toBe(false);
    expect(isPaidVisaProduct("dnv")).toBe(false);
    expect(isPaidVisaProduct("nomad")).toBe(false);
    expect(isPaidVisaProduct("eu")).toBe(false);
    expect(isPaidVisaProduct("certificado-registro")).toBe(false);
  });

  it("rejects empty and non-string input", () => {
    expect(isPaidVisaProduct("")).toBe(false);
    expect(isPaidVisaProduct(null)).toBe(false);
    expect(isPaidVisaProduct(undefined)).toBe(false);
    expect(isPaidVisaProduct(123)).toBe(false);
    expect(isPaidVisaProduct({})).toBe(false);
  });
});

describe("resolveVisaRoute", () => {
  it("resolves eu-registration to itself", () => {
    expect(resolveVisaRoute("eu-registration")).toBe("eu-registration");
  });

  it("resolves digital-nomad-visa to itself", () => {
    expect(resolveVisaRoute("digital-nomad-visa")).toBe("digital-nomad-visa");
  });

  it("resolves each paid product to itself", () => {
    for (const slug of PAID_VISA_PRODUCTS) {
      expect(resolveVisaRoute(slug)).toBe(slug);
    }
  });

  it("resolves unknown input to 'unknown' (not to DNV)", () => {
    const result = resolveVisaRoute("anything-else");
    expect(result).toBe("unknown");
    expect(result).not.toBe("digital-nomad-visa");
  });

  it("resolves null/undefined/empty to 'unknown' (not to DNV)", () => {
    expect(resolveVisaRoute(null)).toBe("unknown");
    expect(resolveVisaRoute(undefined)).toBe("unknown");
    expect(resolveVisaRoute("")).toBe("unknown");
  });

  it("does NOT use heuristics — display names resolve to 'unknown'", () => {
    // Pre-PR-2, "Digital Nomad Visa (DNV)" entered admin-created cases as a
    // raw display name and silently received the DNV checklist. After PR-2,
    // the resolver returns "unknown" and the case is rejected at write time.
    expect(resolveVisaRoute("Digital Nomad Visa (DNV)")).toBe("unknown");
    expect(resolveVisaRoute("EU Registration Certificate")).toBe("unknown");
    expect(resolveVisaRoute("Non-Lucrative Visa (NLV)")).toBe("unknown");
  });

  it("does NOT use partial-match heuristics", () => {
    // Pre-PR-2, four matchers used `slug.includes("nomad")` / `includes("dnv")`.
    expect(resolveVisaRoute("dnv")).toBe("unknown");
    expect(resolveVisaRoute("nomad")).toBe("unknown");
    expect(resolveVisaRoute("eu-residence-cert")).toBe("unknown");
    expect(resolveVisaRoute("certificado-registro")).toBe("unknown");
  });

  it("is case-sensitive", () => {
    // Inputs entering the resolver must already be normalised to lower-kebab
    // by the callers. The resolver does not lowercase.
    expect(resolveVisaRoute("EU-REGISTRATION")).toBe("unknown");
    expect(resolveVisaRoute("Digital-Nomad-Visa")).toBe("unknown");
  });
});

describe("routeGroupOf", () => {
  it("maps eu-registration to 'eu'", () => {
    expect(routeGroupOf("eu-registration")).toBe("eu");
  });

  it("maps digital-nomad-visa to 'dnv'", () => {
    expect(routeGroupOf("digital-nomad-visa")).toBe("dnv");
  });

  it("maps NLV / Student / Work to 'generic'", () => {
    expect(routeGroupOf("non-lucrative-visa")).toBe("generic");
    expect(routeGroupOf("student-visa")).toBe("generic");
    expect(routeGroupOf("work-visa")).toBe("generic");
  });

  it("maps explicit generic to 'generic'", () => {
    expect(routeGroupOf("generic")).toBe("generic");
  });

  it("maps unknown to 'unknown' (NOT to dnv)", () => {
    const group = routeGroupOf("unknown");
    expect(group).toBe("unknown");
    expect(group).not.toBe("dnv");
  });
});

describe("resolveRouteGroup (end-to-end)", () => {
  it("collapses unknown input into the 'unknown' group, not 'dnv'", () => {
    const group = resolveRouteGroup("Digital Nomad Visa (DNV)");
    expect(group).toBe("unknown");
    expect(group).not.toBe("dnv");
  });

  it("returns 'eu' for eu-registration", () => {
    expect(resolveRouteGroup("eu-registration")).toBe("eu");
  });

  it("returns 'dnv' for digital-nomad-visa", () => {
    expect(resolveRouteGroup("digital-nomad-visa")).toBe("dnv");
  });

  it("returns 'generic' for NLV", () => {
    expect(resolveRouteGroup("non-lucrative-visa")).toBe("generic");
  });

  it("returns 'unknown' for null", () => {
    expect(resolveRouteGroup(null)).toBe("unknown");
  });
});

describe("exhaustiveness (compile-time guarantee)", () => {
  it("routeGroupOf has a case for every VisaRoute", () => {
    // Runtime smoke test: every VisaRoute value must produce a defined group.
    // The real guarantee is at compile time — TypeScript's switch exhaustiveness
    // check means adding a new VisaRoute without updating routeGroupOf is a
    // type error.
    for (const route of VISA_ROUTES) {
      const group = routeGroupOf(route as VisaRoute);
      expect(["eu", "dnv", "generic", "unknown"]).toContain(group);
    }
  });
});

describe("ROUTE_METADATA", () => {
  it("has an entry for every RouteGroup", () => {
    expect(ROUTE_METADATA.eu).toBeDefined();
    expect(ROUTE_METADATA.dnv).toBeDefined();
    expect(ROUTE_METADATA.generic).toBeDefined();
    expect(ROUTE_METADATA.unknown).toBeDefined();
  });

  it("eu uses SPF-EU and 'EU Registration Certificate'", () => {
    expect(ROUTE_METADATA.eu.caseIdPrefix).toBe("SPF-EU");
    expect(ROUTE_METADATA.eu.displayLabel).toBe("EU Registration Certificate");
  });

  it("dnv uses SPF-DNV and 'Digital Nomad Visa'", () => {
    expect(ROUTE_METADATA.dnv.caseIdPrefix).toBe("SPF-DNV");
    expect(ROUTE_METADATA.dnv.displayLabel).toBe("Digital Nomad Visa");
  });

  it("generic and unknown share the same neutral metadata (so unknown never claims a specific visa)", () => {
    expect(ROUTE_METADATA.generic.caseIdPrefix).toBe("SPF");
    expect(ROUTE_METADATA.generic.displayLabel).toBe("Visa Application");
    expect(ROUTE_METADATA.unknown.caseIdPrefix).toBe(ROUTE_METADATA.generic.caseIdPrefix);
    expect(ROUTE_METADATA.unknown.displayLabel).toBe(ROUTE_METADATA.generic.displayLabel);
  });

  it("unknown metadata never displays as DNV", () => {
    expect(ROUTE_METADATA.unknown.caseIdPrefix).not.toBe(ROUTE_METADATA.dnv.caseIdPrefix);
    expect(ROUTE_METADATA.unknown.displayLabel).not.toBe(ROUTE_METADATA.dnv.displayLabel);
  });
});

describe("getRouteMetadata", () => {
  it("returns the EU metadata for eu-registration", () => {
    expect(getRouteMetadata("eu-registration")).toBe(ROUTE_METADATA.eu);
  });

  it("returns the DNV metadata for digital-nomad-visa", () => {
    expect(getRouteMetadata("digital-nomad-visa")).toBe(ROUTE_METADATA.dnv);
  });

  it("returns the generic metadata for NLV / Student / Work", () => {
    expect(getRouteMetadata("non-lucrative-visa")).toBe(ROUTE_METADATA.generic);
    expect(getRouteMetadata("student-visa")).toBe(ROUTE_METADATA.generic);
    expect(getRouteMetadata("work-visa")).toBe(ROUTE_METADATA.generic);
  });

  it("returns the unknown metadata for null/unmapped (NOT the DNV metadata)", () => {
    expect(getRouteMetadata(null)).toBe(ROUTE_METADATA.unknown);
    expect(getRouteMetadata("Digital Nomad Visa (DNV)")).toBe(ROUTE_METADATA.unknown);
    expect(getRouteMetadata(null)).not.toBe(ROUTE_METADATA.dnv);
  });
});
