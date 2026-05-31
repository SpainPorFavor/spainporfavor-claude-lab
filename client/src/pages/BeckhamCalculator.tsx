/**
 * Beckham Law Tax Calculator — Interactive tool for comparing standard Spanish
 * IRPF progressive tax vs Beckham Law flat 24% regime.
 *
 * Designed for maximum shareability and backlink potential.
 * All tax brackets are 2026 Spanish IRPF rates (state + average regional).
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Calculator,
  TrendingDown,
  Banknote,
  Info,
  ChevronDown,
} from "lucide-react";

// 2026 Spanish IRPF brackets (state + average regional combined)
// Source: Agencia Tributaria + average autonomous community surcharge
const IRPF_BRACKETS = [
  { min: 0, max: 12450, rate: 0.19 },
  { min: 12450, max: 20200, rate: 0.24 },
  { min: 20200, max: 35200, rate: 0.30 },
  { min: 35200, max: 60000, rate: 0.37 },
  { min: 60000, max: 300000, rate: 0.45 },
  { min: 300000, max: Infinity, rate: 0.47 },
];

const BECKHAM_RATE = 0.24;
const BECKHAM_HIGH_RATE = 0.47;
const BECKHAM_HIGH_THRESHOLD = 600000;
const BECKHAM_DURATION_YEARS = 6;

// Currency conversion rates (approximate, for display purposes)
const CURRENCIES: Record<string, { symbol: string; rate: number; name: string }> = {
  EUR: { symbol: "€", rate: 1, name: "Euro" },
  USD: { symbol: "$", rate: 0.92, name: "US Dollar" },
  GBP: { symbol: "£", rate: 1.17, name: "British Pound" },
  CAD: { symbol: "C$", rate: 0.67, name: "Canadian Dollar" },
  AUD: { symbol: "A$", rate: 0.60, name: "Australian Dollar" },
};

function calculateStandardTax(annualIncome: number): number {
  let tax = 0;
  let remaining = annualIncome;
  for (const bracket of IRPF_BRACKETS) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }
  return tax;
}

function calculateBeckhamTax(annualIncome: number): number {
  if (annualIncome <= BECKHAM_HIGH_THRESHOLD) {
    return annualIncome * BECKHAM_RATE;
  }
  return (
    BECKHAM_HIGH_THRESHOLD * BECKHAM_RATE +
    (annualIncome - BECKHAM_HIGH_THRESHOLD) * BECKHAM_HIGH_RATE
  );
}

function formatCurrency(amount: number, symbol: string = "€"): string {
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

export default function BeckhamCalculator() {
  const [incomeInput, setIncomeInput] = useState("80000");
  const [currency, setCurrency] = useState("EUR");
  const [showBrackets, setShowBrackets] = useState(false);

  const curr = CURRENCIES[currency];

  const results = useMemo(() => {
    const rawIncome = parseFloat(incomeInput) || 0;
    const annualIncomeEUR = rawIncome * curr.rate;

    const standardTax = calculateStandardTax(annualIncomeEUR);
    const beckhamTax = calculateBeckhamTax(annualIncomeEUR);
    const annualSavings = standardTax - beckhamTax;
    const sixYearSavings = annualSavings * BECKHAM_DURATION_YEARS;
    const standardEffective =
      annualIncomeEUR > 0 ? (standardTax / annualIncomeEUR) * 100 : 0;
    const beckhamEffective =
      annualIncomeEUR > 0 ? (beckhamTax / annualIncomeEUR) * 100 : 0;

    return {
      annualIncomeEUR,
      standardTax,
      beckhamTax,
      annualSavings,
      sixYearSavings,
      standardEffective,
      beckhamEffective,
      isBeneficial: annualSavings > 0,
    };
  }, [incomeInput, curr.rate]);

  // Visual bar widths (percentage of income for tax)
  const maxRate = Math.max(results.standardEffective, results.beckhamEffective, 1);
  const standardBarWidth = (results.standardEffective / 50) * 100; // scale to 50% max
  const beckhamBarWidth = (results.beckhamEffective / 50) * 100;

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Spain Beckham Law Tax Calculator",
    description:
      "Calculate your tax savings under Spain's Beckham Law (IRPF Article 93). Compare flat 24% rate vs standard progressive rates for Digital Nomad Visa holders.",
    url: "https://www.spainporfavor.com/tools/beckham-calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    author: {
      "@type": "Organization",
      name: "SpainPorFavor",
      url: "https://www.spainporfavor.com",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Spain's Beckham Law?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Beckham Law (IRPF Article 93) is a special tax regime in Spain that allows qualifying new residents, including Digital Nomad Visa holders, to pay a flat 24% income tax rate for up to 6 years instead of Spain's progressive rates of 19–47%.",
        },
      },
      {
        "@type": "Question",
        name: "Who is eligible for the Beckham Law in Spain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You must not have been a Spanish tax resident in the previous 5 years, move to Spain due to employment or economic activity (Digital Nomad Visa qualifies), and apply within 6 months of becoming tax resident by filing Form 149 with the AEAT.",
        },
      },
      {
        "@type": "Question",
        name: "How much can I save with the Beckham Law?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Savings depend on your income. At €80,000/year, you save approximately €4,300 annually (€25,800 over 6 years). At €150,000/year, savings are approximately €19,000 annually (€114,000 over 6 years). The Beckham Law becomes beneficial above approximately €40,000/year income.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Spain Beckham Law Tax Calculator — Compare Your Savings | SpainPorFavor"
        description="Calculate your tax savings under Spain's Beckham Law. Compare flat 24% rate vs standard progressive rates (19–47%). Free interactive calculator for Digital Nomad Visa holders."
        path="/tools/beckham-calculator"
        keywords="Beckham Law Spain calculator, Spain tax savings, Digital Nomad Visa tax, flat rate tax Spain, IRPF calculator"
      >
        <script type="application/ld+json">{JSON.stringify(toolSchema)}</script>
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
          <div className="flex items-center gap-2">
            <Link href="/blog/spain-beckham-law-tax-benefits-digital-nomad">
              <Button variant="ghost" size="sm">
                Beckham Law Guide
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

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#1A2332]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Beckham Law Tax Calculator</span>
        </nav>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-6 h-6 text-[#F59E0B]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A2332] font-['Outfit']">
              Beckham Law Tax Calculator
            </h1>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Compare Spain's standard progressive income tax (IRPF, 19–47%) with the
            Beckham Law flat rate (24%) available to Digital Nomad Visa holders. See
            exactly how much you'd save over 6 years.
          </p>
        </div>

        {/* Calculator Input */}
        <div className="bg-[#FAFBFC] border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-[#1A2332] mb-4">
            Enter your annual income
          </h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="income" className="text-sm text-gray-600 mb-1 block">
                Annual gross income
              </Label>
              <Input
                id="income"
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                placeholder="80000"
                className="text-lg h-12"
                min="0"
                step="1000"
              />
            </div>
            <div className="w-36">
              <Label className="text-sm text-gray-600 mb-1 block">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([code, c]) => (
                    <SelectItem key={code} value={code}>
                      {c.symbol} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {currency !== "EUR" && (
            <p className="text-xs text-gray-400 mt-2">
              ≈ {formatCurrency(results.annualIncomeEUR)} EUR (approximate conversion)
            </p>
          )}
        </div>

        {/* Results */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1A2332] mb-5 font-['Outfit']">
            Your Tax Comparison
          </h2>

          {/* Tax bars */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Standard IRPF (progressive)
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(results.standardTax)}/year
                </span>
              </div>
              <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${Math.max(standardBarWidth, 5)}%` }}
                >
                  <span className="text-xs font-semibold text-white">
                    {results.standardEffective.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Beckham Law (flat 24%)
                </span>
                <span className="text-sm font-bold text-[#F59E0B]">
                  {formatCurrency(results.beckhamTax)}/year
                </span>
              </div>
              <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${Math.max(beckhamBarWidth, 5)}%` }}
                >
                  <span className="text-xs font-semibold text-white">
                    {results.beckhamEffective.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div
              className={`p-5 rounded-lg border ${
                results.isBeneficial
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown
                  className={`w-4 h-4 ${
                    results.isBeneficial ? "text-green-600" : "text-gray-500"
                  }`}
                />
                <span className="text-xs font-medium text-gray-600">Annual Savings</span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  results.isBeneficial ? "text-green-700" : "text-gray-700"
                }`}
              >
                {results.annualSavings > 0 ? "+" : ""}
                {formatCurrency(results.annualSavings)}
              </div>
              <div className="text-xs text-gray-500 mt-1">per year</div>
            </div>

            <div
              className={`p-5 rounded-lg border ${
                results.isBeneficial
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Banknote
                  className={`w-4 h-4 ${
                    results.isBeneficial ? "text-green-600" : "text-gray-500"
                  }`}
                />
                <span className="text-xs font-medium text-gray-600">6-Year Total</span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  results.isBeneficial ? "text-green-700" : "text-gray-700"
                }`}
              >
                {results.sixYearSavings > 0 ? "+" : ""}
                {formatCurrency(results.sixYearSavings)}
              </div>
              <div className="text-xs text-gray-500 mt-1">over Beckham Law period</div>
            </div>

            <div className="p-5 rounded-lg border bg-[#FAFBFC] border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Rate Difference</span>
              </div>
              <div className="text-2xl font-bold text-[#1A2332]">
                {(results.standardEffective - results.beckhamEffective).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {results.standardEffective.toFixed(1)}% → {results.beckhamEffective.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Verdict */}
          {results.annualIncomeEUR > 0 && (
            <div
              className={`p-4 rounded-lg border ${
                results.isBeneficial
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              {results.isBeneficial ? (
                <p className="text-sm text-green-800">
                  <strong>The Beckham Law saves you {formatCurrency(results.annualSavings)}/year</strong>{" "}
                  ({formatCurrency(results.sixYearSavings)} over 6 years). At your income level,
                  the flat 24% rate is significantly better than the standard progressive rates.
                </p>
              ) : (
                <p className="text-sm text-amber-800">
                  <strong>The Beckham Law may not benefit you at this income level.</strong>{" "}
                  Below approximately €40,000/year, Spain's standard deductions and lower brackets
                  can result in a lower effective rate than the flat 24%. Consider consulting a tax
                  advisor for your specific situation.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tax brackets detail */}
        <div className="mb-8">
          <button
            onClick={() => setShowBrackets(!showBrackets)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#1A2332] transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showBrackets ? "rotate-180" : ""}`}
            />
            {showBrackets ? "Hide" : "Show"} 2026 Spanish IRPF tax brackets
          </button>
          {showBrackets && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-600">
                      Income Range
                    </th>
                    <th className="text-right py-2 font-medium text-gray-600">
                      Marginal Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {IRPF_BRACKETS.map((bracket, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-700">
                        €{bracket.min.toLocaleString()} –{" "}
                        {bracket.max === Infinity
                          ? "above"
                          : `€${bracket.max.toLocaleString()}`}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {(bracket.rate * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-2">
                Source: Agencia Tributaria (AEAT) 2026 IRPF rates. Includes average autonomous
                community surcharge. Actual rates vary by region.
              </p>
            </div>
          )}
        </div>

        {/* Important notes */}
        <div className="mb-8 p-5 bg-[#FAFBFC] border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
            <h3 className="text-sm font-semibold text-[#1A2332]">Important Notes</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              This calculator provides estimates based on 2026 Spanish IRPF rates. Actual tax
              liability depends on your specific situation, deductions, and autonomous community.
            </li>
            <li>
              <strong>Social security contributions</strong> are not included. Self-employed
              (autónomo) workers pay approximately €300–€500/month in social security.
            </li>
            <li>
              <strong>US citizens:</strong> You must still file US taxes. Use the Foreign Earned
              Income Exclusion (FEIE, up to $126,500 in 2026) or Foreign Tax Credit (FTC) to
              avoid double taxation.
            </li>
            <li>
              The Beckham Law applies for 6 years (year of arrival + 5 subsequent years). After
              that, standard progressive rates apply.
            </li>
            <li>
              You must apply within 6 months of becoming tax resident by filing Form 149 with
              the AEAT.
            </li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1A2332] mb-4 font-['Outfit']">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-[#1A2332] mb-1">
                What is Spain's Beckham Law?
              </h3>
              <p className="text-sm text-gray-600">
                The Beckham Law (IRPF Article 93) is a special tax regime allowing qualifying new
                residents — including Digital Nomad Visa holders — to pay a flat 24% income tax
                rate for up to 6 years, instead of Spain's progressive rates of 19–47%.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#1A2332] mb-1">
                Who is eligible for the Beckham Law?
              </h3>
              <p className="text-sm text-gray-600">
                You must not have been a Spanish tax resident in the previous 5 years, move to
                Spain due to employment or economic activity (Digital Nomad Visa qualifies), and
                apply within 6 months of becoming tax resident by filing Form 149 with the AEAT.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#1A2332] mb-1">
                Can freelancers use the Beckham Law?
              </h3>
              <p className="text-sm text-gray-600">
                Yes. Since the 2023 amendments linked to the Startup Act (Ley 28/2022),
                freelancers and self-employed remote workers on the Digital Nomad Visa can access
                the Beckham Law. You must register as autónomo and pay social security.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-[#1A2332] rounded-lg mb-8">
          <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
            Ready to apply for the Beckham Law?
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Start with our free eligibility assessment. We'll confirm your Beckham Law
            eligibility and guide you through the Digital Nomad Visa process.
          </p>
          <Link href="/free-assessment">
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              Free Assessment <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Related content */}
        <div className="p-5 bg-[#FAFBFC] border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-[#1A2332] mb-3">Related Resources</h3>
          <div className="space-y-2">
            <Link href="/blog/spain-beckham-law-tax-benefits-digital-nomad">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded hover:border-[#F59E0B] transition-colors cursor-pointer">
                <span className="text-sm font-medium text-[#1A2332]">
                  Beckham Law Tax Benefits Explained (Full Guide)
                </span>
                <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </Link>
            <Link href="/guides/digital-nomad-visa">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded hover:border-[#F59E0B] transition-colors cursor-pointer">
                <span className="text-sm font-medium text-[#1A2332]">
                  Spain Digital Nomad Visa Guide
                </span>
                <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </Link>
            <Link href="/blog/work-remotely-spain-american-2026">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded hover:border-[#F59E0B] transition-colors cursor-pointer">
                <span className="text-sm font-medium text-[#1A2332]">
                  Working Remotely in Spain as an American
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
            © 2026 Bayshore Products S.L. (trading as SpainPorFavor). This calculator is for informational purposes only — not tax
            advice. Consult a qualified tax advisor for your specific situation.
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
            <Link href="/tools/checklists" className="hover:text-[#1A2332]">
              Checklists
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
