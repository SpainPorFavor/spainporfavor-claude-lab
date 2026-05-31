/**
 * Event-Triggered Messaging — Generates Laura messages automatically
 * when case events occur (document validated, status changed, requerimiento created, etc.)
 * 
 * This module is called from other server-side code (portalRouter, gestorRouter)
 * whenever a meaningful event happens. It:
 * 1. Records the event in case_events
 * 2. Generates an appropriate Laura message using LLM
 * 3. Stores the message in portal_messages
 */

import { getDb } from "./db";
import { caseEvents, portalMessages } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { getCaseById } from "./portalDb";
import { eq } from "drizzle-orm";
import { queueEventEmail } from "./emailNotifications";

type EventPayload = Record<string, any>;

/**
 * Fire a case event and generate an appropriate Laura message.
 * Non-blocking — errors are logged but don't propagate.
 */
export async function fireCaseEvent(
  caseId: number,
  eventType: "document_uploaded" | "document_validated" | "status_changed" | "requerimiento_created" | "resolution_logged" | "expiry_warning" | "inactivity_detected" | "milestone_reached",
  payload: EventPayload
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Record the event
    const [eventResult] = await db.insert(caseEvents).values({
      caseId,
      eventType,
      payload,
      processed: 0,
    });

    const eventId = eventResult.insertId;

    // Generate Laura's message based on the event
    const message = await generateEventMessage(caseId, eventType, payload);
    if (!message) {
      // Mark as processed even if no message needed
      await db.update(caseEvents).set({ processed: 1 }).where(eq(caseEvents.id, Number(eventId)));
      return;
    }

    // Store the message
    const [msgResult] = await db.insert(portalMessages).values({
      caseId,
      role: "laura",
      content: message,
      metadata: { eventType, eventId: Number(eventId) },
    });

    // Link event to message
    await db.update(caseEvents).set({
      processed: 1,
      triggeredMessageId: Number(msgResult.insertId),
    }).where(eq(caseEvents.id, Number(eventId)));

    // Queue email notification for the client
    queueEventEmail(caseId, eventType, payload, message).catch((err) => {
      console.error(`[EventMessaging] Failed to queue email for case #${caseId}:`, err);
    });

    console.log(`[EventMessaging] Event ${eventType} for case #${caseId} → message generated + email queued`);
  } catch (err) {
    console.error(`[EventMessaging] Error processing event ${eventType} for case #${caseId}:`, err);
  }
}

/**
 * Generate a contextual Laura message based on the event type.
 * Uses templates for common events, LLM for complex ones.
 */
