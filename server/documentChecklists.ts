/**
 * Document checklist templates per visa type.
 * Used to auto-generate document slots when a case is created.
 */

import type { PaidVisaProduct } from "../shared/visaRoutes";

export interface DocumentSlotTemplate {
  documentType: string;
  label: string;
  description: string;
  requirementsText: string;
  isRequired: boolean;
  apostilleRequired: boolean;
  translationRequired: boolean;
  validityDays: number | null; // null = no expiry concern
  sortOrder: number;
}

const DNV_CHECKLIST: DocumentSlotTemplate[] = [
  {
    documentType: "passport",
    label: "Passport (Bio Page)",
    description: "A clear scan of your passport's biographical data page showing your photo, name, and expiry date.",
    requirementsText: "Must have at least 6 months validity remaining and 2+ blank pages. Passports issued more than 10 years ago are not accepted.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 1,
  },
  {
    documentType: "employment_letter",
    label: "Employment / Contract Certificate",
    description: "A letter from your employer confirming your role, start date, salary, and explicit permission to work remotely from Spain.",
    requirementsText: "Must show 3+ months seniority, state your salary, and explicitly mention remote work permission from Spain. If self-employed, upload client contracts showing 3+ months of ongoing work.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: true,
    validityDays: null,
    sortOrder: 2,
  },
  {
    documentType: "company_registration",
    label: "Company Registration Certificate",
    description: "Official proof that your employer (or your own company) is registered and active.",
    requirementsText: "Must show the company has been active for at least 1 year. Certificate of Good Standing, Certificate of Incorporation, or equivalent.",
    isRequired: true,
    apostilleRequired: true,
    translationRequired: true,
    validityDays: null,
    sortOrder: 3,
  },
  {
    documentType: "bank_statements",
    label: "Bank Statements (Last 3 Months)",
    description: "Your most recent 3 months of bank statements showing regular income deposits.",
    requirementsText: "Must show monthly income of at least €2,849 (200% IPREM). Your name must match your passport. Include all pages.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: 90,
    sortOrder: 4,
  },
  {
    documentType: "criminal_record",
    label: "Criminal Record Certificate",
    description: "An official police clearance certificate from your country of residence (e.g., FBI check for US, ACRO for UK, RCMP for Canada).",
    requirementsText: "Must be issued within the last 90 days. Must have a Federal Apostille (from the Department of State for US, or equivalent). Must be translated to Spanish by a certified translator. State-level background checks are NOT accepted.",
    isRequired: true,
    apostilleRequired: true,
    translationRequired: true,
    validityDays: 90,
    sortOrder: 5,
  },
  {
    documentType: "health_insurance",
    label: "Health Insurance Policy",
    description: "Private health insurance covering you in Spain with full coverage and no co-payments.",
    requirementsText: "Must be from an insurer authorised to operate in Spain. Must provide full coverage with no co-payments or deductibles. Must cover the duration of your visa.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 6,
  },
  {
    documentType: "degree_or_experience",
    label: "University Degree OR Proof of 3+ Years Experience",
    description: "Either your university degree certificate OR employment letters proving 3+ years of professional experience in your field.",
    requirementsText: "If uploading a degree: must be apostilled and translated to Spanish. If uploading experience letters: must show 3+ years in a relevant field.",
    isRequired: true,
    apostilleRequired: true,
    translationRequired: true,
    validityDays: null,
    sortOrder: 7,
  },
  {
    documentType: "passport_photo",
    label: "Passport Photo",
    description: "A recent passport-sized photo meeting Spanish visa requirements.",
    requirementsText: "White background, facing forward, no glasses, no head coverings (unless religious). Taken within the last 6 months.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 8,
  },
];

