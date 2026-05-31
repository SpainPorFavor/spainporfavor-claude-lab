/**
 * AI Document Validation — uses multimodal LLM to validate uploaded documents.
 * Each document type has a specific validation prompt.
 */

import { invokeLLM } from "./_core/llm";
import { storageGetSignedUrl } from "./storage";
import { z } from "zod";

const validationResultSchema = z.object({
  status: z.enum(["pass", "needs_revision", "unclear"]),
  issues: z.array(z.string()),
  feedback: z.string(),
});

export interface ValidationResult {
  status: "pass" | "needs_revision" | "unclear";
  issues: string[];
  feedback: string;
}

/**
 * Validate a document using the multimodal LLM.
 * Sends the document image/PDF to the LLM with a type-specific prompt.
 */
export async function validateDocument(params: {
  documentType: string;
  fileKey: string;
  mimeType: string;
  clientName: string;
  visaType: string;
  employerName?: string;
}): Promise<ValidationResult> {
  const { documentType, fileKey, mimeType, clientName, visaType } = params;

  // Get a signed URL for the uploaded document
  const signedUrl = await storageGetSignedUrl(fileKey);

  // Build the validation prompt based on document type
  const prompt = getValidationPrompt(documentType, clientName, visaType, params.employerName);

  // Determine content type for the LLM
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  const userContent: any[] = [
    { type: "text", text: prompt },
  ];

  if (isImage) {
    userContent.push({
      type: "image_url",
      image_url: { url: signedUrl, detail: "high" },
    });
  } else if (isPdf) {
    userContent.push({
      type: "file_url",
      file_url: { url: signedUrl, mime_type: "application/pdf" },
    });
  } else {
    // For unsupported types, return unclear
    return {
      status: "unclear",
      issues: ["Unsupported file format for AI validation"],
      feedback: "We couldn't automatically validate this file format. Our team will review it manually within 24 hours.",
    };
  }

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a document validation specialist for a Spanish visa application service. Your job is to examine uploaded documents and determine if they meet the requirements for a Spanish visa application. Be thorough but fair — if a document clearly meets the requirements, pass it. If there's a specific issue, flag it with actionable feedback. If you genuinely cannot determine the document's validity (e.g., image is too blurry, wrong language you can't read), mark it as unclear.

IMPORTANT: Return your response as valid JSON matching this exact schema:
{
  "status": "pass" | "needs_revision" | "unclear",
  "issues": ["list of specific issues found, empty array if pass"],
  "feedback": "A clear, friendly message to show the client explaining the result"
}`,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "document_validation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["pass", "needs_revision", "unclear"],
                description: "The validation result status",
              },
              issues: {
                type: "array",
                items: { type: "string" },
                description: "List of specific issues found",
              },
              feedback: {
                type: "string",
                description: "Client-facing feedback message",
              },
            },
            required: ["status", "issues", "feedback"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const raw = JSON.parse(content);
      const parsed = validationResultSchema.safeParse(raw);
      if (parsed.success) {
        return parsed.data;
      }
      console.error("[Document Validation] LLM returned invalid schema:", parsed.error.issues);
      return {
        status: "unclear" as const,
        issues: ["AI validation returned unexpected format"],
        feedback: "We couldn't complete the automated check. Our team will review this document manually within 24 hours.",
      };
    }

    return {
      status: "unclear",
      issues: ["AI validation returned unexpected format"],
      feedback: "We couldn't complete the automated check. Our team will review this document manually within 24 hours.",
    };
  } catch (error) {
    console.error("[Document Validation] LLM error:", error);
    return {
      status: "unclear",
      issues: ["AI validation service temporarily unavailable"],
      feedback: "Our automated check is temporarily unavailable. Our team will review this document manually within 24 hours.",
    };
  }
}

function getValidationPrompt(
  documentType: string,
  clientName: string,
  visaType: string,
  employerName?: string
): string {
  const today = new Date().toISOString().split("T")[0];

  switch (documentType) {
    case "passport":
      return `Analyse this document. It should be the biographical data page of a passport.

Check the following:
1. DOCUMENT TYPE: Is this a passport bio page showing photo, name, date of birth, passport number, and expiry date?
2. EXPIRY DATE: What is the expiry date? It must be at least 6 months from today (${today}).
3. NAME: Does the name match or closely resemble "${clientName}"?
4. BLANK PAGES: If multiple pages are shown, are there at least 2 blank visa pages?
5. ISSUE DATE: Was this passport issued within the last 10 years?

If the document is clearly a valid passport bio page with sufficient validity, mark as "pass".`;

    case "criminal_record":
      return `Analyse this document. It should be a criminal record certificate (also called police clearance, background check, or DBS check).

Check the following:
1. DOCUMENT TYPE: Is this actually a criminal record/police clearance certificate? (not a court record, not a driving record)
2. DATE ISSUED: What date was this document issued? It must be within the last 90 days of today (${today}).
3. APOSTILLE: Is there an apostille stamp, seal, or attached apostille page visible? Look for "Apostille (Convention de La Haye)" or similar official certification.
4. NAME: Does the name on this document match or closely resemble "${clientName}"?
5. ISSUING AUTHORITY: What authority issued this? (e.g., FBI, ACRO, RCMP, AFP)

If the document appears to be a valid criminal record certificate with apostille and within date, mark as "pass".`;

    case "health_insurance":
      return `Analyse this document. It should be a health insurance policy or certificate of coverage for Spain.

Check the following:
1. DOCUMENT TYPE: Is this a health insurance policy, certificate of insurance, or coverage confirmation?
2. COVERAGE TERRITORY: Does it explicitly mention coverage in Spain, EU, or worldwide?
3. COVERAGE TYPE: Does it indicate full/comprehensive coverage? Look for mentions of: no co-payments, no deductibles, full coverage.
4. INSURED NAME: Does the name match or closely resemble "${clientName}"?
5. VALIDITY PERIOD: What are the start and end dates? Does coverage appear current?
6. INSURANCE PROVIDER: Is the provider named?

${visaType.includes("non-lucrative") || visaType.includes("nlv") ? "IMPORTANT: For Non-Lucrative Visa, the insurance MUST have NO co-payments and NO deductibles. This is strictly enforced." : ""}

If the document clearly shows valid health insurance covering Spain with appropriate coverage level, mark as "pass".`;

    case "bank_statements":
      return `Analyse this document. It should be a bank statement or financial document proving income or savings.

Check the following:
1. DOCUMENT TYPE: Is this a bank statement, account summary, or financial certificate from a recognised bank?
2. ACCOUNT HOLDER: Does the name match or closely resemble "${clientName}"?
3. BANK DETAILS: Is the bank name visible?
4. DATES: What period does this statement cover? We need recent statements (last 3 months).
5. INCOME/BALANCE: Can you identify regular income deposits or a substantial balance?

Note: We will verify the specific amounts separately. Focus on whether this is a genuine bank statement with the correct name and recent dates.

If this is clearly a bank statement for the named person with recent dates, mark as "pass".`;

    case "employment_letter":
      return `Analyse this document. It should be a letter or certificate from an employer confirming employment and permission to work remotely from Spain.

Check the following:
1. DOCUMENT TYPE: Is this an employment letter, contract, or certificate from a company?
2. EMPLOYEE NAME: Does it reference "${clientName}"?
3. COMPANY NAME: ${employerName ? `Does it reference "${employerName}"?` : "What company is named?"}
4. START DATE/SENIORITY: Does it show the employee has been with the company for at least 3 months?
5. REMOTE WORK PERMISSION: Does it explicitly state permission/agreement for the employee to work remotely from Spain?
6. INCOME: Does it state the employee's salary or compensation?

If the document clearly confirms employment with remote work permission and sufficient seniority, mark as "pass".`;

    case "company_registration":
      return `Analyse this document. It should be a certificate of company registration, incorporation, or similar official document.

Check the following:
1. DOCUMENT TYPE: Is this an official company registration document (Certificate of Incorporation, Certificate of Good Standing, Articles of Organization, or similar)?
2. COMPANY NAME: ${employerName ? `Does the company name match "${employerName}"?` : "What company is named?"}
3. DATE OF INCORPORATION: What date was the company incorporated/registered? It must be at least 1 year before today (${today}).
4. ACTIVITY STATUS: Does the document indicate the company is active/in good standing?
5. APOSTILLE: Is there an apostille stamp or attached apostille page visible?

If this is clearly a valid company registration showing 1+ year of activity, mark as "pass".`;

    case "degree_or_experience":
      return `Analyse this document. It should be either a university degree certificate OR employment letters proving 3+ years of professional experience.

Check the following:
1. DOCUMENT TYPE: Is this a university degree/diploma, OR an employment reference letter?
2. NAME: Does the name match or closely resemble "${clientName}"?
3. If DEGREE: What degree and field of study? Is it from a recognised institution?
4. If EXPERIENCE LETTER: Does it show 3+ years of professional experience? What role/field?
5. APOSTILLE (for degrees): Is there an apostille stamp visible?

If this is clearly a valid degree or experience documentation, mark as "pass".`;

    case "medical_certificate":
      return `Analyse this document. It should be a medical certificate confirming good health.

Check the following:
1. DOCUMENT TYPE: Is this a medical certificate or health clearance document?
2. PATIENT NAME: Does the name match or closely resemble "${clientName}"?
3. DATE: What date was this issued? It must be within the last 3 months of today (${today}).
4. DOCTOR'S DETAILS: Is there a doctor's stamp, signature, or medical letterhead?
5. CONTENT: Does it confirm the person is in good health / fit to travel?

If this is clearly a valid, recent medical certificate with proper medical authority, mark as "pass".`;

    case "acceptance_letter":
      return `Analyse this document. It should be an acceptance or enrollment letter from a Spanish educational institution.

Check the following:
1. DOCUMENT TYPE: Is this an acceptance letter, enrollment confirmation, or admission letter from an educational institution?
2. STUDENT NAME: Does the name match or closely resemble "${clientName}"?
3. INSTITUTION: What institution issued this? Is it clearly a Spanish institution?
4. COURSE DETAILS: Are the course name, start date, and end date mentioned?
5. DATES: Does the course start in the future or is currently ongoing?

If this clearly confirms enrollment at a Spanish institution with course dates, mark as "pass".`;

    case "passport_photo":
      return `Analyse this image. It should be a passport-sized photo suitable for a Spanish visa application.

Check the following:
1. Is this a portrait/headshot photo of a person?
2. BACKGROUND: Is the background white or very light/plain?
3. FACE: Is the person facing forward with their full face visible?
4. GLASSES: Are they wearing dark or reflective glasses? (not allowed)
5. HEAD COVERING: Is there any non-religious head covering? (not allowed)
6. QUALITY: Is the image clear and well-lit?

If this is a suitable passport photo meeting standard requirements, mark as "pass".`;

    case "job_offer":
      return `Analyse this document. It should be a job offer or employment contract from a Spanish employer.

Check the following:
1. DOCUMENT TYPE: Is this a job offer letter or employment contract?
2. EMPLOYEE NAME: Does it reference "${clientName}"?
3. EMPLOYER: Is the employer clearly a Spanish company? Is a CIF number mentioned?
4. ROLE: What position/role is offered?
5. SALARY: Is a salary mentioned?
6. START DATE: Is there a proposed start date?

If this is clearly a valid job offer from a Spanish employer, mark as "pass".`;

    case "accommodation_proof":
      return `Analyse this document. It should be proof of accommodation in Spain.

Check the following:
1. DOCUMENT TYPE: Is this a rental contract, property deed, hotel booking, or accommodation confirmation?
2. LOCATION: Is the accommodation in Spain?
3. TENANT/GUEST NAME: Does the name match or closely resemble "${clientName}"?
4. DATES: What period does the accommodation cover?

If this clearly shows accommodation arranged in Spain, mark as "pass".`;

    default:
      return `Analyse this document. It was uploaded as part of a Spanish visa application for "${clientName}".

Determine:
1. What type of document is this?
2. Does it appear to be genuine and official?
3. Is the name "${clientName}" mentioned?
4. Are there any obvious issues (expired, wrong person, wrong document type)?

If the document appears genuine and relevant to a visa application, mark as "pass". If there are clear issues, mark as "needs_revision" with specific feedback.`;
  }
}
