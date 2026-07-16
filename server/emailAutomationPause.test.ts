/**
 * Tests for the EMAIL_AUTOMATION_PAUSED kill switch.
 *
 * Verifies that when EMAIL_AUTOMATION_PAUSED="true":
 *   - runLeadDripScan() sends nothing (early exit, no DB access)
 *   - runProactiveOutreach() fires no email-generating events
 * And that when the flag is unset, both jobs behave exactly as before
 * (same scenarios DO send).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the gmailService module (lead drip sends through sendProspectEmail)
vi.mock("./gmailService", () => ({
  sendProspectEmail: vi.fn().mockResolvedValue({ success: true, messageId: "msg_test" }),
  sendClientEmail: vi.fn().mockResolvedValue({ success: true, messageId: "msg_test" }),
  relabelContactAsClient: vi.fn().mockResolvedValue(undefined),
}));

// Mock eventMessaging (proactive outreach sends email via fireCaseEvent)
vi.mock("./eventMessaging", () => ({
  fireCaseEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock the db module with a chainable, awaitable query builder.
// Each awaited query consumes the next entry from resultQueue (FIFO).
let resultQueue: any[][] = [];

function makeQuery(): any {
  const q: any = {};
  for (const m of ["from", "where", "orderBy", "limit", "values", "set"]) {
    q[m] = vi.fn(() => q);
  }
  q.then = (resolve: any, reject: any) =>
    Promise.resolve(resultQueue.length ? resultQueue.shift() : []).then(resolve, reject);
  return q;
}

const mockDb = {
  select: vi.fn(() => makeQuery()),
  insert: vi.fn(() => makeQuery()),
  update: vi.fn(() => makeQuery()),
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

const DAY_MS = 24 * 60 * 60 * 1000;

// A lead that qualifies for the Day 1 drip email
const eligibleLead = () => ({
  id: 1,
  email: "drip-target@example.com",
  name: "Test Lead",
  visaType: "digital-nomad-visa",
  status: "new",
  linkedCaseId: null,
  createdAt: new Date(Date.now() - 1 * DAY_MS),
});

// An active case whose passport upload expires in ~5 days → triggers an
// expiry_warning event (i.e. an email) when the scanner runs.
const activeCase = () => ({
  id: 100,
  status: "collecting_documents",
  createdAt: new Date(Date.now() - 30 * DAY_MS),
});

const expiringSlot = () => ({
  id: 11,
  caseId: 100,
  label: "Passport",
  documentType: "passport",
  validityDays: 90,
  isRequired: 1,
});

const oldPassingUpload = () => ({
  id: 500,
  slotId: 11,
  validationStatus: "pass",
  uploadedAt: new Date(Date.now() - 85 * DAY_MS), // expires in ~5 days
});

describe("EMAIL_AUTOMATION_PAUSED kill switch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resultQueue = [];
  });

  afterEach(() => {
    delete process.env.EMAIL_AUTOMATION_PAUSED;
  });

  describe("lead drip scan", () => {
    it("sends nothing and skips the DB when paused", async () => {
      process.env.EMAIL_AUTOMATION_PAUSED = "true";
      const { sendProspectEmail } = await import("./gmailService");
      const { getDb } = await import("./db");
      const { runLeadDripScan } = await import("./leadDripEmails");

      // Even with an eligible lead queued up, nothing should be read or sent
      resultQueue = [[eligibleLead()]];

      const result = await runLeadDripScan();

      expect(result).toEqual({ sent: 0, errors: 0 });
      expect(sendProspectEmail).not.toHaveBeenCalled();
      expect(getDb).not.toHaveBeenCalled();
    });

    it("sends to an eligible lead when the flag is unset (unchanged behaviour)", async () => {
      const { sendProspectEmail } = await import("./gmailService");
      const { runLeadDripScan } = await import("./leadDripEmails");

      resultQueue = [
        [eligibleLead()], // day 1 leads query
        [],               // email_queue dedupe query → not sent yet
        [],               // day 3 leads query
        [],               // day 7 leads query
      ];

      const result = await runLeadDripScan();

      expect(result.sent).toBe(1);
      expect(sendProspectEmail).toHaveBeenCalledTimes(1);
      expect((sendProspectEmail as any).mock.calls[0][0].recipientEmail).toBe(
        "drip-target@example.com"
      );
    });
  });

  describe("proactive outreach scanners", () => {
    it("fires no email events when paused", async () => {
      process.env.EMAIL_AUTOMATION_PAUSED = "true";
      const { fireCaseEvent } = await import("./eventMessaging");
      const { runProactiveOutreach } = await import("./proactiveOutreach");

      resultQueue = [
        [activeCase()], // active cases query
        // expiry/inactivity/milestone scans are skipped when paused
        [],             // deadline reminders (requerimientos) query → none
      ];

      const result = await runProactiveOutreach();

      expect(fireCaseEvent).not.toHaveBeenCalled();
      expect(result).toEqual({
        expiryWarnings: 0,
        inactivityNudges: 0,
        deadlineReminders: 0,
        milestones: 0,
      });
    });

    it("fires an expiry warning for the same case when the flag is unset (unchanged behaviour)", async () => {
      const { fireCaseEvent } = await import("./eventMessaging");
      const { runProactiveOutreach } = await import("./proactiveOutreach");

      resultQueue = [
        [activeCase()],       // active cases query
        [expiringSlot()],     // checkDocumentExpiry: slots for case
        [oldPassingUpload()], // checkDocumentExpiry: latest passing upload → ~5 days left
        [],                   // checkDocumentExpiry: dedupe (no recent event) → fire!
        [],                   // checkInactivity: slots → none, bail
        [],                   // checkDeadlines: pending requerimientos → none
        [],                   // checkMilestones: slots → none, bail
      ];

      const result = await runProactiveOutreach();

      expect(result.expiryWarnings).toBe(1);
      expect(fireCaseEvent).toHaveBeenCalledTimes(1);
      expect(fireCaseEvent).toHaveBeenCalledWith(
        100,
        "expiry_warning",
        expect.objectContaining({ documentLabel: "Passport" })
      );
    });
  });
});
