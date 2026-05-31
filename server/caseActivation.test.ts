import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the portalDb module
vi.mock("./portalDb", () => ({
  findCaseByStripeSessionId: vi.fn(),
  findCaseByEmail: vi.fn(),
  updateCaseStripeSessionId: vi.fn(),
}));

// Mock Stripe to handle both session and paymentIntent retrieval
const mockSessionsRetrieve = vi.fn();
const mockPaymentIntentsRetrieve = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            url: "https://checkout.stripe.com/test-session",
            id: "cs_test_123",
          }),
          retrieve: mockSessionsRetrieve,
        },
      },
      paymentIntents: {
        retrieve: mockPaymentIntentsRetrieve,
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

describe("checkout.verifySession — dual mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles Checkout Session IDs (cs_xxx) via sessions.retrieve", async () => {
    mockSessionsRetrieve.mockResolvedValueOnce({
      payment_status: "paid",
      customer_email: "sarah@example.com",
      metadata: {
        customer_name: "Sarah Mitchell",
        product_id: "digital-nomad-visa",
        dependents: "0",
      },
      amount_total: 69900,
      currency: "eur",
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checkout.verifySession({
      sessionId: "cs_test_abc123",
    });

    expect(result.verified).toBe(true);
    expect(result.customerEmail).toBe("sarah@example.com");
    expect(result.customerName).toBe("Sarah Mitchell");
    expect(result.productId).toBe("digital-nomad-visa");
    expect(result.amountTotal).toBe(69900);
    expect(result.currency).toBe("eur");
    expect(mockSessionsRetrieve).toHaveBeenCalledWith("cs_test_abc123");
    expect(mockPaymentIntentsRetrieve).not.toHaveBeenCalled();
  });

  it("handles PaymentIntent IDs (pi_xxx) via paymentIntents.retrieve", async () => {
    mockPaymentIntentsRetrieve.mockResolvedValueOnce({
      status: "succeeded",
      metadata: {
        customer_email: "james@example.com",
        customer_name: "James Thompson",
        product_id: "eu-registration",
        dependents: "1",
      },
      receipt_email: "james@example.com",
      amount: 34900,
      currency: "eur",
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checkout.verifySession({
      sessionId: "pi_3Tc8cePQMNl2HgGI17dD4x7g",
    });

    expect(result.verified).toBe(true);
    expect(result.customerEmail).toBe("james@example.com");
    expect(result.customerName).toBe("James Thompson");
    expect(result.productId).toBe("eu-registration");
    expect(result.dependents).toBe(1);
    expect(result.amountTotal).toBe(34900);
    expect(result.currency).toBe("eur");
    expect(mockPaymentIntentsRetrieve).toHaveBeenCalledWith("pi_3Tc8cePQMNl2HgGI17dD4x7g");
    expect(mockSessionsRetrieve).not.toHaveBeenCalled();
  });

  it("throws when PaymentIntent status is not succeeded", async () => {
    mockPaymentIntentsRetrieve.mockResolvedValueOnce({
      status: "requires_payment_method",
      metadata: {},
      amount: 34900,
      currency: "eur",
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.checkout.verifySession({ sessionId: "pi_failed_123" })
    ).rejects.toThrow("Payment not completed");
  });

  it("throws when Checkout Session payment_status is not paid", async () => {
    mockSessionsRetrieve.mockResolvedValueOnce({
      payment_status: "unpaid",
      metadata: {},
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.checkout.verifySession({ sessionId: "cs_test_unpaid" })
    ).rejects.toThrow("Payment not completed");
  });

  it("falls back to receipt_email when metadata.customer_email is missing for pi_", async () => {
    mockPaymentIntentsRetrieve.mockResolvedValueOnce({
      status: "succeeded",
      metadata: {
        product_id: "non-lucrative-visa",
        customer_name: "David",
        dependents: "2",
      },
      receipt_email: "david@fallback.com",
      amount: 79900,
      currency: "eur",
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checkout.verifySession({
      sessionId: "pi_no_email_meta",
    });

    expect(result.customerEmail).toBe("david@fallback.com");
  });
});

describe("checkout.getCaseBySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns case data when found", async () => {
    const { findCaseByStripeSessionId } = await import("./portalDb");
    (findCaseByStripeSessionId as any).mockResolvedValueOnce({
      id: 30001,
      visaType: "eu-registration",
      status: "onboarding",
      clientName: "Patrick McClafferty",
      clientEmail: "paddymcc2004@gmail.com",
      dependents: 0,
      createdAt: new Date("2026-05-28T18:25:00Z"),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checkout.getCaseBySession({
      sessionId: "pi_3Tc8cePQMNl2HgGI17dD4x7g",
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe(30001);
    expect(result!.visaType).toBe("eu-registration");
    expect(result!.status).toBe("onboarding");
    expect(result!.clientName).toBe("Patrick McClafferty");
  });

  it("returns null when no case found", async () => {
    const { findCaseByStripeSessionId } = await import("./portalDb");
    (findCaseByStripeSessionId as any).mockResolvedValueOnce(null);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checkout.getCaseBySession({
      sessionId: "pi_nonexistent",
    });

    expect(result).toBeNull();
  });

  it("rejects empty sessionId", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.checkout.getCaseBySession({ sessionId: "" })
    ).rejects.toThrow();
  });
});
