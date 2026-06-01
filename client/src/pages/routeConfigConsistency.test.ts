/**
 * Cross-config consistency tests.
 *
 * The funnel has four route-specific config surfaces:
 *   1. activationRouteConfig.ts        — /application-success page
 *   2. portalCockpitConfig.ts          — /portal cockpit
 *   3. documentIntakeConfig.ts         — /documents/start page
 *   4. documentRequirementConfig.ts    — per-document copy + selectors
 *
 * Before PR-3, each file had its own slug matcher and its own hardcoded
 * caseIdPrefix / displayLabel. PR-3 routes them all through
 * shared/visaRoutes.ts and through the shared ROUTE_METADATA so the same
 * product slug produces consistent identity across the funnel.
 *
 * These tests pin that contract: same input → same group across all four
 * matchers, and unknown input never produces DNV copy anywhere.
 */
import { describe, it, expect } from "vitest";
import { getRouteConfig } from "./activationRouteConfig";
import { getCockpitConfig } from "./portalCockpitConfig";
import { getIntakeRouteConfig } from "./documentIntakeConfig";
import { resolveProductType } from "./documentRequirementConfig";
import { ROUTE_METADATA, PAID_VISA_PRODUCTS } from "@shared/visaRoutes";

describe("EU Registration: same identity across all four configs", () => {
  const slug = "eu-registration";

  it("activation config carries EU identity", () => {
    const cfg = getRouteConfig(slug);
    expect(cfg.routeKey).toBe("eu");
    expect(cfg.caseIdPrefix).toBe(ROUTE_METADATA.eu.caseIdPrefix);
    expect(cfg.heroHeadline).toMatch(/EU Registration/);
    expect(cfg.checklistTitle).toMatch(/passport|EU/i);
  });

  it("cockpit config carries EU identity", () => {
    const cfg = getCockpitConfig(slug);
    expect(cfg.routePrefix).toBe(ROUTE_METADATA.eu.caseIdPrefix);
    expect(cfg.routeLabel).toBe(ROUTE_METADATA.eu.displayLabel);
    expect(cfg.heroHeadline).toMatch(/EU Registration/);
  });

  it("intake config carries EU identity", () => {
    const cfg = getIntakeRouteConfig(slug);
    expect(cfg.heroHeadline + cfg.heroSubheadline).toMatch(/passport|EU ID/i);
    expect(cfg.journeyTitle).toMatch(/EU registration/i);
  });

  it("requirement type resolves to eu-registration", () => {
    expect(resolveProductType(slug)).toBe("eu-registration");
  });

  it("activation caseIdPrefix === cockpit routePrefix (no drift)", () => {
    expect(getRouteConfig(slug).caseIdPrefix).toBe(getCockpitConfig(slug).routePrefix);
  });

  it("nowhere in EU configs is DNV-only language present", () => {
    const blob =
      JSON.stringify(getRouteConfig(slug)) +
      JSON.stringify(getCockpitConfig(slug)) +
      JSON.stringify(getIntakeRouteConfig(slug));
    expect(blob).not.toMatch(/Digital Nomad Visa/);
    expect(blob).not.toMatch(/SPF-DNV/);
  });
});

describe("Digital Nomad Visa: same identity across all four configs", () => {
  const slug = "digital-nomad-visa";

  it("activation config carries DNV identity", () => {
    const cfg = getRouteConfig(slug);
    expect(cfg.routeKey).toBe("dnv");
    expect(cfg.caseIdPrefix).toBe(ROUTE_METADATA.dnv.caseIdPrefix);
    expect(cfg.heroHeadline).toMatch(/Digital Nomad Visa/);
  });

  it("cockpit config carries DNV identity", () => {
    const cfg = getCockpitConfig(slug);
    expect(cfg.routePrefix).toBe(ROUTE_METADATA.dnv.caseIdPrefix);
    expect(cfg.routeLabel).toBe(ROUTE_METADATA.dnv.displayLabel);
    expect(cfg.heroHeadline).toMatch(/Digital Nomad Visa/);
  });

  it("intake config carries DNV identity", () => {
    const cfg = getIntakeRouteConfig(slug);
    expect(cfg.journeyTitle).toMatch(/Digital Nomad Visa/i);
  });

  it("requirement type resolves to digital-nomad-visa", () => {
    expect(resolveProductType(slug)).toBe("digital-nomad-visa");
  });

  it("activation caseIdPrefix === cockpit routePrefix (no drift)", () => {
    expect(getRouteConfig(slug).caseIdPrefix).toBe(getCockpitConfig(slug).routePrefix);
  });

  it("nowhere in DNV configs is EU-only language present", () => {
    const blob =
      JSON.stringify(getRouteConfig(slug)) +
      JSON.stringify(getCockpitConfig(slug)) +
      JSON.stringify(getIntakeRouteConfig(slug));
    expect(blob).not.toMatch(/EU Registration Certificate/);
    expect(blob).not.toMatch(/SPF-EU/);
    expect(blob).not.toMatch(/EX-18/);
  });
});

