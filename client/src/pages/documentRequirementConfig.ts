/**
 * Document Requirement Configuration
 * Route-aware, document-specific config for the upload page.
 * Determines: hero copy, requirement checklists, upload mode, multi-file support, help links.
 */

export type ProductType = "eu-registration" | "digital-nomad-visa" | "generic";

export type DocumentType =
  | "passport"
  | "eu_national_id"
  | "employment_contract"
  | "company_registration_certificate"
  | "bank_statements"
  | "criminal_record_certificate"
  | "health_insurance_policy"
  | "university_degree_or_experience"
  | "passport_photo"
  | "proof_of_address"
  | "ex18"
  | "modelo_790_012";

export type UploadMode = "camera_primary" | "file_primary" | "file_only" | "photo_primary";

export interface DocumentRequirement {
  id: DocumentType;
  title: string;
  uploadMode: UploadMode;
  acceptedFileTypes: string[];
  maxFileSizeMB: number;
  allowsMultipleFiles: boolean;
  requiresFrontBack: boolean;
  primaryCta: string;
  secondaryCta: string;
  uploadCardTitle: string;
  uploadCardBody: string;
}

export interface RouteDocumentCopy {
  badge: string;
  headline: string;
  subheadline: string;
  requirementsTitle: string;
  requirementsChecklist: string[];
  additionalNotes?: string[];
}

// --- Base document requirements (upload mode, file types, multi-file) ---

