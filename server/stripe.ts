import Stripe from "stripe";
import { Express, Request, Response } from "express";
import { VISA_PRODUCTS } from "./products";
import { createCaseWithSlots, findCaseByStripeSessionId } from "./portalDb";
import { queueWelcomeEmail } from "./emailNotifications";

// Test mode keys — used when STRIPE_TEST_MODE=true
const STRIPE_TEST_SK = "STRIPE_SECRET_KEY_PLACEHOLDER";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const isTestMode = process.env.STRIPE_TEST_MODE === "true";
    const key = isTestMode ? STRIPE_TEST_SK : process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Payment features are unavailable.");
    }
    if (isTestMode) {
      console.log("[Stripe] ⚠️ Running in TEST MODE — no real charges will be made");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

/**
 * Create a Stripe Checkout Session for a visa application.
 * Supports main applicant + optional dependents as separate line items.
 * Called from the tRPC router.
 */
export async function createCheckoutSession(params: {
  productId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  nationality: string;
  origin: string;
  dependents?: number; // Number of dependents (spouse, children)
}) {
  const product = VISA_PRODUCTS[params.productId];
  if (!product) {
    throw new Error(`Unknown product: ${params.productId}`);
  }

  // Build line items — main applicant always included
  const lineItems: Array<{
    price_data: { currency: string; product_data: { name: string; description: string }; unit_amount: number };
    quantity: number;
  }> = [
    {
      price_data: {
        currency: product.currency,
        product_data: {
          name: product.name,
          description: product.description,
        },
        unit_amount: product.priceInCents,
      },
      quantity: 1,
    },
  ];

  // Add dependent line items if applicable
  const dependentCount = params.dependents || 0;
  if (dependentCount > 0 && product.dependentPriceInCents) {
    lineItems.push({
      price_data: {
        currency: product.currency,
        product_data: {
          name: `${product.name} — Dependent`,
          description: `Dependent application (spouse/child) — document preparation and Gestor submission`,
        },
        unit_amount: product.dependentPriceInCents,
      },
      quantity: dependentCount,
    });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.customerEmail,
    allow_promotion_codes: true,
    line_items: lineItems,
    metadata: {
      product_id: params.productId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail,
      nationality: params.nationality,
      dependents: String(dependentCount),
    },
    success_url: `${params.origin}/application-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/#quiz`,
  });

  return { url: session.url };
}

