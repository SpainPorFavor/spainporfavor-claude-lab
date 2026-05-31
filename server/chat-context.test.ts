import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock invokeLLM
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
          content: "Hi Sarah! Great question about the Digital Nomad Visa. You'll need proof of income of at least €2,849/month...",
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

describe("chat.send with context parameter", () => {
  it("accepts messages without context (backward compatible)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "What documents do I need?" }],
    });
    expect(result.reply).toBeTruthy();
    expect(typeof result.reply).toBe("string");
  });

  it("accepts messages with free-assessment context", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "How long does it take?" }],
      context: {
        name: "Sarah Mitchell",
        visaType: "Digital Nomad Visa",
        situation: "Remote worker from the US, moving to Barcelona",
        source: "free-assessment",
      },
    });
    expect(result.reply).toBeTruthy();
    expect(typeof result.reply).toBe("string");
  });

  it("accepts context with only source field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "What's the cost?" }],
      context: {
        source: "free-assessment",
      },
    });
    expect(result.reply).toBeTruthy();
  });

  it("accepts context with general source (no extra prompt injection)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "Tell me about visas" }],
      context: {
        source: "general",
      },
    });
    expect(result.reply).toBeTruthy();
  });

  it("rejects invalid source enum value", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.chat.send({
        messages: [{ role: "user", content: "Hello" }],
        context: {
          source: "invalid-source" as any,
        },
      })
    ).rejects.toThrow();
  });
});
