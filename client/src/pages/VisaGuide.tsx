/**
 * VisaGuide — Individual visa guide page optimized for AI Search (GEO)
 *
 * Structure follows GEO best practices (Princeton Research, 2023):
 * - Clear definition in the first paragraph (+40% AI visibility)
 * - Statistics and data with sources (+37%)
 * - Expert quotations and citations (+30%)
 * - Technical terminology (+28%)
 * - FAQ section matching natural language queries
 * - Structured tables for requirements
 * - Step-by-step process (HowTo pattern)
 * - "Last updated" date for freshness signal
 * - Breadcrumb navigation for context
 * - JSON-LD structured data (FAQPage, HowTo, Service, BreadcrumbList)
 */
import { useRoute, Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Shield,
  ChevronLeft,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { getGuideBySlug, VISA_GUIDES, type VisaGuide as VisaGuideType } from "@/data/visaGuides";

function generateFAQSchema(guide: VisaGuideType) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function generateHowToSchema(guide: VisaGuideType) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Apply for ${guide.title.split("—")[0].trim()}`,
    description: guide.overview,
    totalTime: guide.timeline,
    step: guide.steps.map((s) => ({
      "@type": "HowToStep",
      position: s.step,
      name: s.title,
      text: s.description,
    })),
  };
}

function generateServiceSchema(guide: VisaGuideType) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${guide.title.split("—")[0].trim()} Application Service`,
    description: guide.definition,
    provider: {
      "@type": "Organization",
      name: "SpainPorFavor",
      url: "https://www.spainporfavor.com",
      description:
        "Immigration document preparation service connecting clients with licensed Gestores Administrativos in Spain",
    },
    areaServed: {
      "@type": "Country",
      name: "Spain",
    },
    serviceType: "Immigration Document Preparation",
  };
}

function generateBreadcrumbSchema(guide: VisaGuideType) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.spainporfavor.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Visa Guides",
        item: "https://www.spainporfavor.com/guides",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title.split("—")[0].trim(),
        item: `https://www.spainporfavor.com/guides/${guide.slug}`,
      },
    ],
  };
}

function generateWebPageSchema(guide: VisaGuideType) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: guide.metaTitle,
    description: guide.metaDescription,
    dateModified: "2026-05-10",
    publisher: {
      "@type": "Organization",
      name: "SpainPorFavor",
      url: "https://www.spainporfavor.com",
    },
    about: {
      "@type": "GovernmentService",
      name: guide.officialName,
      serviceOperator: {
        "@type": "GovernmentOrganization",
        name: "Ministerio de Inclusión, Seguridad Social y Migraciones",
        url: "https://www.inclusion.gob.es/",
      },
    },
  };
}

