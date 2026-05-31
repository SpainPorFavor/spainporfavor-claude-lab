/**
 * Route-specific content configuration for the Case Activation Page.
 * Each route (DNV, EU Registration, Generic) has its own hero, stepper,
 * checklist, blocker cards, and copy.
 */

export type StepStatus = "complete" | "current" | "next" | "goal";

export interface StepConfig {
  label: string;
  body: string;
  status: StepStatus;
  cta?: string;
  note?: string;
}

export interface BlockerCard {
  title: string;
  body: string;
}

export interface RouteConfig {
  routeKey: string;
  heroHeadline: string;
  progressBadge: string;
  heroSubheadline: string;
  primaryCta: string;
  ctaMicrocopy: string;
  journeyTitle: string;
  steps: StepConfig[];
  caseIdPrefix: string;
  checklistTitle: string;
  checklistIntro: string;
  checklistItems: string[];
  afterUploadTitle: string;
  afterUploadBody: string;
  afterUploadBullets: string[];
  blockerTitle: string;
  blockerBody: string;
  blockerCards: BlockerCard[];
  stickyCta: string;
}

// ── Route A: Digital Nomad Visa ──
const dnvConfig: RouteConfig = {
  routeKey: "dnv",
  heroHeadline: "Payment confirmed — your Digital Nomad Visa case is open",
  progressBadge: "2 of 5 steps complete",
  heroSubheadline:
    "Upload your passport now so we can begin your document review and prepare your application package.",
  primaryCta: "Upload My Passport Now",
  ctaMicrocopy: "Takes about 2 minutes. You can upload the rest later.",
  journeyTitle: "Your 5-step Digital Nomad Visa journey",
  steps: [
    {
      label: "Payment confirmed",
      status: "complete",
      body: "Your payment was successful.",
    },
    {
      label: "Case opened",
      status: "complete",
      body: "Your SpainPorFavor case has been created and linked to your Digital Nomad Visa pathway.",
    },
    {
      label: "Upload your passport",
      status: "current",
      body: "Upload your passport so we can verify your details and begin your document review.",
      cta: "Upload My Passport Now",
    },
    {
      label: "Expert review and application preparation",
      status: "next",
      body: "Your team reviews your documents, flags missing items, and prepares your application package.",
    },
    {
      label: "Application ready / submitted",
      status: "goal",
      body: "We guide you through the required submission, appointment, or next-step process for your route.",
      note: "Final decisions depend on official requirements, appointment availability, and the competent Spanish authority.",
    },
  ],
  caseIdPrefix: "SPF-DNV",
  checklistTitle: "Start with your passport",
  checklistIntro:
    "You do not need to upload everything right now. Start with your passport. Your full checklist will be confirmed inside your portal based on where you are applying from.",
  checklistItems: [
    "Valid passport",
    "Criminal record certificate, if required for your application route",
    "Proof of remote work, employment, freelance, or client activity",
    "Proof of income or financial means",
    "Health insurance evidence, if required",
    "Professional qualification or work-experience evidence, if required",
    "Apostille/legalisation and translation guidance, where required",
  ],
  afterUploadTitle: "After you upload your passport",
  afterUploadBody:
    "Your passport upload lets us start the practical work. Here\u2019s what happens next:",
  afterUploadBullets: [
    "We verify your identity details",
    "We confirm your full Digital Nomad Visa checklist",
    "We review uploaded documents for missing or incorrectly formatted items",
    "We prepare your application package and next-step instructions",
    "We guide you through the required submission, appointment, or follow-up step",
  ],
  blockerTitle: "Missing something for your visa application?",
  blockerBody:
    "If you do not have everything yet, we can help you solve the common blockers.",
  blockerCards: [
    {
      title: "Need help with your criminal record certificate?",
      body: "We\u2019ll guide you on apostille/legalisation and translation requirements where applicable.",
    },
    {
      title: "Need health insurance evidence checked?",
      body: "We\u2019ll help you confirm whether your policy evidence fits your route.",
    },
    {
      title: "Need help preparing employer or client proof?",
      body: "We\u2019ll help you organize contracts, letters, client evidence, or remote-work documentation.",
    },
    {
      title: "Applying from Spain or from abroad?",
      body: "We\u2019ll guide the correct submission path and next step based on where you are applying from.",
    },
  ],
  stickyCta: "Upload Passport Now",
};

