/**
 * Email Notification Layer
 * 
 * Composes and sends email notifications for clients on case events
 * via Laura's Gmail account (laura@spainporfavor.com).
 * 
 * Emails are sent immediately via Gmail MCP and recorded in email_queue
 * for audit trail. Labels (SPF/Prospects, SPF/Clients) are applied automatically.
 * 
 * This module hooks into the event messaging system — whenever fireCaseEvent()
 * generates a Laura message, we also send an email version.
 */

import { getDb } from "./db";
import { emailQueue } from "../drizzle/schema";
import { getCaseById } from "./portalDb";
import { notifyOwner } from "./_core/notification";
import { sendClientEmail, sendProspectEmail } from "./gmailService";

type EmailType = "document_validated" | "document_needs_revision" | "status_update" | "requerimiento" | "resolution" | "expiry_warning" | "inactivity_nudge" | "milestone" | "welcome";

interface QueueEmailParams {
  caseId: number;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  emailType: EmailType;
}

/**
 * Send an email immediately via Gmail and record in the audit log.
 * Falls back to queue-only if Gmail send fails.
 */
async function queueEmail(params: QueueEmailParams): Promise<void> {
  try {
    // Send immediately via Laura's Gmail
    await sendClientEmail({
      caseId: params.caseId,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      subject: params.subject,
      body: params.body,
      emailType: params.emailType as any,
    });

    console.log(`[Email] Sent ${params.emailType} email to ${params.recipientEmail} via Gmail`);
  } catch (err) {
    // Fallback: queue for later processing
    console.error(`[Email] Gmail send failed, queuing for retry:`, err);
    try {
      const db = await getDb();
      if (!db) return;
      await db.insert(emailQueue).values({
        caseId: params.caseId,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        subject: params.subject,
        body: params.body,
        emailType: params.emailType,
        category: "client",
        status: "queued",
      });
    } catch (dbErr) {
      console.error(`[Email] Also failed to queue:`, dbErr);
    }
  }
}

/**
 * Hook into case events and queue appropriate emails.
 * Called from eventMessaging.ts after a Laura message is generated.
 */
export async function queueEventEmail(
  caseId: number,
  eventType: string,
  payload: Record<string, any>,
  lauraMessage: string
): Promise<void> {
  const caseData = await getCaseById(caseId);
  if (!caseData || !caseData.clientEmail) return;

  const firstName = caseData.clientName.split(" ")[0];
  const recipientEmail = caseData.clientEmail;
  const recipientName = caseData.clientName;

  let subject: string;
  let emailType: EmailType;

  switch (eventType) {
    case "document_validated": {
      const status = payload.status;
      if (status === "pass") {
        subject = `✓ Document approved: ${payload.documentLabel}`;
        emailType = "document_validated";
      } else if (status === "needs_revision") {
        subject = `Action needed: ${payload.documentLabel} requires revision`;
        emailType = "document_needs_revision";
      } else {
        subject = `Update: ${payload.documentLabel} is under review`;
        emailType = "document_validated";
      }
      break;
    }

    case "status_changed": {
      subject = `Case update: ${formatStatus(payload.toStatus)}`;
      emailType = "status_update";
      break;
    }

    case "requerimiento_created": {
      subject = `⚠️ Action required: Government request for your application`;
      emailType = "requerimiento";
      break;
    }

    case "resolution_logged": {
      const type = payload.type;
      if (type === "approved") {
        subject = `🎉 Congratulations! Your visa has been approved`;
      } else if (type === "denied") {
        subject = `Important update about your visa application`;
      } else {
        subject = `Update: Your application status has changed`;
      }
      emailType = "resolution";
      break;
    }

    case "expiry_warning": {
      subject = `⚠️ Document expiring soon: ${payload.documentLabel}`;
      emailType = "expiry_warning";
      break;
    }

    case "inactivity_detected": {
      subject = `${firstName}, your Spain visa application is waiting for you`;
      emailType = "inactivity_nudge";
      break;
    }

    case "milestone_reached": {
      const milestone = payload.milestone;
      if (milestone === "all_complete") {
        subject = `🎉 All documents approved — your application is ready!`;
      } else {
        subject = `Progress update: ${payload.completedCount}/${payload.totalCount} documents complete`;
      }
      emailType = "milestone";
      break;
    }

    default:
      return; // Unknown event type, don't queue
  }

  // Compose the email body (plain text version of Laura's message + footer)
  const body = composeEmailBody(firstName, lauraMessage, caseData.visaType);

  await queueEmail({
    caseId,
    recipientEmail,
    recipientName,
    subject,
    body,
    emailType,
  });

  // Also notify owner for critical events
  if (eventType === "resolution_logged" || eventType === "requerimiento_created") {
    await notifyOwner({
      title: `[Case #${caseId}] ${subject}`,
      content: `Client: ${recipientName} (${recipientEmail})\nVisa: ${caseData.visaType}\n\n${lauraMessage}`,
    }).catch(() => {}); // Non-blocking
  }
}

