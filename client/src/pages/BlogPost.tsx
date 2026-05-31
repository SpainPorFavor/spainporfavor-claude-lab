/**
 * BlogPost — Individual blog article page with GEO-optimized structure.
 * Renders long-form content with structured data, FAQ schema, and internal linking.
 */
import { Link, useParams } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  CalendarDays,
  Tag,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { BLOG_ARTICLES } from "@/data/blogArticles";
import { VISA_GUIDES } from "@/data/visaGuides";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A2332] mb-4">Article Not Found</h1>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const relatedGuides = article.relatedGuides
    .map((slug) => VISA_GUIDES.find((g) => g.slug === slug))
    .filter(Boolean);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishDate,
    dateModified: article.lastUpdated,
    author: {
      "@type": "Organization",
      name: "SpainPorFavor",
      url: "https://www.spainporfavor.com",
    },
    publisher: {
      "@type": "Organization",
      name: "SpainPorFavor",
      url: "https://www.spainporfavor.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.spainporfavor.com/blog/${article.slug}`,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={article.metaTitle}
        description={article.metaDescription}
        path={`/blog/${article.slug}`}
        type="article"
        publishedTime={article.publishDate}
        modifiedTime={article.lastUpdated}
      >
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
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
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Blog
            </Button>
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#1A2332]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[#1A2332]">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{article.category}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A2332] mb-4 font-['Outfit'] leading-tight">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Updated {article.lastUpdated}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.readTime}
          </span>
          <Badge variant="secondary" className="text-xs">
            <Tag className="w-3 h-3 mr-1" />
            {article.category}
          </Badge>
        </div>

        {/* Excerpt / Lead */}
        <div className="bg-[#FAFBFC] border border-gray-200 rounded-lg p-5 mb-8">
          <p className="text-gray-800 leading-relaxed font-medium">{article.excerpt}</p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-sm font-semibold text-[#1A2332] mb-2">In this article:</h2>
          <ul className="space-y-1">
            {article.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-gray-600 hover:text-[#F59E0B] transition-colors"
                >
                  {section.heading}
                </a>
              </li>
            ))}
            <li>
              <a href="#faq" className="text-sm text-gray-600 hover:text-[#F59E0B] transition-colors">
                Frequently Asked Questions
              </a>
            </li>
          </ul>
        </nav>

        {/* Sections */}
        {article.sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-10">
            <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
              {section.heading}
            </h2>
            <div
              className="prose prose-gray max-w-none prose-headings:font-['Outfit'] prose-headings:text-[#1A2332] prose-a:text-[#F59E0B] prose-strong:text-[#1A2332] prose-table:text-sm"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </section>
        ))}

        {/* FAQ Section */}
        <section id="faq" className="mb-10">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {article.faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-sm text-[#1A2332] pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#1A2332] mb-3 font-['Outfit']">Sources</h2>
          <ul className="space-y-1">
            {article.sources.map((source, i) => (
              <li key={i} className="text-sm text-gray-600">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F59E0B] transition-colors inline-flex items-center gap-1"
                >
                  {source.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Related Guides */}
        {relatedGuides.length > 0 && (
          <section className="mb-10 p-5 bg-[#FAFBFC] border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-[#1A2332] mb-3">Related Visa Guides</h3>
            <div className="space-y-2">
              {relatedGuides.map((guide) => (
                <Link key={guide!.slug} href={`/guides/${guide!.slug}`}>
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded hover:border-[#F59E0B] transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-[#1A2332]">{guide!.title.split("—")[0].trim()}</span>
                    <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="text-center p-8 bg-[#1A2332] rounded-lg">
          <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
            Ready to start your Spain visa application?
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Take our free 60-second eligibility assessment and get a personalized recommendation.
          </p>
          <Link href="/free-assessment">
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              Free Assessment <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </section>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Bayshore Products S.L. (trading as SpainPorFavor). For informational purposes only — not legal advice.</p>
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
