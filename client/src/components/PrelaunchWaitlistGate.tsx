/**
 * PrelaunchWaitlistGate — shown on /order to the PUBLIC while the pre-launch
 * flag is on and no bypass cookie is present (decision made server-side in
 * checkout.getPrelaunchGate). It replaces the checkout with a professional
 * "reserve your place" step instead of exposing a test-mode Stripe form.
 *
 * It reuses the EXISTING lead-capture path:
 *   - writes to the leads table via trpc.leads.capture (source: "waitlist")
 *   - that mutation sends the existing prospect confirmation email
 *   - then fires the existing Google Ads lead-capture conversion event
 *
 * No new consent copy is added — this mirrors the current quiz/assessment
 * capture, which shows no in-UI consent microcopy.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAVY = "#1A2332";
const AMBER = "#D97706";

export interface WaitlistPrefill {
  name: string;
  email: string;
  nationality: string | null;
  /** Canonical product slug (e.g. "digital-nomad-visa"), or null if unknown. */
  visaProductId: string | null;
  /** Friendly visa name for display (e.g. "Digital Nomad Visa (DNV)"). */
  visaLabel: string | null;
}

export function PrelaunchWaitlistGate({ prefill }: { prefill: WaitlistPrefill }) {
  const [email, setEmail] = useState(prefill.email);
  const [submitted, setSubmitted] = useState(false);
  const captureLead = trpc.leads.capture.useMutation();

  const handleReserve = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email so we can reach you.");
      return;
    }
    try {
      await captureLead.mutateAsync({
        email,
        source: "waitlist",
        nationality: prefill.nationality || null,
        // Store the canonical slug so waitlist leads are segmentable.
        visaType: prefill.visaProductId || undefined,
        name: prefill.name || undefined,
      });
      setSubmitted(true);
      // Fire the existing Google Ads lead-capture conversion (mirrors FreeAssessment).
      if (typeof (window as any).gtag === "function") {
        (window as any).gtag("event", "conversion", {
          send_to: "AW-18188838081/K8QzCMGOkLMcEMHJjuFD",
          value: 1.0,
          currency: "EUR",
        });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {submitted ? (
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: `${AMBER}1A` }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke={AMBER}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>
              You're on the list. We'll email you the moment applications open.
            </h1>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>
              Applications open soon
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
              We're opening our first cases shortly. Reserve your place and we'll open
              yours first.
            </p>

            <div className="mt-6 space-y-4">
              {prefill.name && (
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Name
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {prefill.name}
                  </div>
                </div>
              )}

              {prefill.visaLabel && (
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Visa
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {prefill.visaLabel}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="waitlist-email"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@email.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <Button
              onClick={handleReserve}
              disabled={captureLead.isPending}
              className="mt-6 h-12 w-full rounded-lg text-base font-semibold text-white hover:opacity-95"
              style={{ backgroundColor: AMBER }}
            >
              {captureLead.isPending ? "Reserving…" : "Reserve My Place"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
