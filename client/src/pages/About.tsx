/**
 * About Page — Structured for directory submissions and backlink building.
 * Contains Organization schema, team info, and credentials that directories need.
 */
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Award,
  Globe,
  Users,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function About() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "SpainPorFavor",
    alternateName: "Spain Por Favor",
    description:
      "Immigration document preparation service connecting clients with licensed Gestores Administrativos in Spain. Specializing in Digital Nomad Visa, Non-Lucrative Visa, Student Visa, Work Visa, and EU Registration applications.",
    url: "https://www.spainporfavor.com",
    logo: "https://www.spainporfavor.com/favicon.ico",
    foundingDate: "2024",
    areaServed: [
      { "@type": "Country", name: "Spain" },
      { "@type": "Country", name: "United States" },
      { "@type": "Country", name: "United Kingdom" },
      { "@type": "Country", name: "Canada" },
      { "@type": "Country", name: "Australia" },
    ],
    serviceType: [
      "Immigration Document Preparation",
      "Digital Nomad Visa Application",
      "Non-Lucrative Visa Application",
      "Student Visa Application",
      "Work Visa Application",
      "EU Citizen Registration",
      "NIE Number Application",
      "Beckham Law Tax Registration",
    ],
    knowsAbout: [
      "Spanish Immigration Law",
      "Digital Nomad Visa (Ley 28/2022)",
      "Gestores Administrativos",
      "Spain Mercurio Platform",
      "Beckham Law (IRPF Article 93)",
      "NIE and TIE Applications",
    ],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "Professional License",
        name: "Colegio Oficial de Gestores Administrativos Registration",
      },
    ],
    sameAs: [
      "https://www.expatica.com/es/directory/moving/immigration-lawyers/",
      "https://www.internations.org/",
      "https://www.expatforum.com/",
      "https://nomads.com/forum/spain",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Málaga",
      addressRegion: "Andalucía",
      addressCountry: "ES",
    },
    priceRange: "€349–€799",

  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="About SpainPorFavor — Licensed Immigration Specialists for Spain"
        description="Licensed Gestores Administrativos handle your Spain visa from start to finish. Professional document preparation with 4–6 week average processing time."
        path="/about"
        keywords="Gestor Administrativo Spain, Spain visa specialists, immigration service Spain, licensed immigration consultant, Spain relocation service"
      >
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      </SEOHead>

      {/* Header */}
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
              Free Assessment
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-14 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            About SpainPorFavor
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
            We're a technology-powered immigration document preparation service that connects
            clients with licensed Gestores Administrativos in Spain. Our mission: make moving to
            Spain as simple as booking a flight.
          </p>
        </div>
      </section>

      {/* Key Facts */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F59E0B]">98.7%</div>
              <div className="text-sm text-gray-600 mt-1">Approval rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F59E0B]">4–6</div>
              <div className="text-sm text-gray-600 mt-1">Weeks average</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F59E0B]">500+</div>
              <div className="text-sm text-gray-600 mt-1">Clients served</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F59E0B]">48h</div>
              <div className="text-sm text-gray-600 mt-1">Document review</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#1A2332] mb-6 font-['Outfit']">
            What Makes Us Different
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-[#F59E0B] shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-[#1A2332] mb-1">Licensed Gestores, Not Lawyers</h3>
                <p className="text-sm text-gray-600">
                  In Spain, immigration applications are handled by Gestores Administrativos —
                  licensed specialists registered with the Colegio Oficial. They submit directly
                  through Spain's official Mercurio platform using digital certificates.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Award className="w-6 h-6 text-[#F59E0B] shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-[#1A2332] mb-1">AI-Powered Document Verification</h3>
                <p className="text-sm text-gray-600">
                  Our proprietary document verification system checks every document against exact
                  consulate requirements before submission, catching errors that cause rejections.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Globe className="w-6 h-6 text-[#F59E0B] shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-[#1A2332] mb-1">Serving 30+ Countries</h3>
                <p className="text-sm text-gray-600">
                  We serve clients from the United States, United Kingdom, Canada, Australia, and
                  30+ other countries. Our team understands the specific requirements for each
                  nationality.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Users className="w-6 h-6 text-[#F59E0B] shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-[#1A2332] mb-1">Dedicated Case Manager</h3>
                <p className="text-sm text-gray-600">
                  Every client gets a dedicated Gestor who manages their case from start to finish.
                  Track your application in real-time through our client portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 bg-[#FAFBFC] border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-6 font-['Outfit']">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Digital Nomad Visa (DNV)", price: "€699", time: "4–6 weeks" },
              { name: "Non-Lucrative Visa (NLV)", price: "€649", time: "6–8 weeks" },
              { name: "Student Visa", price: "€549", time: "4–6 weeks" },
              { name: "Work Visa", price: "€799", time: "8–12 weeks" },
              { name: "EU Registration", price: "€349", time: "2–3 weeks" },

            ].map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-[#1A2332]">{service.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#F59E0B]">{service.price}</span>
                  <span className="text-xs text-gray-400 ml-2">{service.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials & Trust */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-6 font-['Outfit']">
            Credentials & Trust
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <Shield className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-[#1A2332]">
                  Colegio Oficial de Gestores Administrativos
                </h3>
                <p className="text-sm text-gray-600">
                  Our Gestores are fully licensed and registered with Spain's official professional
                  body for administrative specialists.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <Shield className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-[#1A2332]">GDPR Compliant</h3>
                <p className="text-sm text-gray-600">
                  Registered as a data processor with the Spanish Data Protection Agency (AEPD). All
                  documents encrypted at rest (AES-256) and in transit (TLS 1.3).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <Shield className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-[#1A2332]">Free Resubmission Guarantee</h3>
                <p className="text-sm text-gray-600">
                  If your application is rejected, we resubmit at no additional cost. If we
                  determine the rejection cannot be overcome, we refund your fee minus government
                  filing costs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Listings */}
      <section className="py-12 bg-[#FAFBFC] border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Find Us On
          </h2>
          <p className="text-gray-600 mb-6">
            SpainPorFavor is listed on leading expat and immigration directories:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { name: "Expatica Spain — Immigration Services", url: "https://www.expatica.com/es/directory/moving/immigration-lawyers/" },
              { name: "InterNations — Spain Expat Community", url: "https://www.internations.org/" },
              { name: "Expat Forum — Spain Immigration", url: "https://www.expatforum.com/forums/spain-expat-forum-for-expats-living-in-spain.30/" },
              { name: "Nomads.com — Spain Remote Work Forum", url: "https://nomads.com/forum/spain" },
              { name: "Reddit — r/SpainExpats", url: "https://www.reddit.com/r/SpainExpats/" },
              { name: "Reddit — r/digitalnomad", url: "https://www.reddit.com/r/digitalnomad/" },
            ].map((dir) => (
              <a
                key={dir.name}
                href={dir.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-[#F59E0B] transition-colors"
              >
                <span className="text-sm text-[#1A2332]">{dir.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-3 font-['Outfit']">
            Ready to start your Spain journey?
          </h2>
          <p className="text-gray-600 mb-5">
            Take our free 60-second eligibility assessment and get a personalized visa recommendation.
          </p>
          <Link href="/free-assessment">
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              Free Assessment <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Bayshore Products S.L. (trading as SpainPorFavor). C.I.F.: B70778360. For informational purposes only — not legal advice.</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/guides" className="hover:text-[#1A2332]">Visa Guides</Link>
            <span>·</span>
            <Link href="/blog" className="hover:text-[#1A2332]">Blog</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#1A2332]">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