async function generateEventMessage(
  caseId: number,
  eventType: string,
  payload: EventPayload
): Promise<string | null> {
  const caseData = await getCaseById(caseId);
  if (!caseData) return null;

  const firstName = caseData.clientName.split(" ")[0];

  switch (eventType) {
    case "document_validated": {
      const { documentLabel, status, feedback } = payload;
      if (status === "pass") {
        return `Great news, ${firstName}! Your **${documentLabel}** has been validated and approved. ${getProgressMessage(payload.completedCount, payload.totalCount)}`;
      } else if (status === "needs_revision") {
        return `${firstName}, I've reviewed your **${documentLabel}** and there's one thing that needs fixing: ${feedback}\n\nOnce you've made the correction, just re-upload it and I'll check it again right away.`;
      } else if (status === "unclear") {
        return `${firstName}, I've flagged your **${documentLabel}** for a manual review by our team. This usually takes less than 24 hours — I'll let you know as soon as it's confirmed.`;
      }
      return null;
    }

    case "status_changed": {
      const { fromStatus, toStatus, note } = payload;
      return getStatusChangeMessage(firstName, fromStatus, toStatus, note, caseData.visaType);
    }

    case "requerimiento_created": {
      const { description, deadline, documentsNeeded } = payload;
      // Use LLM to translate and explain the requerimiento
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Laura, a warm and knowledgeable immigration case manager. A government requerimiento (request for additional information) has been received for a client's visa application. Translate the following into clear, actionable English. Keep it under 100 words. Be reassuring but honest about the deadline.`,
          },
          {
            role: "user",
            content: `Client name: ${firstName}\nGovernment request (Spanish): ${description}\nDeadline: ${deadline ? new Date(deadline).toLocaleDateString() : "Not specified"}\nDocuments needed: ${JSON.stringify(documentsNeeded)}\n\nGenerate Laura's message to the client explaining what they need to do.`,
          },
        ],
      });
      const content = llmResponse.choices[0]?.message?.content;
      return typeof content === "string" ? content : `${firstName}, the immigration office has requested additional information for your application. Please check your document checklist — there are new items that need your attention.`;
    }

    case "resolution_logged": {
      const { type, reason } = payload;
      if (type === "approved") {
        return `${firstName}, I have wonderful news — **your visa has been approved!** 🎉\n\nCongratulations on this milestone. I'll be sending you a detailed guide on your next steps (TIE card, NIE number, empadronamiento) shortly. You're officially on your way to Spain!`;
      } else if (type === "denied") {
        return `${firstName}, I'm sorry to share that your application was not approved. The reason given was: ${reason || "not specified"}.\n\nDon't worry — we'll review the decision carefully and discuss your options. In many cases, we can appeal or resubmit with additional documentation. I'll have more details for you within 24 hours.`;
      } else if (type === "silencio_administrativo") {
        return `${firstName}, good news — the legal processing deadline has passed without a negative response from the authorities. Under Spanish administrative law, this means your application is considered **approved by administrative silence** (silencio administrativo). We'll confirm the next steps shortly.`;
      }
      return null;
    }

    case "expiry_warning": {
      const { documentLabel, expiresAt, daysRemaining } = payload;
      return `Heads up, ${firstName} — your **${documentLabel}** expires in **${daysRemaining} days** (${new Date(expiresAt).toLocaleDateString()}). If your application hasn't been submitted by then, you'll need to get a fresh one. Let me know if you need help with that.`;
    }

    case "inactivity_detected": {
      const { daysSinceLastActivity, completedCount, totalCount } = payload;
      return getInactivityMessage(firstName, daysSinceLastActivity, completedCount, totalCount);
    }

    case "milestone_reached": {
      const { milestone } = payload;
      if (milestone === "50_percent") {
        return `You're halfway there, ${firstName}! ${payload.completedCount} of ${payload.totalCount} documents approved. Keep the momentum going — you're doing great.`;
      } else if (milestone === "75_percent") {
        return `Almost there, ${firstName}! Just ${payload.totalCount - payload.completedCount} more document${payload.totalCount - payload.completedCount > 1 ? "s" : ""} to go. The finish line is in sight!`;
      } else if (milestone === "all_complete") {
        return `${firstName}, all your documents are validated and approved! 🎉\n\nI'm passing your complete application package to your assigned Gestor now. They'll prepare everything for submission to the Spanish authorities. I'll keep you updated on every step.`;
      }
      return null;
    }

    default:
      return null;
  }
}

function getProgressMessage(completed: number, total: number): string {
  const remaining = total - completed;
  if (remaining === 0) return "That's all of them — your document package is complete!";
  if (remaining === 1) return "Just 1 more document to go!";
  if (remaining <= 3) return `Only ${remaining} more to go — you're almost there.`;
  return `${completed} of ${total} documents done. Keep going!`;
}

function getStatusChangeMessage(
  firstName: string,
  fromStatus: string,
  toStatus: string,
  note: string | undefined,
  visaType: string
): string | null {
  const statusMessages: Record<string, string> = {
    "onboarding→collecting_documents": `Welcome aboard, ${firstName}! Your case is now active. Start uploading your documents whenever you're ready — I'll validate each one as it comes in.`,
    "collecting_documents→ready_for_gestor": `${firstName}, all your documents are validated and approved! Your case is now being assigned to a licensed Gestor who will prepare your formal application package.`,
    "ready_for_gestor→with_gestor": `${firstName}, your Gestor has picked up your case and is now reviewing your documents and preparing your application package. This typically takes 2-3 business days.`,
    "with_gestor→submitted": `${firstName}, your application has been officially submitted to the Spanish immigration authorities! Now we wait for their decision. I'll update you the moment we hear back.`,
  };

  const key = `${fromStatus}→${toStatus}`;
  return statusMessages[key] || null;
}

function getInactivityMessage(firstName: string, days: number, completed: number, total: number): string {
  if (days <= 7) {
    return `Hey ${firstName}, just checking in! Your application is ${Math.round((completed / total) * 100)}% complete. Need any help with the remaining documents?`;
  } else if (days <= 14) {
    return `${firstName}, it's been a couple of weeks since your last upload. Your case is still ${Math.round((completed / total) * 100)}% complete with ${total - completed} documents remaining. Is there anything holding you up? I'm here to help with any questions.`;
  } else {
    return `${firstName}, I wanted to reach out — it's been a while since we heard from you. Your application is still open and ${Math.round((completed / total) * 100)}% complete. If your plans have changed, that's totally fine. But if you're still planning to move to Spain, I'd love to help you get back on track. Just reply here and I'll walk you through what's next.`;
  }
}