const NLV_CHECKLIST: DocumentSlotTemplate[] = [
  {
    documentType: "passport",
    label: "Passport (Bio Page)",
    description: "A clear scan of your passport's biographical data page.",
    requirementsText: "Must have at least 1 year validity remaining and 2+ blank pages. Passports issued more than 10 years ago are not accepted.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 1,
  },
  {
    documentType: "bank_statements",
    label: "Proof of Financial Means",
    description: "Bank statements or financial certificates proving you have sufficient funds to live in Spain without working.",
    requirementsText: "Must show at least 400% IPREM (~€2,400/month) for the main applicant plus 100% IPREM per family member. Must include: bank name and address, full account identification, opening dates, balance as of Dec 31 of previous year, and average balance for the previous year.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 2,
  },
  {
    documentType: "criminal_record",
    label: "Criminal Record Certificate",
    description: "An official police clearance certificate (FBI for US, ACRO for UK, RCMP for Canada).",
    requirementsText: "Must be issued within the last 6 months. Must have a Federal Apostille. Must be translated to Spanish by a certified translator. Must cover countries of residence in the last 5 years.",
    isRequired: true,
    apostilleRequired: true,
    translationRequired: true,
    validityDays: 180,
    sortOrder: 3,
  },
  {
    documentType: "health_insurance",
    label: "Health Insurance Policy",
    description: "Private health insurance with full coverage in Spain, no co-payments, no deductibles.",
    requirementsText: "Must be from an insurer authorised to operate in Spain. Must provide unlimited coverage with absolutely no co-payments or deductibles. This is strictly enforced for NLV.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 4,
  },
  {
    documentType: "medical_certificate",
    label: "Medical Certificate (Bilingual)",
    description: "A bilingual medical certificate confirming you are in good health.",
    requirementsText: "Must be completed by a licensed physician, bear the doctor's stamp or be on medical letterhead. Must not be older than 3 months. Use the Spanish consulate's template if available.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: 90,
    sortOrder: 5,
  },
  {
    documentType: "passport_photo",
    label: "Passport Photo",
    description: "A recent passport-sized photo meeting Spanish visa requirements.",
    requirementsText: "White background, facing forward, no glasses. Taken within the last 6 months.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 6,
  },
  {
    documentType: "accommodation_proof",
    label: "Proof of Accommodation in Spain",
    description: "Evidence that you have somewhere to live in Spain (rental contract, property deed, or hotel booking for initial period).",
    requirementsText: "Rental contract, property purchase deed, or accommodation booking covering at least the first month.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 7,
  },
];

const STUDENT_CHECKLIST: DocumentSlotTemplate[] = [
  {
    documentType: "passport",
    label: "Passport (Bio Page)",
    description: "A clear scan of your passport's biographical data page.",
    requirementsText: "Must be valid for the duration of your studies. Must have 2+ blank pages.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 1,
  },
  {
    documentType: "acceptance_letter",
    label: "Acceptance Letter from Spanish Institution",
    description: "Official acceptance or enrollment letter from your Spanish educational institution.",
    requirementsText: "Must clearly state: institution name, course name, start and end dates, and your full name.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 2,
  },
  {
    documentType: "bank_statements",
    label: "Proof of Financial Means",
    description: "Bank statements proving you can support yourself during your studies.",
    requirementsText: "Must show at least €600/month for the duration of your studies. Your name must match your passport.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 3,
  },
  {
    documentType: "health_insurance",
    label: "Health Insurance Policy",
    description: "Private health insurance covering you in Spain for the duration of your studies.",
    requirementsText: "Must provide full coverage in Spain for the entire study period.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 4,
  },
  {
    documentType: "criminal_record",
    label: "Criminal Record Certificate",
    description: "An official police clearance certificate from your country.",
    requirementsText: "Must be issued within the last 3-6 months. Must be apostilled and translated to Spanish.",
    isRequired: true,
    apostilleRequired: true,
    translationRequired: true,
    validityDays: 180,
    sortOrder: 5,
  },
  {
    documentType: "medical_certificate",
    label: "Medical Certificate",
    description: "A medical certificate confirming you are in good health.",
    requirementsText: "Must be issued within the last 3 months. Must bear the doctor's stamp.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: 90,
    sortOrder: 6,
  },
  {
    documentType: "passport_photo",
    label: "Passport Photo",
    description: "A recent passport-sized photo.",
    requirementsText: "White background, facing forward, taken within last 6 months.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 7,
  },
];

