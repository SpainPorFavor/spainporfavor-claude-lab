/**
 * Custom Order Form — High-converting payment page with Stripe Elements.
 * Two-column layout: order summary (left) + payment form (right).
 * Pre-populated from quiz/chat data via URL search params.
 */
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { autoCapitalize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Shield,
  Lock,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  BadgeCheck,
  Clock,
  Star,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Stripe instance will be loaded dynamically based on server config
let stripePromiseCache: ReturnType<typeof loadStripe> | null = null;

// Product info for display
const PRODUCT_INFO: Record<string, { name: string; price: number; depPrice: number; timeline: string; features: string[] }> = {
  "eu-registration": {
    name: "EU Registration Certificate",
    price: 349,
    depPrice: 199,
    timeline: "2–3 weeks",
    features: ["NIE and Certificado de Registro", "Licensed Gestor submission", "48-hour document review", "Dedicated case manager"],
  },
  "digital-nomad-visa": {
    name: "Digital Nomad Visa (DNV)",
    price: 699,
    depPrice: 399,
    timeline: "4–6 weeks",
    features: ["Expert document preparation", "Licensed Gestor submission", "48-hour document review", "Free resubmission guarantee", "Dedicated case manager"],
  },
  "non-lucrative-visa": {
    name: "Non-Lucrative Visa (NLV)",
    price: 649,
    depPrice: 349,
    timeline: "6–8 weeks",
    features: ["Expert document preparation", "Licensed Gestor submission", "48-hour document review", "Free resubmission guarantee", "Dedicated case manager"],
  },
  "student-visa": {
    name: "Student Visa",
    price: 549,
    depPrice: 0,
    timeline: "4–6 weeks",
    features: ["Expert document preparation", "Licensed Gestor submission", "48-hour document review", "Free resubmission guarantee", "Dedicated case manager"],
  },
  "work-visa": {
    name: "Work Visa",
    price: 799,
    depPrice: 449,
    timeline: "8–12 weeks",
    features: ["Expert document preparation", "Licensed Gestor submission", "Employer sponsorship guidance", "Free resubmission guarantee", "Dedicated case manager"],
  },
};

// Map nationality codes to country codes for billing
const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  us: "US",
  uk: "GB",
  ca: "CA",
  au: "AU",
  eu: "ES",
  other: "",
};

const COUNTRY_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "IE", label: "Ireland" },
  { code: "ES", label: "Spain" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "NL", label: "Netherlands" },
  { code: "PT", label: "Portugal" },
  { code: "IT", label: "Italy" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "NZ", label: "New Zealand" },
  { code: "ZA", label: "South Africa" },
  { code: "IN", label: "India" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SG", label: "Singapore" },
  { code: "HK", label: "Hong Kong" },
  { code: "JP", label: "Japan" },
];