/**
 * Register Stripe webhook endpoint.
 * MUST be registered BEFORE express.json() middleware for raw body access.
 */
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    // Raw body for signature verification
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      let event: Stripe.Event;

      try {
        event = getStripe().webhooks.constructEvent(
          req.body,
          sig as string,
          webhookSecret
        );
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      // Process events
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log("[Stripe] Checkout completed:", {
            id: session.id,
            email: session.customer_email,
            metadata: session.metadata,
            amount: session.amount_total,
          });

          // Auto-create a case with document slots (idempotent — dedupe by stripeSessionId)
          try {
            const metadata = session.metadata || {};
            const existingCase = await findCaseByStripeSessionId(session.id);
            if (existingCase) {
              console.log(`[Stripe] Case already exists for session ${session.id}, skipping duplicate`);
              break;
            }
            const caseId = await createCaseWithSlots({
              visaType: metadata.product_id || "digital-nomad-visa",
              clientName: metadata.customer_name || "Unknown",
              clientEmail: metadata.customer_email || session.customer_email || "",
              clientPhone: metadata.customer_phone || null,
              nationality: metadata.nationality || null,
              dependents: parseInt(metadata.dependents || "0", 10),
              stripeSessionId: session.id,
              status: "onboarding",
            });
            console.log(`[Stripe] Case created: #${caseId} for ${metadata.customer_email}`);
            // Queue welcome email
            queueWelcomeEmail(caseId).catch((err) => {
              console.error("[Stripe] Failed to queue welcome email:", err);
            });
          } catch (err) {
            console.error("[Stripe] Failed to create case:", err);
          }
          break;
        }
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log("[Stripe] Payment succeeded:", paymentIntent.id, paymentIntent.metadata);

          // Create case from custom order form payment (idempotent — dedupe by paymentIntent.id)
          try {
            const meta = paymentIntent.metadata || {};
            if (meta.product_id && meta.customer_email) {
              const existingCase = await findCaseByStripeSessionId(paymentIntent.id);
              if (existingCase) {
                console.log(`[Stripe] Case already exists for PaymentIntent ${paymentIntent.id}, skipping duplicate`);
                break;
              }
              const caseId = await createCaseWithSlots({
                visaType: meta.product_id,
                clientName: meta.customer_name || "Unknown",
                clientEmail: meta.customer_email,
                clientPhone: meta.customer_phone || null,
                nationality: meta.nationality || null,
                dependents: parseInt(meta.dependents || "0", 10),
                stripeSessionId: paymentIntent.id,
                status: "onboarding",
              });
              console.log(`[Stripe] Case created from PaymentIntent: #${caseId} for ${meta.customer_email}`);
              queueWelcomeEmail(caseId).catch((err) => {
                console.error("[Stripe] Failed to queue welcome email:", err);
              });
            }
          } catch (err) {
            console.error("[Stripe] Failed to create case from PaymentIntent:", err);
          }
          break;
        }
        default:
          console.log("[Stripe] Unhandled event type:", event.type);
      }

      res.json({ received: true });
    }
  );
}

/**
 * Create a PaymentIntent for the custom order form (Stripe Elements).
 * Returns client_secret for frontend confirmation.
 */
export async function createPaymentIntent(params: {
  amountInCents: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  nationality: string;
  productId: string;
  dependents: number;
  billingAddress: {
    country: string;
    line1: string;
    city: string;
    postalCode: string;
  };
}) {
  const product = VISA_PRODUCTS[params.productId];
  if (!product) {
    throw new Error(`Unknown product: ${params.productId}`);
  }

  // Verify amount matches expected pricing
  const expectedAmount = product.priceInCents + (product.dependentPriceInCents || 0) * params.dependents;
  if (params.amountInCents !== expectedAmount) {
    throw new Error("Amount mismatch — please refresh and try again");
  }

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: params.amountInCents,
    currency: product.currency,
    payment_method_types: ["card"],
    metadata: {
      product_id: params.productId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail,
      nationality: params.nationality,
      dependents: String(params.dependents),
    },
    receipt_email: params.customerEmail,
  });

  return { clientSecret: paymentIntent.client_secret };
}

/**
 * Verify a Stripe Checkout Session or PaymentIntent by ID.
 * Handles both cs_xxx (Checkout Sessions) and pi_xxx (PaymentIntents).
 * Returns session details if payment was successful, throws otherwise.
 */
export async function verifyCheckoutSession(sessionId: string) {
  // Handle PaymentIntent IDs (from embedded card form)
  if (sessionId.startsWith("pi_")) {
    const paymentIntent = await getStripe().paymentIntents.retrieve(sessionId);
    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment not completed");
    }
    return {
      verified: true,
      customerEmail: paymentIntent.metadata?.customer_email || paymentIntent.receipt_email || null,
      customerName: paymentIntent.metadata?.customer_name || null,
      productId: paymentIntent.metadata?.product_id || null,
      dependents: parseInt(paymentIntent.metadata?.dependents || "0", 10),
      amountTotal: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  // Handle Checkout Session IDs (from hosted checkout)
  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("Payment not completed");
  }

  return {
    verified: true,
    customerEmail: session.customer_email,
    customerName: session.metadata?.customer_name || null,
    productId: session.metadata?.product_id || null,
    dependents: parseInt(session.metadata?.dependents || "0", 10),
    amountTotal: session.amount_total,
    currency: session.currency,
  };
}