/**
 * Queue a welcome email when a new case is created.
 */
export async function queueWelcomeEmail(caseId: number): Promise<void> {
  const caseData = await getCaseById(caseId);
  if (!caseData || !caseData.clientEmail) return;

  const firstName = caseData.clientName.split(" ")[0];

  const body = composeEmailBody(
    firstName,
    `Welcome to VivaSpain! Your ${formatVisaType(caseData.visaType)} application case has been created.\n\nHere's what happens next:\n1. Log into your client portal to see your personalized document checklist\n2. Upload each document — I'll validate them in real-time\n3. Once everything is approved, your licensed Gestor takes over\n\nI'm Laura, your AI case manager. I'll be with you every step of the way. If you have any questions, just ask me in the portal chat.`,
    caseData.visaType
  );

  await queueEmail({
    caseId,
    recipientEmail: caseData.clientEmail,
    recipientName: caseData.clientName,
    subject: `Welcome! Your ${formatVisaType(caseData.visaType)} application is underway`,
    body,
    emailType: "welcome",
  });
}

/**
 * Get queued emails for admin review / batch sending.
 */
export async function getQueuedEmails(limit = 50): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const { eq } = await import("drizzle-orm");
  return db.select().from(emailQueue).where(eq(emailQueue.status, "queued")).limit(limit);
}

/**
 * Mark emails as sent (after batch sending via Gmail MCP or transactional service).
 */
export async function markEmailsSent(emailIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { inArray } = await import("drizzle-orm");
  await db.update(emailQueue).set({ status: "sent", sentAt: new Date() }).where(inArray(emailQueue.id, emailIds));
}

// ============================================================
// HELPERS
// ============================================================

function composeEmailBody(firstName: string, message: string, visaType: string): string {
  return `Hi ${firstName},

${message}

---
Your case: ${formatVisaType(visaType)}
Portal: Log in to view your full case status and chat with Laura

---
VivaSpain Immigration Services
This email was sent because you have an active visa application with us.
To manage your notification preferences or request data deletion, visit your portal settings.
Unsubscribe: Reply with "STOP" to opt out of non-essential emails.`;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    onboarding: "Getting started",
    collecting_documents: "Document collection in progress",
    ready_for_gestor: "Documents complete — ready for review",
    with_gestor: "Your Gestor is preparing your application",
    submitted: "Application submitted to authorities",
    approved: "Visa approved!",
    rejected: "Application decision received",
  };
  return map[status] || status.replace(/_/g, " ");
}

function formatVisaType(visaType: string): string {
  const map: Record<string, string> = {
    digital_nomad: "Digital Nomad Visa",
    non_lucrative: "Non-Lucrative Visa",
    student: "Student Visa",
    work: "Work Visa",
    eu_registration: "EU Registration",
  };
  return map[visaType] || visaType.replace(/_/g, " ");
}
