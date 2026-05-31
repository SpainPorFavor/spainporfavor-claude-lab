/**
 * Blog Articles Data — Long-tail keyword content targeting AI search queries.
 * Each article is structured for maximum AI citation potential:
 * - Clear, factual opening paragraph (definition/answer)
 * - Structured data (tables, lists, step-by-step)
 * - Citations to official sources
 * - FAQ section for additional AI extraction
 */

export interface BlogArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  publishDate: string;
  lastUpdated: string;
  readTime: string;
  category: string;
  tags: string[];
  excerpt: string;
  sections: ArticleSection[];
  faqs: { question: string; answer: string }[];
  sources: { name: string; url: string }[];
  relatedGuides: string[]; // slugs from visaGuides
}

export interface ArticleSection {
  id: string;
  heading: string;
  content: string; // HTML content
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "work-remotely-spain-american-2026",
    title: "Can I Work Remotely in Spain as an American in 2026?",
    metaTitle: "Can I Work Remotely in Spain as an American? (2026 Guide) | SpainPorFavor",
    metaDescription: "Yes, Americans can work remotely in Spain using the Digital Nomad Visa (DNV). Requirements: €2,849/month income, remote job for non-Spanish employer, university degree or 3+ years experience. Full 2026 guide.",
    publishDate: "2026-04-15",
    lastUpdated: "2026-05-10",
    readTime: "8 min read",
    category: "Digital Nomad Visa",
    tags: ["digital nomad visa", "american expat spain", "remote work spain", "US citizen spain visa"],
    excerpt: "Yes, Americans can legally work remotely from Spain using the Digital Nomad Visa (Visado para teletrabajo de carácter internacional), introduced under Spain's Startup Act (Ley 28/2022). This visa grants a 1-year initial residency, renewable for 3-year periods, and includes eligibility for Spain's Beckham Law tax regime.",
    sections: [
      {
        id: "answer",
        heading: "The Short Answer",
        content: `<p><strong>Yes, Americans can legally work remotely from Spain in 2026.</strong> The mechanism is Spain's <strong>Digital Nomad Visa</strong> (officially: <em>Visado para teletrabajo de carácter internacional</em>), introduced under the Startup Act (Ley 28/2022, Articles 74–80). This visa allows non-EU citizens to live in Spain while working remotely for companies or clients outside Spain.</p>
<p>The Digital Nomad Visa grants an initial 1-year residency, renewable for 3-year periods. It also makes you eligible for Spain's <strong>Beckham Law</strong> tax regime — a flat 24% income tax rate for up to 6 years, compared to Spain's standard progressive rates of up to 47%.</p>`
      },
      {
        id: "requirements",
        heading: "Requirements for Americans",
        content: `<p>As a US citizen applying for Spain's Digital Nomad Visa in 2026, you must meet these requirements:</p>
<table>
<thead><tr><th>Requirement</th><th>Details</th></tr></thead>
<tbody>
<tr><td><strong>Income</strong></td><td>Minimum €2,849/month (200% of Spain's IPREM indicator)</td></tr>
<tr><td><strong>Employment</strong></td><td>Remote work for a non-Spanish company or freelance clients (max 20% revenue from Spanish clients)</td></tr>
<tr><td><strong>Education</strong></td><td>University degree OR 3+ years professional experience in your field</td></tr>
<tr><td><strong>Employer tenure</strong></td><td>3+ months with current employer (or 1+ year of freelance activity)</td></tr>
<tr><td><strong>Criminal record</strong></td><td>Clean criminal record certificate (FBI background check for Americans), apostilled</td></tr>
<tr><td><strong>Health insurance</strong></td><td>Private health insurance covering Spain (full coverage, no co-pays)</td></tr>
<tr><td><strong>Passport</strong></td><td>Valid US passport with 6+ months remaining validity</td></tr>
</tbody>
</table>`
      },
      {
        id: "process",
        heading: "Step-by-Step Process for Americans",
        content: `<ol>
<li><strong>Gather documents</strong> — Collect employment contract/client contracts, bank statements (3 months), FBI background check, university degree, health insurance policy</li>
<li><strong>Apostille documents</strong> — FBI background check must be apostilled by the US Department of State. University degrees need apostille from the state where issued.</li>
<li><strong>Translate to Spanish</strong> — All non-Spanish documents must be translated by a sworn translator (<em>traductor jurado</em>)</li>
<li><strong>Apply at Spanish Consulate</strong> — Submit at the Spanish consulate with jurisdiction over your US state of residence (New York, Miami, Houston, Chicago, Los Angeles, San Francisco, or Washington DC)</li>
<li><strong>Wait for approval</strong> — Processing takes 4–6 weeks on average</li>
<li><strong>Travel to Spain</strong> — Enter Spain within 90 days of visa issuance</li>
<li><strong>Get your TIE card</strong> — Apply for your Tarjeta de Identidad de Extranjero within 30 days of arrival</li>
<li><strong>Register for Beckham Law</strong> — File Form 149 within 6 months of becoming tax resident</li>
</ol>`
      },
      {
        id: "costs",
        heading: "Total Costs Breakdown",
        content: `<table>
<thead><tr><th>Item</th><th>Cost (USD approx.)</th></tr></thead>
<tbody>
<tr><td>Consulate visa fee</td><td>$80–$120</td></tr>
<tr><td>FBI background check</td><td>$18</td></tr>
<tr><td>Apostille (State Dept)</td><td>$20 per document</td></tr>
<tr><td>Sworn translation</td><td>$50–$100 per document</td></tr>
<tr><td>Health insurance (annual)</td><td>$1,200–$2,400</td></tr>
<tr><td>Professional preparation service</td><td>$700–$1,500</td></tr>
<tr><td><strong>Total estimate</strong></td><td><strong>$2,000–$4,000</strong></td></tr>
</tbody>
</table>
<p><em>Note: These are approximate costs as of 2026. Government fees are subject to change.</em></p>`
      },
      {
        id: "tax-benefits",
        heading: "Tax Benefits: Beckham Law for Americans",
        content: `<p>One of the biggest advantages of Spain's Digital Nomad Visa for Americans is eligibility for the <strong>Beckham Law</strong> (Régimen Especial de Trabajadores Desplazados, IRPF Article 93). This special tax regime offers:</p>
<ul>
<li><strong>Flat 24% income tax</strong> on Spanish-source income (vs. progressive rates up to 47%)</li>
<li><strong>Non-resident tax treatment</strong> — only taxed on Spanish-source income, not worldwide income</li>
<li><strong>Duration: 6 years</strong> (year of arrival + 5 subsequent years)</li>
<li><strong>No wealth tax</strong> on non-Spanish assets</li>
</ul>
<p><strong>Important for Americans:</strong> The US taxes citizens on worldwide income regardless of residence. However, you can use the Foreign Earned Income Exclusion (FEIE, up to $126,500 in 2026) or Foreign Tax Credit (FTC) to avoid double taxation. Consult a cross-border tax advisor.</p>`
      },
      {
        id: "common-mistakes",
        heading: "Common Mistakes Americans Make",
        content: `<ul>
<li><strong>Applying from the wrong consulate</strong> — You must apply at the consulate with jurisdiction over your state of residence, not where you happen to be</li>
<li><strong>FBI check expiry</strong> — The background check is only valid for 3–6 months depending on the consulate. Time your request carefully.</li>
<li><strong>Insufficient income proof</strong> — Bank statements must clearly show €2,849+/month. Irregular freelance income needs extra documentation (contracts, invoices, tax returns)</li>
<li><strong>Missing apostille</strong> — Every US public document needs a Hague Apostille before it's valid in Spain</li>
<li><strong>Forgetting FBAR/FATCA</strong> — As a US citizen, you must still file FBAR (FinCEN 114) for foreign accounts over $10,000 and FATCA (Form 8938) for specified foreign assets</li>
</ul>`
      },
    ],
    faqs: [
      {
        question: "Can I work for a US company while living in Spain on a Digital Nomad Visa?",
        answer: "Yes. The Spain Digital Nomad Visa is specifically designed for people working remotely for non-Spanish companies. You can continue working for your US employer while living in Spain. The only restriction is that no more than 20% of your work/revenue can come from Spanish clients or companies."
      },
      {
        question: "How long can I stay in Spain on the Digital Nomad Visa?",
        answer: "The initial Digital Nomad Visa is valid for 1 year. After that, you can renew for 3-year periods (called autorización de residencia). There is no limit on renewals as long as you continue meeting the requirements. After 5 years of continuous legal residence, you can apply for permanent residency or Spanish citizenship."
      },
      {
        question: "Do I need to speak Spanish to get the Digital Nomad Visa?",
        answer: "No. There is no Spanish language requirement for the Digital Nomad Visa application. However, basic Spanish will make daily life easier, and you will need B2 level Spanish (or equivalent) if you later apply for Spanish citizenship after 10 years of residence (or 2 years for Latin American citizens)."
      },
      {
        question: "Can my spouse and children come with me to Spain?",
        answer: "Yes. Your spouse and dependent children can apply for family reunification visas alongside your Digital Nomad Visa application. They receive the same residency duration. Your spouse can also work in Spain (they are not restricted to remote work). Each family member needs their own application and documents."
      },
      {
        question: "What happens to my US taxes if I move to Spain?",
        answer: "As a US citizen, you must continue filing US tax returns regardless of where you live. However, you can use the Foreign Earned Income Exclusion (FEIE) to exclude up to $126,500 (2026) of earned income from US tax, or use the Foreign Tax Credit (FTC) to offset taxes paid to Spain. The Beckham Law's flat 24% rate is generally lower than US effective rates for high earners, making Spain tax-efficient. Consult a cross-border tax advisor specializing in US-Spain situations."
      },
    ],
    sources: [
      { name: "Ley 28/2022 (Spain Startup Act)", url: "https://www.boe.es/eli/es/l/2022/12/21/28" },
      { name: "Spain IPREM 2026", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2004-3480" },
      { name: "IRS Foreign Earned Income Exclusion", url: "https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion" },
      { name: "Spanish Consulate General New York", url: "https://www.exteriores.gob.es/Consulados/nuevayork/en/Paginas/index.aspx" },
    ],
    relatedGuides: ["digital-nomad-visa"],
  },
  {
    slug: "spain-vs-portugal-digital-nomad-visa-2026",
    title: "Spain vs Portugal Digital Nomad Visa: Complete 2026 Comparison",
    metaTitle: "Spain vs Portugal Digital Nomad Visa Comparison 2026 | SpainPorFavor",
    metaDescription: "Spain vs Portugal Digital Nomad Visa compared: income requirements (Spain €2,849/mo vs Portugal €3,510/mo), tax benefits (Beckham Law 24% vs NHR ended), processing times, and quality of life. Full 2026 comparison.",
    publishDate: "2026-03-20",
    lastUpdated: "2026-05-10",
    readTime: "10 min read",
    category: "Comparison",
    tags: ["spain vs portugal", "digital nomad visa comparison", "portugal D8 visa", "beckham law vs NHR"],
    excerpt: "Spain and Portugal both offer Digital Nomad Visas for remote workers, but they differ significantly in income requirements, tax treatment, processing times, and lifestyle. Spain requires €2,849/month income and offers the Beckham Law (24% flat tax for 6 years), while Portugal requires €3,510/month and ended its NHR tax regime in 2024.",
    sections: [
      {
        id: "overview",
        heading: "Quick Comparison Overview",
        content: `<p>Both Spain and Portugal are popular destinations for digital nomads in 2026, but their visa programs have important differences. Here's a side-by-side comparison:</p>
<table>
<thead><tr><th>Factor</th><th>Spain (DNV)</th><th>Portugal (D8 Visa)</th></tr></thead>
<tbody>
<tr><td><strong>Official name</strong></td><td>Visado para teletrabajo de carácter internacional</td><td>Visto D8 (Nómada Digital)</td></tr>
<tr><td><strong>Legal basis</strong></td><td>Ley 28/2022 (Startup Act)</td><td>Lei 23/2007, amended 2022</td></tr>
<tr><td><strong>Income requirement</strong></td><td>€2,849/month (200% IPREM)</td><td>€3,510/month (4× minimum wage)</td></tr>
<tr><td><strong>Tax benefit</strong></td><td>Beckham Law: flat 24% for 6 years</td><td>NHR ended 2024; standard rates 14.5–48%</td></tr>
<tr><td><strong>Processing time</strong></td><td>4–6 weeks</td><td>2–4 months</td></tr>
<tr><td><strong>Initial duration</strong></td><td>1 year</td><td>1 year (temporary stay) or 2 years (residence)</td></tr>
<tr><td><strong>Renewal</strong></td><td>3-year periods</td><td>2-year periods</td></tr>
<tr><td><strong>Path to citizenship</strong></td><td>10 years (2 for Latin Americans)</td><td>5 years</td></tr>
<tr><td><strong>Work restriction</strong></td><td>Max 20% revenue from Spanish clients</td><td>Must work for non-Portuguese entity</td></tr>
<tr><td><strong>Health insurance</strong></td><td>Required (private, full coverage)</td><td>Required (private or public via SNS)</td></tr>
<tr><td><strong>Cost of living (index)</strong></td><td>Lower outside Madrid/Barcelona</td><td>Lower outside Lisbon/Porto</td></tr>
</tbody>
</table>`
      },
      {
        id: "tax-comparison",
        heading: "Tax Comparison: Beckham Law vs Post-NHR Portugal",
        content: `<p>The tax situation is where Spain has a clear advantage in 2026:</p>
<p><strong>Spain's Beckham Law (still active in 2026):</strong></p>
<ul>
<li>Flat 24% income tax on Spanish-source income for 6 years</li>
<li>Only taxed on Spanish-source income (not worldwide)</li>
<li>No wealth tax on non-Spanish assets</li>
<li>Available to Digital Nomad Visa holders</li>
</ul>
<p><strong>Portugal's NHR (ended January 2024):</strong></p>
<ul>
<li>The Non-Habitual Resident regime ended for new applicants in January 2024</li>
<li>Replacement "IFICI" regime has stricter eligibility and fewer benefits</li>
<li>Standard Portuguese tax rates: 14.5% to 48% progressive</li>
<li>Portugal taxes worldwide income for residents</li>
</ul>
<p><strong>Bottom line:</strong> For a remote worker earning €60,000/year, Spain's Beckham Law means ~€14,400 in tax. In Portugal under standard rates, the same income would be taxed at approximately €16,000–€20,000 depending on deductions.</p>`
      },
      {
        id: "processing",
        heading: "Processing Times and Bureaucracy",
        content: `<p>Spain's Digital Nomad Visa is generally processed faster than Portugal's D8:</p>
<ul>
<li><strong>Spain:</strong> 4–6 weeks from consulate submission. Applications can be submitted through licensed Gestores Administrativos via the Mercurio platform (for in-Spain applications) or at consulates abroad.</li>
<li><strong>Portugal:</strong> 2–4 months from AIMA (formerly SEF) submission. Portugal's immigration agency has faced significant backlogs since 2023, with some applicants waiting 6+ months for appointments.</li>
</ul>
<p>Spain also has a more established network of Gestores Administrativos — licensed professionals who specialize in immigration document preparation and submission. Portugal relies more on lawyers (advogados) for immigration matters, which tends to be more expensive.</p>`
      },
      {
        id: "lifestyle",
        heading: "Lifestyle and Cost of Living",
        content: `<table>
<thead><tr><th>Factor</th><th>Spain</th><th>Portugal</th></tr></thead>
<tbody>
<tr><td><strong>Average rent (1BR, city center)</strong></td><td>€800–€1,500 (varies by city)</td><td>€900–€1,800 (Lisbon expensive)</td></tr>
<tr><td><strong>Climate</strong></td><td>Mediterranean (south), Continental (north)</td><td>Atlantic (mild, rainy winters)</td></tr>
<tr><td><strong>Language</strong></td><td>Spanish (widely spoken globally)</td><td>Portuguese (smaller global reach)</td></tr>
<tr><td><strong>Digital nomad community</strong></td><td>Barcelona, Valencia, Málaga, Canary Islands</td><td>Lisbon, Porto, Madeira, Algarve</td></tr>
<tr><td><strong>Healthcare quality</strong></td><td>Excellent (ranked 7th globally)</td><td>Good (ranked 12th globally)</td></tr>
<tr><td><strong>Safety</strong></td><td>Very safe (low crime)</td><td>Very safe (low crime)</td></tr>
<tr><td><strong>Internet speed</strong></td><td>Fast (avg 200+ Mbps fiber)</td><td>Fast (avg 150+ Mbps fiber)</td></tr>
</tbody>
</table>`
      },
      {
        id: "verdict",
        heading: "Which Should You Choose?",
        content: `<p><strong>Choose Spain if:</strong></p>
<ul>
<li>You want the best tax deal (Beckham Law 24% flat rate for 6 years)</li>
<li>You prefer faster processing (4–6 weeks vs 2–4 months)</li>
<li>You want more city options (Barcelona, Madrid, Valencia, Málaga, Seville, Canary Islands)</li>
<li>You speak or want to learn Spanish (more globally useful than Portuguese)</li>
<li>You have a lower income (Spain's threshold is €651/month lower than Portugal's)</li>
</ul>
<p><strong>Choose Portugal if:</strong></p>
<ul>
<li>You want faster path to EU citizenship (5 years vs 10 years)</li>
<li>You prefer Atlantic climate and surf culture</li>
<li>You have strong ties to Portuguese-speaking countries (Brazil, Mozambique, etc.)</li>
<li>You plan to eventually work locally (Portugal's labor market is more English-friendly)</li>
</ul>`
      },
    ],
    faqs: [
      {
        question: "Is Spain or Portugal cheaper for digital nomads?",
        answer: "Outside of major cities, Spain and Portugal have similar costs of living. However, Lisbon has become significantly more expensive than most Spanish cities except Barcelona and Madrid. Cities like Valencia, Málaga, and Seville in Spain offer excellent quality of life at lower costs than Lisbon or Porto. For tax purposes, Spain is cheaper due to the Beckham Law (24% flat rate vs Portugal's progressive rates up to 48%)."
      },
      {
        question: "Can I apply for both Spain and Portugal Digital Nomad Visas?",
        answer: "You cannot hold both simultaneously, but you can apply to one and later switch to the other. If you start in Portugal and later want to move to Spain (or vice versa), you would need to apply for the new country's visa and cancel your existing residency. Note that time spent in one country does not count toward citizenship in the other."
      },
      {
        question: "Which country has better internet for remote work?",
        answer: "Both Spain and Portugal have excellent internet infrastructure with widespread fiber optic coverage. Spain averages slightly faster speeds (200+ Mbps) compared to Portugal (150+ Mbps), but both are more than adequate for remote work including video calls and large file transfers. Coworking spaces in both countries typically offer 500+ Mbps connections."
      },
    ],
    sources: [
      { name: "Ley 28/2022 (Spain Startup Act)", url: "https://www.boe.es/eli/es/l/2022/12/21/28" },
      { name: "Portugal Lei 23/2007 (Immigration Law)", url: "https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=920&tabela=leis" },
      { name: "Portugal NHR End Announcement", url: "https://www.portugal.gov.pt" },
      { name: "Numbeo Cost of Living Index", url: "https://www.numbeo.com/cost-of-living/" },
    ],
    relatedGuides: ["digital-nomad-visa"],
  },
  {
    slug: "how-much-money-move-to-spain-2026",
    title: "How Much Money Do You Need to Move to Spain in 2026?",
    metaTitle: "How Much Money Do You Need to Move to Spain? (2026 Costs) | SpainPorFavor",
    metaDescription: "Moving to Spain in 2026 costs €5,000–€15,000 upfront depending on visa type. Monthly income requirements: Digital Nomad Visa €2,849/mo, Non-Lucrative Visa €2,400/mo, Student Visa €600/mo. Full cost breakdown.",
    publishDate: "2026-04-01",
    lastUpdated: "2026-05-10",
    readTime: "9 min read",
    category: "Planning",
    tags: ["cost of moving to spain", "spain visa income requirements", "spain cost of living 2026", "IPREM 2026"],
    excerpt: "The total cost of moving to Spain in 2026 ranges from €5,000 to €15,000 depending on your visa type, family size, and chosen city. Monthly income requirements range from €600/month (Student Visa) to €2,849/month (Digital Nomad Visa). Here's a complete breakdown of every cost involved.",
    sections: [
      {
        id: "summary",
        heading: "Total Cost Summary by Visa Type",
        content: `<p>Moving to Spain involves three categories of costs: <strong>visa/immigration costs</strong>, <strong>setup costs</strong> (first month rent, deposit, flights), and <strong>ongoing monthly costs</strong>. Here's what each visa type requires:</p>
<table>
<thead><tr><th>Visa Type</th><th>Monthly Income Required</th><th>Upfront Costs (estimate)</th><th>Monthly Living Costs</th></tr></thead>
<tbody>
<tr><td><strong>Digital Nomad Visa</strong></td><td>€2,849/month</td><td>€5,000–€8,000</td><td>€1,500–€3,000</td></tr>
<tr><td><strong>Non-Lucrative Visa</strong></td><td>€2,400/month (~€28,800/year)</td><td>€6,000–€10,000</td><td>€1,500–€2,500</td></tr>
<tr><td><strong>Student Visa</strong></td><td>€600/month</td><td>€3,000–€6,000</td><td>€1,000–€1,800</td></tr>
<tr><td><strong>Work Visa</strong></td><td>No minimum (employer sponsors)</td><td>€3,000–€5,000</td><td>€1,500–€2,500</td></tr>
<tr><td><strong>EU Registration</strong></td><td>Varies (must show means)</td><td>€1,000–€3,000</td><td>€1,500–€2,500</td></tr>
</tbody>
</table>`
      },
      {
        id: "iprem",
        heading: "Understanding Spain's IPREM (Income Indicator)",
        content: `<p>Spain calculates visa income requirements based on the <strong>IPREM</strong> (Indicador Público de Renta de Efectos Múltiples), a reference indicator updated annually by the Spanish government. In 2026:</p>
<table>
<thead><tr><th>IPREM Measure</th><th>Amount</th></tr></thead>
<tbody>
<tr><td>Monthly IPREM</td><td>~€600</td></tr>
<tr><td>Annual IPREM (12 payments)</td><td>~€7,200</td></tr>
<tr><td>Annual IPREM (14 payments)</td><td>~€8,400</td></tr>
<tr><td>Digital Nomad Visa (200% IPREM)</td><td>€2,849/month</td></tr>
<tr><td>Non-Lucrative Visa (400% IPREM)</td><td>~€2,400/month (€28,800/year)</td></tr>
<tr><td>Student Visa (100% IPREM)</td><td>~€600/month</td></tr>
</tbody>
</table>
<p>For family members, add approximately 75% of the IPREM per dependent (spouse) and 25% per child.</p>`
      },
      {
        id: "upfront-costs",
        heading: "Upfront Costs Breakdown",
        content: `<table>
<thead><tr><th>Cost Item</th><th>Amount (€)</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>Visa application fee</td><td>€80–€120</td><td>Paid at consulate</td></tr>
<tr><td>Document apostille</td><td>€50–€200</td><td>Varies by country</td></tr>
<tr><td>Sworn translations</td><td>€200–€500</td><td>€50–€100 per document</td></tr>
<tr><td>Professional preparation</td><td>€349–€799</td><td>Gestor/service fees</td></tr>
<tr><td>Health insurance (annual)</td><td>€600–€2,000</td><td>Required for all visa types</td></tr>
<tr><td>Flight (one-way)</td><td>€200–€800</td><td>Depends on origin</td></tr>
<tr><td>First month rent</td><td>€700–€2,000</td><td>Depends on city</td></tr>
<tr><td>Rental deposit</td><td>€1,400–€4,000</td><td>Usually 2 months</td></tr>
<tr><td>NIE/TIE card fee</td><td>€12–€20</td><td>After arrival</td></tr>
<tr><td>Empadronamiento</td><td>Free</td><td>Town hall registration</td></tr>
<tr><td><strong>Total upfront</strong></td><td><strong>€3,600–€10,500</strong></td><td></td></tr>
</tbody>
</table>`
      },
      {
        id: "monthly-costs",
        heading: "Monthly Living Costs by City",
        content: `<table>
<thead><tr><th>City</th><th>Rent (1BR)</th><th>Groceries</th><th>Transport</th><th>Total (single)</th></tr></thead>
<tbody>
<tr><td><strong>Barcelona</strong></td><td>€1,200–€1,800</td><td>€250–€350</td><td>€40–€55</td><td>€2,000–€3,000</td></tr>
<tr><td><strong>Madrid</strong></td><td>€1,000–€1,600</td><td>€250–€350</td><td>€55</td><td>€1,800–€2,800</td></tr>
<tr><td><strong>Valencia</strong></td><td>€800–€1,200</td><td>€200–€300</td><td>€40</td><td>€1,400–€2,200</td></tr>
<tr><td><strong>Málaga</strong></td><td>€800–€1,300</td><td>€200–€300</td><td>€35</td><td>€1,400–€2,200</td></tr>
<tr><td><strong>Seville</strong></td><td>€700–€1,100</td><td>€200–€280</td><td>€35</td><td>€1,200–€2,000</td></tr>
<tr><td><strong>Las Palmas</strong></td><td>€700–€1,100</td><td>€200–€300</td><td>€30</td><td>€1,200–€2,000</td></tr>
<tr><td><strong>Alicante</strong></td><td>€600–€1,000</td><td>€200–€280</td><td>€30</td><td>€1,100–€1,800</td></tr>
</tbody>
</table>
<p><em>Costs based on Numbeo and Expatistan data, May 2026. Rent varies significantly by neighborhood and apartment quality.</em></p>`
      },
      {
        id: "savings-buffer",
        heading: "Recommended Savings Buffer",
        content: `<p>Beyond the minimum visa requirements, we recommend having a <strong>savings buffer</strong> for unexpected costs:</p>
<ul>
<li><strong>3 months of living expenses</strong> — In case of delayed income, job changes, or unexpected costs</li>
<li><strong>€1,000–€2,000 emergency fund</strong> — For medical co-pays, appliance repairs, or travel</li>
<li><strong>Visa renewal costs</strong> — Budget €200–€500 for annual renewal fees and updated documents</li>
</ul>
<p><strong>Total recommended savings before moving:</strong> €10,000–€20,000 depending on your visa type and chosen city. This gives you a comfortable 3-month runway plus all upfront costs.</p>`
      },
    ],
    faqs: [
      {
        question: "What is the cheapest way to move to Spain?",
        answer: "The cheapest legal pathway is the Student Visa, which requires only €600/month in financial means and allows part-time work (20 hours/week). Tuition at public Spanish universities ranges from €700–€2,000/year for master's programs. Combined with living in an affordable city like Seville or Alicante, total costs can be under €1,500/month. After completing studies, you can convert to a work permit."
      },
      {
        question: "Can I move to Spain with no money?",
        answer: "No. All Spanish visa types require proof of financial means. The minimum is the Student Visa at €600/month. If you have a job offer from a Spanish employer (Work Visa), you don't need to show personal savings, but your employer must demonstrate they can pay your salary. There is no visa pathway that requires zero financial proof."
      },
      {
        question: "Is €2,849 per month enough to live comfortably in Spain?",
        answer: "Yes, €2,849/month (the Digital Nomad Visa minimum) provides a comfortable lifestyle in most Spanish cities outside Barcelona and central Madrid. In cities like Valencia, Málaga, or Seville, this income covers rent (€800–€1,200), food (€300), utilities (€100), transport (€40), health insurance (€100), and leaves €1,000+ for savings and leisure. In Barcelona or Madrid, it's tighter but still livable."
      },
    ],
    sources: [
      { name: "Spain IPREM 2026 (BOE)", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2004-3480" },
      { name: "Numbeo Cost of Living Spain", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Spain" },
      { name: "Expatistan Cost of Living", url: "https://www.expatistan.com/cost-of-living/country/spain" },
    ],
    relatedGuides: ["digital-nomad-visa", "non-lucrative-visa", "student-visa"],
  },
  {
    slug: "spain-beckham-law-tax-benefits-digital-nomad",
    title: "Spain Digital Nomad Visa Beckham Law Tax Benefits Explained",
    metaTitle: "Spain Beckham Law Tax Benefits for Digital Nomads (2026) | SpainPorFavor",
    metaDescription: "Spain's Beckham Law offers Digital Nomad Visa holders a flat 24% income tax rate for 6 years (vs. up to 47% standard). Eligibility, application process, and savings calculator explained for 2026.",
    publishDate: "2026-04-10",
    lastUpdated: "2026-05-10",
    readTime: "7 min read",
    category: "Tax",
    tags: ["beckham law spain", "spain tax digital nomad", "IRPF article 93", "spain flat tax rate"],
    excerpt: "Spain's Beckham Law (Régimen Especial de Trabajadores Desplazados, IRPF Article 93) allows Digital Nomad Visa holders to pay a flat 24% income tax rate for up to 6 years, instead of Spain's progressive rates of 19–47%. This can save a remote worker earning €80,000/year approximately €8,000–€12,000 annually in taxes.",
    sections: [
      {
        id: "what-is",
        heading: "What is the Beckham Law?",
        content: `<p>The <strong>Beckham Law</strong> (officially: <em>Régimen Especial de Trabajadores Desplazados</em>, regulated under IRPF Article 93) is a special tax regime in Spain that allows qualifying new residents to be taxed as non-residents for up to 6 years. It was originally created in 2005 to attract foreign football players (hence the nickname after David Beckham), but has since been expanded to cover all qualifying foreign workers, including Digital Nomad Visa holders.</p>
<p>Under the Beckham Law, you pay:</p>
<ul>
<li><strong>24% flat tax</strong> on income up to €600,000 (Spanish-source only)</li>
<li><strong>47% flat tax</strong> on income above €600,000</li>
<li><strong>No tax on foreign-source income</strong> (dividends, capital gains, rental income from outside Spain)</li>
<li><strong>No wealth tax</strong> on assets outside Spain</li>
</ul>`
      },
      {
        id: "eligibility",
        heading: "Eligibility for Digital Nomad Visa Holders",
        content: `<p>To qualify for the Beckham Law as a Digital Nomad Visa holder in 2026, you must meet ALL of these criteria:</p>
<ol>
<li><strong>Not been a Spanish tax resident</strong> in the 5 years before arriving in Spain</li>
<li><strong>Move to Spain due to employment or economic activity</strong> — the Digital Nomad Visa qualifies</li>
<li><strong>Register as a Spanish tax resident</strong> (spend 183+ days/year in Spain)</li>
<li><strong>Apply within 6 months</strong> of becoming tax resident (filing Form 149)</li>
</ol>
<p><strong>Important:</strong> If you were a Spanish tax resident at any point in the previous 5 years (e.g., you lived in Spain on a tourist visa overstay or previous residency), you do NOT qualify.</p>`
      },
      {
        id: "savings",
        heading: "Tax Savings Calculator",
        content: `<p>Here's how much you save with the Beckham Law compared to standard Spanish tax rates:</p>
<table>
<thead><tr><th>Annual Income</th><th>Standard Tax (IRPF)</th><th>Beckham Law Tax</th><th>Annual Savings</th></tr></thead>
<tbody>
<tr><td>€40,000</td><td>~€9,500 (eff. ~24%)</td><td>€9,600 (24%)</td><td>~€0 (break-even)</td></tr>
<tr><td>€60,000</td><td>~€16,000 (eff. ~27%)</td><td>€14,400 (24%)</td><td><strong>~€1,600</strong></td></tr>
<tr><td>€80,000</td><td>~€23,500 (eff. ~29%)</td><td>€19,200 (24%)</td><td><strong>~€4,300</strong></td></tr>
<tr><td>€100,000</td><td>~€32,000 (eff. ~32%)</td><td>€24,000 (24%)</td><td><strong>~€8,000</strong></td></tr>
<tr><td>€150,000</td><td>~€55,000 (eff. ~37%)</td><td>€36,000 (24%)</td><td><strong>~€19,000</strong></td></tr>
<tr><td>€200,000</td><td>~€78,000 (eff. ~39%)</td><td>€48,000 (24%)</td><td><strong>~€30,000</strong></td></tr>
</tbody>
</table>
<p><em>Standard tax calculated using 2026 Spanish IRPF brackets (state + average regional). Beckham Law figures are exact (24% flat). Does not include social security contributions.</em></p>
<p><strong>Key insight:</strong> The Beckham Law becomes significantly beneficial above €60,000/year income. Below €40,000, standard rates may actually be lower due to deductions and allowances.</p>`
      },
      {
        id: "application",
        heading: "How to Apply for the Beckham Law",
        content: `<ol>
<li><strong>Obtain your NIE number</strong> — Required for all tax matters in Spain</li>
<li><strong>Register with the Tax Agency (AEAT)</strong> — Get your tax identification</li>
<li><strong>File Form 149</strong> — "Comunicación de la opción, renuncia o exclusión del régimen especial" within 6 months of becoming tax resident</li>
<li><strong>Receive confirmation</strong> — AEAT processes within 10 business days</li>
<li><strong>File annual tax return</strong> — Use Form 151 (not the standard Form 100) for your annual declaration</li>
</ol>
<p><strong>Deadline:</strong> You must file Form 149 within 6 months of the date you became a Spanish tax resident. Missing this deadline means losing the Beckham Law benefit permanently for this residency period.</p>`
      },
      {
        id: "limitations",
        heading: "Limitations and Considerations",
        content: `<ul>
<li><strong>No personal deductions</strong> — Under Beckham Law, you cannot claim standard deductions (mortgage, children, etc.) that reduce the standard tax base</li>
<li><strong>No double-taxation treaty benefits</strong> — You're taxed as a non-resident, so some treaty provisions may not apply</li>
<li><strong>Social security still applies</strong> — You must still pay Spanish social security contributions if self-employed (~€300–€500/month)</li>
<li><strong>Wealth tax exemption only for foreign assets</strong> — Spanish assets (property, bank accounts in Spain) are still subject to wealth tax</li>
<li><strong>6-year limit is firm</strong> — After 6 years, you revert to standard progressive rates with no extension possible</li>
<li><strong>Cannot combine with other regimes</strong> — If you previously used the Beckham Law, you cannot use it again</li>
</ul>`
      },
    ],
    faqs: [
      {
        question: "Can freelancers use the Beckham Law in Spain?",
        answer: "Yes, since the 2023 amendments to the Beckham Law (linked to the Startup Act), freelancers and self-employed remote workers on the Digital Nomad Visa can access the Beckham Law regime. Previously, it was limited to employees. You must register as autónomo (self-employed) in Spain and pay social security contributions, but your income tax will be the flat 24% rate."
      },
      {
        question: "Does the Beckham Law apply to crypto income?",
        answer: "Under the Beckham Law, you are only taxed on Spanish-source income. If your crypto gains are from platforms/exchanges outside Spain and the activity generating them is not performed in Spain, they may be classified as foreign-source income and exempt. However, this is a complex area — if you actively trade crypto while physically in Spain, it could be considered Spanish-source. Consult a tax advisor specializing in crypto and Spanish tax law."
      },
      {
        question: "What happens after the 6-year Beckham Law period ends?",
        answer: "After 6 years, you automatically revert to standard Spanish tax resident status with progressive rates (19–47%). At that point, you're taxed on worldwide income. Many expats use this transition to either: (1) stay in Spain and accept standard rates, (2) move to another country with favorable tax treatment, or (3) apply for Spanish citizenship (if eligible after 10 years) and then restructure their tax situation."
      },
    ],
    sources: [
      { name: "IRPF Article 93 (BOE)", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764" },
      { name: "AEAT Form 149", url: "https://sede.agenciatributaria.gob.es" },
      { name: "Ley 28/2022 Beckham Law Extension", url: "https://www.boe.es/eli/es/l/2022/12/21/28" },
    ],
    relatedGuides: ["digital-nomad-visa"],
  },
  {
    slug: "nie-number-spain-guide-2026",
    title: "How to Get an NIE Number in Spain: Complete 2026 Guide",
    metaTitle: "How to Get an NIE Number in Spain (2026 Guide) | SpainPorFavor",
    metaDescription: "The NIE (Número de Identidad de Extranjero) is Spain's foreigner ID number required for working, renting, banking, and taxes. How to get it: police station appointment, €12 fee, same-day processing. Full 2026 guide.",
    publishDate: "2026-03-01",
    lastUpdated: "2026-05-10",
    readTime: "6 min read",
    category: "Practical",
    tags: ["NIE number spain", "numero identidad extranjero", "NIE appointment spain", "spain foreigner ID"],
    excerpt: "The NIE (Número de Identidad de Extranjero) is a unique identification number assigned to all foreigners in Spain. You need it for almost everything: opening a bank account, signing a rental contract, paying taxes, buying property, getting a phone contract, or starting a business. It's a simple white paper certificate with your number, obtained at a police station.",
    sections: [
      {
        id: "what-is",
        heading: "What is an NIE Number?",
        content: `<p>The <strong>NIE</strong> (Número de Identidad de Extranjero, "Foreigner Identity Number") is a unique tax identification number assigned to all non-Spanish nationals who have financial, professional, or social interactions in Spain. It follows the format: <strong>X-1234567-A</strong> (letter, 7 digits, letter).</p>
<p>The NIE is <strong>not a visa or residency permit</strong> — it's purely an identification number for administrative purposes. You can have an NIE without being a resident, and you need one even for short-term activities like buying property or setting up a business.</p>
<p><strong>Key distinction:</strong></p>
<ul>
<li><strong>NIE</strong> = Your number (permanent, never changes)</li>
<li><strong>NIE certificate</strong> = The white paper document proving your number (can expire, needs renewal)</li>
<li><strong>TIE</strong> = Tarjeta de Identidad de Extranjero (physical ID card for residents, contains your NIE number)</li>
</ul>`
      },
      {
        id: "when-needed",
        heading: "When Do You Need an NIE?",
        content: `<p>You need an NIE for virtually all official and financial activities in Spain:</p>
<table>
<thead><tr><th>Activity</th><th>NIE Required?</th></tr></thead>
<tbody>
<tr><td>Opening a bank account</td><td>Yes (mandatory)</td></tr>
<tr><td>Signing a rental contract</td><td>Yes (landlord needs it for tax reporting)</td></tr>
<tr><td>Working (employed or self-employed)</td><td>Yes (for social security and tax)</td></tr>
<tr><td>Buying property</td><td>Yes (for deed and tax)</td></tr>
<tr><td>Getting a phone contract</td><td>Yes (most providers require it)</td></tr>
<tr><td>Paying taxes</td><td>Yes (it's your tax ID)</td></tr>
<tr><td>Registering a vehicle</td><td>Yes</td></tr>
<tr><td>Starting a business</td><td>Yes (for company registration)</td></tr>
<tr><td>Getting utilities (electricity, water)</td><td>Sometimes (depends on provider)</td></tr>
<tr><td>Tourist activities (short stay)</td><td>No (passport sufficient)</td></tr>
</tbody>
</table>`
      },
      {
        id: "how-to-get",
        heading: "How to Get Your NIE: Step by Step",
        content: `<p>There are two ways to get an NIE:</p>
<h3>Option 1: In Spain (at a police station)</h3>
<ol>
<li><strong>Book an appointment (cita previa)</strong> — Online at <a href="https://sede.administracionespublicas.gob.es">sede.administracionespublicas.gob.es</a>, select "Policía - Certificados UE" or "Asignación NIE"</li>
<li><strong>Pay the fee</strong> — Download Modelo 790 Código 012, pay €12 at any bank</li>
<li><strong>Attend your appointment</strong> — Bring: passport + copy, completed EX-15 form, proof of reason (rental contract, job offer, etc.), paid Modelo 790 receipt</li>
<li><strong>Receive your NIE</strong> — Usually issued same-day or within 1–3 days</li>
</ol>
<h3>Option 2: From abroad (at a Spanish consulate)</h3>
<ol>
<li><strong>Book a consulate appointment</strong> — Contact your nearest Spanish consulate</li>
<li><strong>Submit documents</strong> — Same as above, plus justification for why you need it before arriving</li>
<li><strong>Wait 2–4 weeks</strong> — Consulates process NIE requests more slowly</li>
</ol>
<p><strong>Pro tip:</strong> If you're applying for a visa (Digital Nomad, Non-Lucrative, etc.), your NIE is automatically assigned during the visa process. You don't need to apply separately.</p>`
      },
      {
        id: "documents",
        heading: "Required Documents",
        content: `<table>
<thead><tr><th>Document</th><th>Details</th></tr></thead>
<tbody>
<tr><td><strong>Passport</strong></td><td>Original + photocopy of photo page</td></tr>
<tr><td><strong>EX-15 form</strong></td><td>Completed and signed (download from extranjeros.gob.es)</td></tr>
<tr><td><strong>Modelo 790 (paid)</strong></td><td>€12 fee, paid at any Spanish bank before appointment</td></tr>
<tr><td><strong>Justification</strong></td><td>Document proving why you need the NIE (job offer, rental contract, property purchase deed, etc.)</td></tr>
<tr><td><strong>Passport photo</strong></td><td>1 recent photo (white background, 32×26mm)</td></tr>
<tr><td><strong>Empadronamiento</strong></td><td>Sometimes requested (proof of address registration)</td></tr>
</tbody>
</table>`
      },
      {
        id: "tips",
        heading: "Practical Tips and Common Issues",
        content: `<ul>
<li><strong>Appointments are scarce</strong> — In popular cities (Barcelona, Madrid, Málaga), NIE appointments can be booked out weeks in advance. Check the website daily at 8:00 AM when new slots are released.</li>
<li><strong>Your NIE never changes</strong> — Once assigned, your NIE number stays with you forever, even if you leave Spain and return years later.</li>
<li><strong>The certificate expires</strong> — The paper NIE certificate is valid for 3 months. After that, you need a new certificate (not a new number) if someone requests a recent one.</li>
<li><strong>TIE replaces the certificate</strong> — Once you have a TIE card (issued to residents), you no longer need the paper NIE certificate. Your NIE number is printed on the TIE.</li>
<li><strong>Use a Gestor</strong> — A licensed Gestor Administrativo can apply for your NIE on your behalf using a power of attorney (poder notarial), saving you the appointment hassle.</li>
<li><strong>Modelo 790 must be paid same-day</strong> — The bank payment receipt is only valid for the day it's paid. Pay it the morning of your appointment.</li>
</ul>`
      },
    ],
    faqs: [
      {
        question: "How long does it take to get an NIE in Spain?",
        answer: "If you apply in person at a police station in Spain, the NIE is typically issued the same day or within 1–3 business days. The main delay is getting an appointment (cita previa), which can take 1–4 weeks depending on the city and time of year. From a Spanish consulate abroad, processing takes 2–4 weeks after your appointment."
      },
      {
        question: "Can I get an NIE without an appointment?",
        answer: "No. Since 2020, all NIE applications in Spain require a prior appointment (cita previa) booked online. Walk-ins are not accepted. However, a licensed Gestor Administrativo can sometimes access appointment slots more quickly or apply on your behalf with a power of attorney."
      },
      {
        question: "Is the NIE the same as the TIE?",
        answer: "No. The NIE is your identification number (a sequence like X-1234567-A). The TIE (Tarjeta de Identidad de Extranjero) is a physical ID card issued to non-EU residents that contains your NIE number, photo, and residency information. Think of it like: NIE = your Social Security number, TIE = your ID card. EU citizens get a green certificate instead of a TIE."
      },
      {
        question: "Do I need an NIE to rent an apartment in Spain?",
        answer: "Technically, you can sign a short-term rental without an NIE (using your passport number). However, for long-term rentals (12+ months), most landlords and agencies require an NIE because they need it for tax reporting purposes. Some flexible landlords will allow you to sign with your passport and provide the NIE later, but this is becoming less common."
      },
    ],
    sources: [
      { name: "Ministerio de Inclusión — NIE Information", url: "https://www.inclusion.gob.es/web/migraciones/w/nie" },
      { name: "Sede Electrónica — Cita Previa", url: "https://sede.administracionespublicas.gob.es" },
      { name: "Modelo 790 Código 012", url: "https://sede.policia.gob.es/Tasa790_012/" },
    ],
    relatedGuides: ["digital-nomad-visa", "eu-registration"],
  },
];
