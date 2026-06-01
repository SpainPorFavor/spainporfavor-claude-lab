/**
 * Canonical visa route resolver.
 *
 * Single source of truth for visa product identifiers across the funnel.
 * Replaces four independent matcher functions that previously diverged
 * (`getRouteConfig`, `getCockpitConfig`, `resolveProductType`,
 * `getIntakeRouteConfig`) and the DNV silent-default fallbacks in checklist
 * generation, the Stripe webhook, and the homepage quiz handoff.
 *
 * See docs/product-routes.md and .claude/skills/spf-funnel-architect/SKILL.md.
 *
 * Two related types:
 *
 *   PaidVisaProduct — the 5 things a customer can buy. Used by payment,
 *     case creation, and document-checklist generation. Stored in
 *     `cases.visaType`.
 *
 *   VisaRoute — the 7 IDs a UI matcher may see. The 5 paid products plus
 *     `generic` (for products without dedicated UI configs — currently NLV,
 *     Student, Work) and `unknown` (explicit marker for inputs we don't
 *     recognise; NEVER silently mapped to DNV).
 */

export const PAID_VISA_PRODUCTS = [
  "eu-registration",
  "digital-nomad-visa",
  "non-lucrative-visa",
  "student-visa",
  "work-visa",
] as const;

export type PaidVisaProduct = (typeof PAID_VISA_PRODUCTS)[number];

export const VISA_ROUTES = [
  ...PAID_VISA_PRODUCTS,
  "generic",
  "unknown",
] as const;

export type VisaRoute = (typeof VISA_ROUTES)[number];

/** Display-group used by UI matchers to pick which route config to render. */
export type RouteGroup = "eu" | "dnv" | "generic" | "unknown";

/** Type guard for the 5 paid products. */
export function isPaidVisaProduct(input: unknown): input is PaidVisaProduct {
  return typeof input === "string" && (PAID_VISA_PRODUCTS as readonly string[]).includes(input);
}

/**
 * Resolve any input string to a canonical VisaRoute.
 *
 * Returns the input verbatim if it is a paid visa product slug; returns
 * `"unknown"` otherwise. There are NO heuristics here — display names
 * (e.g. "Digital Nomad Visa (DNV)") resolve to `"unknown"`, not to DNV.
 * If you need to map a display name, add it to the explicit lookup at
 * the call site (e.g. Home.tsx's `VISA_NAME_TO_PRODUCT_ID`).
 */
export function resolveVisaRoute(input: string | null | undefined): VisaRoute {
  if (!input) return "unknown";
  if (isPaidVisaProduct(input)) return input;
  return "unknown";
}

/**
 * Map a VisaRoute to its UI display group.
 *
 * Exhaustive — adding a new VisaRoute without handling it here is a
 * compile error. NLV, Student, and Work currently route to `generic`
 * because they share the generic UI configs. `unknown` also routes to
 * `generic` so legacy/bad data renders without crashing the page;
 * crucially, it does NOT route to `dnv`.
 */
export function routeGroupOf(route: VisaRoute): RouteGroup {
  switch (route) {
    case "eu-registration":
      return "eu";
    case "digital-nomad-visa":
      return "dnv";
    case "non-lucrative-visa":
    case "student-visa":
    case "work-visa":
    case "generic":
      return "generic";
    case "unknown":
      return "unknown";
  }
}

/** Convenience: input string → display group, used by UI matchers. */
export function resolveRouteGroup(input: string | null | undefined): RouteGroup {
  return routeGroupOf(resolveVisaRoute(input));
}

/**
 * Shared per-RouteGroup facts that must agree across the four UI configs.
 *
 *   caseIdPrefix — used in the case ID rendered on /application-success
 *     and /portal. Activation and cockpit configs previously hardcoded this
 *     in two places; PR-3 consolidates so drift is impossible.
 *   displayLabel — short brand-aligned label for the route, shown in
 *     headers and case-snapshot cards.
 *
 * Keep these intentionally short and non-marketing. Page-specific headlines,
 * subheadlines, and microcopy stay in their respective config files because
 * each surface needs different framing.
 */
export interface RouteMetadata {
  caseIdPrefix: string;
  displayLabel: string;
}

export const ROUTE_METADATA: Record<RouteGroup, RouteMetadata> = {
  eu: {
    caseIdPrefix: "SPF-EU",
    displayLabel: "EU Registration Certificate",
  },
  dnv: {
    caseIdPrefix: "SPF-DNV",
    displayLabel: "Digital Nomad Visa",
  },
  generic: {
    caseIdPrefix: "SPF",
    displayLabel: "Visa Application",
  },
  unknown: {
    // Unknown gets the same surface as generic — copy is intentionally
    // non-specific so a case whose visaType could not be classified renders
    // safely without claiming a product the user did not buy.
    caseIdPrefix: "SPF",
    displayLabel: "Visa Application",
  },
};

/** Look up the metadata for a raw input string. Resolves through the canonical resolver. */
export function getRouteMetadata(input: string | null | undefined): RouteMetadata {
  return ROUTE_METADATA[resolveRouteGroup(input)];
}