// Stripe Elements styling
const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1A2332",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: { color: "#ef4444" },
  },
};

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();

  // Read params from URL
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const productId = params.get("product") || "digital-nomad-visa";
  const prefillName = params.get("name") || "";
  const prefillEmail = params.get("email") || "";
  const prefillPhone = params.get("phone") || "";
  const prefillNationality = params.get("nationality") || "other";
  const prefillDependents = parseInt(params.get("dependents") || "0", 10);

  const product = PRODUCT_INFO[productId] || PRODUCT_INFO["digital-nomad-visa"];
  const totalPrice = product.price + product.depPrice * prefillDependents;

  // Form state
  const [name, setName] = useState(autoCapitalize(prefillName));
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState(prefillPhone);
  const [country, setCountry] = useState(NATIONALITY_TO_COUNTRY[prefillNationality] || "US");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const createPaymentIntent = trpc.checkout.createPaymentIntent.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!name || !email || !address || !city || !postalCode || !country) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create PaymentIntent on server
      const { clientSecret } = await createPaymentIntent.mutateAsync({
        productId,
        customerEmail: email,
        customerName: name,
        customerPhone: phone,
        nationality: prefillNationality,
        dependents: prefillDependents,
        billingAddress: {
          country,
          line1: address,
          city,
          postalCode,
        },
      });

      if (!clientSecret) {
        throw new Error("Failed to initialize payment");
      }

      // 2. Confirm payment with Stripe Elements
      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) {
        throw new Error("Card element not found");
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name,
            email,
            phone,
            address: {
              line1: address,
              city,
              postal_code: postalCode,
              country,
            },
          },
        },
      });

      if (error) {
        toast.error(error.message || "Payment failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        toast.success("Payment successful!");
        // Redirect to Case Activation Page with PaymentIntent ID
        window.location.href = `/application-success?session_id=${paymentIntent.id}`;
        return;
      } else if (paymentIntent?.status === "requires_action") {
        // 3D Secure or other action required — Stripe handles this automatically
        // If we reach here, the action failed or was cancelled
        toast.error("Authentication was not completed. Please try again.");
        setIsProcessing(false);
      } else {
        toast.error("Payment could not be processed. Please try again or use a different card.");
        setIsProcessing(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  // Success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1A2332] mb-2">
            Payment Confirmed!
          </h1>
          <p className="text-slate-600 mb-6">
            Your application for the {product.name} is now being processed.
            You'll receive your personalized document checklist within 24 hours.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-left mb-6">
            <h3 className="font-semibold text-sm text-[#1A2332] mb-3">What happens next:</h3>
            <ol className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                Check your email for your document checklist (within 24h)
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                Upload your documents through your client portal
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                Your Gestor reviews and submits to Spanish immigration
              </li>
            </ol>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="btn-primary"
          >
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-bold">
            <span className="text-[#1A2332]">Spain</span>
            <span className="text-amber-500">PorFavor</span>
          </a>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" />
            <span>256-bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Back to results link */}
        <a
          href="/#results"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1A2332] transition-colors mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to results
        </a>
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left Column — Order Summary */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="lg:sticky lg:top-8">
              {/* Order Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
                <h2 className="font-display text-lg font-bold text-[#1A2332] mb-4">
                  Order Summary
                </h2>

                {/* Line items */}
                <div className="space-y-3 pb-4 border-b border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">{product.name}</p>
                      <p className="text-[13px] text-slate-500">Primary applicant</p>
                    </div>
                    <p className="text-sm font-semibold text-[#1A2332]">€{product.price}</p>
                  </div>
                  {prefillDependents > 0 && product.depPrice > 0 && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-[#1A2332]">Dependent Application</p>
                        <p className="text-[13px] text-slate-500">
                          {prefillDependents} dependent{prefillDependents > 1 ? "s" : ""} × €{product.depPrice}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#1A2332]">
                        €{product.depPrice * prefillDependents}
                      </p>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4">
                  <p className="font-semibold text-[#1A2332]">Total</p>
                  <p className="font-display text-2xl font-bold text-[#1A2332]">€{totalPrice}</p>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
                <h3 className="font-semibold text-base text-[#1A2332] mb-3">What's included:</h3>
                <ul className="space-y-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-[13px] text-slate-500">
                    Estimated timeline: <span className="font-medium text-[#1A2332]">{product.timeline}</span>
                  </p>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed mb-3">
                  "I was drowning in paperwork and conflicting information. SpainPorFavor handled everything — I just uploaded my documents and got my visa in 5 weeks."
                </p>
                <p className="text-[13px] font-medium text-slate-600">— Sarah M., Digital Nomad Visa</p>
              </div>

              {/* Trust badges */}
              <div className="mt-5 flex items-center justify-center gap-4 text-[13px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  GDPR Compliant
                </span>
                <span className="flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  98.7% Approval Rate
                </span>
              </div>
            </div>
          </div>

          {/* Right Column — Payment Form */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1A2332] mb-1">
              Complete Your Order
            </h1>
            <p className="text-[15px] text-slate-500 mb-6">
              Your dedicated team starts within 24 hours of payment.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Details */}
              <div>
                <h3 className="font-semibold text-base text-[#1A2332] mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                  Contact Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[13px] font-medium text-slate-600 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(autoCapitalize(e.target.value))}
                      placeholder="Your full legal name"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-[#1A2332] placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[13px] font-medium text-slate-600 block mb-1">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-[#1A2332] placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-slate-600 block mb-1">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555 000 0000"
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-[#1A2332] placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h3 className="font-semibold text-base text-[#1A2332] mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                  Billing Address
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[13px] font-medium text-slate-600 block mb-1">Country *</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-[#1A2332] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                    >
                      <option value="">Select country</option>
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-slate-600 block mb-1">Address *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(autoCapitalize(e.target.value))}
                      placeholder="Street address"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-[#1A2332] placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[13px] font-medium text-slate-600 block mb-1">City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(autoCapitalize(e.target.value))}
                        placeholder="City"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-[#1A2332] placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-slate-600 block mb-1">ZIP / Postal Code *</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Postal code"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-[#1A2332] placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div>
                <h3 className="font-semibold text-base text-[#1A2332] mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
                  Payment Details
                </h3>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[13px] font-medium text-slate-600 block mb-1.5">Card Number</label>
                      <div className="px-4 py-3 rounded-lg border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                        <CardNumberElement options={ELEMENT_OPTIONS} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[13px] font-medium text-slate-600 block mb-1.5">Expiration Date</label>
                        <div className="px-4 py-3 rounded-lg border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                          <CardExpiryElement options={ELEMENT_OPTIONS} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[13px] font-medium text-slate-600 block mb-1.5">Security Code</label>
                        <div className="px-4 py-3 rounded-lg border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                          <CardCvcElement options={ELEMENT_OPTIONS} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div>
                {!promoOpen ? (
                  <button
                    type="button"
                    onClick={() => setPromoOpen(true)}
                    className="text-sm text-slate-500 hover:text-amber-600 underline underline-offset-4 transition-colors"
                  >
                    Have a promo code?
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info("Promo codes are applied at Stripe level. Contact us for discount codes.")}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 font-bold text-base bg-amber-500 hover:bg-amber-600 text-[#1A2332] rounded-xl shadow-lg shadow-amber-200/50"
                  disabled={isProcessing || !stripe}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pay €{totalPrice} — Start My Application
                    </>
                  )}
                </Button>

                {/* Trust signals below button */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Lock className="w-3 h-3" />
                    <span>Secure payment processed by Stripe</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Money-back guarantee
                    </span>
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Free resubmission
                    </span>
                  </div>
                  <p className="text-center text-[11px] text-slate-400 leading-relaxed mt-3">
                    Your card is charged immediately. If we determine you're ineligible after document review, you receive a full refund.
                    Government filing fees (€80–120), sworn translations, and apostille costs are separate.
                  </p>
                  <p className="text-center text-[11px] text-slate-400 mt-2">
                    By paying, you agree to our{" "}
                    <a href="/terms" target="_blank" className="underline hover:text-slate-600">Terms of Service</a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" className="underline hover:text-slate-600">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

// Wrapper component that fetches Stripe config from server then provides Stripe context
export default function OrderForm() {
  const { data: stripeConfig, isLoading } = trpc.checkout.getStripeConfig.useQuery();
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);

  useEffect(() => {
    if (stripeConfig?.publishableKey) {
      if (!stripePromiseCache) {
        stripePromiseCache = loadStripe(stripeConfig.publishableKey);
      }
      setStripePromise(stripePromiseCache);
    }
  }, [stripeConfig?.publishableKey]);

  if (isLoading || !stripePromise) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-[#475569] text-sm">Loading secure payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {stripeConfig?.testMode && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-800 text-center py-2 text-sm font-medium">
          ⚠️ TEST MODE — No real charges. Use card 4242 4242 4242 4242
        </div>
      )}
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </>
  );
}
