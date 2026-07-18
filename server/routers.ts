import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createCheckoutSession, createPaymentIntent } from "./stripe";
import { captureLead, getDb } from "./db";
import { resolveGateDecisionFromEnv } from "./prelaunchGate";
import { sendProspectEmail } from "./gmailService";
import { invokeLLM } from "./_core/llm";
import { portalRouter } from "./portalRouter";
import { chatRouter } from "./chatRouter";
import { gestorRouter } from "./gestorRouter";
import { consentRouter } from "./consentRouter";
import { managementRouter } from "./managementRouter";
import { teamAuthRouter } from "./teamAuth";
import { secureDocumentRouter } from "./secureDocumentRouter";
import { funnelChatMessages } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Simple in-memory rate limiter for public chat endpoint
const chatRateLimits = new Map<string, { count: number; resetAt: number }>();
const CHAT_RATE_LIMIT = 10; // max messages per window
const CHAT_RATE_WINDOW_MS = 60_000; // 1 minute

function checkChatRateLimit(sessionId: string): void {
  const now = Date.now();
  const entry = chatRateLimits.get(sessionId);
  if (!entry || now > entry.resetAt) {
    chatRateLimits.set(sessionId, { count: 1, resetAt: now + CHAT_RATE_WINDOW_MS });
    return;
  }
  entry.count++;
  if (entry.count > CHAT_RATE_LIMIT) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please slow down. Try again in a moment." });
  }
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  chatRateLimits.forEach((val, key) => {
    if (now > val.resetAt) chatRateLimits.delete(key);
  });
}, 5 * 60_000);

const VISA_ADVISOR_SYSTEM_PROMPT = `You are a friendly, knowledgeable visa advisor for SpainPorFavor — a licensed immigration document preparation service based in Málaga, Spain.

Your role: Answer questions about Spanish visas clearly and concisely. Help prospects understand their options and feel confident about moving forward.

Key facts you know:
- SpainPorFavor uses licensed Gestores Administrativos (Spain's official immigration specialists) registered with the Colegio Oficial
- Documents are submitted directly to Spanish immigration authorities (consulates for initial visas, or via the Mercurio platform for in-Spain procedures like renewals)
- Digital Nomad Visa (DNV): For remote workers, 4-6 weeks, requires €2,849/month income (200% of Spain's SMI, updated 2026), 3-year residency
- Non-Lucrative Visa (NLV): For retirees, 6-8 weeks, requires €2,400/month passive income, no working allowed
- Student Visa: 4-6 weeks, requires acceptance letter + €600/month
- Work Visa: 8-12 weeks, requires Spanish employer sponsorship
- EU Registration: 2-3 weeks, just paperwork (NIE + Certificado de Registro)
- Pricing: DNV €699, NLV €649, Student €549, Work €799, EU Registration €349
- Free resubmission support for fixable document issues if a visa is rejected (subject to our terms — does not apply to undisclosed criminal record issues or policy changes)
- Documents reviewed within 48 hours
- IMPORTANT — ADDITIONAL COSTS NOT INCLUDED IN OUR FEE: Government filing fees (€80-120), sworn translations (€80-150 per document, required for non-Spanish documents), apostille fees (varies by country, typically €10-50 per document), private health insurance (required for most visas, ~€60-120/month). Always mention these when discussing pricing so prospects are never surprised later.
- Criminal record certificates must be apostilled
- Health insurance must be private, full coverage, no co-pays for NLV
- Beckham Law tax optimization available for qualifying clients

Tone: Warm, professional, brief. Use short paragraphs. Never use bullet points in chat — write conversationally.

Rules:
- Keep responses under 150 words unless the question requires detail
- If someone asks about pricing, mention the specific price for their visa type and note it includes everything (document prep, Gestor submission, free resubmission)
- If someone seems ready to buy, encourage them to click "Start My Application" on the page
- If you don't know something specific (e.g., their exact eligibility), suggest they take the quiz or start their application for a personalized assessment
- Never make up information about Spanish immigration law
- Never claim to be human — if asked directly, say you're SpainPorFavor's instant advisor and can connect them with the team if needed
- Do not discuss competitors by name
- NEVER claim a specific approval rate or success rate percentage
- NEVER claim how many years the company has been in business or give a founding date
- If asked about track record, say: "We've helped many people successfully move to Spain" — do not invent statistics`;

