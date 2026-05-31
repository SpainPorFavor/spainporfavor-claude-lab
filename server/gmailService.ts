/**
 * Gmail Email Service
 * 
 * Sends emails via Laura's Gmail account (laura@spainporfavor.com) using the
 * manus-mcp-cli tool. Applies SPF/Prospects or SPF/Clients labels automatically.
 * 
 * This replaces the "queue only" approach — emails are now actually sent.
 * The email_queue table still serves as the audit log of all sent emails.
 */

import { execSync } from "child_process";
import { getDb } from "./db";
import { emailQueue } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

// Gmail label IDs (created via Gmail MCP)
const GMAIL_LABELS = {
  PROSPECTS: "Label_1", // SPF/Prospects
  CLIENTS: "Label_2",   // SPF/Clients
} as const;

type EmailCategory = "prospect" | "client";

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  category: EmailCategory;
  threadId?: string; // Reply to existing thread
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

/**
 * Send an email via Laura's Gmail account using manus-mcp-cli.
 * Returns the Gmail message ID and thread ID for tracking.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const mcpInput: any = {
      messages: [
        {
          to: [params.to],
          subject: params.subject,
          content: params.body,
          ...(params.threadId ? { thread_id: params.threadId } : {}),
        },
      ],
    };

    const inputJson = JSON.stringify(mcpInput);
    
    // Send via Gmail MCP
    const result = execSync(
      `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${inputJson.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", timeout: 30000 }
    );

    // Parse the result to get message ID
    const resultFile = result.match(/saved to:\s*(.+\.json)/)?.[1];
    let messageId: string | undefined;
    let threadId: string | undefined;

    if (resultFile) {
      try {
        const fs = await import("fs");
        const resultData = JSON.parse(fs.readFileSync(resultFile.trim(), "utf-8"));
        // Extract message ID from result content
        const content = typeof resultData === "string" ? resultData : JSON.stringify(resultData);
        const msgIdMatch = content.match(/Message ID:\s*([a-f0-9]+)/i);
        const threadIdMatch = content.match(/Thread ID:\s*([a-f0-9]+)/i);
        messageId = msgIdMatch?.[1];
        threadId = threadIdMatch?.[1];
      } catch {
        // Non-critical — we still sent the email
      }
    }

    // Apply label after sending
    if (messageId) {
      await applyLabel(messageId, params.category);
    }

    console.log(`[Gmail] Sent email to ${params.to}: "${params.subject}" [${params.category}]`);
    return { success: true, messageId, threadId };
  } catch (err: any) {
    console.error(`[Gmail] Failed to send email to ${params.to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Apply the appropriate SPF label to a sent message.
 */
async function applyLabel(messageId: string, category: EmailCategory): Promise<void> {
  try {
    const labelId = category === "prospect" ? GMAIL_LABELS.PROSPECTS : GMAIL_LABELS.CLIENTS;
    const input = JSON.stringify({
      operation: "apply",
      label_id: labelId,
      message_ids: [messageId],
    });

    execSync(
      `manus-mcp-cli tool call gmail_manage_labels --server gmail --input '${input.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", timeout: 15000 }
    );
  } catch (err: any) {
    console.error(`[Gmail] Failed to apply label to message ${messageId}:`, err.message);
    // Non-critical — email was still sent
  }
}

/**
 * Re-label all messages for a contact from Prospects to Clients.
 * Called when a lead converts (status changes to "converted").
 */
export async function relabelContactAsClient(email: string): Promise<void> {
  try {
    // Search for all messages to/from this email with the Prospects label
    const searchInput = JSON.stringify({
      q: `from:${email} OR to:${email} label:SPF-Prospects`,
      max_results: 100,
    });

    const searchResult = execSync(
      `manus-mcp-cli tool call gmail_search_messages --server gmail --input '${searchInput.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", timeout: 30000 }
    );

    // Parse result to get message IDs
    const resultFile = searchResult.match(/saved to:\s*(.+\.json)/)?.[1];
    if (!resultFile) return;

    const fs = await import("fs");
    const resultData = fs.readFileSync(resultFile.trim(), "utf-8");
    
    // Extract message IDs from the result
    const messageIds: string[] = [];
    let idMatch: RegExpExecArray | null;
    const idRegex = /Message ID:\s*([a-f0-9]+)/gi;
    while ((idMatch = idRegex.exec(resultData)) !== null) {
      messageIds.push(idMatch[1]);
    }

    if (messageIds.length === 0) return;

    // Remove Prospects label
    const removeInput = JSON.stringify({
      operation: "remove",
      label_id: GMAIL_LABELS.PROSPECTS,
      message_ids: messageIds,
    });
    execSync(
      `manus-mcp-cli tool call gmail_manage_labels --server gmail --input '${removeInput.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", timeout: 15000 }
    );

    // Apply Clients label
    const applyInput = JSON.stringify({
      operation: "apply",
      label_id: GMAIL_LABELS.CLIENTS,
      message_ids: messageIds,
    });
    execSync(
      `manus-mcp-cli tool call gmail_manage_labels --server gmail --input '${applyInput.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", timeout: 15000 }
    );

    console.log(`[Gmail] Re-labeled ${messageIds.length} messages for ${email}: Prospects → Clients`);
  } catch (err: any) {
    console.error(`[Gmail] Failed to re-label messages for ${email}:`, err.message);
  }
}