const WORK_VISA_CHECKLIST: DocumentSlotTemplate[] = [
  {
    documentType: "passport",
    label: "Passport (Bio Page)",
    description: "A clear scan of your passport's biographical data page.",
    requirementsText: "Must have at least 6 months validity remaining and 2+ blank pages.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 1,
  },
  {
    documentType: "job_offer",
    label: "Job Offer / Employment Contract",
    description: "A formal job offer or employment contract from your Spanish employer.",
    requirementsText: "Must include: employer's company name, CIF number, your role, salary, and start date.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 2,
  },
  {
    documentType: "employer_registration",
    label: "Employer's Company Registration (CIF)",
    description: "Proof that your Spanish employer is a registered company.",
    requirementsText: "Must include the employer's CIF number and company registration details.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 3,
  },
  {
    documentType: "criminal_record",
    label: "Criminal Record Certificate",
    description: "An official police clearance certificate from your country.",
    requirementsText: "Must be apostilled and translated to Spanish. Issued within the last 3-6 months.",
    isRequired: true,
    apostilleRequired: true,
    translationRequired: true,
    validityDays: 180,
    sortOrder: 4,
  },
  {
    documentType: "health_insurance",
    label: "Health Insurance Policy",
    description: "Private health insurance covering you in Spain.",
    requirementsText: "Full coverage in Spain for the initial period.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 5,
  },
  {
    documentType: "qualifications",
    label: "Professional Qualifications",
    description: "Relevant professional qualifications, certifications, or degrees for your role.",
    requirementsText: "Must be relevant to the job offered. May need apostille and translation depending on the document.",
    isRequired: true,
    apostilleRequired: true,
    translationRequired: true,
    validityDays: null,
    sortOrder: 6,
  },
  {
    documentType: "passport_photo",
    label: "Passport Photo",
    description: "A recent passport-sized photo.",
    requirementsText: "White background, facing forward, taken within last 6 months.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 7,
  },
];

const EU_REGISTRATION_CHECKLIST: DocumentSlotTemplate[] = [
  {
    documentType: "passport",
    label: "Passport or EU National ID",
    description: "A clear scan of your passport bio page or both sides of your EU national ID card.",
    requirementsText: "Must be valid (not expired). If using EU ID, scan both front and back.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 1,
  },
  {
    documentType: "proof_of_address",
    label: "Proof of Address in Spain",
    description: "Rental contract, utility bill, or empadronamiento certificate showing your Spanish address.",
    requirementsText: "Must show your full name and a Spanish address. Rental contracts must be signed. Utility bills must be recent (within 3 months).",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: 90,
    sortOrder: 2,
  },
  {
    documentType: "employment_evidence",
    label: "Employment / Self-Employment / Student / Sufficient Resources Evidence",
    description: "Proof that you meet one of the EU registration conditions: employed, self-employed, studying, or have sufficient resources.",
    requirementsText: "Employment contract, business registration, university enrollment, or bank statements showing sufficient funds. Must clearly link to your name.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 3,
  },
  {
    documentType: "health_insurance",
    label: "Health Insurance / EHIC / S1 Form",
    description: "Evidence of health coverage in Spain — private insurance, EHIC card, or S1 form from your home country.",
    requirementsText: "Must cover you in Spain. If using EHIC, scan both sides. If using S1, include the full form. Private insurance must show coverage dates and your name.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 4,
  },
  {
    documentType: "fee_payment",
    label: "790/012 Fee Payment Proof",
    description: "Receipt of the Tasa 012 or Modelo 790 fee payment (when instructed by your case manager).",
    requirementsText: "We will tell you exactly when and how to pay this fee. Do not pay it until instructed.",
    isRequired: false,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 5,
  },
  {
    documentType: "ex18_form",
    label: "EX-18 Form (Prepared by SpainPorFavor)",
    description: "The official application form for EU citizen registration. We prepare this for you.",
    requirementsText: "This will be prepared by your case manager using your uploaded documents. You will review and sign it before submission.",
    isRequired: true,
    apostilleRequired: false,
    translationRequired: false,
    validityDays: null,
    sortOrder: 6,
  },
];

/**
 * Get the document checklist for a given paid visa product.
 *
 * The parameter is typed as `PaidVisaProduct` (the canonical 5-slug enum from
 * shared/visaRoutes.ts) — not a free `string`. This means:
 *
 *   - Display names like "Digital Nomad Visa (DNV)" cannot be passed here
 *     without an explicit cast (and callers must validate first).
 *   - Adding a new paid product without updating this switch is a compile error
 *     via the `never` narrowing in the default branch.
 *   - The previous "default to DNV" fallback is gone.
 *
 * Runtime defence-in-depth: if a caller bypasses the type system via cast,
 * the function throws rather than silently returning DNV.
 */
export function getChecklistForVisaType(product: PaidVisaProduct): DocumentSlotTemplate[] {
  switch (product) {
    case "digital-nomad-visa":
      return DNV_CHECKLIST;
    case "non-lucrative-visa":
      return NLV_CHECKLIST;
    case "student-visa":
      return STUDENT_CHECKLIST;
    case "work-visa":
      return WORK_VISA_CHECKLIST;
    case "eu-registration":
      return EU_REGISTRATION_CHECKLIST;
    default: {
      const _exhaustive: never = product;
      throw new Error(`Unknown visa product: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
