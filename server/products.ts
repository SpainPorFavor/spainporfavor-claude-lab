/**
 * SpainPorFavor Visa Products — centralized pricing config
 * Prices in EUR cents
 *
 * The keys of VISA_PRODUCTS must match the PaidVisaProduct enum in
 * shared/visaRoutes.ts. The `Record<PaidVisaProduct, …>` typing means
 * TypeScript will fail compilation if a paid product is added to the
 * shared enum without a price entry here (or vice versa).
 */

import { isPaidVisaProduct, type PaidVisaProduct } from "../shared/visaRoutes";

export interface VisaProduct {
  id: PaidVisaProduct;
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
  timeline: string;
  dependentPriceInCents?: number;
}

export const VISA_PRODUCTS: Record<PaidVisaProduct, VisaProduct> = {
  "eu-registration": {
    id: "eu-registration",
    name: "EU Registration Certificate",
    description: "NIE and Certificado de Registro — full document preparation and submission by licensed Gestor",
    priceInCents: 34900,
    currency: "eur",
    timeline: "2–3 weeks",
    dependentPriceInCents: 19900,
  },
  "digital-nomad-visa": {
    id: "digital-nomad-visa",
    name: "Digital Nomad Visa (DNV)",
    description: "Complete DNV application — document preparation, expert review, and Gestor submission to immigration authorities",
    priceInCents: 69900,
    currency: "eur",
    timeline: "4–6 weeks",
    dependentPriceInCents: 39900,
  },
  "non-lucrative-visa": {
    id: "non-lucrative-visa",
    name: "Non-Lucrative Visa (NLV)",
    description: "Full NLV application — financial document review, preparation, and Gestor submission to immigration authorities",
    priceInCents: 64900,
    currency: "eur",
    timeline: "6–8 weeks",
    dependentPriceInCents: 34900,
  },
  "student-visa": {
    id: "student-visa",
    name: "Student Visa (Estancia por Estudios)",
    description: "Complete student visa application — enrollment verification, document prep, and Gestor submission",
    priceInCents: 54900,
    currency: "eur",
    timeline: "4–6 weeks",
    // No dependent pricing — student visas rarely include dependents
  },
  "work-visa": {
    id: "work-visa",
    name: "Work Visa (Autorización Cuenta Ajena)",
    description: "Full work visa application — employer sponsorship guidance, document prep, and Gestor submission",
    priceInCents: 79900,
    currency: "eur",
    timeline: "8–12 weeks",
    dependentPriceInCents: 44900,
  },
};

// Map visa recommendation names to product IDs
export const VISA_NAME_TO_PRODUCT_ID: Record<string, string> = {
  "EU Registration Certificate": "eu-registration",
  "Digital Nomad Visa (DNV)": "digital-nomad-visa",
  "Digital Nomad Visa": "digital-nomad-visa",
  "Non-Lucrative Visa (NLV)": "non-lucrative-visa",
  "Non-Lucrative Visa": "non-lucrative-visa",
  "Student Visa (Estancia por Estudios)": "student-visa",
  "Student Visa": "student-visa",
  "Work Visa (Autorización Cuenta Ajena)": "work-visa",
  "Work Visa": "work-visa",
};

/**
 * Look up a visa product by id. Returns undefined for unknown ids. Safer than
 * indexing VISA_PRODUCTS directly because it never throws and never returns a
 * silent DNV default.
 */
export function getVisaProduct(productId: string | null | undefined): VisaProduct | undefined {
  if (!isPaidVisaProduct(productId)) return undefined;
  return VISA_PRODUCTS[productId];
}

// Helper to get pricing summary for a visa with dependents
export function getPricingSummary(productId: string, dependentCount: number): {
  mainPrice: number;
  dependentPrice: number;
  totalPrice: number;
  breakdown: string;
} {
  const product = getVisaProduct(productId);
  if (!product) {
    return { mainPrice: 0, dependentPrice: 0, totalPrice: 0, breakdown: "" };
  }

  const mainPrice = product.priceInCents / 100;
  const depUnitPrice = (product.dependentPriceInCents || 0) / 100;
  const dependentPrice = depUnitPrice * dependentCount;
  const totalPrice = mainPrice + dependentPrice;

  let breakdown = `€${mainPrice} for the main applicant`;
  if (dependentCount > 0 && depUnitPrice > 0) {
    breakdown += ` + €${depUnitPrice} per dependent (${dependentCount} dependent${dependentCount > 1 ? "s" : ""} = €${dependentPrice})`;
    breakdown += ` — total: €${totalPrice}`;
  }

  return { mainPrice, dependentPrice, totalPrice, breakdown };
}
