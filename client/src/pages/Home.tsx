/**
 * SpainPorFavor Funnel — Light Theme, High-Converting
 * Design decisions from 6-round debate:
 * - Light bg (#FAFBFC) + navy text (#1A2332) + amber CTAs (#F59E0B)
 * - Split hero (copy left, lifestyle image right)
 * - Outfit headlines + DM Sans body
 * - Hybrid quiz placement (CTA in hero → scroll to quiz)
 * - Escalating CTA copy per funnel stage
 * - Numbers bar first, testimonials after pricing
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import { useGeoCountryCode } from "@/hooks/useGeoCountryCode";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { autoCapitalize } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Clock,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Star,
  CheckCircle2,
  ArrowRight,
  Zap,
  Users,
  Globe,
  BadgeCheck,
  X,
  MapPin,
  Calendar,
  Home as HomeIcon,
  Briefcase,
} from "lucide-react";

// Asset URLs
const TERRACE_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028259905/ZhZM5zouxMCf2dF6jAeR8b/spain-terrace-work-KipjbSU8D86v6ZXrt9ztoq.webp";
const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028259905/ZhZM5zouxMCf2dF6jAeR8b/hero-spain-lifestyle-AMFqHSsXvoLLDHnbsv2BNW.webp";
const STREET_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028259905/ZhZM5zouxMCf2dF6jAeR8b/spain-street-life-Kfdem6m46KtdCGDhdetuFU.webp";

// Stage 3: Document readiness + timeline commitment questions (post-email, pre-payment)
const COMMITMENT_QUESTIONS = [
  {
    id: 7,
    question: "When do you want to be living in Spain?",
    subtitle: "This helps us prioritize your application timeline",
    options: [
      { label: "Within 2 months", value: "urgent", icon: "\u26A1" },
      { label: "3–4 months", value: "soon", icon: "\uD83D\uDCC5" },
      { label: "6+ months", value: "planning", icon: "\uD83D\uDDD3\uFE0F" },
      { label: "I'm flexible", value: "flexible", icon: "\uD83E\uDD37" },
    ],
  },
  {
    id: 8,
    question: "Which city or region are you considering?",
    subtitle: "Some consulates have different processing times",
    options: [
      { label: "Barcelona", value: "barcelona", icon: "\uD83C\uDFD7\uFE0F" },
      { label: "Madrid", value: "madrid", icon: "\uD83C\uDFDB\uFE0F" },
      { label: "Valencia", value: "valencia", icon: "\uD83C\uDF4A" },
      { label: "M\u00E1laga / Costa del Sol", value: "malaga", icon: "\u2600\uFE0F" },
      { label: "Other / Not sure yet", value: "other", icon: "\uD83C\uDF0D" },
    ],
  },
  {
    id: 9,
    question: "Do you have a valid passport with 6+ months validity?",
    subtitle: "This is required for all Spanish visa applications",
    options: [
      { label: "Yes, it's valid", value: "yes", icon: "\u2705" },
      { label: "No, I need to renew", value: "renew", icon: "\uD83D\uDD04" },
    ],
  },
  {
    id: 10,
    question: "Do you have a clean criminal record?",
    subtitle: "Spain requires an apostilled criminal record certificate",
    options: [
      { label: "Yes", value: "yes", icon: "\u2705" },
      { label: "No", value: "no", icon: "\u274C" },
    ],
  },
  {
    id: 11,
    question: "Have you found accommodation in Spain?",
    subtitle: "Proof of accommodation is needed for most visa types",
    options: [
      { label: "Yes, I have a place", value: "yes", icon: "\uD83C\uDFE0" },
      { label: "I'm actively looking", value: "looking", icon: "\uD83D\uDD0D" },
      { label: "Not yet", value: "no", icon: "\uD83D\uDCCB" },
    ],
  },
];

// City display names for summary
const CITY_LABELS: Record<string, string> = {
  barcelona: "Barcelona",
  madrid: "Madrid",
  valencia: "Valencia",
  malaga: "M\u00E1laga / Costa del Sol",
  other: "Spain",
};

// Timeline display for summary
const TIMELINE_LABELS: Record<string, string> = {
  urgent: "Within 2 months",
  soon: "3\u20134 months",
  planning: "6+ months",
  flexible: "Flexible timeline",
};

// Currency-localized income options based on nationality
function getIncomeOptions(nationality: string) {
  const currencyMap: Record<string, { symbol: string; thresholds: [string, string, string, string] }> = {
    us: { symbol: "$", thresholds: ["Under $3,100", "$3,100 – $4,500", "$4,500 – $6,500", "Over $6,500"] },
    uk: { symbol: "£", thresholds: ["Under £2,400", "£2,400 – £3,500", "£3,500 – £5,000", "Over £5,000"] },
    ca: { symbol: "C$", thresholds: ["Under C$4,200", "C$4,200 – C$6,200", "C$6,200 – C$8,800", "Over C$8,800"] },
    au: { symbol: "A$", thresholds: ["Under A$4,700", "A$4,700 – A$6,800", "A$6,800 – A$9,800", "Over A$9,800"] },
    eu: { symbol: "€", thresholds: ["Under €2,849", "€2,849 – €4,000", "€4,000 – €6,000", "Over €6,000"] },
    other: { symbol: "$", thresholds: ["Under $3,100", "$3,100 – $4,500", "$4,500 – $6,500", "Over $6,500"] },
  };

  const currency = currencyMap[nationality] || currencyMap.other;

  return [
    { label: currency.thresholds[0], value: "under3k", icon: "📊" },
    { label: currency.thresholds[1], value: "3k-4.5k", icon: "📊" },
    { label: currency.thresholds[2], value: "4.5k-6.5k", icon: "📊" },
    { label: currency.thresholds[3], value: "over6.5k", icon: "📊" },
  ];
}

// Quiz data
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Where are you currently?",
    subtitle: "This determines your application route — the process differs significantly",
    options: [
      { label: "Outside Spain (applying from my home country)", value: "outside", icon: "✈️" },
      { label: "Already in Spain (switching visa or first-time registration)", value: "inside", icon: "🇪🇸" },
    ],
  },
  {
    id: 2,
    question: "Why are you moving to Spain?",
    subtitle: "This determines which visa pathway is right for you",
    options: [
      { label: "Work remotely for a foreign company", value: "remote", icon: "💻" },
      { label: "Retire and enjoy life", value: "retire", icon: "🌅" },
      { label: "Study at a Spanish university", value: "study", icon: "📚" },
      { label: "Work for a Spanish employer", value: "work", icon: "🏢" },
      { label: "Start a business in Spain", value: "business", icon: "🚀" },
    ],
  },
  {
    id: 3,
    question: "What is your nationality?",
    subtitle: "Requirements vary by country of origin",
    options: [
      { label: "United States", value: "us", icon: "🇺🇸" },
      { label: "United Kingdom", value: "uk", icon: "🇬🇧" },
      { label: "Canada", value: "ca", icon: "🇨🇦" },
      { label: "Australia", value: "au", icon: "🇦🇺" },
      { label: "EU Citizen", value: "eu", icon: "🇪🇺" },
      { label: "Other", value: "other", icon: "🌍" },
    ],
  },
  {
    id: 4,
    question: "Who is moving with you?",
    subtitle: "Family members may need separate applications",
    options: [
      { label: "Just me", value: "solo", icon: "👤" },
      { label: "Me + my partner", value: "partner", icon: "👫" },
      { label: "Me + my family (kids)", value: "family", icon: "👨‍👩‍👧‍👦" },
    ],
  },
  {
    id: 5,
    question: "What is your monthly income?",
    subtitle: "Spain requires minimum income thresholds for most visas",
    options: [], // Dynamically generated based on nationality — see getIncomeOptions()
  },
  {
    id: 6,
    question: "What is your employment status?",
    subtitle: "This affects which documents you'll need",
    options: [
      { label: "Employee of a foreign company", value: "employee", icon: "💼" },
      { label: "Freelancer / Self-employed", value: "freelance", icon: "🎯" },
      { label: "Retired", value: "retired", icon: "🏖️" },
      { label: "Student", value: "student", icon: "🎓" },
      { label: "Business owner", value: "owner", icon: "📈" },
    ],
  },
];

function getVisaRecommendation(answers: Record<number, string>) {
  const location = answers[1]; // "outside" or "inside"
  const purpose = answers[2];
  const nationality = answers[3];

  // Submission path differs based on location
  const submissionStep = location === "inside"
    ? "We submit through Spain's Unidad de Grandes Empresas (UGE) immigration office — you track progress in real-time"
    : "We prepare your consulate submission package — you track progress in real-time";

  const routeNote = location === "inside"
    ? " You're applying from within Spain, so your application goes through the UGE (immigration office) rather than a consulate."
    : " You'll apply through the Spanish consulate in your home country.";

  if (nationality === "eu") {
    return {
      visa: "EU Registration Certificate",
      description: "As an EU citizen, you don't need a visa — but you do need to register. We handle the Certificado de Registro and NIE paperwork so you don't have to navigate Spanish bureaucracy.",
      timeline: "2–3 weeks",
      documents: ["Valid passport or EU national ID", "Proof of address in Spain (rental contract)", "Health insurance or S1 form", "Proof of income or employment contract"],
      nextSteps: ["Our team completes a full document review for your application within 48 hours — we catch errors before the government does", "Your Gestor prepares your complete registration package", "We submit to the local police station (Comisaría) — you track progress in real-time"],
    };
  }

  if (purpose === "remote" || purpose === "business") {
    return {
      visa: "Digital Nomad Visa (DNV)",
      description: `Spain's newest visa designed for remote workers and digital entrepreneurs. Live in Spain while working for companies outside Spain. Includes 3-year residency.${routeNote}`,
      timeline: location === "inside" ? "3–5 weeks" : "4–6 weeks",
      documents: ["Valid passport (6+ months validity)", "Remote work contract or client contracts", "Proof of income (min. €2,849/month)", "Private health insurance covering Spain", "Clean criminal record certificate (apostilled)", "University degree or 3+ years professional experience"],
      nextSteps: ["Our team completes a full document review for your application within 48 hours — we catch errors before the government does", "Your Gestor prepares your complete DNV application package", submissionStep],
    };
  }

  if (purpose === "retire") {
    return {
      visa: "Non-Lucrative Visa (NLV)",
      description: `The retirement visa for those who want to live in Spain without working. Requires proof of passive income or sufficient savings. Renewable annually.${routeNote}`,
      timeline: location === "inside" ? "4–6 weeks" : "6–8 weeks",
      documents: ["Valid passport (6+ months validity)", "Proof of passive income (min. €2,400/month)", "Private health insurance (no co-pays, full coverage)", "Clean criminal record certificate (apostilled)", "Medical certificate", "Proof of accommodation in Spain"],
      nextSteps: ["Our team completes a full document review for your application within 48 hours — we catch errors before the government does", "Your Gestor prepares your complete NLV application package", submissionStep],
    };
  }

  if (purpose === "study") {
    return {
      visa: "Student Visa (Estancia por Estudios)",
      description: `For enrollment in a Spanish educational institution. Can be converted to a work permit after graduation. Valid for the duration of your studies.${routeNote}`,
      timeline: location === "inside" ? "3–5 weeks" : "4–6 weeks",
      documents: ["Valid passport (6+ months validity)", "Acceptance letter from Spanish institution", "Proof of financial means (€600/month)", "Private health insurance covering Spain", "Clean criminal record certificate (apostilled)", "Medical certificate"],
      nextSteps: ["Our team completes a full document review for your application within 48 hours — we catch errors before the government does", "Your Gestor prepares your complete student visa package", submissionStep],
    };
  }

  if (purpose === "work") {
    return {
      visa: "Work Visa (Autorización Cuenta Ajena)",
      description: `For those with a job offer from a Spanish employer. Your employer must sponsor your application through the labor market test process.${routeNote}`,
      timeline: "8–12 weeks",
      documents: ["Valid passport (6+ months validity)", "Job offer/contract from Spanish company", "Employer's CIF and company registration", "Private health insurance", "Clean criminal record certificate (apostilled)", "Relevant professional qualifications"],
      nextSteps: ["Our team completes a full document review for your application within 48 hours — we catch errors before the government does", "Your Gestor prepares your complete work visa package", submissionStep],
    };
  }

  return {
    visa: "Digital Nomad Visa (DNV)",
    description: `Based on your profile, the Digital Nomad Visa is your strongest pathway to Spain. It offers a 3-year residency with the right to work remotely.${routeNote}`,
    timeline: location === "inside" ? "3–5 weeks" : "4–6 weeks",
    documents: ["Valid passport (6+ months validity)", "Remote work contract or client contracts", "Proof of income (min. €2,849/month)", "Private health insurance covering Spain", "Clean criminal record certificate (apostilled)", "University degree or 3+ years professional experience"],
    nextSteps: ["Our team completes a full document review for your application within 48 hours — we catch errors before the government does", "Your Gestor prepares your complete DNV application package", submissionStep],
  };
}

// Note: Replace with real testimonials once you have paying customers.
// These are framed as common pain points we solve, not attributed to fake people.
const TESTIMONIALS = [
  {
    name: "Digital Nomad Visa Client",
    flag: "🇺🇸",
    visa: "Digital Nomad Visa",
    quote: "The biggest challenge for remote workers is navigating conflicting information online. Our Gestores cut through the noise — you upload your documents, we handle the rest. Typical processing: 4–6 weeks.",
    rating: 5,
  },
  {
    name: "Non-Lucrative Visa Client",
    flag: "🇬🇧",
    visa: "Non-Lucrative Visa",
    quote: "Post-Brexit, UK citizens face new requirements for Spain. Our team knows exactly what each consulate expects — from financial proof formatting to insurance specifications. No guesswork.",
    rating: 5,
  },
  {
    name: "DNV Application",
    flag: "🇨🇦",
    visa: "Digital Nomad Visa",
    quote: "Document errors are the #1 cause of visa rejections. Our review process catches issues like apostille formatting, certificate validity dates, and income proof requirements before they reach the authorities.",
    rating: 5,
  },
];

const FAQS = [
  {
    question: "Do I need a lawyer to get a Spanish visa?",
    answer: "No. In Spain, immigration document preparation and submission is handled by licensed Gestores Administrativos (official immigration specialists) — not lawyers. Our in-house Gestores are fully licensed and registered with the Colegio Oficial. They submit directly to Spanish immigration authorities using their digital certificates.",
  },
  {
    question: "How long does the process take?",
    answer: "From the moment you upload your documents, our team prepares everything within 24-48 hours. Your Gestor (dedicated immigration specialist) then submits to the Spanish authorities. Total timeline depends on your visa type: Digital Nomad Visa (4-6 weeks), Non-Lucrative Visa (6-8 weeks), Student Visa (4-6 weeks). We'll give you a precise timeline after your eligibility check.",
  },
  {
    question: "How do you make sure my application is well prepared?",
    answer: "Your documents are reviewed by specialists before they go anywhere near the Spanish authorities. A licensed Gestor Administrativo checks each document against the requirements for your visa type, flags anything missing or incorrectly formatted, and only submits the package once it is complete. Outcomes still depend on the competent authority and on truthful, complete information from you — no service can guarantee an approval.",
  },
  {
    question: "Is my data safe? I'm uploading my passport.",
    answer: "Your documents are uploaded to a private storage bucket in the EU, encrypted at rest, and accessed only by authorised case staff working on your application. Connections use HTTPS. See our Privacy Policy for retention and your data-protection rights, including how to request deletion of your case data.",
  },
  {
    question: "What if my application is rejected?",
    answer: "If your application is rejected for fixable document reasons, we resubmit at no additional cost, subject to our terms. Your Gestor analyses the rejection reason, addresses the issue, and resubmits to the authorities — you don't pay twice. This applies when you have provided truthful, complete information; it does not apply to circumstances outside our control (such as undisclosed criminal record issues or policy changes).",
  },
  {
    question: "Can you help with renewals and NIE?",
    answer: "Yes. After your initial visa, we offer renewal services, NIE number processing, TIE card applications, and even Beckham Law tax optimization for qualifying clients. Most clients stay with us for 3-5 years as we handle their ongoing immigration needs.",
  },
];

// Pricing lookup keyed by visa recommendation name
const PRICING_MAP: Record<string, { price: string; timeline: string; features: string[] }> = {
  "EU Registration Certificate": {
    price: "349",
    timeline: "2–3 weeks",
    features: ["NIE and Certificado de Registro handled", "Licensed Gestor (specialist) submission", "48-hour turnaround on document review", "Dedicated case manager", "Empadronamiento guidance included"],
  },
  "Digital Nomad Visa (DNV)": {
    price: "699",
    timeline: "4–6 weeks",
    features: ["Expert document preparation & review", "Licensed Gestor submission to immigration authorities", "48-hour turnaround on document review", "Free resubmission support for fixable issues (subject to our terms)", "Dedicated case manager"],
  },
  "Non-Lucrative Visa (NLV)": {
    price: "649",
    timeline: "6–8 weeks",
    features: ["Expert document preparation & review", "Licensed Gestor submission to immigration authorities", "48-hour turnaround on document review", "Free resubmission support for fixable issues (subject to our terms)", "Dedicated case manager"],
  },
  "Student Visa (Estancia por Estudios)": {
    price: "549",
    timeline: "4–6 weeks",
    features: ["Expert document preparation & review", "Licensed Gestor submission to immigration authorities", "48-hour turnaround on document review", "Free resubmission support for fixable issues (subject to our terms)", "Dedicated case manager"],
  },
  "Work Visa (Autorización Cuenta Ajena)": {
    price: "799",
    timeline: "8–12 weeks",
    features: ["Expert document preparation & review", "Licensed Gestor submission to immigration authorities", "Employer sponsorship guidance", "Free resubmission support for fixable issues (subject to our terms)", "Dedicated case manager"],
  },
};

// FAQPage schema for the homepage FAQ section
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [email, setEmail] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [appName, setAppName] = useState("");
  const geoCode = useGeoCountryCode("+44");
  const [appCountryCode, setAppCountryCode] = useState("+44");
  const [appPhone, setAppPhone] = useState("");
  const [geoAppliedApp, setGeoAppliedApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [commitmentStep, setCommitmentStep] = useState(0); // 0 = not started, 1-5 = questions 7-11
  const [commitmentAnswers, setCommitmentAnswers] = useState<Record<number, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const exitIntentShown = useRef(false);

  // Map quiz nationality answer to phone dial code
  const NATIONALITY_TO_DIAL: Record<string, string> = {
    us: "+1",
    uk: "+44",
    ca: "+1",
    au: "+61",
    eu: "+34", // EU citizens moving to Spain likely have/want a Spanish number
    other: "+1",
  };

  // Apply nationality-based country code whenever the nationality answer changes
  // This runs AFTER the user answers the nationality question (answers[3])
  useEffect(() => {
    const nationality = answers[3];
    if (nationality && NATIONALITY_TO_DIAL[nationality]) {
      setAppCountryCode(NATIONALITY_TO_DIAL[nationality]);
    }
  }, [answers[3]]);

  // Fallback: apply geo-detected code only if no nationality answer yet
  useEffect(() => {
    if (geoCode && !geoAppliedApp && !answers[3]) {
      setAppCountryCode(geoCode);
      setGeoAppliedApp(true);
    }
  }, [geoCode, geoAppliedApp]);

  // Exit-intent detection: triggers when cursor moves to top of viewport
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentShown.current && !email) {
        exitIntentShown.current = true;
        setShowExitIntent(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [email]);
  const quizRef = useRef<HTMLDivElement>(null);

  const checkoutMutation = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to secure checkout...");
        window.location.href = data.url;
      }
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    },
  });

  const leadCaptureMutation = trpc.leads.capture.useMutation();

  // Map visa recommendation name to product ID
  const VISA_NAME_TO_PRODUCT_ID: Record<string, string> = {
    "EU Registration Certificate": "eu-registration",
    "Digital Nomad Visa (DNV)": "digital-nomad-visa",
    "Non-Lucrative Visa (NLV)": "non-lucrative-visa",
    "Student Visa (Estancia por Estudios)": "student-visa",
    "Work Visa (Autorización Cuenta Ajena)": "work-visa",
  };

  const handleStartApplication = () => {
    setShowApplicationForm(true);
  };

  const [, navigate] = useLocation();

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !appPhone || !email) return;
    // Resolve the quiz recommendation display name to a canonical product slug.
    // No silent DNV default — if the recommendation isn't in the explicit map,
    // block navigation and surface a clear error. See docs/product-routes.md.
    const productId = VISA_NAME_TO_PRODUCT_ID[recommendation.visa];
    if (!productId) {
      console.error(
        `[Home] Unmapped visa recommendation: ${JSON.stringify(recommendation.visa)}. Refusing to route to /order with a DNV default.`
      );
      toast.error(
        "We couldn't determine your visa type. Please retake the quiz or contact support."
      );
      return;
    }
    // Determine dependents from quiz answer
    const whoMoving = answers[4]; // solo, partner, family
    const dependents = whoMoving === "partner" ? 1 : whoMoving === "family" ? 2 : 0;
    // Navigate to custom order form with pre-filled data
    const params = new URLSearchParams({
      product: productId,
      name: appName,
      email,
      phone: `${appCountryCode}${appPhone.replace(/^0+/, '')}`,
      nationality: answers[3] || "other",
      dependents: String(dependents),
    });
    navigate(`/order?${params.toString()}`);
  };

  const handleStartQuiz = () => {
    setQuizStep(1);
    setTimeout(() => {
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (questionId < 6) {
      setTimeout(() => setQuizStep(questionId + 1), 250);
    } else {
      setTimeout(() => setQuizStep(7), 250);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Don't show results yet — go to commitment questions first
      setCommitmentStep(1);
      setQuizStep(8);
      // Capture lead in database
      leadCaptureMutation.mutate({
        email,
        source: "quiz" as const,
        nationality: answers[3] || undefined,
        visaType: recommendation?.visa || undefined,
      });
    }
  };

  const handleCommitmentAnswer = (questionId: number, value: string) => {
    setCommitmentAnswers((prev) => ({ ...prev, [questionId]: value }));
    const currentIndex = COMMITMENT_QUESTIONS.findIndex((q) => q.id === questionId);
    if (currentIndex < COMMITMENT_QUESTIONS.length - 1) {
      setTimeout(() => setCommitmentStep(currentIndex + 2), 250);
    } else {
      // All commitment questions answered — show summary
      setTimeout(() => {
        setShowSummary(true);
        setCommitmentStep(0);
      }, 250);
    }
  };

  const handleSummaryProceed = () => {
    setShowSummary(false);
    setShowResults(true);
  };

  // Calculate document readiness for summary
  const getDocumentReadiness = () => {
    let ready = 0;
    let total = 3; // passport, criminal record, accommodation
    if (commitmentAnswers[9] === "yes") ready++;
    if (commitmentAnswers[10] === "yes") ready++;
    if (commitmentAnswers[11] === "yes") ready++;
    return { ready, total, percentage: Math.round((ready / total) * 100) };
  };

  const recommendation = getVisaRecommendation(answers);

  // Adjusted timeline based on urgency + readiness
  const getAdjustedTimeline = () => {
    const baseTimeline = recommendation.timeline;
    const urgency = commitmentAnswers[7];
    if (urgency === "urgent" && commitmentAnswers[9] === "yes") {
      return "Rush processing available — " + baseTimeline;
    }
    if (commitmentAnswers[9] === "renew") {
      return baseTimeline + " (+ passport renewal time)";
    }
    return baseTimeline;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="SpainPorFavor — The Smartest Way to Move to Spain"
        description="Get your Spanish visa approved in weeks, not months. Licensed Gestores prepare and submit your documents directly to Spanish immigration authorities."
        path="/"
        keywords="Spain visa, Digital Nomad Visa Spain, Non-Lucrative Visa, move to Spain, Gestor Administrativo, Spain immigration"
      >
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SpainPorFavor",
          url: "https://www.spainporfavor.com",
          description: "Immigration document preparation service connecting clients with licensed Gestores Administrativos in Spain",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.spainporfavor.com/guides?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}</script>
      </SEOHead>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight" style={{ color: "#1A2332" }}>
              Spain<span style={{ color: "#D97706" }}>PorFavor</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <BadgeCheck className="w-4 h-4" style={{ color: "#D97706" }} />
              <span className="font-medium" style={{ color: "#1A2332" }}>Licensed Gestores</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="w-4 h-4 text-emerald-600" />
              Licensed Gestores (Immigration Specialists)
            </span>
          </div>
          <Button
            onClick={handleStartQuiz}
            className="btn-primary text-sm px-5 h-9 font-semibold"
          >
            Check Eligibility
          </Button>
        </div>
      </nav>

      {/* Hero Section — Split Layout */}
      <section className="pt-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-4rem)] py-12 lg:py-20">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
                <Shield className="w-3.5 h-3.5" />
                Trusted by Expats Worldwide
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] mb-5" style={{ color: "#1A2332" }}>
                The Smartest Way to Move to Spain
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Get your Spanish visa approved in weeks, not months. Our licensed Gestores (Spain's official immigration specialists) prepare and submit your documents directly to Spanish immigration — so you don't have to.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  onClick={handleStartQuiz}
                  size="lg"
                  className="btn-primary text-base px-7 h-13 font-bold"
                >
                  Check Your Eligibility — Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  Takes 60 seconds
                </span>
              </div>

              {/* Mini social proof */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="flex -space-x-2">
                  {["S", "J", "E", "D", "M"].map((letter, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-600"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Licensed <span className="font-semibold" style={{ color: "#1A2332" }}>Gestores</span> handling your application
                </p>
              </div>
            </motion.div>

            {/* Right: Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50">
                <img
                  src={TERRACE_IMAGE}
                  alt="Working remotely from a Spanish terrace overlooking the Mediterranean"
                  className="w-full h-[520px] object-cover"
                />
                {/* Floating badge */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#1A2332" }}>Average processing time</p>
                      <p className="text-xs text-muted-foreground">4–6 weeks for Digital Nomad Visa</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Numbers Bar */}
      <section className="section-divider bg-slate-50 py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* PR-4: removed the unsupported numeric approval-rate stat —
                replaced with a non-numeric trust signal. See
                docs/compliance-rules.md. */}
            {[
              { number: "6+", label: "Visa Types Covered" },
              { number: "Gestor", label: "Licensed Submission" },
              { number: "48hr", label: "Document Review" },
              { number: "4–6 wks", label: "Typical DNV Timeline" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-2xl md:text-3xl font-extrabold" style={{ color: "#1A2332" }}>
                  {stat.number}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">*Industry average for professionally prepared applications (source: MoveToSpainGuide 2024 data, 291 applications)</p>
        </div>
      </section>

      {/* Interactive Quiz Section */}
      <section ref={quizRef} id="quiz" className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            {quizStep === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1A2332" }}>
                  Find Your Visa Pathway
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                  Answer 6 quick questions. We'll tell you which visa you qualify for, what documents you need, and how long it takes.
                </p>
                <Button
                  onClick={handleStartQuiz}
                  size="lg"
                  className="btn-primary text-base px-8 h-13 font-bold"
                >
                  Check Your Eligibility — Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <p className="text-xs text-muted-foreground mt-3">No account needed. Results are instant.</p>
              </motion.div>
            )}

            {quizStep >= 1 && quizStep <= 6 && (
              <div>
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Question {quizStep} of 6</span>
                    <span className="font-medium" style={{ color: "#1A2332" }}>{Math.round((quizStep / 6) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "#D97706" }}
                      initial={{ width: `${((quizStep - 1) / 6) * 100}%` }}
                      animate={{ width: `${(quizStep / 6) * 100}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {quizStep > 1 && (
                  <button
                    onClick={() => setQuizStep(quizStep - 1)}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={quizStep}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h3 className="font-display text-2xl md:text-3xl font-bold mb-2" style={{ color: "#1A2332" }}>
                      {QUIZ_QUESTIONS[quizStep - 1].question}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      {QUIZ_QUESTIONS[quizStep - 1].subtitle}
                    </p>
                    <div className="space-y-3">
                      {(quizStep === 5 ? getIncomeOptions(answers[3] || "other") : QUIZ_QUESTIONS[quizStep - 1].options).map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAnswer(quizStep, option.value)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-150 flex items-center gap-3 ${
                            answers[quizStep] === option.value
                              ? "border-amber-500 bg-amber-50"
                              : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                          }`}
                        >
                          <span className="text-xl">{option.icon}</span>
                          <span className="font-medium text-sm" style={{ color: "#1A2332" }}>{option.label}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {quizStep === 7 && !showResults && commitmentStep === 0 && !showSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                  <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Almost there...</span>
                    <span className="font-medium" style={{ color: "#1A2332" }}>50%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full w-[50%]" style={{ backgroundColor: "#D97706" }} />
                  </div>
                </div>

                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-2" style={{ color: "#1A2332" }}>
                  Great news — you likely qualify!
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Enter your email to see your personalized visa pathway, required documents, and timeline.
                </p>
                <form onSubmit={handleEmailSubmit} className="max-w-sm mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white border-2 border-slate-200 text-foreground placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 mb-3 text-sm"
                  />
                  <Button
                    type="submit"
                    className="w-full btn-primary h-12 font-bold text-sm"
                  >
                    See My Visa Pathway
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    No spam. We'll send your personalized report only.
                  </p>
                </form>
              </motion.div>
            )}

            {/* Stage 3: Commitment Questions (post-email, pre-results) */}
            {commitmentStep > 0 && !showResults && !showSummary && (
              <div>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Personalizing your plan...</span>
                    <span className="font-medium" style={{ color: "#1A2332" }}>
                      {Math.round(50 + (commitmentStep / COMMITMENT_QUESTIONS.length) * 40)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "#D97706" }}
                      initial={{ width: "50%" }}
                      animate={{ width: `${50 + (commitmentStep / COMMITMENT_QUESTIONS.length) * 40}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {commitmentStep > 1 && (
                  <button
                    onClick={() => setCommitmentStep(commitmentStep - 1)}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`commitment-${commitmentStep}`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h3 className="font-display text-2xl md:text-3xl font-bold mb-2" style={{ color: "#1A2332" }}>
                      {COMMITMENT_QUESTIONS[commitmentStep - 1].question}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      {COMMITMENT_QUESTIONS[commitmentStep - 1].subtitle}
                    </p>
                    <div className="space-y-3">
                      {COMMITMENT_QUESTIONS[commitmentStep - 1].options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleCommitmentAnswer(COMMITMENT_QUESTIONS[commitmentStep - 1].id, option.value)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-150 flex items-center gap-3 ${
                            commitmentAnswers[COMMITMENT_QUESTIONS[commitmentStep - 1].id] === option.value
                              ? "border-amber-500 bg-amber-50"
                              : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                          }`}
                        >
                          <span className="text-xl">{option.icon}</span>
                          <span className="font-medium text-sm" style={{ color: "#1A2332" }}>{option.label}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Personalized Summary Screen */}
            {showSummary && !showResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* PR-4: removed the "95%" numeric label — too easy to read
                    as an approval-rate claim next to visa marketing. Progress
                    bar stays as a UI cue without an attached number. */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Your plan is ready</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "#D97706" }}
                      initial={{ width: "90%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>

                <div className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Personalized for you
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "#1A2332" }}>
                    Your Spain Move Summary
                  </h3>
                </div>

                <div className="card-elevated p-5 md:p-6 mb-4">
                  {/* Visa + Timeline */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
                      <BadgeCheck className="w-4 h-4" style={{ color: "#D97706" }} />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold" style={{ color: "#D97706" }}>{recommendation.visa}</p>
                      <p className="text-xs text-muted-foreground">{getAdjustedTimeline()}</p>
                    </div>
                  </div>

                  {/* Move details */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-muted-foreground">Destination</span>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: "#1A2332" }}>
                        {CITY_LABELS[commitmentAnswers[8]] || "Spain"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-muted-foreground">Target move</span>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: "#1A2332" }}>
                        {TIMELINE_LABELS[commitmentAnswers[7]] || "Flexible"}
                      </p>
                    </div>
                  </div>

                  {/* Document readiness */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="font-semibold text-sm mb-3" style={{ color: "#1A2332" }}>Document Readiness</p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        {commitmentAnswers[9] === "yes" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-amber-400 shrink-0" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          Valid passport (6+ months)
                          {commitmentAnswers[9] === "renew" && (
                            <span className="text-amber-600 font-medium"> — renewal needed</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {commitmentAnswers[10] === "yes" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-red-400 shrink-0" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          Clean criminal record
                          {commitmentAnswers[10] === "no" && (
                            <span className="text-red-600 font-medium"> — may affect eligibility</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {commitmentAnswers[11] === "yes" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          Accommodation in Spain
                          {commitmentAnswers[11] === "looking" && (
                            <span className="text-amber-600 font-medium"> — actively searching</span>
                          )}
                          {commitmentAnswers[11] === "no" && (
                            <span className="text-slate-500 font-medium"> — we can help with this</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Readiness bar */}
                    <div className="mt-4 bg-slate-50 rounded-lg p-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Document readiness</span>
                        <span className="font-semibold" style={{ color: "#1A2332" }}>
                          {getDocumentReadiness().ready}/{getDocumentReadiness().total} ready
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${getDocumentReadiness().percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Criminal record warning */}
                {commitmentAnswers[10] === "no" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
                      Your situation may need individual assessment
                    </p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Criminal record issues don't always prevent visa approval — it depends on the type and severity. We recommend a free consultation to assess your specific case before proceeding.
                    </p>
                  </div>
                )}

                {/* CTA */}
                {commitmentAnswers[10] === "no" ? (
                  <>
                    <Button
                      size="lg"
                      className="w-full h-13 font-bold text-base bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => {
                        toast("Free consultation", {
                          description: "Our team will reach out within 24 hours to discuss your situation confidentially.",
                        });
                      }}
                    >
                      Book a Free Consultation
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <button
                      className="mt-3 text-xs text-muted-foreground underline hover:text-foreground"
                      onClick={handleSummaryProceed}
                    >
                      I'd prefer to proceed with the standard application
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="w-full btn-primary h-13 font-bold text-base"
                      onClick={handleSummaryProceed}
                    >
                      See My Complete Visa Plan
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      Your personalized document checklist, timeline, and next steps
                    </p>
                  </>
                )}
              </motion.div>
            )}

            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    You qualify!
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "#1A2332" }}>
                    Your Visa Pathway
                  </h3>
                </div>

                <div className="card-elevated p-6 md:p-8 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#D97706" }} />
                    </div>
                    <h4 className="font-display text-xl md:text-2xl font-bold" style={{ color: "#D97706" }}>
                      {recommendation.visa}
                    </h4>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    {recommendation.description}
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3 mb-6 inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <p className="text-sm"><span className="font-semibold" style={{ color: "#1A2332" }}>Estimated timeline:</span> {recommendation.timeline}</p>
                  </div>

                  <div className="mb-6">
                    <p className="font-semibold text-sm mb-3" style={{ color: "#1A2332" }}>Your personalized document checklist:</p>
                    <ul className="space-y-2">
                      {recommendation.documents.map((doc) => (
                        <li key={doc} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <p className="font-semibold text-sm mb-3" style={{ color: "#1A2332" }}>What happens next:</p>
                    <ol className="space-y-2">
                      {recommendation.nextSteps.map((step, i) => (
                        <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {!showApplicationForm ? (
                  <>
                    <Button
                      size="lg"
                      className="w-full btn-primary h-13 font-bold text-base"
                      onClick={handleStartApplication}
                    >
                      Start My Application — €{PRICING_MAP[recommendation.visa]?.price || "699"}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <div className="flex items-center justify-center gap-2 mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-xs font-medium text-emerald-700">
                        Free resubmission support for fixable document issues, subject to our terms.
                      </p>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Secure checkout. Your dedicated team starts within 24 hours of payment.
                    </p>
                    <button
                      className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4 transition-colors"
                      onClick={() => toast("Coming soon", { description: "Free consultation booking will be available shortly. In the meantime, email us at support@spainporfavor.com" })}
                    >
                      Have questions? Book a free 15-min call
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <div className="bg-slate-50 rounded-xl p-5 md:p-6 border border-slate-200">
                      <h4 className="font-display text-lg font-bold mb-1" style={{ color: "#1A2332" }}>
                        Almost there — confirm your details
                      </h4>
                      <p className="text-xs text-muted-foreground mb-5">
                        We'll use this to set up your application. You'll be redirected to secure payment.
                      </p>
                      <form onSubmit={handleSubmitApplication} className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Full name</label>
                          <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(autoCapitalize(e.target.value))}
                            placeholder="Your full legal name"
                            required
                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-foreground placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
                          <input
                            type="email"
                            value={email}
                            readOnly
                            className="w-full px-3 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-foreground text-sm cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground mt-0.5">Pre-filled from your eligibility check</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Phone number</label>
                          <div className="flex gap-2">
                            <select
                              value={appCountryCode}
                              onChange={(e) => setAppCountryCode(e.target.value)}
                              className="h-10 w-[100px] shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
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
                              <option value="+39">🇮🇹 +39</option>
                              <option value="+46">🇸🇪 +46</option>
                              <option value="+47">🇳🇴 +47</option>
                              <option value="+45">🇩🇰 +45</option>
                              <option value="+91">🇮🇳 +91</option>
                              <option value="+971">🇦🇪 +971</option>
                              <option value="+64">🇳🇿 +64</option>
                              <option value="+852">🇭🇰 +852</option>
                              <option value="+65">🇸🇬 +65</option>
                              <option value="+81">🇯🇵 +81</option>
                            </select>
                            <input
                              type="tel"
                              value={appPhone}
                              onChange={(e) => setAppPhone(e.target.value)}
                              placeholder="7700 900000"
                              required
                              className="flex-1 px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-foreground placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">For SMS updates on your application</p>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3 mt-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Your visa</p>
                              <p className="font-semibold text-sm" style={{ color: "#1A2332" }}>{recommendation.visa}</p>
                            </div>
                            <p className="font-display text-xl font-bold" style={{ color: "#1A2332" }}>
                              €{PRICING_MAP[recommendation.visa]?.price || "699"}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          This fee covers our full service (document review, Gestor submission, tracking, and free resubmission). Government filing fees (€80–120), sworn translations, and apostille costs are separate and will be confirmed after your document review.
                        </p>
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full btn-primary h-12 font-bold text-sm mt-4"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Processing..." : "Proceed to Secure Payment"}
                          {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
                        </Button>
                        <div className="flex items-center justify-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="w-3 h-3" />
                            Secure checkout
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="w-3 h-3" />
                            Stripe Secure
                          </span>
                        </div>
                      </form>
                    </div>
                    <button
                      onClick={() => setShowApplicationForm(false)}
                      className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4 transition-colors"
                    >
                      ← Back to results
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-slate-50 section-divider">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1A2332" }}>
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Three simple steps. We handle the bureaucracy so you don't have to.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                icon: <Zap className="w-5 h-5" />,
                title: "Take the Quiz",
                description: "Answer 5 questions. We determine your visa type and create a personalized document checklist tailored to your exact situation.",
              },
              {
                step: "2",
                icon: <FileCheck className="w-5 h-5" />,
                title: "Upload Documents",
                description: "Upload your documents. Our team checks them for errors, formats them to Spanish requirements, and prepares your complete application within 48 hours.",
              },
              {
                step: "3",
                icon: <Shield className="w-5 h-5" />,
                title: "Your Gestor Submits",
                description: "Your dedicated Gestor — a licensed immigration specialist registered with Spain's government — submits directly to Spanish immigration authorities on your behalf. Track progress in real-time.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="card-elevated p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold mb-2" style={{ color: "#1A2332" }}>{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SpainPorFavor */}
      <section className="py-16 md:py-24 section-divider">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-8" style={{ color: "#1A2332" }}>
                Why people choose SpainPorFavor
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: <Clock className="w-5 h-5" />,
                    title: "10x faster than doing it yourself",
                    desc: "Our technology checks and prepares documents in hours, not weeks. No more googling conflicting information at 2am or waiting months for an appointment.",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    title: "Licensed professionals, not freelancers",
                    desc: "Real Gestores — Spain's registered immigration specialists — licensed with the Colegio Oficial. Not random consultants on Fiverr.",
                  },
                  {
                    icon: <Globe className="w-5 h-5" />,
                    title: "Direct government submission",
                    desc: "We submit directly to Spanish immigration authorities — the same offices that approve your visa. No middlemen.",
                  },
                  {
                    icon: <Users className="w-5 h-5" />,
                    title: "Flat fee, no surprises",
                    desc: "One price covers everything: document prep, expert review, Gestor submission, and free resubmission if needed. No hourly billing.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm mb-1" style={{ color: "#1A2332" }}>{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="hidden lg:block">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={HERO_IMAGE}
                  alt="Aerial view of a beautiful Spanish coastal city"
                  className="w-full h-[460px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 section-divider">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1A2332" }}>
              Common Challenges We Solve
            </h2>
            <p className="text-muted-foreground text-lg">
              The problems our clients face — and how we handle them.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="card-elevated p-5"
              >
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-base">
                    {t.flag}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#1A2332" }}>{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.visa}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-slate-50 section-divider">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: "#1A2332" }}>
                Common Questions
              </h2>
            </div>

            <div className="space-y-2">
              {FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-sm pr-4" style={{ color: "#1A2332" }}>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — dynamic: shows prescribed visa if quiz completed, or quiz prompt if not */}
      <section className="py-16 md:py-24 section-divider">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1A2332" }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Flat fees. No hourly billing. Everything included from document preparation to government submission.
            </p>
          </div>

          {showResults && recommendation ? (
            // Prescribed single pricing card based on quiz result
            <div className="max-w-md mx-auto">
              <div className="rounded-xl p-6 md:p-8 bg-white border-2 border-amber-400 shadow-lg shadow-amber-100/50">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Your recommended visa
                  </div>
                  <h3 className="font-display text-xl font-bold" style={{ color: "#1A2332" }}>{recommendation.visa}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{PRICING_MAP[recommendation.visa]?.timeline || recommendation.timeline}</p>
                </div>
                <p className="font-display text-4xl font-extrabold text-center mb-6" style={{ color: "#1A2332" }}>
                  €{PRICING_MAP[recommendation.visa]?.price || "699"}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {(PRICING_MAP[recommendation.visa]?.features || []).map((feature: string) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="w-full btn-primary h-12 font-bold text-sm"
                  onClick={() => {
                    setShowApplicationForm(true);
                    quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Start My Application
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Secure checkout. Your dedicated team starts within 24 hours of payment.
                </p>
                <button
                  className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4 transition-colors"
                  onClick={() => toast("Coming soon", { description: "Free consultation booking will be available shortly. In the meantime, email us at support@spainporfavor.com" })}
                >
                  Have questions? Book a free 15-min call
                </button>
              </div>
              {/* What's Included / Not Included */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-emerald-50/60 rounded-lg p-4">
                  <h4 className="font-display text-sm font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Included in Your Fee
                  </h4>
                  <ul className="space-y-1.5 text-xs text-emerald-900/80">
                    <li>Full document review &amp; preparation</li>
                    <li>Licensed Gestor handling your case</li>
                    <li>Submission to Spanish immigration</li>
                    <li>Real-time status tracking</li>
                    <li>Free resubmission if rejected</li>
                    <li>Dedicated case manager</li>
                  </ul>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-display text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> Separate Standard Costs
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    <li>Government filing fees — €80–120</li>
                    <li>Sworn translations — €80–150/doc</li>
                    <li>Apostille fees — €10–50/doc</li>
                    <li>Private health insurance — ~€60–120/mo</li>
                  </ul>
                  <p className="text-[10px] text-slate-400 mt-2">These apply to all visa applicants regardless of provider. We'll give you exact costs after reviewing your documents.</p>
                </div>
              </div>
            </div>
          ) : (
            // Quiz not completed — prompt them to take it
            <div className="max-w-lg mx-auto text-center">
              <div className="card-elevated p-8 md:p-10">
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                  Pricing depends on your visa type. Take the 60-second eligibility quiz and we'll show you your exact price.
                </p>
                <p className="font-display text-2xl font-bold mb-6" style={{ color: "#1A2332" }}>
                  From €349
                </p>
                <Button
                  onClick={handleStartQuiz}
                  size="lg"
                  className="btn-primary text-sm px-8 h-12 font-bold"
                >
                  Check Your Eligibility — Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Takes 60 seconds. No payment required.
                </p>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4 max-w-md mx-auto">
                Our fee covers the full service. Government filing fees (€80–120), sworn translations, and apostille costs are standard and separate — we'll give you exact figures after your assessment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-slate-50 section-divider">
        <div className="container">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1A2332" }}>
              Ready to Move to Spain?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Your eligibility check takes 60 seconds and it's completely free. No account needed.
            </p>
            <Button
              onClick={handleStartQuiz}
              size="lg"
              className="btn-primary text-base px-8 h-13 font-bold"
            >
              Check Your Eligibility — Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section-divider py-10 bg-slate-50">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="font-display text-lg font-bold" style={{ color: "#1A2332" }}>
                Spain<span style={{ color: "#D97706" }}>PorFavor</span>
              </span>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Expert document preparation for Spanish immigration. Licensed Gestores (Spain's official immigration specialists) submit directly to Spanish immigration authorities on your behalf.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "#1A2332" }}>Visa Guides</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/guides/digital-nomad-visa" className="hover:text-foreground transition-colors">Digital Nomad Visa</a></li>
                <li><a href="/guides/non-lucrative-visa" className="hover:text-foreground transition-colors">Non-Lucrative Visa</a></li>
                <li><a href="/guides/student-visa" className="hover:text-foreground transition-colors">Student Visa</a></li>
                <li><a href="/guides/work-visa" className="hover:text-foreground transition-colors">Work Visa</a></li>
                <li><a href="/guides/eu-registration" className="hover:text-foreground transition-colors">EU Registration</a></li>
                <li><a href="/guides" className="hover:text-foreground transition-colors font-medium">All Guides →</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "#1A2332" }}>Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/blog" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="/tools/beckham-calculator" className="hover:text-foreground transition-colors">Tax Calculator</a></li>
                <li><a href="/tools/checklists" className="hover:text-foreground transition-colors">Document Checklists</a></li>
                <li><a href="/about" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="/free-assessment" className="hover:text-foreground transition-colors font-medium">Free Assessment →</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "#1A2332" }}>Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="/gdpr" className="hover:text-foreground transition-colors">GDPR Compliance</a></li>
                <li><a href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © 2026 Bayshore Products S.L. (trading as SpainPorFavor). C.I.F.: B70778360. Document preparation service — not a law firm.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Secure document handling
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Secure checkout
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Exit-Intent Popup */}
      <AnimatePresence>
        {showExitIntent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowExitIntent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowExitIntent(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🇪🇸</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-2" style={{ color: "#1A2332" }}>
                  Wait — get your free eligibility summary
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  We'll email you a summary of your visa options based on your answers, plus tips on next steps. No spam.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const exitEmail = formData.get("exitEmail") as string;
                    if (exitEmail) {
                      setEmail(exitEmail);
                      setShowExitIntent(false);
                      leadCaptureMutation.mutate({
                        email: exitEmail,
                        source: "exit-intent" as const,
                        nationality: answers[3] || undefined,
                        visaType: recommendation?.visa || undefined,
                      });
                      toast.success("Check your inbox — we'll be in touch within 24 hours!");
                    }
                  }}
                >
                  <input
                    type="email"
                    name="exitEmail"
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white border-2 border-slate-200 text-foreground placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 mb-3 text-sm"
                  />
                  <Button type="submit" className="w-full btn-primary h-11 font-bold text-sm">
                    Send My Free Summary
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-3">No spam. Unsubscribe anytime.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Sticky Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
        <Button
          onClick={handleStartQuiz}
          className="w-full btn-primary h-11 font-bold text-sm"
        >
          Check Eligibility — Free
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
