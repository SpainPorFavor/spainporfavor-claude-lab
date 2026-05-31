/**
 * Lead Drip Email Scheduler
 * Sends Day 1, Day 3, and Day 7 follow-up emails to leads who haven't converted.
 * Runs every 2 hours, checks leads by createdAt age, dedupes against email_queue.
 */
import { eq, and, lte, gte, inArray, isNull, ne } from "drizzle-orm";
import { getDb } from "./db";
import { leads, emailQueue } from "../drizzle/schema";
import { sendProspectEmail } from "./gmailService";

const SCAN_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
let scanInterval: ReturnType<typeof setInterval> | null = null;

// Drip schedule: day offsets and email types
const DRIP_STEPS = [
  { day: 1, emailType: "prospect_nurture" as const, stepKey: "drip_day1" },
  { day: 3, emailType: "prospect_nurture" as const, stepKey: "drip_day3" },
  { day: 7, emailType: "prospect_nurture" as const, stepKey: "drip_day7" },
];

// Visa type display names
const VISA_LABELS: Record<string, string> = {
  "digital-nomad-visa": "Digital Nomad Visa",
  "non-lucrative-visa": "Non-Lucrative Visa",
  "eu-registration": "EU Registration",
  "student-visa": "Student Visa",
  "work-visa": "Work Visa",
};

function getDripEmail(step: string, firstName: string, visaType: string | null): { subject: string; body: string } {
  const visa = visaType ? (VISA_LABELS[visaType] || visaType) : "Spanish visa";

  switch (step) {
    case "drip_day1":
      return {
        subject: `Quick question about your ${visa} application`,
        body: `Hi ${firstName},\n\nI wanted to check in — did you get a chance to look over the information we sent about your ${visa} pathway?\n\nIf you have any questions about the process, documents needed, or timeline, just hit reply. I'm happy to walk you through it.\n\nMany of our clients tell us the hardest part is knowing where to start — that's exactly what we handle for you.\n\nBest,\nLaura\nSpainPorFavor Immigration Team\n\n---\nYou're receiving this because you completed our visa eligibility assessment at spainporfavor.com.\nReply STOP to opt out.`,
      };

    case "drip_day3":
      return {
        subject: `Your ${visa} — 3 things most people get wrong`,
        body: `Hi ${firstName},\n\nI see a lot of applications come through, and there are three mistakes that trip people up almost every time:\n\n1. Criminal record certificates need an apostille — this alone takes 2-4 weeks in most countries\n2. Health insurance must have zero co-pays and full coverage in Spain (many standard policies don't qualify)\n3. Financial documents have a validity window — submit too early and they expire before processing\n\nOur licensed Gestores catch these issues before they become rejection reasons. That's why we review every document within 48 hours of upload.\n\nIf you'd like to get started, your application page is still waiting for you:\nhttps://spainporfavor.com\n\nOr if you'd prefer to talk it through first, reply to this email and we'll set up a quick call.\n\nHablamos pronto,\nLaura\nSpainPorFavor Immigration Team\n\n---\nYou're receiving this because you completed our visa eligibility assessment at spainporfavor.com.\nReply STOP to opt out.`,
      };

    case "drip_day7":
      return {
        subject: `Last check-in: still thinking about Spain?`,
        body: `Hi ${firstName},\n\nIt's been about a week since you explored your visa options with us. I know moving to another country is a big decision — there's a lot to consider.\n\nI just wanted you to know: whenever you're ready, we're here. Your eligibility profile is saved, and you can pick up exactly where you left off.\n\nA few things that might help:\n\n• Our fixed pricing means no surprises — you know the total cost upfront\n• The free resubmission guarantee means you're covered if anything goes wrong\n• Most of our clients go from "thinking about it" to "documents submitted" in under 3 weeks\n\nIf your timeline has changed or you have new questions, just reply — I read every email personally.\n\nWishing you the best,\nLaura\nSpainPorFavor Immigration Team\n\n---\nYou're receiving this because you completed our visa eligibility assessment at spainporfavor.com.\nReply STOP to opt out of future emails.`,
      };

    default:
      return { subject: "", body: "" };
  }
}