export default function VisaGuide() {
  const [, params] = useRoute("/guides/:slug");
  const slug = params?.slug;
  const guide = slug ? getGuideBySlug(slug) : undefined;

  if (!guide) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A2332] mb-4">Guide Not Found</h1>
          <p className="text-gray-600 mb-6">The visa guide you're looking for doesn't exist.</p>
          <Link href="/guides">
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to All Guides
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={guide.metaTitle}
        description={guide.metaDescription}
        path={`/guides/${guide.slug}`}
        keywords={guide.metaKeywords}
        type="article"
      >
        <script type="application/ld+json">{JSON.stringify(generateFAQSchema(guide))}</script>
        <script type="application/ld+json">{JSON.stringify(generateHowToSchema(guide))}</script>
        <script type="application/ld+json">{JSON.stringify(generateServiceSchema(guide))}</script>
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema(guide))}</script>
        <script type="application/ld+json">{JSON.stringify(generateWebPageSchema(guide))}</script>
      </SEOHead>

      {/* Minimal header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-lg font-bold">
              <span className="text-[#1A2332]">Spain</span>
              <span className="text-[#F59E0B]">PorFavor</span>
            </span>
          </Link>
          <Link href="/free-assessment">
            <Button size="sm" className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              Free Assessment <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/guides">Visa Guides</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{guide.title.split("—")[0].trim()}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Title and metadata */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="text-xs font-medium text-[#F59E0B] border-[#F59E0B]">
              <CalendarDays className="w-3 h-3 mr-1" />
              Updated {guide.lastUpdated}
            </Badge>
            <Badge variant="outline" className="text-xs text-gray-500">
              {guide.timeline} processing
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A2332] leading-tight mb-4 font-['Outfit']">
            {guide.title}
          </h1>
          <p className="text-sm text-gray-500">
            Official name: <em>{guide.officialName}</em> · Legal basis: {guide.legalBasis}
          </p>
        </div>

        {/* Definition — the critical first paragraph for AI extraction */}
        <section className="mb-10">
          <div className="bg-[#FAFBFC] border border-gray-200 rounded-lg p-6">
            <p className="text-gray-800 leading-relaxed text-lg">
              {guide.definition}
            </p>
          </div>
        </section>

        {/* Key Facts table — structured data for AI extraction */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Key Facts at a Glance
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableBody>
                {guide.keyFacts.map((fact, i) => (
                  <TableRow key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}>
                    <TableCell className="font-semibold text-[#1A2332] w-1/3 whitespace-normal">
                      {fact.label}
                    </TableCell>
                    <TableCell className="text-gray-700 whitespace-normal">{fact.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">Overview</h2>
          <p className="text-gray-700 leading-relaxed">{guide.overview}</p>
        </section>

        {/* Eligibility */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Who Is Eligible?
          </h2>
          <ul className="space-y-3">
            {guide.eligibility.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Income / Financial Requirements */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Income and Financial Requirements
          </h2>
          <div className="bg-[#FFF8EB] border border-[#F59E0B]/20 rounded-lg p-6 mb-4">
            <p className="text-2xl font-bold text-[#1A2332] mb-1">{guide.incomeRequirement}</p>
            <p className="text-sm text-gray-600">Minimum financial requirement for 2026</p>
          </div>
          <p className="text-gray-700 leading-relaxed">{guide.incomeDetails}</p>
        </section>

        {/* Required Documents Table */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Required Documents
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1A2332]">
                  <TableHead className="text-white font-semibold whitespace-normal">Document</TableHead>
                  <TableHead className="text-white font-semibold whitespace-normal">Details</TableHead>
                  <TableHead className="text-white font-semibold text-center whitespace-normal">Apostille</TableHead>
                  <TableHead className="text-white font-semibold text-center whitespace-normal">Translation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guide.requirements.map((req, i) => (
                  <TableRow key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}>
                    <TableCell className="font-medium text-[#1A2332] whitespace-normal min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#F59E0B] shrink-0" />
                        {req.document}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm whitespace-normal">{req.details}</TableCell>
                    <TableCell className="text-center">
                      {req.apostille ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100" title="Typically €10–50 per document">Yes (~€10–50)</Badge>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {req.translation ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100" title="Typically €80–150 per document">Yes (~€80–150)</Badge>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Apostille: document must be legalized with a Hague Apostille (typically €10–50 per document, varies by country). Translation: must be translated to Spanish by a certified/sworn translator (traductor jurado), typically €80–150 per document. These are standard costs that apply to all visa applicants regardless of provider.
          </p>
        </section>

        {/* Step-by-Step Process */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-6 font-['Outfit']">
            Step-by-Step Application Process
          </h2>
          <div className="space-y-6">
            {guide.steps.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#1A2332] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {step.step}
                  </div>
                  {step.step < guide.steps.length && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#1A2332] text-lg">{step.title}</h3>
                    <Badge variant="outline" className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {step.timeline}
                    </Badge>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA mid-page */}
        <section className="mb-10">
          <div className="bg-[#1A2332] rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2 font-['Outfit']">
              Not sure if you qualify?
            </h2>
            <p className="text-gray-300 mb-6">
              Our free eligibility assessment takes 60 seconds and gives you a personalized visa recommendation.
            </p>
            <Link href="/free-assessment">
              <Button size="lg" className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold">
                {guide.ctaText} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-gray-400 text-sm mt-3">
              Licensed Gestores Administrativos handle your application
            </p>
          </div>
        </section>

        {/* FAQ Section — critical for AI extraction */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {guide.faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-[#1A2332] font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Official Sources */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Official Sources and References
          </h2>
          <div className="space-y-3">
            <a
              href="https://www.inclusion.gob.es/web/migraciones/w/extranjeria"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900 text-sm"
            >
              <Globe className="w-4 h-4" />
              Ministerio de Inclusión, Seguridad Social y Migraciones — Extranjería
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Visados.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900 text-sm"
            >
              <Globe className="w-4 h-4" />
              Ministerio de Asuntos Exteriores — Visados
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.boe.es/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900 text-sm"
            >
              <Globe className="w-4 h-4" />
              Boletín Oficial del Estado (BOE) — Official Gazette
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://sede.administracionespublicas.gob.es/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900 text-sm"
            >
              <Globe className="w-4 h-4" />
              Sede Electrónica — Online Appointments (Extranjería)
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        {/* Other Guides */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Other Spain Visa Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VISA_GUIDES.filter((g) => g.slug !== guide.slug).map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`}>
                <div className="border rounded-lg p-4 hover:border-[#F59E0B] hover:bg-[#FAFBFC] transition-colors cursor-pointer">
                  <h3 className="font-semibold text-[#1A2332] text-sm mb-1">
                    {g.title.split("—")[0].trim()}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {g.incomeRequirement} · {g.timeline}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-10">
          <div className="border-t pt-8 text-center">
            <p className="text-gray-600 mb-4">
              SpainPorFavor connects you with licensed Gestores Administrativos who prepare and submit your visa application directly to Spanish immigration authorities.
            </p>
            <Link href="/free-assessment">
              <Button size="lg" className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold">
                Start Your Free Assessment <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            © 2026 Bayshore Products S.L. (trading as SpainPorFavor). This guide is for informational purposes only and does not constitute legal advice.
            Immigration requirements may change — always verify with official Spanish government sources.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/privacy" className="hover:text-[#1A2332]">Privacy Policy</Link>
            <span>·</span>
            <Link href="/guides" className="hover:text-[#1A2332]">All Guides</Link>
            <span>·</span>
            <Link href="/" className="hover:text-[#1A2332]">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