export const DOCUMENT_REQUIREMENTS: Record<DocumentType, DocumentRequirement> = {
  passport: {
    id: "passport",
    title: "Passport",
    uploadMode: "camera_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: false,
    requiresFrontBack: false,
    primaryCta: "Use camera to scan",
    secondaryCta: "Upload photo or PDF instead",
    uploadCardTitle: "Scan your identity document",
    uploadCardBody: "Position your passport photo page within the frame for a clear capture.",
  },
  eu_national_id: {
    id: "eu_national_id",
    title: "EU National ID",
    uploadMode: "camera_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: false,
    requiresFrontBack: true,
    primaryCta: "Use camera to scan",
    secondaryCta: "Upload photo or PDF instead",
    uploadCardTitle: "Scan your identity document",
    uploadCardBody: "You'll need to capture both the front and back of your ID card.",
  },
  employment_contract: {
    id: "employment_contract",
    title: "Employment / Contract Certificate",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: true,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "PDF is best. You can also upload a clear photo if that's all you have.",
  },
  company_registration_certificate: {
    id: "company_registration_certificate",
    title: "Company Registration Certificate",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: true,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "PDF is best. You can also upload a clear photo if that's all you have.",
  },
  bank_statements: {
    id: "bank_statements",
    title: "Bank Statements",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: true,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "PDF is best. You can upload multiple statements covering the required period.",
  },
  criminal_record_certificate: {
    id: "criminal_record_certificate",
    title: "Criminal Record Certificate",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: true,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "PDF is best. Include the apostille/legalisation if you have it.",
  },
  health_insurance_policy: {
    id: "health_insurance_policy",
    title: "Health Insurance Policy",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: true,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "PDF is best. You can also upload a clear photo if that's all you have.",
  },
  university_degree_or_experience: {
    id: "university_degree_or_experience",
    title: "University Degree or Professional Experience",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: true,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "PDF is best. You can also upload a clear photo if that's all you have.",
  },
  passport_photo: {
    id: "passport_photo",
    title: "Passport Photo",
    uploadMode: "photo_primary",
    acceptedFileTypes: ["JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: false,
    requiresFrontBack: false,
    primaryCta: "Upload passport photo",
    secondaryCta: "Take photo",
    uploadCardTitle: "Upload your passport photo",
    uploadCardBody: "A recent passport-style photo with white background, facing forward.",
  },
  proof_of_address: {
    id: "proof_of_address",
    title: "Proof of Address",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: false,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "PDF is best. You can also upload a clear photo if that's all you have.",
  },
  ex18: {
    id: "ex18",
    title: "EX-18 Form",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: false,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "Upload the completed and signed EX-18 form.",
  },
  modelo_790_012: {
    id: "modelo_790_012",
    title: "Modelo 790-012 (Fee Payment)",
    uploadMode: "file_primary",
    acceptedFileTypes: ["PDF", "JPG", "PNG"],
    maxFileSizeMB: 20,
    allowsMultipleFiles: false,
    requiresFrontBack: false,
    primaryCta: "Upload PDF or file",
    secondaryCta: "Take a photo instead",
    uploadCardTitle: "Upload your document",
    uploadCardBody: "Upload the paid Modelo 790-012 receipt.",
  },
};

// --- Route-specific copy per productType + documentType ---

type CopyKey = `${ProductType}:${DocumentType}`;

const ROUTE_COPY: Partial<Record<CopyKey, RouteDocumentCopy>> = {
  // --- EU REGISTRATION ---
  "eu-registration:passport": {
    badge: "EU Registration Certificate · Required",
    headline: "Upload your passport",
    subheadline: "We'll use this to verify your identity for the EU registration application.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Full photo page visible",
      "Name readable",
      "Passport number readable",
      "Expiry date readable",
      "No glare or blur",
      "All corners visible",
    ],
  },
  "eu-registration:eu_national_id": {
    badge: "EU Registration Certificate · Required",
    headline: "Upload your EU national ID",
    subheadline: "We'll use this to verify your identity and EU citizenship for the registration.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Front and back required",
      "Name readable",
      "ID number readable",
      "Expiry date readable",
      "No glare or blur",
    ],
  },
  "eu-registration:employment_contract": {
    badge: "EU Registration Certificate · Required",
    headline: "Upload your proof of employment or work status",
    subheadline: "We'll use this to confirm the basis for your EU registration in Spain.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Your full name",
      "Your employer or work activity",
      "Your employment, self-employment, student, or sufficient-resources basis",
      "Dates or current validity where applicable",
      "Clear readable text",
      "Translation if required",
    ],
  },
  "eu-registration:proof_of_address": {
    badge: "EU Registration Certificate · Required",
    headline: "Upload your proof of address in Spain",
    subheadline: "We'll use this to confirm your residence in Spain for the registration.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Your full name",
      "Your address in Spain",
      "Recent date (within last 3 months)",
      "Clear readable text",
    ],
  },
  "eu-registration:health_insurance_policy": {
    badge: "EU Registration Certificate · Required",
    headline: "Upload your health insurance policy",
    subheadline: "We'll use this to confirm you have health coverage in Spain.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Policy holder name visible",
      "Coverage in Spain visible",
      "Coverage dates visible",
      "No co-payment or required coverage language if applicable",
      "Insurer name visible",
    ],
  },
  "eu-registration:bank_statements": {
    badge: "EU Registration Certificate · Required",
    headline: "Upload your bank statements",
    subheadline: "We'll use this to confirm sufficient financial resources for your registration.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Covers the required date range",
      "Shows account holder name",
      "Shows income deposits or relevant transactions",
      "All pages included",
      "PDF preferred",
    ],
  },
  "eu-registration:ex18": {
    badge: "EU Registration Certificate · Required",
    headline: "Upload your completed EX-18 form",
    subheadline: "The official application form for EU citizen registration in Spain.",
    requirementsTitle: "Before you upload, check that the form:",
    requirementsChecklist: [
      "Is fully completed",
      "Is signed and dated",
      "Has your correct personal details",
      "All sections relevant to your case are filled in",
    ],
  },
  "eu-registration:modelo_790_012": {
    badge: "EU Registration Certificate · Required",
    headline: "Upload your Modelo 790-012 payment receipt",
    subheadline: "The government fee payment receipt for your EU registration.",
    requirementsTitle: "Before you upload, check that the receipt shows:",
    requirementsChecklist: [
      "Payment confirmation visible",
      "Your name matches your application",
      "Amount paid is correct",
      "Date of payment visible",
    ],
  },

  // --- DIGITAL NOMAD VISA ---
  "digital-nomad-visa:passport": {
    badge: "Digital Nomad Visa · Required",
    headline: "Upload your passport",
    subheadline: "We'll use this to verify your identity for the Digital Nomad Visa application.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Full photo page visible",
      "Name readable",
      "Passport number readable",
      "Expiry date readable (6+ months validity required)",
      "No glare or blur",
      "All corners visible",
    ],
  },
  "digital-nomad-visa:employment_contract": {
    badge: "Digital Nomad Visa · Required",
    headline: "Upload your Employment / Contract Certificate",
    subheadline: "We'll use this to confirm your remote-work relationship, role, income, and permission to work from Spain.",
    requirementsTitle: "Before you upload, check that the document includes:",
    requirementsChecklist: [
      "Your full name",
      "Your role or service relationship",
      "Your start date or proof of at least 3 months of work relationship",
      "Your salary, payment terms, or income basis where applicable",
      "Clear permission to work remotely from Spain if you are employed",
      "Company name and contact details where applicable",
      "Date and signature where applicable",
      "Certified translation if required",
    ],
    additionalNotes: [
      "If you are self-employed, upload client contracts, client letters, or other proof showing ongoing remote work for non-Spanish clients.",
      "If you are not sure whether your document is acceptable, upload the best version you have and our team will review it.",
    ],
  },
  "digital-nomad-visa:company_registration_certificate": {
    badge: "Digital Nomad Visa · Required",
    headline: "Upload your Company Registration Certificate",
    subheadline: "We'll use this to verify the company you work for or own is registered outside Spain.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Company name",
      "Registration number",
      "Country of registration (must be outside Spain)",
      "Date of registration",
      "Your name as director/owner if applicable",
      "Clear readable text",
      "Certified translation if required",
    ],
  },
  "digital-nomad-visa:bank_statements": {
    badge: "Digital Nomad Visa · Required",
    headline: "Upload your bank statements",
    subheadline: "We'll use this to confirm you meet the minimum income threshold for the Digital Nomad Visa.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Covers the required date range (typically last 3-6 months)",
      "Shows account holder name matching your passport",
      "Shows regular income deposits",
      "All pages included",
      "PDF preferred",
    ],
  },
  "digital-nomad-visa:criminal_record_certificate": {
    badge: "Digital Nomad Visa · Required",
    headline: "Upload your Criminal Record Certificate",
    subheadline: "We'll use this to confirm a clean record for your visa application.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Issued by the correct authority for your country",
      "Name matches your passport exactly",
      "Issue date visible (must be recent, typically within 3-6 months)",
      "Apostille or legalisation attached if required",
      "Certified translation if required",
    ],
  },
  "digital-nomad-visa:health_insurance_policy": {
    badge: "Digital Nomad Visa · Required",
    headline: "Upload your Health Insurance Policy",
    subheadline: "We'll use this to confirm you have qualifying health coverage for Spain.",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Policy holder name visible",
      "Coverage in Spain explicitly stated",
      "Coverage dates visible (must cover your stay)",
      "No co-payment clause (full coverage required for DNV)",
      "Insurer name visible",
    ],
  },
  "digital-nomad-visa:university_degree_or_experience": {
    badge: "Digital Nomad Visa · Required",
    headline: "Upload your University Degree or Professional Experience",
    subheadline: "We'll use this to confirm you meet the qualification requirements (degree or 3+ years experience).",
    requirementsTitle: "Before you upload, check that the document shows:",
    requirementsChecklist: [
      "Your full name",
      "Institution or employer name",
      "Qualification or role title",
      "Dates of study or employment",
      "Clear readable text",
      "Certified translation if required",
    ],
  },
  "digital-nomad-visa:passport_photo": {
    badge: "Digital Nomad Visa · Required",
    headline: "Upload your passport photo",
    subheadline: "A recent biometric-style photo for your visa application.",
    requirementsTitle: "Before you upload, check that the photo:",
    requirementsChecklist: [
      "White or light background",
      "Face clearly visible, facing forward",
      "No glasses or head covering (unless religious)",
      "Recent (taken within last 6 months)",
      "High resolution, not blurry",
    ],
  },
};

