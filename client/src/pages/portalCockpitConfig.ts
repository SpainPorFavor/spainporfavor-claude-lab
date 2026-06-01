/**
 * Route-specific configuration for the Portal Application Cockpit.
 * Each visa route gets its own copy, document groupings, and next-best-action logic.
 *
 * Shared route facts (caseIdPrefix / routePrefix and displayLabel / routeLabel)
 * live in shared/visaRoutes.ts under ROUTE_METADATA — consumed below so the
 * same fact isn't duplicated across this file and activationRouteConfig.ts.
 */
import { ROUTE_METADATA } from "@shared/visaRoutes";

// Document group — logical grouping for the checklist UI
export interface DocumentGroup {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  documentTypes: string[]; // matches documentSlots.documentType
}

export interface CockpitRouteConfig {
  routeLabel: string; // e.g. "Digital Nomad Visa"
  routePrefix: string; // e.g. "SPF-DNV"
  heroHeadline: string;
  heroSubheadline: string;
  privacyIntro: string;
  privacyBullets: string[];
  documentGroups: DocumentGroup[];
  nextBestActionCopy: {
    noUploads: string;
    someUploads: string;
    allUploaded: string;
    allApproved: string;
    actionRequired: string;
  };
  helpText: string;
  statusCopy: {
    collecting: { title: string; body: string };
    actionRequired: { title: string; body: string };
    underReview: { title: string; body: string };
    readyForGestor: { title: string; body: string };
    completed: { title: string; body: string };
  };
}

// ============================================================
// DNV CONFIG
// ============================================================
const dnvCockpitConfig: CockpitRouteConfig = {
  routeLabel: ROUTE_METADATA.dnv.displayLabel,
  routePrefix: ROUTE_METADATA.dnv.caseIdPrefix,
  heroHeadline: "Your Digital Nomad Visa Application",
  heroSubheadline: "Upload your documents below. Your Gestor will review everything once the checklist is complete.",
  privacyIntro: "We need to process your documents to prepare and review your application. Please review the summary below before continuing.",
  privacyBullets: [
    "Your documents are stored securely and accessed only by authorised case staff or approved service providers involved in your case",
    "Your assigned case team or licensed Gestor may access the documents needed to prepare and support your application",
    "Documents are used solely for preparing your Digital Nomad Visa application",
  ],
  documentGroups: [
    {
      id: "identity",
      title: "Identity & Background",
      description: "Passport, criminal record, and photo",
      icon: "🪪",
      documentTypes: ["passport", "criminal_record", "passport_photo"],
    },
    {
      id: "employment",
      title: "Employment & Income",
      description: "Work contract, company docs, and bank statements",
      icon: "💼",
      documentTypes: ["employment_letter", "company_registration", "bank_statements"],
    },
    {
      id: "living",
      title: "Living in Spain",
      description: "Health insurance and qualifications",
      icon: "🏠",
      documentTypes: ["health_insurance", "degree_or_experience"],
    },
  ],
  nextBestActionCopy: {
    noUploads: "Start with your passport — it's the quickest document to upload.",
    someUploads: "Keep going! Upload your next document to move your application forward.",
    allUploaded: "All documents uploaded. We're reviewing them now — you'll see status updates here.",
    allApproved: "All documents approved! Your Gestor is preparing your application package.",
    actionRequired: "One or more documents need changes before your case can move forward.",
  },
  statusCopy: {
    collecting: { title: "Collecting documents", body: "Upload the required documents below. We'll review each one and tell you if anything needs fixing." },
    actionRequired: { title: "Action required", body: "One or more documents need changes before your case can move forward." },
    underReview: { title: "Documents under review", body: "Your uploaded documents are being checked by the SpainPorFavor team." },
    readyForGestor: { title: "Ready for specialist review", body: "All documents validated. Your Gestor will begin preparing your application." },
    completed: { title: "Application complete", body: "Your Digital Nomad Visa application has been submitted." },
  },
  helpText: "Need help? Ask Laura or contact your case team.",
};

