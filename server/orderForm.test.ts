import { describe, it, expect, vi } from "vitest";

// Mock Stripe
vi.mock("stripe", () => {
  const mockStripe = {
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        client_secret: "pi_test_secret_123",
        id: "pi_test_123",
      }),
    },
    checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
  };
  return { default: vi.fn(() => mockStripe) };
});

describe("createPaymentIntent", () => {
  it("should create a payment intent with correct amount for DNV solo", async () => {
    const { createPaymentIntent } = await import("./stripe");

    const result = await createPaymentIntent({
      amountInCents: 69900,
      customerEmail: "test@example.com",
      customerName: "John Doe",
      customerPhone: "+15551234567",
      nationality: "us",
      productId: "digital-nomad-visa",
      dependents: 0,
      billingAddress: {
        country: "US",
        line1: "123 Main St",
        city: "New York",
        postalCode: "10001",
      },
    });

    expect(result).toBeDefined();
    expect(result.clientSecret).toBe("pi_test_secret_123");
  });

  it("should create a payment intent with correct amount for DNV + 1 dependent", async () => {
    const { createPaymentIntent } = await import("./stripe");

    const result = await createPaymentIntent({
      amountInCents: 69900 + 39900, // 699 + 399 = 1098
      customerEmail: "couple@example.com",
      customerName: "Jane Doe",
      customerPhone: "+447700900000",
      nationality: "uk",
      productId: "digital-nomad-visa",
      dependents: 1,
      billingAddress: {
        country: "GB",
        line1: "10 Downing St",
        city: "London",
        postalCode: "SW1A 2AA",
      },
    });

    expect(result).toBeDefined();
    expect(result.clientSecret).toBe("pi_test_secret_123");
  });

  it("should reject mismatched amounts", async () => {
    const { createPaymentIntent } = await import("./stripe");

    await expect(
      createPaymentIntent({
        amountInCents: 10000, // Wrong amount
        customerEmail: "test@example.com",
        customerName: "John Doe",
        customerPhone: "+15551234567",
        nationality: "us",
        productId: "digital-nomad-visa",
        dependents: 0,
        billingAddress: {
          country: "US",
          line1: "123 Main St",
          city: "New York",
          postalCode: "10001",
        },
      })
    ).rejects.toThrow("Amount mismatch");
  });

  it("should reject unknown product IDs", async () => {
    const { createPaymentIntent } = await import("./stripe");

    await expect(
      createPaymentIntent({
        amountInCents: 50000,
        customerEmail: "test@example.com",
        customerName: "John Doe",
        customerPhone: "+15551234567",
        nationality: "us",
        productId: "nonexistent-visa",
        dependents: 0,
        billingAddress: {
          country: "US",
          line1: "123 Main St",
          city: "New York",
          postalCode: "10001",
        },
      })
    ).rejects.toThrow("Unknown product");
  });
});