// --- Journey stepper config ---

export interface JourneyStep {
  label: string;
  status: "complete" | "current" | "upcoming";
}

export function getJourneySteps(productType: ProductType, isIdentityDocument: boolean): { title: string; steps: string[] } {
  if (productType === "digital-nomad-visa") {
    return {
      title: "YOUR DIGITAL NOMAD VISA JOURNEY",
      steps: [
        "Payment confirmed",
        "Case opened",
        isIdentityDocument ? "Upload passport or EU ID" : "Upload visa documents",
        "Expert review and application preparation",
        "Application ready / submitted",
      ],
    };
  }

  if (productType === "eu-registration") {
    return {
      title: "YOUR EU REGISTRATION JOURNEY",
      steps: [
        "Payment confirmed",
        "Case opened",
        isIdentityDocument ? "Upload passport or EU ID" : "Upload required documents",
        "Expert review and registration package",
        "Appointment-ready / registration completed",
      ],
    };
  }

  return {
    title: "YOUR APPLICATION JOURNEY",
    steps: [
      "Payment confirmed",
      "Case opened",
      isIdentityDocument ? "Upload passport or EU ID" : "Upload required documents",
      "Expert review",
      "Application completed",
    ],
  };
}

// --- Helper to get route-specific copy ---

export function getDocumentCopy(
  productType: ProductType,
  documentType: DocumentType
): RouteDocumentCopy {
  const key: CopyKey = `${productType}:${documentType}`;
  const specific = ROUTE_COPY[key];

  if (specific) return specific;

  // Generic fallback
  const baseReq = DOCUMENT_REQUIREMENTS[documentType];
  return {
    badge: "Required document",
    headline: `Upload your ${baseReq?.title || "document"}`,
    subheadline: "Upload a clear copy so our team can review it.",
    requirementsTitle: "Before you upload, check that the document:",
    requirementsChecklist: [
      "Shows your full name",
      "Is clearly readable",
      "All pages are included",
      "Is not expired (if applicable)",
    ],
  };
}

