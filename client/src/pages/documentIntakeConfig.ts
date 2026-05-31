/**
 * Route-specific content configuration for the Secure Document Intake page (Step 3).
 * Supports EU Registration, Digital Nomad Visa, and Generic fallback.
 */

export type DocumentTypeOption = {
  id: string;
  label: string;
  body: string;
  sides: number; // 1 = single-sided, 2 = front+back
  scanInstruction: string;
  captureLabel: string;
};

export type IntakeRouteConfig = {
  heroHeadline: string;
  heroSubheadline: string;
  primaryCta: string;
  secondaryCta: string;
  microcopy: string;
  journeyTitle: string;
  steps: { label: string; status: "complete" | "current" | "next" | "goal" }[];
  documentTypeQuestion: string;
  documentTypes: DocumentTypeOption[];
  successHeadline: string;
  successBody: string;
  successSteps: { label: string; status: "complete" | "current" | "next" | "goal" }[];
  successPrimaryCta: string;
  successSecondaryCta: string;
  successTertiaryCta?: string;
  checklistItems: string[];
  stickyCta: string;
  stickyCtaAfterUpload: string;
};

const EU_REGISTRATION_CONFIG: IntakeRouteConfig = {
  heroHeadline: "Step 3 of 5 — Upload your passport or EU ID",
  heroSubheadline:
    "Start with one identity document. We'll use it to verify your case details and begin your document review.",
  primaryCta: "Scan Passport or EU ID",
  secondaryCta: "Upload file instead",
  microcopy:
    "This usually takes about 2 minutes. Make sure the full document is visible and readable.",
  journeyTitle: "Your EU registration journey",
  steps: [
    { label: "Payment confirmed", status: "complete" },
    { label: "Case opened", status: "complete" },
    { label: "Upload passport or EU ID", status: "current" },
    { label: "Expert review and registration package", status: "next" },
    { label: "Appointment-ready / registration completed", status: "goal" },
  ],
  documentTypeQuestion: "What are you uploading?",
  documentTypes: [
    {
      id: "passport",
      label: "Passport",
      body: "Scan the photo page of your passport.",
      sides: 1,
      scanInstruction:
        "Place your passport photo page on a flat surface. Make sure all four corners are visible and avoid glare.",
      captureLabel: "Capture Passport",
    },
    {
      id: "eu_id",
      label: "EU national ID card",
      body: "Scan the front and back of your ID card.",
      sides: 2,
      scanInstruction:
        "Place your ID on a flat surface. We'll need the front and back.",
      captureLabel: "Capture Front",
    },
    {
      id: "other",
      label: "I'm not sure",
      body: "Upload the clearest identity document you have. We'll confirm if anything else is needed.",
      sides: 1,
      scanInstruction:
        "Place the document on a flat surface. Make sure all text is clear and all corners are visible.",
      captureLabel: "Capture Document",
    },
  ],
  successHeadline: "Passport or EU ID uploaded — your review can begin",
  successBody:
    "Your first document has been added to your case. We'll use it to verify your details and confirm your full EU registration checklist.",
  successSteps: [
    { label: "Payment confirmed", status: "complete" },
    { label: "Case opened", status: "complete" },
    { label: "Passport or EU ID uploaded", status: "complete" },
    { label: "Expert review and registration package", status: "current" },
    { label: "Appointment-ready / registration completed", status: "goal" },
  ],
  successPrimaryCta: "View My Full Document Checklist",
  successSecondaryCta: "Upload Another Document",
  successTertiaryCta: "Return to Case Overview",
  checklistItems: [
    "Passport or EU national ID — uploaded",
    "Proof of address in Spain, if already available",
    "Employment, self-employment, student, or sufficient-resources evidence",
    "Health insurance, EHIC, or S1 evidence if required",
    "790/012 fee payment proof when instructed",
    "EX-18 preparation guidance",
  ],
  stickyCta: "Upload Passport or EU ID",
  stickyCtaAfterUpload: "View Full Checklist",
};

