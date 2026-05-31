import { useState, useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import { useGeoCountryCode } from "@/hooks/useGeoCountryCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { autoCapitalize } from "@/lib/utils";
import { Shield, Clock, BadgeCheck, CheckCircle2 } from "lucide-react";
import AssessmentChat from "@/components/AssessmentChat";
import { useLocation } from "wouter";

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028259905/ZhZM5zouxMCf2dF6jAeR8b/spain-terrace-work-KipjbSU8D86v6ZXrt9ztoq.webp";

// Map visa type dropdown values to product IDs for checkout
const VISA_TO_PRODUCT: Record<string, string> = {
  "digital-nomad": "digital-nomad-visa",
  "non-lucrative": "non-lucrative-visa",
  "student": "student-visa",
  "work": "work-visa",
  "eu-registration": "eu-registration",
};

export default function FreeAssessment() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const geoCode = useGeoCountryCode("+44");
  const [countryCode, setCountryCode] = useState("+44");
  const [geoApplied, setGeoApplied] = useState(false);
  const [visaType, setVisaType] = useState("");
  const [situation, setSituation] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Apply geo-detected country code once on load
  useEffect(() => {
    if (geoCode && !geoApplied) {
      setCountryCode(geoCode);
      setGeoApplied(true);
    }
  }, [geoCode, geoApplied]);

  const captureLeadMutation = trpc.leads.capture.useMutation();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !visaType) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const fullPhone = phone ? `${countryCode}${phone.replace(/^0+/, '')}` : phone;
      await captureLeadMutation.mutateAsync({
        email,
        source: "free-assessment",
        nationality: null,
        visaType,
        name,
        phone: fullPhone,
        situation,

      });
      setSubmitted(true);
      // Fire Google Ads conversion event
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-18188838081/K8QzCMGOkLMcEMHJjuFD',
          'value': 1.0,
          'currency': 'EUR'
        });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleStartApplication = (dependents: number = 0) => {
    const productId = VISA_TO_PRODUCT[visaType];
    if (!productId) {
      // If "not-sure" or unmapped, send to main funnel
      window.location.href = "/#quiz";
      return;
    }

    const params = new URLSearchParams({
      product: productId,
      name,
      email,
      phone,
      nationality: "other",
      dependents: String(dependents),
    });
    navigate(`/order?${params.toString()}`);
  };

  // Scroll to top when the confirmation/chat view loads
  useEffect(() => {
    if (submitted) {
      window.scrollTo(0, 0);
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        {/* Minimal nav */}
        <nav className="border-b border-slate-100 bg-white">
          <div className="container flex items-center justify-between h-14">
            <a
              href="/"
              className="font-display text-lg font-bold tracking-tight"
              style={{ color: "#1A2332" }}
            >
              Spain<span style={{ color: "#D97706" }}>PorFavor</span>
            </a>
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Licensed Gestores
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                24hr response
              </span>
            </div>
          </div>
        </nav>

        {/* Confirmation + Chat */}
        <main className="container py-10 md:py-16">
          <div className="max-w-2xl mx-auto">
            {/* Success header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1
                className="font-display text-2xl md:text-3xl font-bold mb-3"
                style={{ color: "#1A2332" }}
              >
                We've received your details, {name.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                Our team will review your situation and get back to you within 24
                hours.
              </p>
            </div>

            {/* AI Chat — the main feature of this page */}
            <div className="mb-8">
              <AssessmentChat
                userName={name}
                visaType={visaType}
                situation={situation}
                email={email}
                onStartApplication={handleStartApplication}
              />
            </div>

            {/* What happens next — condensed below chat */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p
                className="text-sm font-semibold mb-2"
                style={{ color: "#1A2332" }}
              >
                What happens next:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="font-semibold text-amber-600">1.</span>
                  We review your case within 24 hours
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-amber-600">2.</span>
                  You'll receive a personalized visa recommendation via email
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-amber-600">3.</span>
                  We'll outline your exact document checklist and next steps
                </li>
              </ol>
            </div>
          </div>
        </main>

        {/* Minimal footer */}
        <footer className="border-t border-slate-100 py-6">
          <div className="container text-center text-xs text-muted-foreground">
            © 2026 Bayshore Products S.L. (trading as SpainPorFavor). C.I.F.: B70778360. Licensed Gestores Administrativos — Document
            preparation service, not a law firm.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Free Visa Assessment — Check Your Spain Eligibility in 60 Seconds"
        description="Free Spain visa eligibility check. Tell us your situation and get a personalised visa recommendation with document checklist in under 60 seconds."
        path="/free-assessment"
        keywords="free visa assessment Spain, Spain visa eligibility check, Digital Nomad Visa requirements, am I eligible for Spain visa, Spain immigration assessment, visa document checklist"
      />
      {/* Minimal nav */}
      <nav className="border-b border-slate-100 bg-white">
        <div className="container flex items-center justify-between h-14">
          <a href="/" className="font-display text-lg font-bold tracking-tight" style={{ color: "#1A2332" }}>
            Spain<span style={{ color: "#D97706" }}>PorFavor</span>
          </a>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Licensed Gestores
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              24hr response
            </span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold mb-5">
              <BadgeCheck className="w-3.5 h-3.5" />
              Free — No obligation
            </div>
            <h1
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5"
              style={{ color: "#1A2332" }}
            >
              Get Your Free
              <br />
              Visa Assessment
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
              Tell us about your situation and our licensed immigration
              specialists will assess your eligibility and recommend the best
              visa pathway — within 24 hours.
            </p>

            {/* Trust signals */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#1A2332" }}>
                    Licensed Gestores Administrativos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Spain's official immigration specialists, registered with the
                    Colegio Oficial
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#1A2332" }}>
                    Response within 24 hours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No waiting weeks for a consultation slot — we get back to you
                    fast
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <BadgeCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#1A2332" }}>
                    No obligation, no payment required
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Get a clear answer on your eligibility before committing to
                    anything
                  </p>
                </div>
              </div>
            </div>

            {/* Image — hidden on mobile to keep form above fold */}
            <div className="hidden md:block rounded-xl overflow-hidden">
              <img
                src={HERO_IMAGE}
                alt="Working from a terrace in Spain"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
            <h2
              className="font-display text-xl font-bold mb-1"
              style={{ color: "#1A2332" }}
            >
              Tell us about your move
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Fill in the details below and we'll send you a personalized
              assessment.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Full name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(autoCapitalize(e.target.value))}
                  placeholder="Your full name"
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone number *
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="flex h-10 w-[100px] shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+1">🇨🇦 +1</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+353">🇮🇪 +353</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+351">🇵🇹 +351</option>
                    <option value="+64">🇳🇿 +64</option>
                    <option value="+852">🇭🇰 +852</option>
                  </select>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="7700 900000"
                    className="flex-1"
                    required
                  />
                </div>
              </div>


              <div>
                <Label htmlFor="visaType" className="text-sm font-medium">
                  What type of visa are you interested in? *
                </Label>
                <Select value={visaType} onValueChange={setVisaType}>
                  <SelectTrigger className="mt-1.5" tabIndex={0} id="visaType">
                    <SelectValue placeholder="Select a visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital-nomad">
                      Digital Nomad Visa (remote work)
                    </SelectItem>
                    <SelectItem value="non-lucrative">
                      Non-Lucrative Visa (retirement)
                    </SelectItem>
                    <SelectItem value="student">Student Visa</SelectItem>
                    <SelectItem value="work">
                      Work Visa (Spanish employer)
                    </SelectItem>
                    <SelectItem value="eu-registration">
                      EU Registration Certificate
                    </SelectItem>
                    <SelectItem value="not-sure">
                      Not sure — need guidance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="situation" className="text-sm font-medium">
                  Tell us about your situation
                </Label>
                <Textarea
                  id="situation"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="E.g., I'm a software developer working remotely for a US company. I want to move to Barcelona with my partner in the next 3 months..."
                  className="mt-1.5 min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional — but helps us give you a more accurate assessment
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full btn-primary h-12 font-bold text-base mt-2"
                disabled={captureLeadMutation.isPending}
              >
                {captureLeadMutation.isPending
                  ? "Submitting..."
                  : "Get My Free Assessment"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                No payment required. We'll respond within 24 hours.
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-slate-100 py-6">
        <div className="container text-center text-xs text-muted-foreground">
          © 2026 Bayshore Products S.L. (trading as SpainPorFavor). C.I.F.: B70778360. Licensed Gestores Administrativos — Document
          preparation service, not a law firm.
        </div>
      </footer>
    </div>
  );
}