// --- Helper to determine if a document type is an identity document ---

export function isIdentityDocumentType(docType: string): boolean {
  return docType === "passport" || docType === "eu_national_id";
}

// --- Helper to get mobile sticky CTA text ---

export function getStickyCTAText(docType: string): string {
  if (isIdentityDocumentType(docType)) {
    return "Scan or upload document";
  }
  return "Upload PDF or file";
}

// --- Map productType string from backend to our enum ---

export function resolveProductType(raw: string | undefined | null): ProductType {
  if (!raw) return "generic";
  const lower = raw.toLowerCase().replace(/[\s_]+/g, "-");
  if (lower.includes("eu") && lower.includes("reg")) return "eu-registration";
  if (lower.includes("digital") || lower.includes("nomad") || lower.includes("dnv")) return "digital-nomad-visa";
  return "generic";
}

// --- Map documentType string from backend slot to our enum ---

export function resolveDocumentType(raw: string | undefined | null): DocumentType | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().replace(/[\s-]+/g, "_");

  // Direct matches
  if (lower in DOCUMENT_REQUIREMENTS) return lower as DocumentType;

  // Fuzzy matches
  if (lower.includes("passport") && lower.includes("photo")) return "passport_photo";
  if (lower.includes("passport")) return "passport";
  if (lower.includes("eu") && lower.includes("id")) return "eu_national_id";
  if (lower.includes("national") && lower.includes("id")) return "eu_national_id";
  if (lower.includes("employ") || lower.includes("contract")) return "employment_contract";
  if (lower.includes("company") || lower.includes("registration")) return "company_registration_certificate";
  if (lower.includes("bank") || lower.includes("statement")) return "bank_statements";
  if (lower.includes("criminal") || lower.includes("record")) return "criminal_record_certificate";
  if (lower.includes("health") || lower.includes("insurance")) return "health_insurance_policy";
  if (lower.includes("degree") || lower.includes("university") || lower.includes("experience")) return "university_degree_or_experience";
  if (lower.includes("address") || lower.includes("proof")) return "proof_of_address";
  if (lower.includes("ex") && lower.includes("18")) return "ex18";
  if (lower.includes("790") || lower.includes("modelo")) return "modelo_790_012";

  return null;
}