const DNV_CONFIG: IntakeRouteConfig = {
  heroHeadline: "Step 3 of 5 — Upload your passport",
  heroSubheadline:
    "Start with your passport so we can verify your details and begin your Digital Nomad Visa document review.",
  primaryCta: "Scan Passport",
  secondaryCta: "Upload file instead",
  microcopy:
    "This usually takes about 2 minutes. Make sure the passport photo page is visible and readable.",
  journeyTitle: "Your Digital Nomad Visa journey",
  steps: [
    { label: "Payment confirmed", status: "complete" },
    { label: "Case opened", status: "complete" },
    { label: "Upload passport", status: "current" },
    { label: "Expert review and application preparation", status: "next" },
    { label: "Application ready / submitted", status: "goal" },
  ],
  documentTypeQuestion: "What are you uploading?",
  documentTypes: [
    {
      id: "passport",
      label: "Passport",
      body: "Scan the photo page of your passport.",
      sides: 1,
      scanInstruction:
        "Place your passport photo page on a flat surface. Make sure all four corners are visible and avoid glare.",
      captureLabel: "Capture Passport",
    },
    {
      id: "other",
      label: "Other identity document",
      body: "Use this only if your case manager has requested another document.",
      sides: 1,
      scanInstruction:
        "Place the document on a flat surface. Make sure all text is clear and all corners are visible.",
      captureLabel: "Capture Document",
    },
  ],
  successHeadline: "Passport uploaded — your review can begin",
  successBody:
    "Your passport has been added to your case. We'll use it to verify your details and confirm your full Digital Nomad Visa checklist.",
  successSteps: [
    { label: "Payment confirmed", status: "complete" },
    { label: "Case opened", status: "complete" },
    { label: "Passport uploaded", status: "complete" },
    { label: "Expert review and application preparation", status: "current" },
    { label: "Application ready / submitted", status: "goal" },
  ],
  successPrimaryCta: "View My Full Document Checklist",
  successSecondaryCta: "Upload Another Document",
  successTertiaryCta: "Return to Case Overview",
  checklistItems: [
    "Passport — uploaded",
    "Criminal record certificate, if required",
    "Proof of remote work, employment, freelance, or client activity",
    "Proof of income or financial means",
    "Health insurance evidence, if required",
    "Professional qualification or work-experience evidence, if required",
    "Apostille/legalisation and translation guidance, where required",
  ],
  stickyCta: "Upload Passport",
  stickyCtaAfterUpload: "View Full Checklist",
};

const GENERIC_CONFIG: IntakeRouteConfig = {
  heroHeadline: "Step 3 of 5 — Upload your first document",
  heroSubheadline:
    "Start with one identity document so we can verify your case details and begin your document review.",
  primaryCta: "Scan Document",
  secondaryCta: "Upload file instead",
  microcopy:
    "This usually takes about 2 minutes. Make sure the full document is visible and readable.",
  journeyTitle: "Your case journey",
  steps: [
    { label: "Payment confirmed", status: "complete" },
    { label: "Case opened", status: "complete" },
    { label: "Upload first document", status: "current" },
    { label: "Expert review and preparation", status: "next" },
    { label: "Next step ready", status: "goal" },
  ],
  documentTypeQuestion: "What are you uploading?",
  documentTypes: [
    {
      id: "passport",
      label: "Passport",
      body: "Scan the photo page of your passport.",
      sides: 1,
      scanInstruction:
        "Place your passport photo page on a flat surface. Make sure all four corners are visible and avoid glare.",
      captureLabel: "Capture Passport",
    },
    {
      id: "national_id",
      label: "National ID card",
      body: "Scan the front and back of your ID card.",
      sides: 2,
      scanInstruction:
        "Place your ID on a flat surface. We'll need the front and back.",
      captureLabel: "Capture Front",
    },
    {
      id: "other",
      label: "Other identity document",
      body: "Upload the clearest identity document you have.",
      sides: 1,
      scanInstruction:
        "Place the document on a flat surface. Make sure all text is clear and all corners are visible.",
      captureLabel: "Capture Document",
    },
  ],
  successHeadline: "First document uploaded — your review can begin",
  successBody:
    "Your document has been added to your case. We'll use it to verify your details and confirm your full checklist.",
  successSteps: [
    { label: "Payment confirmed", status: "complete" },
    { label: "Case opened", status: "complete" },
    { label: "First document uploaded", status: "complete" },
    { label: "Expert review and preparation", status: "current" },
    { label: "Next step ready", status: "goal" },
  ],
  successPrimaryCta: "View My Full Document Checklist",
  successSecondaryCta: "Upload Another Document",
  checklistItems: [
    "Identity document — uploaded",
    "Supporting documents as required for your case type",
  ],
  stickyCta: "Upload First Document",
  stickyCtaAfterUpload: "View Full Checklist",
};

export function getIntakeRouteConfig(productId: string | null | undefined): IntakeRouteConfig {
  if (!productId) return GENERIC_CONFIG;
  switch (productId) {
    case "eu-registration":
    case "EU Registration Certificate":
      return EU_REGISTRATION_CONFIG;
    case "digital-nomad-visa":
    case "Digital Nomad Visa (DNV)":
    case "Digital Nomad Visa":
      return DNV_CONFIG;
    default:
      return GENERIC_CONFIG;
  }
}
