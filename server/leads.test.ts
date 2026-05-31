import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  captureLead: vi.fn().mockResolvedValue(undefined),
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

describe("leads.capture", () => {
  it("accepts a valid exit-intent lead", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.capture({
      email: "test@example.com",
      source: "exit-intent",
      nationality: "us",
      visaType: "Digital Nomad Visa (DNV)",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts a valid quiz lead without optional fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.capture({
      email: "quiz@example.com",
      source: "quiz",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.capture({
        email: "not-an-email",
        source: "exit-intent",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid source", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.capture({
        email: "test@example.com",
        source: "invalid-source" as any,
      })
    ).rejects.toThrow();
  });
});