/**
 * Check if a drip email has already been sent for this lead + step.
 * Uses the email_queue table subject as a fingerprint.
 */
async function hasDripBeenSent(db: any, email: string, stepKey: string): Promise<boolean> {
  // We tag drip emails with a specific subject pattern — check email_queue
  const dripSubjects = getDripEmail(stepKey, "", null);
  // More reliable: check if any prospect_nurture email was sent to this address
  // within a window around the expected day
  const existingEmails = await db
    .select({ id: emailQueue.id, subject: emailQueue.subject })
    .from(emailQueue)
    .where(
      and(
        eq(emailQueue.recipientEmail, email),
        eq(emailQueue.emailType, "prospect_nurture"),
        eq(emailQueue.status, "sent")
      )
    );

  // Count how many nurture emails have been sent to this lead
  // Day 1 = 1st nurture, Day 3 = 2nd nurture, Day 7 = 3rd nurture
  const stepIndex = DRIP_STEPS.findIndex((s) => s.stepKey === stepKey);
  return existingEmails.length > stepIndex;
}

/**
 * Main drip scan: find leads eligible for each drip step and send emails.
 */
export async function runLeadDripScan(): Promise<{ sent: number; errors: number }> {
  const db = await getDb();
  if (!db) {
    console.log("[LeadDrip] Database unavailable, skipping scan");
    return { sent: 0, errors: 0 };
  }

  let totalSent = 0;
  let totalErrors = 0;
  const now = new Date();

  for (const step of DRIP_STEPS) {
    // Find leads created between (day - 0.5) and (day + 0.5) days ago
    // This gives a 12-hour window to catch leads regardless of scan timing
    const minAge = new Date(now.getTime() - (step.day + 0.5) * 24 * 60 * 60 * 1000);
    const maxAge = new Date(now.getTime() - (step.day - 0.5) * 24 * 60 * 60 * 1000);

    // Get leads in the window that haven't converted
    const eligibleLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          gte(leads.createdAt, minAge),
          lte(leads.createdAt, maxAge),
          ne(leads.status, "converted"),
          ne(leads.status, "lost"),
          isNull(leads.linkedCaseId)
        )
      );

    for (const lead of eligibleLeads) {
      try {
        // Check if this step was already sent
        const alreadySent = await hasDripBeenSent(db, lead.email, step.stepKey);
        if (alreadySent) continue;

        const firstName = lead.name?.split(" ")[0] || "there";
        const { subject, body } = getDripEmail(step.stepKey, firstName, lead.visaType);
        if (!subject || !body) continue;

        await sendProspectEmail({
          recipientEmail: lead.email,
          recipientName: lead.name || undefined,
          subject,
          body,
          emailType: step.emailType,
        });

        totalSent++;
        console.log(`[LeadDrip] Sent ${step.stepKey} to ${lead.email}`);
      } catch (err) {
        totalErrors++;
        console.error(`[LeadDrip] Failed ${step.stepKey} for ${lead.email}:`, err);
      }
    }
  }

  if (totalSent > 0 || totalErrors > 0) {
    console.log(`[LeadDrip] Scan complete: ${totalSent} sent, ${totalErrors} errors`);
  }

  return { sent: totalSent, errors: totalErrors };
}

/**
 * Start the lead drip email scheduler.
 * Runs immediately on startup (after delay), then every SCAN_INTERVAL_MS.
 */
export function startLeadDripScheduler(): void {
  if (scanInterval) return; // Already running

  console.log(`[LeadDrip] Starting drip email scheduler (interval: ${SCAN_INTERVAL_MS / 1000 / 60 / 60}h)`);

  // Run first scan after a 60-second delay (let server finish starting)
  setTimeout(() => {
    runLeadDripScan().catch(console.error);
  }, 60_000);

  // Then run every SCAN_INTERVAL_MS
  scanInterval = setInterval(() => {
    runLeadDripScan().catch(console.error);
  }, SCAN_INTERVAL_MS);
}

/**
 * Stop the lead drip scheduler (for testing/shutdown).
 */
export function stopLeadDripScheduler(): void {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
    console.log("[LeadDrip] Scheduler stopped");
  }
}
