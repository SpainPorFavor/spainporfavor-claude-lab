import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock Stripe to avoid real API calls
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            url: "https://checkout.stripe.com/test-session",
            id: "cs_test_123",
          }),
        },
      },
    })),
  };
});

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("checkout.createSession", () => {
  it("rejects invalid product IDs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkout.createSession({
        productId: "invalid-product",
        customerEmail: "test@example.com",
        customerName: "Test User",
        customerPhone: "+1234567890",
        nationality: "us",
        origin: "https://example.com",
      })
    ).rejects.toThrow("Unknown product: invalid-product");
  });

  it("validates email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkout.createSession({
        productId: "digital-nomad-visa",
        customerEmail: "not-an-email",
        customerName: "Test User",
        customerPhone: "+1234567890",
        nationality: "us",
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });

  it("validates required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkout.createSession({
        productId: "digital-nomad-visa",
        customerEmail: "test@example.com",
        customerName: "",
        customerPhone: "+1234567890",
        nationality: "us",
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });

  it("validates origin is a URL", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkout.createSession({
        productId: "digital-nomad-visa",
        customerEmail: "test@example.com",
        customerName: "Test User",
        customerPhone: "+1234567890",
        nationality: "us",
        origin: "not-a-url",
      })
    ).rejects.toThrow();
  });

  it("accepts optional dependents parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should succeed with valid input including dependents
    const result = await caller.checkout.createSession({
      productId: "digital-nomad-visa",
      customerEmail: "test@example.com",
      customerName: "Test User",
      customerPhone: "+1234567890",
      nationality: "us",
      origin: "https://example.com",
      dependents: 2,
    });

    expect(result.url).toBeTruthy();
    expect(result.url).toContain("stripe.com");
  }, 10000);

  it("rejects negative dependents", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkout.createSession({
        productId: "digital-nomad-visa",
        customerEmail: "test@example.com",
        customerName: "Test User",
        customerPhone: "+1234567890",
        nationality: "us",
        origin: "https://example.com",
        dependents: -1,
      })
    ).rejects.toThrow();
  });
});
