/**
 * Checklists Download Page — Free downloadable PDF document checklists for each visa type.
 * Designed for shareability and backlink potential.
 */
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const CHECKLISTS = [
  {
    visaType: "digital-nomad-visa",
    title: "Digital Nomad Visa (DNV)",
    subtitle: "For remote workers",
    documents: 8,
    timeline: "4–6 weeks",
    guideUrl: "/guides/digital-nomad-visa",
  },
  {
    visaType: "non-lucrative-visa",
    title: "Non-Lucrative Visa (NLV)",
    subtitle: "For retirees",
    documents: 7,
    timeline: "6–8 weeks",
    guideUrl: "/guides/non-lucrative-visa",
  },
  {
    visaType: "student-visa",
    title: "Student Visa",
    subtitle: "For students",
    documents: 7,
    timeline: "4–6 weeks",
    guideUrl: "/guides/student-visa",
  },
  {
    visaType: "work-visa",
    title: "Work Visa",
    subtitle: "For employees",
    documents: 7,
    timeline: "8–12 weeks",
    guideUrl: "/guides/work-visa",
  },
];

function handleDownload(visaType: string, title: string) {
  toast.info(`Downloading ${title} checklist...`);
  window.open(`/api/checklists/${visaType}`, "_blank");
}

export default function Checklists() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Spain Visa Document Checklists — Free PDF Downloads",
    description:
      "Download free PDF document checklists for every Spain visa type. Digital Nomad Visa, Non-Lucrative Visa, Student Visa, and Work Visa checklists with requirements, tips, and deadlines.",
    url: "https://www.spainporfavor.com/tools/checklists",
    publisher: {
      "@type": "Organization",
      name: "SpainPorFavor",
      url: "https://www.spainporfavor.com",
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Spain Visa Document Checklists — Free PDF Downloads | SpainPorFavor"
        description="Download free PDF document checklists for every Spain visa type. Includes requirements, apostille notes, translation needs, and validity periods. Updated May 2026."
        path="/tools/checklists"
        keywords="Spain visa document checklist, visa requirements PDF, Digital Nomad Visa documents, apostille Spain, Spain visa paperwork"
      >
        <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
      </SEOHead>

      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-lg font-bold">
              <span className="text-[#1A2332]">Spain</span>
              <span className="text-[#F59E0B]">PorFavor</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/tools/beckham-calculator">
              <Button variant="ghost" size="sm">
                Tax Calculator
              </Button>
            </Link>
            <Link href="/free-assessment">
              <Button
                size="sm"
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
              >
                Free Assessment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#1A2332]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Document Checklists</span>
        </nav>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className="w-6 h-6 text-[#F59E0B]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A2332] font-['Outfit']">
              Visa Document Checklists
            </h1>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Download free, printable PDF checklists for every Spain visa type. Each
            checklist includes all required documents, apostille and translation
            requirements, validity periods, and practical tips. Updated May 2026.
          </p>
        </div>

        {/* Checklist Cards */}
        <div className="space-y-4 mb-10">
          {CHECKLISTS.map((cl) => (
            <div
              key={cl.visaType}
              className="border border-gray-200 rounded-lg p-5 hover:border-[#F59E0B] transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[#1A2332] font-['Outfit']">
                    {cl.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">{cl.subtitle}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {cl.documents} documents
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {cl.timeline} processing
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={cl.guideUrl}>
                    <Button variant="outline" size="sm">
                      View Guide
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
                    onClick={() => handleDownload(cl.visaType, cl.title)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What's included */}
        <div className="bg-[#FAFBFC] border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-[#1A2332] mb-4 font-['Outfit']">
            What's in each checklist?
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "Every required document listed",
              "Apostille requirements flagged",
              "Translation requirements noted",
              "Document validity periods",
              "Practical tips for each document",
              "Printable checkbox format",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-[#1A2332] rounded-lg mb-8">
          <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
            Need help gathering your documents?
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Our licensed Gestores review every document within 48 hours and flag
            anything that needs fixing before submission.
          </p>
          <Link href="/free-assessment">
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              Free Assessment <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Related tools */}
        <div className="p-5 bg-[#FAFBFC] border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-[#1A2332] mb-3">
            More Free Tools
          </h3>
          <div className="space-y-2">
            <Link href="/tools/beckham-calculator">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded hover:border-[#F59E0B] transition-colors cursor-pointer">
                <span className="text-sm font-medium text-[#1A2332]">
                  Beckham Law Tax Calculator
                </span>
                <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </Link>
            <Link href="/free-assessment">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded hover:border-[#F59E0B] transition-colors cursor-pointer">
                <span className="text-sm font-medium text-[#1A2332]">
                  Free Visa Eligibility Assessment
                </span>
                <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </Link>
            <Link href="/guides">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded hover:border-[#F59E0B] transition-colors cursor-pointer">
                <span className="text-sm font-medium text-[#1A2332]">
                  Complete Visa Guides
                </span>
                <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-10">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            © 2026 Bayshore Products S.L. (trading as SpainPorFavor). Checklists are for informational purposes only —
            verify requirements with your Gestor before submission.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/guides" className="hover:text-[#1A2332]">
              Visa Guides
            </Link>
            <span>·</span>
            <Link href="/blog" className="hover:text-[#1A2332]">
              Blog
            </Link>
            <span>·</span>
            <Link href="/tools/beckham-calculator" className="hover:text-[#1A2332]">
              Tax Calculator
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#1A2332]">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