// ============================================================
// EU REGISTRATION CONFIG
// ============================================================
const euCockpitConfig: CockpitRouteConfig = {
  routeLabel: ROUTE_METADATA.eu.displayLabel,
  routePrefix: ROUTE_METADATA.eu.caseIdPrefix,
  heroHeadline: "Your EU Registration Application",
  heroSubheadline: "Upload your documents below. The process is simpler than you think — most clients finish in one sitting.",
  privacyIntro: "We need to process your documents to prepare and review your application. Please review the summary below before continuing.",
  privacyBullets: [
    "Your documents are stored securely and accessed only by authorised case staff or approved service providers involved in your case",
    "Your assigned case team or licensed Gestor may access the documents needed to prepare and support your application",
    "Documents are used solely for preparing your EU Registration Certificate application",
  ],
  documentGroups: [
    {
      id: "identity",
      title: "Identity",
      description: "Passport or EU national ID",
      icon: "🪪",
      documentTypes: ["passport", "eu_national_id"],
    },
    {
      id: "residence",
      title: "Residence & Employment",
      description: "Proof of address and employment evidence",
      icon: "🏠",
      documentTypes: ["proof_of_address", "employment_evidence"],
    },
    {
      id: "admin",
      title: "Insurance & Admin",
      description: "Health insurance, fee payment, and EX-18 form",
      icon: "📋",
      documentTypes: ["health_insurance", "fee_payment_proof", "ex18_form"],
    },
  ],
  nextBestActionCopy: {
    noUploads: "Start with your passport or EU ID — it takes less than a minute.",
    someUploads: "Great progress! Upload your next document to keep things moving.",
    allUploaded: "All documents uploaded. We're reviewing them now — you'll see status updates here.",
    allApproved: "All documents approved! Your Gestor is preparing your registration package.",
    actionRequired: "One or more documents need changes before your case can move forward.",
  },
  statusCopy: {
    collecting: { title: "Collecting documents", body: "Upload the required documents below. We'll review each one and tell you if anything needs fixing." },
    actionRequired: { title: "Action required", body: "One or more documents need changes before your registration can move forward." },
    underReview: { title: "Documents under review", body: "Your uploaded documents are being checked by the SpainPorFavor team." },
    readyForGestor: { title: "Ready for specialist review", body: "All documents validated. Your Gestor will begin preparing your registration." },
    completed: { title: "Registration complete", body: "Your EU Registration Certificate application has been submitted." },
  },
  helpText: "Questions about a specific document? Ask Laura — she can explain exactly what's needed.",
};

// ============================================================
// GENERIC FALLBACK
// ============================================================
const genericCockpitConfig: CockpitRouteConfig = {
  routeLabel: ROUTE_METADATA.generic.displayLabel,
  routePrefix: ROUTE_METADATA.generic.caseIdPrefix,
  heroHeadline: "Your Visa Application",
  heroSubheadline: "Upload your documents below. Your Gestor will review everything once the checklist is complete.",
  privacyIntro: "We need to process your documents to prepare and review your application. Please review the summary below before continuing.",
  privacyBullets: [
    "Your documents are stored securely and accessed only by authorised case staff or approved service providers involved in your case",
    "Your assigned case team or licensed Gestor may access the documents needed to prepare and support your application",
    "Documents are used solely for preparing your visa application",
  ],
  documentGroups: [
    {
      id: "all",
      title: "Required Documents",
      description: "All documents needed for your application",
      icon: "📄",
      documentTypes: [], // catch-all — shows all slots
    },
  ],
  nextBestActionCopy: {
    noUploads: "Start by uploading your first document.",
    someUploads: "Keep going! Upload your next document.",
    allUploaded: "All documents uploaded. We're reviewing them now.",
    allApproved: "All documents approved! Your Gestor is preparing your application.",
    actionRequired: "One or more documents need changes before your case can move forward.",
  },
  statusCopy: {
    collecting: { title: "Collecting documents", body: "Upload the required documents below. We'll review each one and tell you if anything needs fixing." },
    actionRequired: { title: "Action required", body: "One or more documents need changes before your case can move forward." },
    underReview: { title: "Documents under review", body: "Your uploaded documents are being checked by the SpainPorFavor team." },
    readyForGestor: { title: "Ready for specialist review", body: "All documents validated. Your Gestor will begin preparing your application." },
    completed: { title: "Application complete", body: "Your visa application has been submitted." },
  },
  helpText: "Need help? Ask Laura in the chat — she knows your case inside and out.",
};

// ============================================================
// ROUTE RESOLVER
// ============================================================
// Single source of truth: shared/visaRoutes.ts. No local slug heuristics —
// unknown visa types route to `genericCockpitConfig`, never silently to DNV.
import { resolveRouteGroup } from "@shared/visaRoutes";

export function getCockpitConfig(visaType: string | null | undefined): CockpitRouteConfig {
  switch (resolveRouteGroup(visaType)) {
    case "eu":
      return euCockpitConfig;
    case "dnv":
      return dnvCockpitConfig;
    case "generic":
    case "unknown":
      return genericCockpitConfig;
  }
}
