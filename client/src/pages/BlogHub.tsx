/**
 * BlogHub — Blog index page listing all articles.
 * Optimized for AI discovery with structured data and clear content hierarchy.
 */
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, CalendarDays } from "lucide-react";
import { BLOG_ARTICLES } from "@/data/blogArticles";

export default function BlogHub() {
  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Spain Visa Blog — Expert Guides for Moving to Spain",
    description:
      "In-depth articles about Spanish visas, immigration requirements, tax benefits, and practical guides for moving to Spain in 2026.",
    url: "https://www.spainporfavor.com/blog",
    publisher: {
      "@type": "Organization",
      name: "SpainPorFavor",
      url: "https://www.spainporfavor.com",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: BLOG_ARTICLES.map((article, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.spainporfavor.com/blog/${article.slug}`,
        name: article.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Spain Visa Blog — Expert Guides for Moving to Spain | SpainPorFavor"
        description="In-depth articles about Spanish visas, immigration requirements, tax benefits, and practical guides for moving to Spain in 2026. Written by licensed immigration specialists."
        path="/blog"
        keywords="Spain visa blog, moving to Spain guide, Digital Nomad Visa articles, Spain immigration tips, expat Spain advice"
      >
        <script type="application/ld+json">{JSON.stringify(blogListSchema)}</script>
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
          <div className="flex items-center gap-3">
            <Link href="/guides">
              <Button variant="ghost" size="sm">
                Visa Guides
              </Button>
            </Link>
            <Link href="/free-assessment">
              <Button size="sm" className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
                Free Assessment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A2332] mb-3 font-['Outfit']">
            Spain Visa Blog
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            In-depth articles about Spanish visas, tax benefits, cost of living, and practical
            guides for moving to Spain. Written by our team of licensed immigration specialists.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            {BLOG_ARTICLES.map((article) => (
              <Link key={article.slug} href={`/blog/${article.slug}`}>
                <article className="group border border-gray-200 rounded-lg p-6 hover:border-[#F59E0B] transition-colors cursor-pointer">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {article.lastUpdated}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#1A2332] mb-2 font-['Outfit'] group-hover:text-[#F59E0B] transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-[#FAFBFC] border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[#1A2332] mb-3 font-['Outfit']">
            Ready to move to Spain?
          </h2>
          <p className="text-gray-600 mb-5">
            Take our free 60-second eligibility assessment and get a personalized visa recommendation.
          </p>
          <Link href="/free-assessment">
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              Start Free Assessment <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Bayshore Products S.L. (trading as SpainPorFavor). For informational purposes only — not legal advice.</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/guides" className="hover:text-[#1A2332]">
              Visa Guides
            </Link>
            <span>·</span>
            <Link href="/blog" className="hover:text-[#1A2332]">
              Blog
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