// ── Route B: EU Registration Certificate ──
const euConfig: RouteConfig = {
  routeKey: "eu",
  heroHeadline:
    "Payment confirmed — your EU Registration Certificate case is open",
  progressBadge: "2 of 5 steps complete",
  heroSubheadline:
    "Upload your passport or EU national ID now so we can begin your document review and prepare your registration package.",
  primaryCta: "Upload My Passport or EU ID Now",
  ctaMicrocopy: "Takes about 2 minutes. You can upload the rest later.",
  journeyTitle: "Your 5-step EU registration journey",
  steps: [
    {
      label: "Payment confirmed",
      status: "complete",
      body: "Your payment was successful.",
    },
    {
      label: "Case opened",
      status: "complete",
      body: "Your SpainPorFavor case has been created and linked to your EU Registration Certificate pathway.",
    },
    {
      label: "Upload your passport or EU ID",
      status: "current",
      body: "Upload your passport or EU national ID so we can verify your details and begin your document review.",
      cta: "Upload My Passport or EU ID Now",
    },
    {
      label: "Expert review and registration package",
      status: "next",
      body: "Your team reviews your documents, flags missing items, and prepares your registration package.",
    },
    {
      label: "Appointment-ready / registration completed",
      status: "goal",
      body: "We prepare your registration package and guide you through the required appointment step.",
      note: "Final issuance depends on official requirements, appointment availability, and your completed documents.",
    },
  ],
  caseIdPrefix: "SPF-EU",
  checklistTitle: "Start with your passport or EU national ID",
  checklistIntro:
    "You do not need to upload everything right now. Start with your passport or EU national ID. Your full checklist will be confirmed inside your portal based on your situation.",
  checklistItems: [
    "Valid passport or EU national ID",
    "Proof of address in Spain, if already available",
    "Employment, self-employment, student, or sufficient-resources evidence",
    "Health insurance, EHIC, or S1 evidence if required for your situation",
    "790/012 fee payment proof when instructed",
  ],
  afterUploadTitle: "After you upload your passport or EU ID",
  afterUploadBody:
    "Your upload lets us start the practical work. Here\u2019s what happens next:",
  afterUploadBullets: [
    "We verify your details",
    "We confirm your full EU registration checklist",
    "We review uploaded documents for missing or incorrect items",
    "We prepare your registration package and next-step instructions",
    "We guide you through the required appointment step",
  ],
  blockerTitle: "Missing something for your registration?",
  blockerBody:
    "If you do not have everything yet, we can help you solve the common blockers.",
  blockerCards: [
    {
      title: "Need address or padr\u00f3n guidance?",
      body: "Get step-by-step guidance for proving your address in Spain.",
    },
    {
      title: "Need health insurance, S1, or EHIC guidance?",
      body: "We\u2019ll help you understand what proof may apply to your situation.",
    },
    {
      title: "Need EX-18 or 790 preparation help?",
      body: "We\u2019ll guide you through the forms and payment proof when required.",
    },
    {
      title: "Need appointment preparation?",
      body: "We\u2019ll help you understand what to bring and what to expect.",
    },
  ],
  stickyCta: "Upload Passport or EU ID Now",
};

// ── Route C: Generic Fallback ──
const genericConfig: RouteConfig = {
  routeKey: "generic",
  heroHeadline: "Payment confirmed — your SpainPorFavor case is open",
  progressBadge: "2 of 5 steps complete",
  heroSubheadline:
    "Upload your first document now so we can begin your document review and confirm your next steps.",
  primaryCta: "Upload My First Document",
  ctaMicrocopy: "Takes about 2 minutes. You can upload the rest later.",
  journeyTitle: "Your 5-step case journey",
  steps: [
    {
      label: "Payment confirmed",
      status: "complete",
      body: "Your payment was successful.",
    },
    {
      label: "Case opened",
      status: "complete",
      body: "Your SpainPorFavor case has been created.",
    },
    {
      label: "Upload your first document",
      status: "current",
      body: "Upload your first document so we can verify your details and begin your document review.",
      cta: "Upload My First Document",
    },
    {
      label: "Expert review and preparation",
      status: "next",
      body: "Your team reviews your documents, flags missing items, and prepares your next-step package.",
    },
    {
      label: "Next step ready",
      status: "goal",
      body: "We guide you through the required next step for your route.",
      note: "Final outcomes depend on official requirements, appointment availability, and your completed documents.",
    },
  ],
  caseIdPrefix: "SPF",
  checklistTitle: "Start with your first document",
  checklistIntro:
    "You do not need to upload everything right now. Start with your passport or primary identity document. Your full checklist will be confirmed inside your portal.",
  checklistItems: [
    "Valid passport or national ID",
    "Proof of income or financial means",
    "Health insurance evidence, if required",
    "Supporting documents for your visa type",
  ],
  afterUploadTitle: "After you upload your first document",
  afterUploadBody:
    "Your upload lets us start the practical work. Here\u2019s what happens next:",
  afterUploadBullets: [
    "We verify your details",
    "We confirm your full document checklist",
    "We review uploaded documents for missing or incorrect items",
    "We prepare your next-step package and instructions",
    "We guide you through the required submission or appointment step",
  ],
  blockerTitle: "Missing something?",
  blockerBody:
    "If you do not have everything yet, we can help you solve the common blockers.",
  blockerCards: [
    {
      title: "Need help with document preparation?",
      body: "We\u2019ll guide you on what\u2019s needed and how to get it.",
    },
    {
      title: "Need health insurance guidance?",
      body: "We\u2019ll help you confirm whether your policy fits your route.",
    },
    {
      title: "Need translation or apostille help?",
      body: "We\u2019ll confirm requirements before you pay for them.",
    },
    {
      title: "Not sure about your next step?",
      body: "Contact support and we\u2019ll help you figure it out.",
    },
  ],
  stickyCta: "Upload First Document",
};

// ── Route detection logic ──
const DNV_SLUGS = new Set([
  "digital-nomad-visa",
  "dnv",
  "visa-digital-nomad",
]);

const EU_SLUGS = new Set([
  "eu-registration",
  "eu-registration-certificate",
  "eu-certificate",
  "certificado-registro",
]);

export function getRouteConfig(productId: string | null | undefined): RouteConfig {
  if (!productId) return genericConfig;
  const slug = productId.toLowerCase().trim();
  if (DNV_SLUGS.has(slug)) return dnvConfig;
  if (EU_SLUGS.has(slug)) return euConfig;
  // Check partial matches
  if (slug.includes("nomad") || slug.includes("dnv")) return dnvConfig;
  if (slug.includes("eu-reg") || slug.includes("certificado")) return euConfig;
  return genericConfig;
}
