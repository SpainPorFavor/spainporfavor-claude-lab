import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Upload,
  FileCheck,
  Shield,
  Lock,
  Calendar,
  Mail,
  ArrowRight,
  Circle,
  HelpCircle,
  ChevronUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSearch } from "wouter";
import { trackEvent } from "@/lib/tracking";
import { getRouteConfig, type RouteConfig, type StepStatus } from "./activationRouteConfig";

// Placeholder URLs — replace with real endpoints when available
const BOOKING_URL = "https://calendly.com/spainporfavor/kickoff"; // TODO: connect real booking link
/**
 * Navigate directly to document upload page using session_id.
 * No login required — the session_id authenticates the user for document upload.
 */
function goToDocuments(sessionId: string) {
  window.location.href = `/documents/start?session_id=${encodeURIComponent(sessionId)}`;
}

// Mask email: p••••@gmail.com
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"•".repeat(Math.min(local.length - 1, 4))}@${domain}`;
}

// Product ID to display name
const PRODUCT_NAMES: Record<string, string> = {
  "eu-registration": "EU Registration Certificate",
  "digital-nomad-visa": "Digital Nomad Visa (DNV)",
  "non-lucrative-visa": "Non-Lucrative Visa (NLV)",
  "student-visa": "Student Visa",
  "work-visa": "Work Visa",
};

export default function ApplicationSuccess() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");

  // Strip PII from URL immediately on mount
  useEffect(() => {
    if (sessionId && window.location.search.includes("name=")) {
      const cleanUrl = `${window.location.pathname}?session_id=${sessionId}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [sessionId]);

  // ── No session_id: invalid access ──
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3 text-[#1A2332]">
            Invalid Page Access
          </h1>
          <p className="text-muted-foreground mb-6">
            This page can only be accessed after completing a payment. If you believe this is an error, please contact support.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => (goToDocuments(sessionId!))} size="lg">
              Open Client Portal
            </Button>
            <a href="mailto:support@spainporfavor.com" className="text-sm text-muted-foreground underline">
              Contact support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Verify payment session ──
  const { data, isLoading, error } = trpc.checkout.verifySession.useQuery(
    { sessionId },
    { retry: 2, staleTime: Infinity }
  );

  // ── Fetch case data ──
  const { data: caseData } = trpc.checkout.getCaseBySession.useQuery(
    { sessionId },
    { enabled: !!data?.verified, retry: 2, staleTime: Infinity }
  );

  // ── Sticky CTA visibility ──
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling past the hero section (~400px)
      setShowStickyCta(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Track page view ──
  useEffect(() => {
    if (data?.verified) {
      trackEvent("payment_success_page_viewed", {
        product_type: data.productId || "unknown",
        product_name: PRODUCT_NAMES[data.productId || ""] || "Unknown",
        amount: data.amountTotal || 0,
      });
    }
  }, [data?.verified]);

  // ── Google Ads conversion ──
  useEffect(() => {
    if (data?.verified && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-18188838081/K8QzCMGOkLMcEMHJjuFD",
        value: data.amountTotal ? data.amountTotal / 100 : 349,
        currency: "EUR",
        transaction_id: sessionId,
      });
    }
  }, [data?.verified]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-[#1A2332] font-medium text-lg">Setting up your case…</p>
          <p className="text-muted-foreground text-sm mt-2">This usually takes a few seconds.</p>
        </div>
      </div>
    );
  }

  // ── Error / not verified ──
  if (error || !data?.verified) {
    trackEvent("success_page_error_state_viewed", { reason: error?.message || "not_verified" });
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3 text-[#1A2332]">
            We could not confirm your payment yet.
          </h1>
          <p className="text-muted-foreground mb-6">
            If you just completed checkout, please wait a moment and try again. Your payment may still be processing.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => (goToDocuments(sessionId!))} size="lg">
              Open Client Portal
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="lg">
              Retry
            </Button>
            <a href="mailto:support@spainporfavor.com" className="text-sm text-muted-foreground underline">
              Contact support
            </a>
            <a href="/" className="text-xs text-muted-foreground underline mt-2">
              Return to homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Get route-specific config ──
  const config = getRouteConfig(data.productId);

  // ── Derived display values ──
  const serviceName = data.productId
    ? PRODUCT_NAMES[data.productId] || "Visa Application"
    : "Visa Application";
  const applicantName = data.customerName || "Primary applicant";
  const maskedEmail = data.customerEmail ? maskEmail(data.customerEmail) : "";
  const caseId = caseData?.id
    ? `${config.caseIdPrefix}-${String(caseData.id).padStart(5, "0")}`
    : null;
  const dependentCount = data.dependents || 0;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* ── SECTION 1: Minimal Header ── */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-[#1A2332]">
              Spain<span className="text-amber-500">Por</span>Favor
            </span>
          </a>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" /> Secure case setup
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* ── SECTION 2: Confirmation Hero ── */}
        <section className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>

          {/* Progress badge */}
          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {config.progressBadge}
          </span>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1A2332] mb-3 leading-tight">
            {config.heroHeadline}
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
            {config.heroSubheadline}
          </p>

          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base px-8 py-6 rounded-lg shadow-md"
            onClick={() => {
              trackEvent("case_activation_cta_clicked", { product_type: data.productId || "" });
              trackEvent("step_3_upload_clicked", { product_type: data.productId || "" });
              goToDocuments(sessionId!);
            }}
          >
            {config.primaryCta}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <p className="text-xs text-muted-foreground mt-3 max-w-md mx-auto">
            {config.ctaMicrocopy}
          </p>

          {/* Secondary links */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-sm">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-[#1A2332] underline underline-offset-2"
              onClick={() => trackEvent("kickoff_call_clicked", { product_type: data.productId || "" })}
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Book a 15-minute kickoff call
            </a>
            {/*
              PR-4: Removed two fake actions — a "resend portal link" button
              that showed a false success alert without calling any backend,
              and a mailto link disguised as a receipt download. Both are
              replaced with a single honest support link until a real resend
              endpoint and a real Stripe receipt URL are wired up.
            */}
            <a
              href={`mailto:support@spainporfavor.com?subject=Help with my SpainPorFavor case - ${sessionId}`}
              className="text-muted-foreground hover:text-[#1A2332] underline underline-offset-2"
              onClick={() => trackEvent("support_clicked", { product_type: data.productId || "" })}
            >
              <Mail className="w-3.5 h-3.5 inline mr-1" />
              Need a portal link or receipt? Contact support
            </a>
          </div>
        </section>

        {/* ── SECTION 3: 5-Step Progress Tracker ── */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-bold text-[#1A2332] text-center mb-6">
            {config.journeyTitle}
          </h2>

          {/* Desktop: horizontal */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0" />
              <div className="absolute top-5 left-[10%] h-0.5 bg-emerald-400 z-0" style={{ width: "35%" }} />

              {config.steps.map((step, i) => (
                <StepItemHorizontal key={i} step={step} index={i} config={config} productId={data.productId} sessionId={sessionId} />
              ))}
            </div>
          </div>

          {/* Mobile: vertical */}
          <div className="md:hidden">
            <div className="space-y-0">
              {config.steps.map((step, i) => (
                <StepItemVertical key={i} step={step} index={i} totalSteps={config.steps.length} config={config} productId={data.productId} sessionId={sessionId} />
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Case Snapshot Card ── */}
        <section className="mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-display text-base font-bold text-[#1A2332] mb-4">Your case</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Service:</span>{" "}
                <span className="font-medium text-[#1A2332]">{serviceName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Applicant:</span>{" "}
                <span className="font-medium text-[#1A2332]">
                  {applicantName}
                  {dependentCount > 0 && ` + ${dependentCount} dependent${dependentCount > 1 ? "s" : ""}`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Payment:</span>{" "}
                <span className="font-medium text-emerald-600">Confirmed</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="font-medium text-amber-600">Waiting for first document upload</span>
              </div>
              <div>
                <span className="text-muted-foreground">Next action:</span>{" "}
                <span className="font-medium text-[#1A2332]">{config.primaryCta}</span>
              </div>
              {caseId && (
                <div>
                  <span className="text-muted-foreground">Case ID:</span>{" "}
                  <span className="font-medium text-[#1A2332]">{caseId}</span>
                </div>
              )}
              {maskedEmail && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Confirmation sent to:</span>{" "}
                  <span className="font-medium text-[#1A2332]">{maskedEmail}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: After Upload Explanation ── */}
        <section className="mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-display text-base font-bold text-[#1A2332] mb-2">
              {config.afterUploadTitle}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {config.afterUploadBody}
            </p>
            <ol className="space-y-2.5 text-sm text-[#1A2332]">
              {config.afterUploadBullets.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── SECTION 6: Starting Document Checklist ── */}
        <section className="mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-display text-base font-bold text-[#1A2332] mb-2">
              {config.checklistTitle}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {config.checklistIntro}
            </p>
            <ul className="space-y-2 text-sm text-[#1A2332]">
              {config.checklistItems.map((doc, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── SECTION 7: Reassurance Block ── */}
        <section className="mb-10">
          <h3 className="font-display text-base font-bold text-[#1A2332] text-center mb-5">
            You're not doing this alone
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReassuranceCard
              icon={<Shield className="w-6 h-6 text-amber-500" />}
              title="Specialist immigration support"
              body="Your documents are reviewed by specialists familiar with Spanish immigration and administrative requirements."
            />
            <ReassuranceCard
              icon={<FileCheck className="w-6 h-6 text-amber-500" />}
              title="Document review before the next step"
              body="We check for missing, unclear, or incorrectly formatted documents before you move forward."
            />
            <ReassuranceCard
              icon={<Lock className="w-6 h-6 text-amber-500" />}
              title="Secure document upload"
              body="Upload sensitive documents through your secure case portal, not scattered email threads."
            />
          </div>
        </section>

        {/* ── SECTION 8: Communication Preferences ── */}
        {/*
          PR-4: The previous SMS/WhatsApp opt-in stored consent in React state
          only — the checkbox cleared on reload and no consent row was written.
          Until a real consent-persistence flow exists, this section is shown
          as a disabled placeholder so we don't capture consent we can't honour.
        */}
        <section className="mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 opacity-70">
            <h3 className="font-display text-base font-bold text-[#1A2332] mb-3">
              Get case reminders
            </h3>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                disabled
                aria-label="SMS or WhatsApp reminders — not available yet"
                className="mt-1 w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-not-allowed"
              />
              <span className="text-sm text-[#1A2332]">
                SMS or WhatsApp reminders are not available yet. Service-critical email updates will still be sent.
              </span>
            </label>
          </div>
        </section>

        {/* ── SECTION 9: Route-Specific Blocker/Add-on Cards ── */}
        <section className="mb-10">
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
            <h3 className="font-display text-base font-bold text-[#1A2332] mb-2">
              {config.blockerTitle}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {config.blockerBody}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.blockerCards.map((addon, i) => (
                <button
                  key={i}
                  className="text-left bg-white rounded-lg border border-gray-100 p-4 hover:border-amber-200 hover:shadow-sm transition-all"
                  onClick={() => {
                    trackEvent("addon_card_clicked", { addon: addon.title, product_type: data.productId || "" });
                    // TODO: connect to add-on purchase flow
                    goToDocuments(sessionId!);
                  }}
                >
                  <p className="text-sm font-medium text-[#1A2332] mb-1">{addon.title}</p>
                  <p className="text-xs text-muted-foreground">{addon.body}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 10: Bottom CTA ── */}
        <section className="text-center mb-10">
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base px-8 py-6 rounded-lg shadow-md"
            onClick={() => {
              trackEvent("step_3_upload_clicked", { product_type: data.productId || "" });
              goToDocuments(sessionId!);
            }}
          >
            {config.primaryCta}
            <Upload className="ml-2 w-5 h-5" />
          </Button>
        </section>

        {/* ── SECTION 11: Footer ── */}
        <footer className="border-t border-gray-100 pt-6 pb-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <a
              href="mailto:support@spainporfavor.com"
              className="hover:text-[#1A2332] underline underline-offset-2"
              onClick={() => trackEvent("support_clicked", { product_type: data.productId || "" })}
            >
              <HelpCircle className="w-3.5 h-3.5 inline mr-1" />
              Need help? Contact support
            </a>
            <a href="/privacy" className="hover:text-[#1A2332] underline underline-offset-2">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-[#1A2332] underline underline-offset-2">
              Terms of Service
            </a>
          </div>
        </footer>
      </main>

      {/* ── SECTION 12: Sticky Mobile CTA ── */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 z-50 md:hidden">
          <Button
            size="lg"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-5 rounded-lg"
            onClick={() => {
              trackEvent("sticky_cta_clicked", { product_type: data.productId || "" });
              goToDocuments(sessionId!);
            }}
          >
            {config.stickyCta}
            <Upload className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-1">Step 3 of 5</p>
        </div>
      )}

      {/* ── Desktop sticky CTA (appears after hero scrolls out of view) ── */}
      {showStickyCta && (
        <div className="hidden md:block fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-5 rounded-lg shadow-lg"
            onClick={() => {
              trackEvent("sticky_cta_clicked", { product_type: data.productId || "" });
              goToDocuments(sessionId!);
            }}
          >
            {config.stickyCta}
            <ChevronUp className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Step components ──

interface StepItemProps {
  step: { label: string; body: string; status: StepStatus; cta?: string; note?: string };
  index: number;
  config: RouteConfig;
  productId: string | null | undefined;
  sessionId: string;
}

function StepItemHorizontal({ step, index, config, productId, sessionId }: StepItemProps) {
  const statusLabel =
    step.status === "complete" ? "Complete" :
    step.status === "current" ? "Current" :
    step.status === "goal" ? "Goal" : "Next";

  return (
    <div className="flex flex-col items-center text-center w-1/5 relative z-10">
      <StepIcon status={step.status} index={index} />
      <p className="text-xs font-semibold text-[#1A2332] mt-2 leading-tight">{step.label}</p>
      <span className={`text-[10px] mt-0.5 font-medium ${
        step.status === "complete" ? "text-emerald-600" :
        step.status === "current" ? "text-amber-600" :
        "text-gray-400"
      }`}>
        {statusLabel}
      </span>
    </div>
  );
}

function StepItemVertical({ step, index, totalSteps, config, productId, sessionId }: StepItemProps & { totalSteps: number }) {
  const statusLabel =
    step.status === "complete" ? "Complete" :
    step.status === "current" ? "Current" :
    step.status === "goal" ? "Goal" : "Next";

  return (
    <div className="flex gap-4 relative">
      {/* Vertical line */}
      {index < totalSteps - 1 && (
        <div className={`absolute left-[15px] top-10 bottom-0 w-0.5 ${
          index < 1 ? "bg-emerald-300" : index === 1 ? "bg-gradient-to-b from-emerald-300 to-gray-200" : "bg-gray-200"
        }`} />
      )}

      <div className="shrink-0 pt-1">
        <StepIcon status={step.status} index={index} />
      </div>

      <div className="pb-6 pt-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#1A2332]">{step.label}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            step.status === "complete" ? "bg-emerald-50 text-emerald-700" :
            step.status === "current" ? "bg-amber-50 text-amber-700" :
            "bg-gray-50 text-gray-500"
          }`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-sm">{step.body}</p>
        {step.cta && (
          <Button
            size="sm"
            className="mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs"
            onClick={() => {
              trackEvent("step_3_upload_clicked", { product_type: productId || "" });
              goToDocuments(sessionId!);
            }}
            aria-current="step"
          >
            {step.cta}
            <Upload className="ml-1.5 w-3.5 h-3.5" />
          </Button>
        )}
        {step.note && (
          <p className="text-[11px] text-muted-foreground mt-1.5 italic">{step.note}</p>
        )}
      </div>
    </div>
  );
}

function StepIcon({ status, index }: { status: StepStatus; index: number }) {
  if (status === "complete") {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center">
        <span className="text-xs font-bold text-amber-700">{index + 1}</span>
      </div>
    );
  }
  // next / goal
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <Circle className="w-4 h-4 text-gray-400" />
    </div>
  );
}

function ReassuranceCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
      <div className="flex items-center justify-center mb-3">{icon}</div>
      <p className="text-sm font-semibold text-[#1A2332] mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