export const appRouter = router({
  system: systemRouter,
  portal: portalRouter,
  portalChat: chatRouter,
  gestor: gestorRouter,
  consent: consentRouter,
  management: managementRouter,
  teamAuth: teamAuthRouter,
  secureDocuments: secureDocumentRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  checkout: router({
    createSession: publicProcedure
      .input(
        z.object({
          productId: z.string(),
          customerEmail: z.string().email(),
          customerName: z.string().min(1),
          customerPhone: z.string().min(1),
          nationality: z.string(),
          origin: z.string().url(),
          dependents: z.number().int().min(0).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createCheckoutSession({
          productId: input.productId,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          nationality: input.nationality,
          origin: input.origin,
          dependents: input.dependents,
        });
        return result;
      }),
    verifySession: publicProcedure
      .input(z.object({ sessionId: z.string().min(1) }))
      .query(async ({ input }) => {
        const { verifyCheckoutSession } = await import("./stripe");
        return verifyCheckoutSession(input.sessionId);
      }),
    getCaseBySession: publicProcedure
      .input(z.object({ sessionId: z.string().min(1) }))
      .query(async ({ input }) => {
        const { findCaseByStripeSessionId, findCaseByEmail, updateCaseStripeSessionId } = await import("./portalDb");
        
        // 1. Direct lookup by stored stripeSessionId
        let caseData = await findCaseByStripeSessionId(input.sessionId);
        
        // 2. Fallback: use Stripe API to get customer email, then find case by email
        if (!caseData) {
          try {
            const { verifyCheckoutSession } = await import("./stripe");
            const sessionInfo = await verifyCheckoutSession(input.sessionId);
            if (sessionInfo?.verified && sessionInfo.customerEmail) {
              caseData = await findCaseByEmail(sessionInfo.customerEmail);
              // Update the case's stripeSessionId so future lookups work directly
              if (caseData) {
                await updateCaseStripeSessionId(caseData.id, input.sessionId);
              }
            }
          } catch (err) {
            console.error("[getCaseBySession] Stripe API fallback failed:", err);
          }
        }
        
        if (!caseData) return null;
        return {
          id: caseData.id,
          visaType: caseData.visaType,
          status: caseData.status,
          clientName: caseData.clientName,
          clientEmail: caseData.clientEmail,
          dependents: caseData.dependents,
          createdAt: caseData.createdAt,
        };
      }),
    /** Public: Get document slots for a case identified by Stripe session_id (no auth needed) */
    getSlotsBySession: publicProcedure
      .input(z.object({ sessionId: z.string().min(1) }))
      .query(async ({ input }) => {
        const { findCaseByStripeSessionId, findCaseByEmail, updateCaseStripeSessionId, getSlotsByCaseId, getUploadsByCaseId } = await import("./portalDb");
        
        // 1. Direct lookup
        let caseData = await findCaseByStripeSessionId(input.sessionId);
        
        // 2. Fallback: Stripe API → email → case
        if (!caseData) {
          try {
            const { verifyCheckoutSession } = await import("./stripe");
            const sessionInfo = await verifyCheckoutSession(input.sessionId);
            if (sessionInfo?.verified && sessionInfo.customerEmail) {
              caseData = await findCaseByEmail(sessionInfo.customerEmail);
              if (caseData) {
                await updateCaseStripeSessionId(caseData.id, input.sessionId);
              }
            }
          } catch (err) {
            console.error("[getSlotsBySession] Stripe API fallback failed:", err);
          }
        }
        
        if (!caseData) return null;
        const slots = await getSlotsByCaseId(caseData.id);
        const uploads = await getUploadsByCaseId(caseData.id);
        return {
          caseId: caseData.id,
          visaType: caseData.visaType,
          slots: slots.map((s) => ({
            id: s.id,
            documentType: s.documentType,
            label: s.label,
            description: s.description,
            requirementsText: s.requirementsText,
            isRequired: s.isRequired,
            sortOrder: s.sortOrder,
            hasUpload: uploads.some((u) => u.slotId === s.id),
            latestUploadStatus: uploads.find((u) => u.slotId === s.id)?.validationStatus || null,
          })),
        };
      }),
    /** Public: Upload a document using Stripe session_id for auth (no login needed) */
    uploadDocumentBySession: publicProcedure
      .input(
        z.object({
          sessionId: z.string().min(1),
          slotId: z.number(),
          fileName: z.string(),
          fileData: z.string(), // base64-encoded
          mimeType: z.string(),
          fileSize: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { findCaseByStripeSessionId, findCaseByEmail, updateCaseStripeSessionId, getSlotsByCaseId, createDocumentUpload, updateCaseStatus } = await import("./portalDb");
        const { storagePut } = await import("./storage");

        // Verify session → case (with Stripe API fallback)
        let caseData = await findCaseByStripeSessionId(input.sessionId);
        if (!caseData) {
          try {
            const { verifyCheckoutSession } = await import("./stripe");
            const sessionInfo = await verifyCheckoutSession(input.sessionId);
            if (sessionInfo?.verified && sessionInfo.customerEmail) {
              caseData = await findCaseByEmail(sessionInfo.customerEmail);
              if (caseData) {
                await updateCaseStripeSessionId(caseData.id, input.sessionId);
              }
            }
          } catch (err) {
            console.error("[uploadDocumentBySession] Stripe API fallback failed:", err);
          }
        }
        if (!caseData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Case not found for this session" });
        }

        // Verify slot belongs to this case
        const slots = await getSlotsByCaseId(caseData.id);
        const slot = slots.find((s) => s.id === input.slotId);
        if (!slot) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This document slot does not belong to this case" });
        }

        // Validate file size (max 10MB)
        if (input.fileSize > 10 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "File size exceeds 10MB limit" });
        }

        // Validate mime type
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(input.mimeType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "File type not supported. Please upload PDF, JPG, PNG, or WEBP files." });
        }

        // Decode base64 and upload
        let fileBuffer = Buffer.from(input.fileData, "base64");

        // Strip EXIF metadata from images
        if (input.mimeType.startsWith("image/")) {
          try {
            const sharp = (await import("sharp")).default;
            fileBuffer = Buffer.from(await sharp(fileBuffer)
              .rotate()
              .withMetadata({ orientation: undefined })
              .toBuffer());
          } catch (err) {
            console.warn("[EXIF Strip] Failed to process image, using original:", err);
          }
        }

        const fileKey = `cases/${caseData.id}/documents/${slot.documentType}/${input.fileName}`;
        const { key } = await storagePut(fileKey, fileBuffer, input.mimeType);

        // Create upload record
        const uploadId = await createDocumentUpload({
          slotId: input.slotId,
          fileKey: key,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          validationStatus: "pending",
        });

        // Move case to collecting_documents if still onboarding
        if (caseData.status === "onboarding") {
          await updateCaseStatus(caseData.id, "collecting_documents", undefined, "First document uploaded (pre-login)");
        }

        return { uploadId, status: "pending" as const };
      }),
    getStripeConfig: publicProcedure.query(() => {
        const isTestMode = process.env.STRIPE_TEST_MODE === "true";
        const testPk = "pk_test_51TSEKiPQMNl2HgGIGtHxcutd2pwTDSnpwcexwqlfX3iTPXFfjedvl4avuN1PH0jNO64IxBdKbDHXQNjxVKlsDaV400IYbAn51X";
        const livePk = process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
        return {
          publishableKey: isTestMode ? testPk : livePk,
          testMode: isTestMode,
        };
      }),
    // Pre-launch waitlist gate — read at request time from PRELAUNCH_GATE_ENABLED
    // and the httpOnly bypass cookie. Fully independent of STRIPE_TEST_MODE.
    getPrelaunchGate: publicProcedure.query(({ ctx }) => {
        return resolveGateDecisionFromEnv(ctx.req.headers.cookie);
      }),
    createPaymentIntent: publicProcedure
      .input(
        z.object({
          productId: z.string(),
          customerEmail: z.string().email(),
          customerName: z.string().min(1),
          customerPhone: z.string().min(1),
          nationality: z.string(),
          dependents: z.number().int().min(0).max(10).default(0),
          billingAddress: z.object({
            country: z.string().min(1),
            line1: z.string().min(1),
            city: z.string().min(1),
            postalCode: z.string().min(1),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const { getVisaProduct } = await import("./products");
        const product = getVisaProduct(input.productId);
        if (!product) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown product" });
        const amountInCents = product.priceInCents + (product.dependentPriceInCents || 0) * input.dependents;
        const result = await createPaymentIntent({
          amountInCents,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          nationality: input.nationality,
          productId: input.productId,
          dependents: input.dependents,
          billingAddress: input.billingAddress,
        });
        return result;
      }),
  }),

  leads: router({
    capture: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          source: z.enum(["exit-intent", "quiz", "free-assessment", "waitlist"]),
          nationality: z.string().nullable().optional(),
          visaType: z.string().optional(),
          name: z.string().optional(),
          phone: z.string().optional(),
          situation: z.string().optional(),

        })
      )
      .mutation(async ({ input }) => {
        await captureLead({
          email: input.email,
          source: input.source,
          nationality: input.nationality || null,
          visaType: input.visaType || null,
          name: input.name || null,
          phone: input.phone || null,
          whatsappOptIn: 0,
          whatsappConsentAt: null,
          whatsappConsentText: null,
          situation: input.situation || null,
        });

        // Send prospect follow-up email (non-blocking)
        const firstName = input.name?.split(" ")[0] || "there";
        const visaLabel = input.visaType || "Spanish visa";
        sendProspectEmail({
          recipientEmail: input.email,
          recipientName: input.name || undefined,
          subject: `Your ${visaLabel} eligibility — next steps`,
          body: `Hi ${firstName},\n\nThanks for taking the time to explore your options for moving to Spain! Based on what you've told us, here's what happens next:\n\n1. Our team reviews your profile within 24 hours\n2. We'll send you a personalized breakdown of your visa pathway\n3. If you're ready to move forward, we'll match you with a licensed Gestor\n\nIn the meantime, if you have any questions, just reply to this email — I'm here to help.\n\nHablamos pronto,\nLaura\nSpainPorFavor Immigration Team\n\n---\nYou're receiving this because you completed our visa eligibility assessment at spainporfavor.com.\nReply STOP to opt out.`,
          emailType: input.source === "free-assessment" ? "assessment_response" : "prospect_followup",
        }).catch((err) => console.error("[Email] Non-blocking prospect email failed:", err));

        return { success: true };
      }),
  }),

  chat: router({
    send: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
          context: z.object({
            name: z.string().optional(),
            visaType: z.string().optional(),
            situation: z.string().optional(),
            source: z.enum(["general", "free-assessment"]).optional(),
            email: z.string().email().optional(),
            sessionId: z.string().optional(),
          }).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Rate limit by session ID (or IP-like identifier)
        const rateLimitKey = input.context?.sessionId || input.context?.email || "anonymous";
        checkChatRateLimit(rateLimitKey);

        // Build context-aware system prompt for free assessment page
        let systemPrompt = VISA_ADVISOR_SYSTEM_PROMPT;

        // --- RETURNING VISITOR CONTEXT (privacy-safe) ---
        // If we have an email, check for prior chat history from previous sessions
        let priorContextBlock = "";
        if (input.context?.email) {
          try {
            const db = await getDb();
            if (db) {
              const priorMessages = await db
                .select()
                .from(funnelChatMessages)
                .where(eq(funnelChatMessages.leadEmail, input.context.email))
                .orderBy(desc(funnelChatMessages.createdAt))
                .limit(40);

              if (priorMessages.length > 0) {
                // Build a summary of prior conversations for Laura's internal context
                const priorTranscript = priorMessages
                  .reverse()
                  .map((m) => `${m.role === "user" ? "Prospect" : "Laura"}: ${m.content}`)
                  .join("\n");

                priorContextBlock = `\n\nRETURNING VISITOR — PRIOR CONVERSATION HISTORY:\nThis person has chatted with you before. Below is their previous conversation transcript.\nUse this to understand their situation, what was discussed, and where the conversation left off.\n\nCRITICAL PRIVACY RULE: You MUST NOT repeat back any private details from the prior conversation (income, family members, specific plans, pricing discussed). Someone could be using this person's email. Instead:\n- Acknowledge warmly that you remember chatting before: "Welcome back! Great to hear from you again."\n- Pick up naturally from where things left off WITHOUT revealing specifics: "Last time we chatted about your move to Spain — any updates on your end?"\n- Let THEM bring up the details. Once they confirm something themselves in THIS conversation, you can discuss it freely.\n- If they seem like a genuinely different person or don't recognize the prior conversation, just proceed as if it's a new chat.\n\nPRIOR TRANSCRIPT:\n${priorTranscript}\n\nEND OF PRIOR TRANSCRIPT.`;
              }
            }
          } catch (err) {
            console.error("[Chat] Failed to load prior context:", err);
          }
        }

        if (input.context?.source === "free-assessment") {
          const ctxParts: string[] = [];
          if (input.context.name) ctxParts.push(`The user's name is ${input.context.name}. Their first name is ${input.context.name.split(" ")[0]}.`);
          if (input.context.visaType) ctxParts.push(`They expressed interest in: ${input.context.visaType}.`);
          if (input.context.situation) ctxParts.push(`Their situation description: ${input.context.situation}`);

          systemPrompt += `\n\nYOU ARE LAURA — a friendly, knowledgeable immigration advisor at SpainPorFavor.\n\nCONTEXT FROM THEIR FORM SUBMISSION:\n${ctxParts.join(" ")}\n\nIMPORTANT — MESSAGE FORMAT:\nKeep each message SHORT (under 60 words). If you need to say multiple things, separate them with "||" (double pipe). Each segment becomes a separate chat bubble. Example:\n"Thanks, John. That's good to know.||It sounds like the visa you need is the Digital Nomad Visa.||It's designed for remote workers and business owners like yourself."\n\nYOUR ROLE — EXPERT PRESCRIBER:\nYou are the expert. You PRESCRIBE the visa — you do not reflect back what they selected on the form. Frame it as YOUR professional recommendation based on what they've told you. Use language like "the visa you need is..." or "based on what you've told me, I'd recommend..." — NOT "since you're interested in..." or "you mentioned you want...".\n\nFORM DATA AWARENESS:\nThe user already filled in a form before this chat started. DO NOT re-ask questions they already answered in the form. Specifically:\n- If their situation field mentions they are retired, DO NOT ask about their work situation — you already know.\n- If their situation field describes their job/role, DO NOT ask about their work situation — acknowledge it and move on.\n- If their situation field mentions family members, DO NOT ask who is moving with them — confirm what you know and ask only for missing details (like children's ages).\n- If their situation field mentions a timeline or start date, DO NOT ask about timeline — acknowledge it.\n- Use the form data to SKIP questions you already have answers to. Go straight to the next unknown.\n\nCONVERSATIONAL QUIZ FLOW:\n1. FIRST MESSAGE (already sent by frontend): "Hi [name], nice to meet you! Are you ok to answer a few questions about getting a visa in Spain?"\n   - When they say yes/sure/ok, respond with: "Great! Are you currently in Spain, or outside of Spain?"\n   - If they immediately answer the location question without saying yes first, that's fine — proceed naturally.\n2. SECOND QUESTION: Ask who is moving with them — alone, with a partner, or with family. If they mention kids, ask their ages. Keep it to ONE short sentence. SKIP if already known from form.\n3. THIRD QUESTION: Ask about their work situation. ONE short sentence. SKIP if already known from form (e.g., they said they're retired, or described their job).\n4. RECOMMENDATION (use || to split into bubbles — but END with the income question and STOP):
   - Bubble 1: Acknowledge + prescribe the visa ("Thanks, [name]. It sounds like the visa you need is the [Full Visa Name].")
   - Bubble 2: One sentence explaining why it fits them.
   - Bubble 3: Timeline ("That visa typically takes between X to Y weeks from submission to approval.")
   - Bubble 4 (FINAL BUBBLE — this is the LAST thing you say, then STOP and WAIT): INCOME SELF-QUALIFIER — state the minimum income requirement and ask if it works for them. Use the correct threshold for their visa type:
     * Digital Nomad Visa: "One thing worth mentioning — for the Digital Nomad Visa, you'll need to show at least €2,849/month in income. Does that work for your situation?"
     * Non-Lucrative Visa: "One thing worth mentioning — for the Non-Lucrative Visa, you'll need to show at least €2,400/month in passive income or savings. Does that work for your situation?"
     * Student Visa: "One thing worth mentioning — for the Student Visa, you'll need to show at least €600/month in financial means. Does that work for your situation?"
   *** STOP HERE. DO NOT ADD ANYTHING AFTER THE INCOME QUESTION. WAIT FOR THEIR REPLY. ***
   - If they say YES or confirm income is fine → THEN (in your NEXT response) ask the timeline question: "What timeline are you planning for your move to Spain?" — SKIP if already known from form.
   - If they say NO or express doubt about income → pivot: "No worries — there may be other pathways we can explore depending on your full situation. Want me to take a closer look?" Then offer email + call link.from form.\n5. AFTER TIMELINE ANSWER — EXPLAIN THE PROCESS (use || to split into separate bubbles):\n   - If they indicate urgency or readiness, say: "OK great! Do you want me to explain how the process works?"\n   - INTENT DETECTION: If the user's message contains both an affirmative AND a request (e.g., "Yes please explain the process and the cost", "Sure, tell me how it works"), treat that as a YES and proceed directly to the explanation. Do NOT re-ask "Do you want me to explain how the process works?" if they already said yes in any form.\n   - If they say yes or seem interested, explain the process in separate bubbles:\n     Bubble 1: "First, we outline exactly which documents you need for your application."\n     Bubble 2: "The Spanish Government's submission system requires a licensed professional to file initial visa applications on your behalf. That professional is called a Gestor — think of them like a certified accountant, but for immigration."\n     Bubble 3: "Our Gestor reviews everything. If anything looks like it could cause a problem, we come back to you for clarification — this avoids a rejection and having to start over."\n     Bubble 4: "Once everything is ready, we submit directly to Spanish immigration on your behalf."\n     Bubble 5: "The government typically takes X to Y weeks to process. We track your application and update you along the way."\n     Bubble 6: "And if your application is rejected for fixable document reasons, we resubmit at no extra cost — subject to our terms (this does not apply to undisclosed criminal record issues or policy changes)."\n   - IMMEDIATELY AFTER the process explanation, give the price (see PRICING below). Do NOT wait for the user to ask. Do NOT go silent. The price MUST follow the process explanation automatically.\n   - If they say they want to think about it at any point, go to the SOFT FALLBACK.\n\nMID-FLOW QUESTIONS:\nIf the user asks a question in the middle of the flow (e.g., about income requirements, documents, part-time work, etc.):\n- Answer their question in 1-2 short sentences.\n- Then CONTINUE where you left off in the flow. Do NOT repeat a question you already asked and they already answered.\n- NEVER re-ask "What timeline are you planning?" if they already answered it.\n- NEVER re-ask any question the user has already answered.\n\n6. PRICING (MUST be delivered immediately after process explanation — never wait for user to ask):\n   - For solo applicants: "From what you have shared with me, the full service is [price for their visa type]. Would you like to get started with your application?"\n   - For families: Personalize the quote using the ACTUAL family members they mentioned. Reference them by relationship (your wife, your son, your daughter, your partner, your children, etc.) — NEVER say "per dependent".\n   - Examples of personalized pricing:\n     * "From what you have shared with me, for you and your family, the full service is €699 for you plus €399 for your wife. Would you like to get started with your application?"\n     * "From what you have shared with me, the full service is €699 for you, €399 for your wife, and €399 for your son. Would you like to get started with your application?"\n     * "From what you have shared with me, for your family the full service is €699 for you, plus €399 for your partner and €399 for each of your two kids — €1,497 total. Would you like to get started with your application?"\n   - DEPENDENT PRICES (per person): Digital Nomad Visa €399, Non-Lucrative Visa €349, Work Visa €449, EU Registration €199.\n    - MAIN PRICES: Digital Nomad Visa €699, Non-Lucrative Visa €649, Student Visa €549, Work Visa €799, EU Registration €349.
   - Always end the pricing bubble with "Would you like to get started with your application?" — mention the "Start My Application" button ONLY ONCE. Never repeat it.
   - IMMEDIATELY AFTER quoting the price, add a separate bubble about additional costs:
     "Just so there are no surprises — our fee covers the full service from document prep through submission. On top of that, there are some standard costs that apply to all visa applicants: government filing fees (€80-120), sworn translations if your documents aren't in Spanish (typically €80-150 per document), and apostille fees for official documents. We'll give you the exact breakdown once we review your documents."
   - This transparency bubble is MANDATORY every time you quote a price. It builds trust and prevents surprises.

PRICE OBJECTION HANDLING:G:\nIf the user expresses concern about the price (too expensive, sticker shock, asking for discounts):\n- Acknowledge their concern with empathy first: "I understand, it's an investment."\n- Briefly reinforce value: "It covers everything from document preparation through to Gestor submission, and if your application is rejected for a fixable document reason, you're covered with free resubmission at no extra cost (subject to our terms)."\n- Then offer the soft fallback: email + call link (see below).\n- Do NOT offer discounts or payment plans (we don't have them).\n\n7. SOFT FALLBACK (if they want to think about it, aren't ready, or express hesitation):\n   - Send as ONE single bubble (do NOT use || to split this message): "Of course! Moving to a new country is a big decision. Whenever you're ready, I'm at laura@spainporfavor.com — or you can book a quick chat with the team here: https://calendly.com/spainporfavor. We're here to help whenever the time is right for you."\n   - CRITICAL: This entire soft fallback message MUST be sent as ONE bubble. Do NOT split it with ||. The email address and URL must stay together in the same bubble.\n   - This MUST be sent whenever the user says anything like: "I need to think about it", "not sure", "maybe later", "I'll come back", "need to discuss with my partner", "let me consider", etc.\n\nCOMPETITIVE DIFFERENTIATION:\nIf the user asks "what makes you different?" or "why should I choose you?" or is comparing services:\n- Respond with concrete differentiators: "Unlike many online services, we use licensed Gestores Administrativos — the official immigration specialists registered with Spain's Colegio Oficial — who submit directly to the authorities on your behalf."\n- Add: "You also get a dedicated case review within 48 hours, and if your application is rejected for a fixable document reason, we resubmit at no extra cost (subject to our terms)."\n- Do NOT use vague phrases like "the SpainPorFavor difference" without explaining what it means.\n- Do NOT name or disparage specific competitors.\n\nALREADY IN SPAIN PATH:\nIf the user says they are currently IN Spain (especially if they've been there on a tourist visa or may have overstayed):\n- Acknowledge the urgency: "That's important to know — being in Spain already means we need to move quickly to get your situation regularized."\n- Note the process difference: "For most visa types, the initial application needs to be submitted through the Spanish consulate in your home country. But don't worry — our team can advise you on the best approach given your specific situation."\n- If they mention overstaying: "I understand that can feel stressful. Our Gestor can assess your situation and advise on the best path forward."\n- Continue with the normal flow after addressing this.\n\nPARENT/FAMILY MEMBER ELIGIBILITY:\nIf the user mentions bringing a parent (mother, father, mum, dad, parents):\n- The Digital Nomad Visa, Non-Lucrative Visa, Student Visa, and Work Visa ONLY cover: spouse/partner and children (under 18, or financially dependent adult children).\n- Parents are NOT eligible as dependents on any of these visas.\n- Respond warmly: "Great that you want your [mum/dad] close by! The [Visa Name] covers your spouse/partner and children, but parents aren't included as dependents unfortunately. Your [mum/dad] would need their own visa — likely a Non-Lucrative Visa if they have passive income or savings. That's something we can definitely help with too."\n- Do NOT include parents in the pricing quote. Only quote for eligible dependents (spouse/partner + children).\n- If they ask about the parent's visa cost, say: "For your [mum/dad]'s Non-Lucrative Visa, that would be a separate application at €649. Want me to include that in your assessment?"\n\nAFTER THE CTA/PRICING MOMENT:\n- If they ask detailed follow-up questions (documents needed, specific requirements, etc.), answer in ONE short sentence then add: "Once we agree to work on your application, we can go through all those details together."\n- If they go off-topic, answer briefly and friendly in one sentence, then lead back.\n- NEVER mention the "Start My Application" button again after the first time.\n\nTHINGS YOU MUST NEVER DO:\n- NEVER claim a specific approval rate or success percentage of any kind\n- NEVER claim how many years the company has been in business or give a founding date\n- NEVER invent statistics or numbers that aren't in this prompt\n- If asked about track record, say: "We've helped many people successfully move to Spain" — keep it honest and vague\n- NEVER repeat a question the user has already answered\n- NEVER go silent after explaining the process — always follow with the price\n\nTONE & RULES:\n- Short, punchy messages. Maximum 60 words per bubble segment.\n- Use || to split longer thoughts into separate bubbles.\n- Never use bullet points — write like texting a real person.\n- Never claim to be AI or a bot.\n- ABSOLUTE RULE — ONE QUESTION PER MESSAGE: You must NEVER include two questions in the same response. NEVER. If you need to learn two things, ask the FIRST question only. STOP. Wait for the user's reply. Then ask the second question in your NEXT response. A response containing two question marks is ALWAYS wrong — go back and delete everything after the first "?". This applies EVERYWHERE in the flow, including after the recommendation. When you ask about income ("Does that work for your situation?"), that is your ONE question — do NOT also ask about timeline in the same response. When you ask about timeline, do NOT also ask if they want to hear about the process. ONE QUESTION. FULL STOP. WAIT.
- Always spell out visa names in full (Digital Nomad Visa, not DNV).
- Each question should be a SHORT one-liner, not a paragraph.
- The email address laura@spainporfavor.com must never be split across bubble segments.`;
        }

        // Inject prior context into system prompt if available
        const fullSystemPrompt = systemPrompt + priorContextBlock;

        const result = await invokeLLM({
          messages: [
            { role: "system", content: fullSystemPrompt },
            ...input.messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
        });

        const reply = result.choices[0]?.message?.content;
        const content = typeof reply === "string" ? reply : Array.isArray(reply) ? reply.map(p => (p as any).text || "").join("") : "";

        // --- PERSIST CHAT MESSAGES ---
        // Save both the user's latest message and Laura's response to the database
        if (input.context?.email && input.context?.sessionId) {
          try {
            const db = await getDb();
            if (db) {
              const lastUserMsg = input.messages[input.messages.length - 1];
              if (lastUserMsg && lastUserMsg.role === "user") {
                await db.insert(funnelChatMessages).values({
                  leadEmail: input.context.email,
                  sessionId: input.context.sessionId,
                  role: "user",
                  content: lastUserMsg.content,
                  source: input.context.source || "general",
                });
              }
              // Save Laura's response
              if (content) {
                await db.insert(funnelChatMessages).values({
                  leadEmail: input.context.email,
                  sessionId: input.context.sessionId,
                  role: "assistant",
                  content: content,
                  source: input.context.source || "general",
                });
              }
            }
          } catch (err) {
            console.error("[Chat] Failed to persist messages:", err);
          }
        }

        return { reply: content };
      }),
  }),
});

export type AppRouter = typeof appRouter;
