import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock execSync to avoid actually calling manus-mcp-cli in tests
vi.mock("child_process", () => ({
  execSync: vi.fn().mockReturnValue("MCP tool invocation result saved to:\n/tmp/manus-mcp/mcp_result_test.json\n"),
}));

// Mock fs for reading result files
vi.mock("fs", () => ({
  readFileSync: vi.fn().mockReturnValue(JSON.stringify({
    content: [{ text: "Message ID: abc123def456\nThread ID: thread789" }],
  })),
}));

// Mock db
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({ insertId: 1 }) });
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: mockInsert,
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ id: 1, email: "test@example.com" }]),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

describe("Gmail Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendEmail constructs correct MCP command for prospect emails", async () => {
    const { execSync } = await import("child_process");
    const { sendEmail } = await import("./gmailService");

    const result = await sendEmail({
      to: "prospect@example.com",
      subject: "Your visa eligibility",
      body: "Hi there, thanks for your interest...",
      category: "prospect",
    });

    expect(result.success).toBe(true);
    expect(execSync).toHaveBeenCalled();
    const callArgs = (execSync as any).mock.calls[0][0] as string;
    expect(callArgs).toContain("gmail_send_messages");
    expect(callArgs).toContain("prospect@example.com");
  });

  it("sendEmail constructs correct MCP command for client emails", async () => {
    const { execSync } = await import("child_process");
    const { sendEmail } = await import("./gmailService");

    const result = await sendEmail({
      to: "client@example.com",
      subject: "Case update",
      body: "Your documents have been approved...",
      category: "client",
    });

    expect(result.success).toBe(true);
    expect(execSync).toHaveBeenCalled();
  });

  it("sendEmail applies the correct label after sending", async () => {
    const { execSync } = await import("child_process");
    const { sendEmail } = await import("./gmailService");

    await sendEmail({
      to: "prospect@example.com",
      subject: "Follow up",
      body: "Just checking in...",
      category: "prospect",
    });

    // Should call execSync twice: once for send, once for label
    expect(execSync).toHaveBeenCalledTimes(2);
    const labelCall = (execSync as any).mock.calls[1][0] as string;
    expect(labelCall).toContain("gmail_manage_labels");
    expect(labelCall).toContain("Label_1"); // SPF/Prospects
  });

  it("sendEmail uses Label_2 for client category", async () => {
    const { execSync } = await import("child_process");
    const { sendEmail } = await import("./gmailService");

    await sendEmail({
      to: "client@example.com",
      subject: "Welcome",
      body: "Welcome to your case...",
      category: "client",
    });

    const labelCall = (execSync as any).mock.calls[1][0] as string;
    expect(labelCall).toContain("Label_2"); // SPF/Clients
  });

  it("sendEmail handles thread replies", async () => {
    const { execSync } = await import("child_process");
    const { sendEmail } = await import("./gmailService");

    await sendEmail({
      to: "client@example.com",
      subject: "Re: Case update",
      body: "Following up on your case...",
      category: "client",
      threadId: "existing_thread_123",
    });

    const sendCall = (execSync as any).mock.calls[0][0] as string;
    expect(sendCall).toContain("existing_thread_123");
  });

  it("sendEmail returns failure on execSync error", async () => {
    const { execSync } = await import("child_process");
    (execSync as any).mockImplementationOnce(() => {
      throw new Error("MCP connection failed");
    });

    const { sendEmail } = await import("./gmailService");

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      body: "Test body",
      category: "prospect",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("MCP connection failed");
  });

  it("sendProspectEmail records in email_queue with prospect category", async () => {
    const { sendProspectEmail } = await import("./gmailService");

    const result = await sendProspectEmail({
      recipientEmail: "lead@example.com",
      recipientName: "Test Lead",
      subject: "Your visa options",
      body: "Hi Test, here are your options...",
      emailType: "prospect_followup",
    });

    expect(result.success).toBe(true);
    // Verify db.insert was called (audit trail)
    expect(mockInsert).toHaveBeenCalled();
  });

  it("sendClientEmail records in email_queue with client category", async () => {
    const { sendClientEmail } = await import("./gmailService");

    const result = await sendClientEmail({
      caseId: 1,
      recipientEmail: "client@example.com",
      recipientName: "Test Client",
      subject: "Welcome to your case",
      body: "Hi Test, your case has been created...",
      emailType: "welcome",
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("relabelContactAsClient searches for messages and applies new label", async () => {
    const { execSync } = await import("child_process");
    const { relabelContactAsClient } = await import("./gmailService");

    await relabelContactAsClient("prospect@example.com");

    // Should call: search, remove label, apply label = 3 calls
    expect(execSync).toHaveBeenCalledTimes(3);
    
    const searchCall = (execSync as any).mock.calls[0][0] as string;
    expect(searchCall).toContain("gmail_search_messages");
    expect(searchCall).toContain("prospect@example.com");

    const removeCall = (execSync as any).mock.calls[1][0] as string;
    expect(removeCall).toContain("remove");
    expect(removeCall).toContain("Label_1"); // Remove Prospects

    const applyCall = (execSync as any).mock.calls[2][0] as string;
    expect(applyCall).toContain("apply");
    expect(applyCall).toContain("Label_2"); // Apply Clients
  });
});
