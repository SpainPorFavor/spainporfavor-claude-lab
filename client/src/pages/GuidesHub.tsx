/**
 * GuidesHub — Visa guides index page (content hub landing)
 * Lists all available visa guides with key facts for quick scanning.
 * Optimized for AI search: clear definitions, structured data, internal linking.
 */
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Clock,
  Globe,
  FileText,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { VISA_GUIDES } from "@/data/visaGuides";

function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SpainPorFavor",
    url: "https://www.spainporfavor.com",
    description:
      "Immigration document preparation service connecting clients with licensed Gestores Administrativos in Spain. SpainPorFavor handles Digital Nomad Visa, Non-Lucrative Visa, Student Visa, Work Visa, and EU Registration applications.",
    foundingDate: "2025",
    areaServed: {
      "@type": "Country",
      name: "Spain",
    },
    serviceType: "Immigration Document Preparation",
    knowsAbout: [
      "Spain Digital Nomad Visa",
      "Spain Non-Lucrative Visa",
      "Spain Student Visa",
      "Spain Work Visa",
      "EU Citizen Registration in Spain",
      "NIE Number Spain",
      "TIE Card Spain",
      "Gestores Administrativos",
      "Spanish Immigration",
      "Beckham Law Spain",
    ],
  };
}

function generateCollectionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Spain Visa Guides — Complete 2026 Immigration Guides",
    description:
      "Comprehensive guides to every Spain visa type in 2026: Digital Nomad Visa, Non-Lucrative Visa, Student Visa, Work Visa, and EU Registration. Requirements, income thresholds, timelines, and step-by-step processes.",
    url: "https://www.spainporfavor.com/guides",
    publisher: {
      "@type": "Organization",
      name: "SpainPorFavor",
      url: "https://www.spainporfavor.com",
    },
    hasPart: VISA_GUIDES.map((g) => ({
      "@type": "WebPage",
      name: g.title,
      url: `https://www.spainporfavor.com/guides/${g.slug}`,
      description: g.metaDescription,
    })),
  };
}

export default function GuidesHub() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Spain Visa Guides 2026 — Requirements, Costs, Timelines | SpainPorFavor"
        description="2026 Spain visa guides: Digital Nomad, Non-Lucrative, Student, Work, and EU Registration. Requirements, costs, timelines, and document checklists."
        path="/guides"
        keywords="Spain visa guides 2026, Spain immigration guide, visa requirements Spain, move to Spain guide, Spain visa types, visa document checklist Spain"
      >
        <script type="application/ld+json">
          {JSON.stringify(generateOrganizationSchema())}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(generateCollectionSchema())}
        </script>
      </SEOHead>

      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
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

      {/* Hero */}
      <section className="bg-[#1A2332] py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Badge className="bg-[#F59E0B]/20 text-[#F59E0B] border-none mb-4">
            <CalendarDays className="w-3 h-3 mr-1" />
            Updated May 2026
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 font-['Outfit']">
            Spain Visa Guides
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Comprehensive guides to every Spain visa type in 2026. Requirements, income thresholds,
            document checklists, step-by-step processes, and answers to the most common questions —
            all based on current Spanish immigration law.
          </p>
        </div>
      </section>

      {/* Introductory paragraph for AI extraction */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-[#FAFBFC] border border-gray-200 rounded-lg p-6 mb-10">
          <p className="text-gray-800 leading-relaxed">
            Spain offers several visa pathways for non-EU citizens who want to live, work, study, or
            retire in Spain. The most popular options in 2026 are the{" "}
            <strong>Digital Nomad Visa</strong> (Visado para teletrabajo de carácter internacional)
            for remote workers, the <strong>Non-Lucrative Visa</strong> (Visado de residencia no
            lucrativa) for retirees and financially independent individuals, the{" "}
            <strong>Student Visa</strong> (Estancia por Estudios) for university and language
            students, and the <strong>Work Visa</strong> (Autorización de Residencia y Trabajo por
            Cuenta Ajena) for those with a job offer from a Spanish employer. EU, EEA, and Swiss
            citizens do not need a visa but must complete{" "}
            <strong>EU citizen registration</strong> (Certificado de Registro) if staying more than
            3 months. All visa applications in Spain are processed by the Ministerio de Inclusión,
            Seguridad Social y Migraciones and can be submitted through licensed Gestores
            Administrativos.
          </p>
        </div>

        {/* Guide Cards */}
        <div className="space-y-6">
          {VISA_GUIDES.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`}>
              <article className="border rounded-lg p-6 hover:border-[#F59E0B] hover:shadow-md transition-all cursor-pointer group">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#1A2332] mb-2 font-['Outfit'] group-hover:text-[#F59E0B] transition-colors">
                      {guide.title.split("—")[0].trim()}
                    </h2>
                    <p className="text-sm text-gray-500 mb-3">
                      Official name: <em>{guide.officialName}</em>
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mb-4">
                      {guide.definition.substring(0, 200)}...
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <FileText className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span className="font-medium">{guide.incomeRequirement}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{guide.timeline}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Globe className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{guide.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-[#F59E0B] group-hover:translate-x-1 transition-transform">
                    <span className="text-sm font-medium mr-1 hidden md:inline">Read guide</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1A2332] py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3 font-['Outfit']">
            Not sure which visa is right for you?
          </h2>
          <p className="text-gray-300 mb-6">
            Take our free 60-second eligibility assessment and get a personalized visa recommendation
            based on your situation.
          </p>
          <Link href="/free-assessment">
            <Button
              size="lg"
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold"
            >
              Get Your Free Assessment <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            © 2026 Bayshore Products S.L. (trading as SpainPorFavor). These guides are for informational purposes only and do not
            constitute legal advice. Immigration requirements may change — always verify with
            official Spanish government sources.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/privacy" className="hover:text-[#1A2332]">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/" className="hover:text-[#1A2332]">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
