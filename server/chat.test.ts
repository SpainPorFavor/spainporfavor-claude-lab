import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "gemini-2.5-flash",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "The Digital Nomad Visa requires a minimum income of €2,849/month. You'll also need a remote work contract and private health insurance. Would you like me to explain the full document list?",
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("chat.send", () => {
  it("returns a reply for a valid user message", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "What income do I need for the DNV?" }],
    });

    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it("handles multi-turn conversation", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [
        { role: "user", content: "I want to move to Spain" },
        { role: "assistant", content: "Great! What's your main reason for moving?" },
        { role: "user", content: "I work remotely for a US company" },
      ],
    });

    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });

  it("handles empty messages array gracefully (sends only system prompt)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.chat.send({ messages: [] })
    ).resolves.toHaveProperty("reply");
  });

  it("rejects invalid role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.chat.send({
        messages: [{ role: "system" as any, content: "hack" }],
      })
    ).rejects.toThrow();
  });
});