/**
 * Process the email queue — send all queued emails via Gmail.
 * Called periodically or on-demand from the management console.
 */
export async function processEmailQueue(): Promise<{ sent: number; failed: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const queued = await db.select().from(emailQueue).where(eq(emailQueue.status, "queued")).limit(20);
  
  let sent = 0;
  let failed = 0;

  for (const email of queued) {
    const category: EmailCategory = email.category as EmailCategory || "client";
    
    const result = await sendEmail({
      to: email.recipientEmail,
      toName: email.recipientName || undefined,
      subject: email.subject,
      body: email.body,
      category,
    });

    if (result.success) {
      await db.update(emailQueue).set({
        status: "sent",
        sentAt: new Date(),
        gmailMessageId: result.messageId || null,
        gmailThreadId: result.threadId || null,
      }).where(eq(emailQueue.id, email.id));
      sent++;
    } else {
      await db.update(emailQueue).set({ status: "failed" }).where(eq(emailQueue.id, email.id));
      failed++;
    }

    // Small delay between sends to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (sent > 0 || failed > 0) {
    console.log(`[Gmail] Queue processed: ${sent} sent, ${failed} failed`);
  }

  return { sent, failed };
}

/**
 * Send a prospect email immediately (not queued) — for real-time follow-ups.
 * Also records it in the email_queue for audit trail.
 */
export async function sendProspectEmail(params: {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  emailType: "prospect_nurture" | "prospect_followup" | "assessment_response";
}): Promise<SendEmailResult> {
  const result = await sendEmail({
    to: params.recipientEmail,
    toName: params.recipientName,
    subject: params.subject,
    body: params.body,
    category: "prospect",
  });

  // Record in email_queue for audit trail
  try {
    const db = await getDb();
    if (db) {
      await db.insert(emailQueue).values({
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName || null,
        subject: params.subject,
        body: params.body,
        emailType: params.emailType,
        category: "prospect",
        status: result.success ? "sent" : "failed",
        gmailMessageId: result.messageId || null,
        gmailThreadId: result.threadId || null,
        sentAt: result.success ? new Date() : null,
      });
    }
  } catch (err) {
    console.error("[Gmail] Failed to record email in queue:", err);
  }

  return result;
}

/**
 * Send a client email immediately — for case updates and notifications.
 * Also records it in the email_queue for audit trail.
 */
export async function sendClientEmail(params: {
  caseId?: number;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  emailType: "welcome" | "status_update" | "document_validated" | "document_needs_revision" | "requerimiento" | "resolution" | "expiry_warning" | "inactivity_nudge" | "milestone";
  threadId?: string;
}): Promise<SendEmailResult> {
  const result = await sendEmail({
    to: params.recipientEmail,
    toName: params.recipientName,
    subject: params.subject,
    body: params.body,
    category: "client",
    threadId: params.threadId,
  });

  // Record in email_queue for audit trail
  try {
    const db = await getDb();
    if (db) {
      await db.insert(emailQueue).values({
        caseId: params.caseId || null,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName || null,
        subject: params.subject,
        body: params.body,
        emailType: params.emailType,
        category: "client",
        status: result.success ? "sent" : "failed",
        gmailMessageId: result.messageId || null,
        gmailThreadId: result.threadId || null,
        sentAt: result.success ? new Date() : null,
      });
    }
  } catch (err) {
    console.error("[Gmail] Failed to record email in queue:", err);
  }

  return result;
}