describe("Unknown / unmappable routes: never DNV copy", () => {
  // Inputs the resolver returns "unknown" for: bad display names, partial
  // matches, completely unknown slugs, null. None should produce DNV copy.
  const UNKNOWN_INPUTS = [
    null,
    undefined,
    "",
    "anything-else",
    "Digital Nomad Visa (DNV)", // display name, not a slug — resolver returns "unknown"
    "EU Registration Certificate",
    "dnv",
    "nomad",
    "eu-residence-cert",
  ];

  for (const input of UNKNOWN_INPUTS) {
    it(`activation config for ${JSON.stringify(input)} is generic, not DNV`, () => {
      const cfg = getRouteConfig(input);
      expect(cfg.routeKey).not.toBe("dnv");
      expect(cfg.caseIdPrefix).not.toBe(ROUTE_METADATA.dnv.caseIdPrefix);
      expect(cfg.heroHeadline).not.toMatch(/Digital Nomad Visa/);
    });

    it(`cockpit config for ${JSON.stringify(input)} is generic, not DNV`, () => {
      const cfg = getCockpitConfig(input);
      expect(cfg.routePrefix).not.toBe(ROUTE_METADATA.dnv.caseIdPrefix);
      expect(cfg.routeLabel).not.toBe(ROUTE_METADATA.dnv.displayLabel);
    });

    it(`intake config for ${JSON.stringify(input)} is generic, not DNV`, () => {
      const cfg = getIntakeRouteConfig(input);
      expect(cfg.journeyTitle).not.toMatch(/Digital Nomad Visa/i);
    });

    it(`requirement type for ${JSON.stringify(input)} is generic, not digital-nomad-visa`, () => {
      const result = resolveProductType(input);
      expect(result).toBe("generic");
      expect(result).not.toBe("digital-nomad-visa");
    });
  }
});

describe("Non-DNV paid products (NLV, Student, Work): route to generic, not DNV", () => {
  // These three paid products don't have dedicated UI configs today —
  // they intentionally fall through to the generic UI. Critically, they
  // must NOT pick up DNV's copy.
  const GENERIC_GROUP_PRODUCTS = [
    "non-lucrative-visa",
    "student-visa",
    "work-visa",
  ];

  for (const slug of GENERIC_GROUP_PRODUCTS) {
    it(`${slug}: activation config is generic`, () => {
      const cfg = getRouteConfig(slug);
      expect(cfg.routeKey).toBe("generic");
      expect(cfg.heroHeadline).not.toMatch(/Digital Nomad Visa/);
    });

    it(`${slug}: cockpit config is generic`, () => {
      const cfg = getCockpitConfig(slug);
      expect(cfg.routePrefix).toBe(ROUTE_METADATA.generic.caseIdPrefix);
    });

    it(`${slug}: requirement type is generic`, () => {
      expect(resolveProductType(slug)).toBe("generic");
    });
  }
});

describe("ROUTE_METADATA is the single source of caseIdPrefix and displayLabel", () => {
  it("activation configs derive caseIdPrefix from ROUTE_METADATA", () => {
    expect(getRouteConfig("eu-registration").caseIdPrefix).toBe(ROUTE_METADATA.eu.caseIdPrefix);
    expect(getRouteConfig("digital-nomad-visa").caseIdPrefix).toBe(ROUTE_METADATA.dnv.caseIdPrefix);
    expect(getRouteConfig("non-lucrative-visa").caseIdPrefix).toBe(ROUTE_METADATA.generic.caseIdPrefix);
    expect(getRouteConfig(null).caseIdPrefix).toBe(ROUTE_METADATA.unknown.caseIdPrefix);
  });

  it("cockpit configs derive routePrefix and routeLabel from ROUTE_METADATA", () => {
    expect(getCockpitConfig("eu-registration").routePrefix).toBe(ROUTE_METADATA.eu.caseIdPrefix);
    expect(getCockpitConfig("eu-registration").routeLabel).toBe(ROUTE_METADATA.eu.displayLabel);
    expect(getCockpitConfig("digital-nomad-visa").routePrefix).toBe(ROUTE_METADATA.dnv.caseIdPrefix);
    expect(getCockpitConfig("digital-nomad-visa").routeLabel).toBe(ROUTE_METADATA.dnv.displayLabel);
    expect(getCockpitConfig(null).routePrefix).toBe(ROUTE_METADATA.unknown.caseIdPrefix);
  });

  it("activation.caseIdPrefix === cockpit.routePrefix for every paid product", () => {
    for (const slug of PAID_VISA_PRODUCTS) {
      expect(getRouteConfig(slug).caseIdPrefix).toBe(getCockpitConfig(slug).routePrefix);
    }
  });
});
