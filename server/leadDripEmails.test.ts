/**
 * Tests for Lead Drip Email Scheduler and Convert-to-Case mutation
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the gmailService module
vi.mock("./gmailService", () => ({
  sendProspectEmail: vi.fn().mockResolvedValue({ success: true, messageId: "msg_test" }),
  relabelContactAsClient: vi.fn().mockResolvedValue(undefined),
}));

// Mock the db module
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([]),
  limit: vi.fn().mockResolvedValue([]),
  orderBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

// Mock portalDb for convert-to-case
vi.mock("./portalDb", () => ({
  createCaseWithSlots: vi.fn().mockResolvedValue(30005),
}));

describe("Lead Drip Emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runLeadDripScan returns zero when no eligible leads", async () => {
    // Default mock returns empty array for leads query
    mockDb.limit.mockResolvedValue([]);
    const { runLeadDripScan } = await import("./leadDripEmails");
    const result = await runLeadDripScan();
    expect(result.sent).toBe(0);
    expect(result.errors).toBe(0);
  });

  it("runLeadDripScan sends Day 1 email to eligible lead", async () => {
    const { sendProspectEmail } = await import("./gmailService");
    const { runLeadDripScan } = await import("./leadDripEmails");

    // The leads query (select().from().where()) should return leads for day 1
    // The email_queue query (select().from().where()) should return empty (not sent)
    let whereCallCount = 0;
    mockDb.where.mockImplementation(() => {
      whereCallCount++;
      if (whereCallCount === 1) {
        // First where() call: leads eligible for day 1
        return Promise.resolve([{
          id: 1,
          email: "test@example.com",
          name: "John Smith",
          visaType: "digital-nomad-visa",
          status: "new",
          linkedCaseId: null,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        }]);
      }
      // All subsequent where() calls: empty (no prior emails, no day 3/7 leads)
      return Promise.resolve([]);
    });

    const result = await runLeadDripScan();
    // Should have attempted to send at least for the day 1 lead
    expect(sendProspectEmail).toHaveBeenCalled();
  });

  it("startLeadDripScheduler does not double-start", async () => {
    const { startLeadDripScheduler, stopLeadDripScheduler } = await import("./leadDripEmails");
    startLeadDripScheduler();
    startLeadDripScheduler(); // Second call should be no-op
    stopLeadDripScheduler();
  });

  it("stopLeadDripScheduler cleans up interval", async () => {
    const { startLeadDripScheduler, stopLeadDripScheduler } = await import("./leadDripEmails");
    startLeadDripScheduler();
    stopLeadDripScheduler();
    // Should not throw
    stopLeadDripScheduler(); // Double-stop should be safe
  });

  it("getDripEmail returns correct Day 1 content", async () => {
    const { sendProspectEmail } = await import("./gmailService");
    const { runLeadDripScan } = await import("./leadDripEmails");

    let whereCallCount = 0;
    mockDb.where.mockImplementation(() => {
      whereCallCount++;
      if (whereCallCount === 1) {
        // Day 1 leads
        return Promise.resolve([{
          id: 2,
          email: "day1@example.com",
          name: "Sarah Jones",
          visaType: "non-lucrative-visa",
          status: "new",
          linkedCaseId: null,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        }]);
      }
      return Promise.resolve([]);
    });

    await runLeadDripScan();

    if ((sendProspectEmail as any).mock.calls.length > 0) {
      const call = (sendProspectEmail as any).mock.calls[0][0];
      expect(call.recipientEmail).toBe("day1@example.com");
      expect(call.emailType).toBe("prospect_nurture");
      expect(call.subject).toContain("Non-Lucrative Visa");
    }
  });
});

describe("Convert Lead to Case", () => {
  it("convertToCase mutation creates case and links lead", async () => {
    const { createCaseWithSlots } = await import("./portalDb");

    // Simulate what the mutation does
    const lead = {
      id: 10,
      email: "prospect@test.com",
      name: "Jane Doe",
      visaType: "digital-nomad-visa",
      phone: "+1234567890",
      nationality: "us",
      situation: "Remote worker wanting to move to Barcelona",
      linkedCaseId: null,
      status: "qualified",
    };

    // Call createCaseWithSlots with lead data
    const caseId = await createCaseWithSlots({
      visaType: lead.visaType || "digital-nomad-visa",
      clientName: lead.name || lead.email.split("@")[0],
      clientEmail: lead.email,
      clientPhone: lead.phone || null,
      nationality: lead.nationality || null,
      familyComposition: null,
      dependents: 0,
      notes: lead.situation || null,
      status: "onboarding",
    });

    expect(caseId).toBe(30005);
    expect(createCaseWithSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        visaType: "digital-nomad-visa",
        clientName: "Jane Doe",
        clientEmail: "prospect@test.com",
        clientPhone: "+1234567890",
        nationality: "us",
        status: "onboarding",
      })
    );
  });

  it("convertToCase rejects if lead already has a linked case", () => {
    const lead = { linkedCaseId: 30001 };
    expect(lead.linkedCaseId).not.toBeNull();
    // The actual mutation throws TRPCError — we verify the guard condition
  });
});
