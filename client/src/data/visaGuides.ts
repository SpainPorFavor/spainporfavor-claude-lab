/**
 * Visa Guide Data — Structured content for GEO (Generative Engine Optimization)
 * Each guide is designed to be citation-worthy by AI assistants:
 * - Clear definitions in the first paragraph
 * - Requirements tables with current 2026 figures
 * - Step-by-step processes
 * - FAQ sections matching natural language queries
 * - Citations to official Spanish government sources
 */

export interface VisaGuide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  lastUpdated: string;
  definition: string;
  officialName: string;
  legalBasis: string;
  duration: string;
  renewability: string;
  timeline: string;
  overview: string;
  eligibility: string[];
  incomeRequirement: string;
  incomeDetails: string;
  requirements: { document: string; details: string; apostille: boolean; translation: boolean }[];
  steps: { step: number; title: string; description: string; timeline: string }[];
  faqs: { question: string; answer: string }[];
  keyFacts: { label: string; value: string }[];
  ctaText: string;
}

export const VISA_GUIDES: VisaGuide[] = [
  {
    slug: "digital-nomad-visa",
    title: "Spain Digital Nomad Visa (DNV) — Complete 2026 Guide",
    metaTitle: "Spain Digital Nomad Visa 2026: Requirements, Income, Process | SpainPorFavor",
    metaDescription: "Spain Digital Nomad Visa 2026: €2,849/month income required, 4–6 week processing. Full requirements, documents, and step-by-step application process.",
    metaKeywords: "Digital Nomad Visa Spain 2026, Spain remote work visa, DNV requirements, Spain visa income threshold, work remotely from Spain, visado teletrabajo España",
    lastUpdated: "May 2026",
    definition: "The Spain Digital Nomad Visa (Visado para teletrabajo de carácter internacional) is a residence visa introduced under Spain's Startup Act (Ley 28/2022, Ley de Fomento del Ecosistema de las Empresas Emergentes) that allows non-EU remote workers and freelancers to live in Spain while working for employers or clients based outside of Spain. It grants an initial 1-year residence permit, renewable for up to 3 years.",
    officialName: "Visado para teletrabajo de carácter internacional",
    legalBasis: "Ley 28/2022 (Spain's Startup Act / Ley de Fomento del Ecosistema de las Empresas Emergentes), Articles 74–80",
    duration: "Initial 1-year visa, then renewable 3-year residence authorization",
    renewability: "Renewable for 3-year periods. After 5 years of continuous residence, you may apply for permanent residency or Spanish citizenship.",
    timeline: "4–6 weeks from submission to decision (via consulate or UGE in Spain)",
    overview: "Spain's Digital Nomad Visa is one of Europe's most popular remote work visas. Introduced in January 2023 under the Startup Act, it allows professionals who work remotely for companies registered outside Spain to live and work legally in Spain. The visa also offers access to Spain's Beckham Law (Régimen Especial de Tributación), which provides a flat 24% income tax rate for the first 6 years — compared to Spain's standard progressive rates of up to 47%.",
    eligibility: [
      "You must be a non-EU/EEA/Swiss citizen (EU citizens do not need a visa to live in Spain)",
      "You must work remotely for a company registered outside of Spain, or be a freelancer with clients predominantly outside Spain",
      "Your employer must have been operating for at least 1 year",
      "No more than 20% of your total work may be for Spanish clients (for freelancers)",
      "You must hold a university degree or have at least 3 years of professional experience in your field",
      "You must not have been a Spanish tax resident in the 5 years prior to application",
      "You must have no criminal record in Spain or in countries where you have lived in the past 5 years",
    ],
    incomeRequirement: "€2,849/month (approximately €34,188/year)",
    incomeDetails: "The income threshold is set at 200% of Spain's IPREM (Indicador Público de Renta de Efectos Múltiples). For 2026, the IPREM is €600/month (€7,200/year), making the DNV threshold approximately €2,849/month for a single applicant. For each dependent family member, add 75% of the IPREM (~€450/month) for the first dependent and 25% (~€150/month) for each additional dependent. Source: Real Decreto 145/2024 and BOE (Boletín Oficial del Estado).",
    requirements: [
      { document: "Valid passport", details: "Must have at least 6 months validity remaining and 2+ blank pages", apostille: false, translation: false },
      { document: "Employment contract or client contracts", details: "Letter from employer confirming remote work permission from Spain, or freelance client contracts showing 3+ months of ongoing work", apostille: false, translation: true },
      { document: "Company registration certificate", details: "Proof that your employer (or your own company) has been active for at least 1 year", apostille: true, translation: true },
      { document: "Bank statements (last 3 months)", details: "Must show monthly income of at least €2,849 (200% IPREM for 2026)", apostille: false, translation: false },
      { document: "Criminal record certificate", details: "Federal-level police clearance from each country of residence in the past 5 years. For US: FBI check. For UK: ACRO. For Canada: RCMP.", apostille: true, translation: true },
      { document: "Private health insurance", details: "Must be from an insurer authorized to operate in Spain. Full coverage, no co-payments or deductibles. Must cover the visa duration.", apostille: false, translation: false },
      { document: "University degree or proof of 3+ years experience", details: "Degree must be apostilled and translated. Experience letters must show 3+ years in a relevant professional field.", apostille: true, translation: true },
      { document: "Passport-sized photo", details: "White background, facing forward, no glasses. Taken within the last 6 months.", apostille: false, translation: false },
    ],
    steps: [
      { step: 1, title: "Check your eligibility", description: "Confirm you meet the income, employment, and qualification requirements. Use our free eligibility assessment to get a personalized recommendation.", timeline: "5 minutes" },
      { step: 2, title: "Gather your documents", description: "Collect all required documents. Criminal record certificates and degrees must be apostilled and translated to Spanish by a certified translator.", timeline: "2–4 weeks" },
      { step: 3, title: "Submit your application", description: "Apply at your nearest Spanish consulate (if outside Spain) or through the Unidad de Grandes Empresas (UGE) if you are already in Spain on a valid visa. Applications are submitted through Spain's Mercurio digital platform.", timeline: "1 day" },
      { step: 4, title: "Wait for processing", description: "The Spanish authorities review your application. You may be asked for additional documents (requerimiento). Processing times vary by consulate.", timeline: "20 business days (official target)" },
      { step: 5, title: "Receive your visa and travel to Spain", description: "Once approved, collect your visa from the consulate. You must enter Spain within the visa validity period and apply for your TIE (Tarjeta de Identidad de Extranjero) within 30 days of arrival.", timeline: "1–2 weeks" },
      { step: 6, title: "Register in Spain (NIE, TIE, Empadronamiento)", description: "After arrival: register your address at the local town hall (empadronamiento), obtain your NIE number, and apply for your TIE card at the Oficina de Extranjería.", timeline: "2–4 weeks" },
    ],
    faqs: [
      { question: "How much income do I need for Spain's Digital Nomad Visa in 2026?", answer: "For 2026, you need to demonstrate a minimum monthly income of approximately €2,849 (200% of Spain's IPREM indicator). This equates to roughly €34,188 per year. For each dependent, you need an additional €450/month for the first dependent and €150/month for each subsequent dependent. Income is proven through bank statements and employment contracts. Source: Spain's IPREM for 2026 as published in the BOE." },
      { question: "Can I work for a Spanish company on the Digital Nomad Visa?", answer: "No. The Digital Nomad Visa is specifically for people who work remotely for companies or clients based outside of Spain. If you are a freelancer, no more than 20% of your total professional income may come from Spanish clients. If you want to work for a Spanish employer, you need a Work Visa (Autorización de Residencia y Trabajo por Cuenta Ajena)." },
      { question: "What is the Beckham Law and how does it apply to Digital Nomad Visa holders?", answer: "The Beckham Law (Régimen Especial de Tributación para Trabajadores Desplazados, under Article 93 of Spain's Income Tax Law) allows qualifying Digital Nomad Visa holders to pay a flat 24% income tax rate on Spanish-source income for the first 6 tax years, instead of Spain's standard progressive rates (which go up to 47%). You must not have been a Spanish tax resident in the 5 years prior to application. This can result in significant tax savings for higher earners." },
      { question: "How long does it take to get a Digital Nomad Visa?", answer: "The official processing target is 20 business days from submission. In practice, total timeline from document gathering to visa in hand is typically 4–6 weeks. Processing times vary by consulate — Madrid and Barcelona tend to be faster than smaller consulates. If you receive a requerimiento (request for additional documents), add 1–2 weeks." },
      { question: "Can I bring my family on the Digital Nomad Visa?", answer: "Yes. Your spouse or unmarried partner and dependent children can apply for family reunification (reagrupación familiar) either simultaneously with your application or after you receive your visa. Each family member needs their own set of documents, and you must demonstrate additional income per dependent." },
      { question: "Do I need a lawyer to apply for the Digital Nomad Visa?", answer: "No. In Spain, immigration document preparation and submission is handled by licensed Gestores Administrativos — official administrative specialists registered with the Colegio Oficial de Gestores Administrativos. Gestores have direct access to Spain's Mercurio digital submission platform and are authorized to represent you before the immigration authorities. SpainPorFavor connects you with licensed Gestores who specialize in Digital Nomad Visa applications." },
      { question: "Can I apply for the Digital Nomad Visa from inside Spain?", answer: "Yes, if you are already in Spain on a valid visa or legal stay (such as a tourist visa with at least 30 days remaining), you can apply through the Unidad de Grandes Empresas (UGE) in Madrid. This is often faster than applying through a consulate abroad." },
      { question: "What happens after 3 years on the Digital Nomad Visa?", answer: "After your initial 1-year visa and subsequent 3-year renewal, you will have lived in Spain for 4 years. After 5 years of continuous legal residence, you can apply for permanent residency (residencia de larga duración). After 10 years of legal residence (or 2 years for citizens of Latin American countries, Portugal, Philippines, Equatorial Guinea, Andorra, or Sephardic Jews), you may apply for Spanish citizenship." },
    ],
    keyFacts: [
      { label: "Visa type", value: "Long-stay residence visa (Type D)" },
      { label: "Legal basis", value: "Ley 28/2022, Articles 74–80" },
      { label: "Income requirement", value: "€2,849/month (200% IPREM, 2026)" },
      { label: "Processing time", value: "20 business days (target)" },
      { label: "Initial duration", value: "1 year" },
      { label: "Renewal", value: "3-year periods" },
      { label: "Tax benefit", value: "Beckham Law: flat 24% for 6 years" },
      { label: "Work restriction", value: "Must work for non-Spanish employer/clients" },
    ],
    ctaText: "Check Your DNV Eligibility — Free",
  },
  {
    slug: "non-lucrative-visa",
    title: "Spain Non-Lucrative Visa (NLV) — Complete 2026 Guide",
    metaTitle: "Spain Non-Lucrative Visa 2026: Requirements, Income, Process | SpainPorFavor",
    metaDescription: "Spain Non-Lucrative Visa 2026: €28,800/year passive income required, 6–8 week processing. Requirements, costs, and application steps for retirees.",
    metaKeywords: "Non-Lucrative Visa Spain, Spain retirement visa, NLV Spain 2026, passive income visa Spain, retire to Spain visa, visado residencia no lucrativa",
    lastUpdated: "May 2026",
    definition: "The Spain Non-Lucrative Visa (Visado de residencia no lucrativa) is a residence visa that allows non-EU citizens to live in Spain without engaging in any work or professional activity. It is designed for retirees, early retirees, and individuals with sufficient passive income or savings to support themselves. The visa grants an initial 1-year residence permit, renewable annually for up to 5 years.",
    officialName: "Visado de residencia no lucrativa",
    legalBasis: "Real Decreto 557/2011 (Reglamento de la Ley Orgánica 4/2000), Articles 45–49",
    duration: "Initial 1-year visa, renewable annually",
    renewability: "Renewable annually. After 5 years of continuous residence, you may apply for permanent residency. After 10 years, you may apply for Spanish citizenship.",
    timeline: "6–8 weeks from submission to decision",
    overview: "Spain's Non-Lucrative Visa is the most popular pathway for retirees and financially independent individuals who want to live in Spain. Unlike the Digital Nomad Visa, the NLV explicitly prohibits any work activity — you cannot be employed or self-employed while holding this visa. You must demonstrate that you have sufficient passive income (pensions, investments, rental income) or savings to support yourself without working. The NLV requires applicants to spend the majority of their time in Spain (at least 183 days per year) to maintain residency.",
    eligibility: [
      "You must be a non-EU/EEA/Swiss citizen",
      "You must not intend to work or engage in any professional activity in Spain",
      "You must have sufficient financial means to support yourself (and dependents) without working",
      "You must have private health insurance with full coverage in Spain (no co-payments)",
      "You must have no criminal record in Spain or in countries where you have lived in the past 5 years",
      "You must be in good health (medical certificate required)",
    ],
    incomeRequirement: "~€28,800/year (~€2,400/month) for a single applicant",
    incomeDetails: "The financial requirement is 400% of Spain's annual IPREM (Indicador Público de Renta de Efectos Múltiples). For 2026, this is approximately €28,800 per year for the main applicant. For each additional family member, add 100% of the annual IPREM (~€7,200/year). You can demonstrate this through pension statements, investment income, rental income, or bank savings. Source: Real Decreto 557/2011, Article 47, and BOE IPREM updates.",
    requirements: [
      { document: "Valid passport", details: "Must have at least 1 year validity remaining and 2+ blank pages", apostille: false, translation: false },
      { document: "Proof of financial means", details: "Bank statements showing at least 400% IPREM (~€28,800/year) for the main applicant, plus 100% IPREM per dependent. Must include bank name, account ID, opening date, balance as of Dec 31, and average balance for the previous year.", apostille: false, translation: false },
      { document: "Criminal record certificate", details: "Federal-level police clearance from each country of residence in the past 5 years. Must be issued within the last 6 months.", apostille: true, translation: true },
      { document: "Private health insurance", details: "Must be from an insurer authorized to operate in Spain. Must provide unlimited coverage with absolutely no co-payments or deductibles. This is strictly enforced for NLV.", apostille: false, translation: false },
      { document: "Medical certificate", details: "Bilingual medical certificate confirming you are in good health. Must be completed by a licensed physician, on medical letterhead. Not older than 3 months.", apostille: false, translation: false },
      { document: "Proof of accommodation in Spain", details: "Rental contract, property purchase deed, or accommodation booking covering at least the initial period.", apostille: false, translation: false },
      { document: "Passport-sized photo", details: "White background, facing forward. Taken within the last 6 months.", apostille: false, translation: false },
    ],
    steps: [
      { step: 1, title: "Verify your financial eligibility", description: "Confirm you have sufficient passive income or savings (400% IPREM for 2026). Use our free eligibility assessment.", timeline: "5 minutes" },
      { step: 2, title: "Gather your documents", description: "Collect all required documents. Criminal record certificates must be apostilled and translated. Medical certificates must be recent (within 3 months).", timeline: "3–6 weeks" },
      { step: 3, title: "Secure health insurance", description: "Purchase private health insurance from a provider authorized to operate in Spain. The policy must have zero co-payments and zero deductibles — this is strictly checked for NLV applications.", timeline: "1–2 days" },
      { step: 4, title: "Submit your application at the Spanish consulate", description: "NLV applications must be submitted at your nearest Spanish consulate in your country of residence. You cannot apply from inside Spain.", timeline: "1 day" },
      { step: 5, title: "Wait for processing", description: "The consulate forwards your application to the Oficina de Extranjería in Spain. Official processing target is 1 month, but in practice it takes 6–8 weeks.", timeline: "6–8 weeks" },
      { step: 6, title: "Collect your visa and move to Spain", description: "Once approved, collect your visa from the consulate (valid for 90 days). Enter Spain and apply for your TIE card within 30 days of arrival.", timeline: "1–2 weeks" },
    ],
    faqs: [
      { question: "Can I work on Spain's Non-Lucrative Visa?", answer: "No. The Non-Lucrative Visa explicitly prohibits any work or professional activity in Spain. You cannot be employed, self-employed, or run a business. If you want to work remotely, you need the Digital Nomad Visa. If you want to work for a Spanish employer, you need a Work Visa." },
      { question: "How much money do I need for Spain's Non-Lucrative Visa in 2026?", answer: "For 2026, you need to demonstrate approximately €28,800 per year (400% of the IPREM) for a single applicant. For each additional family member, add approximately €7,200 per year (100% IPREM). This can be proven through pension income, investment returns, rental income, or bank savings. Source: Real Decreto 557/2011 and BOE IPREM for 2026." },
      { question: "Can I use savings instead of income for the Non-Lucrative Visa?", answer: "Yes. You can demonstrate financial means through bank savings rather than regular income. The savings must be sufficient to cover the required amount for the duration of your visa (typically 1 year). Some consulates prefer to see regular income, but savings are accepted." },
      { question: "Do I have to live in Spain full-time on the Non-Lucrative Visa?", answer: "Yes. To maintain your NLV residency, you must spend at least 183 days per year in Spain. Absences of more than 6 consecutive months may result in loss of residency status. This is different from the Golden Visa, which has no minimum stay requirement." },
      { question: "Can I bring my family on the Non-Lucrative Visa?", answer: "Yes. Your spouse and dependent children can apply for family reunification. You must demonstrate additional financial means (100% IPREM per dependent, approximately €7,200/year per person). Family members can apply simultaneously or after you receive your visa." },
      { question: "What health insurance do I need for the Non-Lucrative Visa?", answer: "You need private health insurance from a company authorized to operate in Spain. The policy must provide full coverage with absolutely no co-payments, no deductibles, and no coverage limits. This is strictly enforced for NLV — policies with any co-payment will be rejected. Popular providers include Sanitas, Adeslas, and ASISA." },
    ],
    keyFacts: [
      { label: "Visa type", value: "Long-stay residence visa (Type D)" },
      { label: "Legal basis", value: "Real Decreto 557/2011, Articles 45–49" },
      { label: "Financial requirement", value: "~€28,800/year (400% IPREM, 2026)" },
      { label: "Processing time", value: "6–8 weeks" },
      { label: "Initial duration", value: "1 year" },
      { label: "Renewal", value: "Annual" },
      { label: "Work permitted", value: "No — no work or professional activity" },
      { label: "Minimum stay", value: "183 days/year in Spain" },
    ],
    ctaText: "Check Your NLV Eligibility — Free",
  },
  {
    slug: "student-visa",
    title: "Spain Student Visa (Estancia por Estudios) — Complete 2026 Guide",
    metaTitle: "Spain Student Visa 2026: Requirements, Process, Costs | SpainPorFavor",
    metaDescription: "Spain Student Visa 2026: €600/month financial proof, 4–6 week processing. Requirements and steps for university, language, and training programs.",
    metaKeywords: "Student Visa Spain, study in Spain visa, Estancia por Estudios 2026, Spain university visa, language course visa Spain, Spain student residence permit",
    lastUpdated: "May 2026",
    definition: "The Spain Student Visa (Estancia por Estudios) is a long-stay visa that allows non-EU citizens to reside in Spain for the purpose of full-time studies at an accredited educational institution. It covers university degrees, master's programs, language courses, professional training, and research programs. The visa is valid for the duration of your studies and can be renewed annually.",
    officialName: "Estancia por Estudios",
    legalBasis: "Ley Orgánica 4/2000 (Ley de Extranjería), Articles 33–37, and Real Decreto 557/2011, Articles 37–42",
    duration: "Valid for the duration of your studies (typically 1 academic year, renewable)",
    renewability: "Renewable annually as long as you remain enrolled. After completing studies, you may apply to modify your status to a work permit (modificación de estancia por estudios a residencia y trabajo).",
    timeline: "4–6 weeks from submission to decision",
    overview: "Spain's Student Visa is the pathway for non-EU citizens who want to study at Spanish universities, language schools, or professional training institutions. Spain is home to some of Europe's top universities and is the world's second-largest Spanish-speaking country by population. The student visa allows part-time work (up to 20 hours per week) and can be converted to a work permit after graduation, making it a popular pathway to long-term residency in Spain.",
    eligibility: [
      "You must be a non-EU/EEA/Swiss citizen",
      "You must have been accepted into a full-time program at an accredited Spanish educational institution",
      "You must have sufficient financial means to support yourself during your studies (100% IPREM per month)",
      "You must have private health insurance covering you in Spain",
      "You must have no criminal record",
    ],
    incomeRequirement: "€600/month (100% IPREM) for the duration of studies",
    incomeDetails: "Students must demonstrate financial means equivalent to 100% of Spain's monthly IPREM (approximately €600/month for 2026) for the entire duration of their studies. This can be proven through bank statements, scholarship letters, or sponsor letters. Source: Real Decreto 557/2011, Article 38.",
    requirements: [
      { document: "Valid passport", details: "Must be valid for the entire duration of your studies. Must have 2+ blank pages.", apostille: false, translation: false },
      { document: "Acceptance letter from Spanish institution", details: "Official acceptance or enrollment letter clearly stating: institution name, course name, start and end dates, and your full name.", apostille: false, translation: false },
      { document: "Proof of financial means", details: "Bank statements showing at least €600/month for the duration of your studies. Your name must match your passport.", apostille: false, translation: false },
      { document: "Private health insurance", details: "Must provide full coverage in Spain for the entire study period.", apostille: false, translation: false },
      { document: "Criminal record certificate", details: "Must be apostilled and translated to Spanish. Issued within the last 3–6 months.", apostille: true, translation: true },
      { document: "Medical certificate", details: "Must be issued within the last 3 months. Must bear the doctor's stamp.", apostille: false, translation: false },
      { document: "Passport-sized photo", details: "White background, facing forward. Taken within the last 6 months.", apostille: false, translation: false },
    ],
    steps: [
      { step: 1, title: "Get accepted into a Spanish institution", description: "Apply and receive an official acceptance letter from an accredited Spanish university, language school, or training institution.", timeline: "Varies" },
      { step: 2, title: "Gather your documents", description: "Collect all required documents including criminal record certificate (apostilled and translated), financial proof, and health insurance.", timeline: "2–4 weeks" },
      { step: 3, title: "Submit your application at the Spanish consulate", description: "Student visa applications must be submitted at your nearest Spanish consulate in your country of residence.", timeline: "1 day" },
      { step: 4, title: "Wait for processing", description: "The consulate processes your application. Official target is 1 month.", timeline: "4–6 weeks" },
      { step: 5, title: "Collect your visa and travel to Spain", description: "Once approved, collect your visa and enter Spain. Apply for your TIE card within 30 days of arrival.", timeline: "1–2 weeks" },
    ],
    faqs: [
      { question: "Can I work on a Spain Student Visa?", answer: "Yes, but only part-time. Student visa holders can work up to 20 hours per week during the academic year and full-time during official holiday periods. Your employer must obtain a work authorization for you. The work must not interfere with your studies." },
      { question: "Can I convert my Student Visa to a work permit?", answer: "Yes. After completing your studies, you can apply for a modification of your immigration status (modificación de estancia por estudios a residencia y trabajo). You need a job offer from a Spanish employer. The process is called 'modificación' and is handled through the Oficina de Extranjería." },
      { question: "How much does it cost to study in Spain?", answer: "Public university tuition in Spain ranges from €680 to €1,400 per year for EU students and €1,500 to €6,000 per year for non-EU students (undergraduate). Master's programs range from €1,500 to €10,000 per year at public universities. Private universities charge €5,000 to €20,000+ per year. Living costs in Spain average €800–€1,200 per month depending on the city." },
      { question: "Do language courses qualify for a Student Visa?", answer: "Yes, but the course must be full-time (at least 20 hours per week) and at an accredited institution. Short courses of less than 90 days can be done on a tourist visa (Schengen visa) without a student visa." },
    ],
    keyFacts: [
      { label: "Visa type", value: "Student stay (Estancia por Estudios)" },
      { label: "Legal basis", value: "LO 4/2000, Articles 33–37" },
      { label: "Financial requirement", value: "€600/month (100% IPREM, 2026)" },
      { label: "Processing time", value: "4–6 weeks" },
      { label: "Duration", value: "Length of studies (renewable annually)" },
      { label: "Work permitted", value: "Part-time (20 hours/week)" },
      { label: "Path to residency", value: "Yes — via modificación after studies" },
    ],
    ctaText: "Check Your Student Visa Eligibility — Free",
  },
  {
    slug: "work-visa",
    title: "Spain Work Visa (Autorización Cuenta Ajena) — Complete 2026 Guide",
    metaTitle: "Spain Work Visa 2026: Requirements, Employer Sponsorship, Process | SpainPorFavor",
    metaDescription: "Spain Work Visa 2026: employer sponsorship required, 8–12 week processing. Full guide to requirements, labour market test, and application steps.",
    metaKeywords: "Work Visa Spain, Spain employer sponsored visa, Cuenta Ajena visa 2026, work permit Spain, Spanish work authorization, labour market test Spain",
    lastUpdated: "May 2026",
    definition: "The Spain Work Visa (Autorización de Residencia y Trabajo por Cuenta Ajena) is a residence and work permit that allows non-EU citizens to live and work in Spain for a specific Spanish employer. The employer must sponsor the application and demonstrate that the position could not be filled by a Spanish or EU citizen (labor market test). The visa grants an initial 1-year residence and work permit.",
    officialName: "Autorización de Residencia y Trabajo por Cuenta Ajena",
    legalBasis: "Ley Orgánica 4/2000 (Ley de Extranjería), Articles 36–38, and Real Decreto 557/2011, Articles 62–70",
    duration: "Initial 1-year permit, renewable for 2-year periods",
    renewability: "Renewable for 2-year periods. After 5 years of continuous legal residence and work, you may apply for permanent residency.",
    timeline: "8–12 weeks from submission to decision",
    overview: "Spain's Work Visa is the standard pathway for non-EU citizens who have a job offer from a Spanish employer. Unlike the Digital Nomad Visa (which is for remote workers employed outside Spain), the Work Visa requires sponsorship from a company registered in Spain. The employer must go through a labor market test (situación nacional de empleo) to demonstrate that no suitable Spanish or EU candidate is available for the position. Certain professions on Spain's shortage occupation list (Catálogo de Ocupaciones de Difícil Cobertura) are exempt from this test.",
    eligibility: [
      "You must be a non-EU/EEA/Swiss citizen",
      "You must have a formal job offer or employment contract from a Spanish employer",
      "Your employer must be registered in Spain with a valid CIF (Código de Identificación Fiscal)",
      "The position must pass the labor market test (unless on the shortage occupation list)",
      "You must have relevant professional qualifications for the role",
      "You must have no criminal record",
    ],
    incomeRequirement: "No specific income threshold — salary must meet Spanish minimum wage (€1,134/month for 2026)",
    incomeDetails: "There is no specific income threshold for the Work Visa beyond Spain's minimum wage (Salario Mínimo Interprofesional). For 2026, Spain's minimum wage is €1,134 per month (14 payments) or approximately €15,876 per year. Your employment contract must specify a salary at or above this level. Source: Real Decreto 2/2024 and BOE.",
    requirements: [
      { document: "Valid passport", details: "Must have at least 6 months validity remaining and 2+ blank pages.", apostille: false, translation: false },
      { document: "Job offer or employment contract", details: "Formal job offer from a Spanish employer including: company name, CIF number, your role, salary, and start date.", apostille: false, translation: false },
      { document: "Employer's company registration (CIF)", details: "Proof that the Spanish employer is a registered company with a valid CIF.", apostille: false, translation: false },
      { document: "Criminal record certificate", details: "Must be apostilled and translated to Spanish. Issued within the last 3–6 months.", apostille: true, translation: true },
      { document: "Private health insurance", details: "Full coverage in Spain for the initial period.", apostille: false, translation: false },
      { document: "Professional qualifications", details: "Relevant degrees, certifications, or professional qualifications for the role. May need apostille and translation.", apostille: true, translation: true },
      { document: "Passport-sized photo", details: "White background, facing forward. Taken within the last 6 months.", apostille: false, translation: false },
    ],
    steps: [
      { step: 1, title: "Secure a job offer from a Spanish employer", description: "Your Spanish employer must provide a formal job offer or employment contract. The employer initiates the visa process.", timeline: "Varies" },
      { step: 2, title: "Employer applies for work authorization", description: "Your employer submits the work authorization application to the Oficina de Extranjería, including the labor market test documentation.", timeline: "1–2 weeks" },
      { step: 3, title: "Labor market test (if applicable)", description: "The authorities verify that no suitable Spanish/EU candidate is available. Positions on the shortage occupation list (Catálogo de Ocupaciones de Difícil Cobertura) are exempt.", timeline: "2–4 weeks" },
      { step: 4, title: "Gather and submit your documents", description: "Once work authorization is granted, submit your visa application at the Spanish consulate with all required documents.", timeline: "1–2 weeks" },
      { step: 5, title: "Wait for visa processing", description: "The consulate processes your visa application.", timeline: "4–6 weeks" },
      { step: 6, title: "Collect your visa and travel to Spain", description: "Once approved, collect your visa, enter Spain, and apply for your TIE card within 30 days.", timeline: "1–2 weeks" },
    ],
    faqs: [
      { question: "Does my employer need to sponsor my Work Visa?", answer: "Yes. The Spanish employer must initiate and sponsor the work authorization process. They submit the application to the Oficina de Extranjería and must demonstrate that the position could not be filled by a Spanish or EU citizen (labor market test)." },
      { question: "What is the labor market test for Spain's Work Visa?", answer: "The labor market test (prueba de la situación nacional de empleo) requires the employer to demonstrate that no suitable Spanish or EU candidate is available for the position. This typically involves publishing the job vacancy through Spain's public employment service (SEPE) for a minimum period. Positions on Spain's shortage occupation list (Catálogo de Ocupaciones de Difícil Cobertura) are exempt from this test." },
      { question: "What professions are on Spain's shortage occupation list?", answer: "Spain's Catálogo de Ocupaciones de Difícil Cobertura is updated quarterly by the SEPE. It typically includes professions in healthcare (doctors, nurses), technology (software engineers, data scientists), engineering, skilled trades (welders, electricians), and maritime occupations. The list varies by region. Check the latest version on the SEPE website." },
      { question: "Can I change employers on a Spanish Work Visa?", answer: "During the first year, your work authorization is tied to a specific employer and geographic area. After the first renewal (year 2+), you can work for any employer in any sector and location in Spain. To change employers during the first year, you need a new work authorization." },
    ],
    keyFacts: [
      { label: "Visa type", value: "Residence and work permit (Cuenta Ajena)" },
      { label: "Legal basis", value: "LO 4/2000, Articles 36–38" },
      { label: "Salary requirement", value: "Spanish minimum wage (€1,134/month, 2026)" },
      { label: "Processing time", value: "8–12 weeks total" },
      { label: "Initial duration", value: "1 year" },
      { label: "Renewal", value: "2-year periods" },
      { label: "Employer sponsorship", value: "Required" },
      { label: "Labor market test", value: "Required (with exemptions)" },
    ],
    ctaText: "Check Your Work Visa Eligibility — Free",
  },
  {
    slug: "eu-registration",
    title: "EU Citizen Registration in Spain (Certificado de Registro) — Complete 2026 Guide",
    metaTitle: "EU Citizen Registration Spain 2026: NIE, Certificado de Registro | SpainPorFavor",
    metaDescription: "EU citizen registration in Spain 2026: get your NIE and Certificado de Registro in 2–3 weeks. Full process, documents, and requirements explained.",
    metaKeywords: "EU registration Spain, NIE number Spain, Certificado de Registro 2026, EU citizen move to Spain, green card Spain EU, empadronamiento EU citizen",
    lastUpdated: "May 2026",
    definition: "The Certificado de Registro de Ciudadano de la Unión Europea is the registration certificate that EU, EEA, and Swiss citizens must obtain when they plan to reside in Spain for more than 3 months. Unlike non-EU citizens, EU citizens do not need a visa to live and work in Spain — but they must register with the Spanish authorities and obtain an NIE (Número de Identidad de Extranjero) number. This registration is mandatory under EU free movement rules.",
    officialName: "Certificado de Registro de Ciudadano de la Unión Europea",
    legalBasis: "Real Decreto 240/2007 (transposing EU Directive 2004/38/EC on free movement of EU citizens)",
    duration: "Permanent (valid for 5 years, then eligible for permanent residence certificate)",
    renewability: "The certificate itself does not expire, but after 5 years of continuous residence you can apply for the Certificado de Registro de Residencia Permanente.",
    timeline: "2–3 weeks from appointment to certificate",
    overview: "If you are an EU, EEA, or Swiss citizen, you have the right to live and work in Spain under EU free movement rules. However, if you plan to stay for more than 3 months, you are legally required to register with the Spanish authorities. This process gives you your Certificado de Registro (green card-sized document) and your NIE number — which you will need for everything from opening a bank account to signing a rental contract, paying taxes, and accessing healthcare.",
    eligibility: [
      "You must be a citizen of an EU member state, EEA country (Norway, Iceland, Liechtenstein), or Switzerland",
      "You must intend to reside in Spain for more than 3 months",
      "You must meet one of the following conditions: be employed or self-employed in Spain, have sufficient financial resources and health insurance, be enrolled as a student with health insurance, or be a family member of an EU citizen meeting the above conditions",
    ],
    incomeRequirement: "No fixed amount — must demonstrate 'sufficient resources'",
    incomeDetails: "There is no specific income threshold for EU citizen registration. You must demonstrate that you have 'sufficient resources' not to become a burden on Spain's social assistance system. In practice, this means showing a regular income (employment contract, self-employment income, pension) or savings. The threshold is generally interpreted as at least the Spanish minimum wage level. Source: Real Decreto 240/2007, Article 7.",
    requirements: [
      { document: "Valid passport or national ID card", details: "Must be valid. Either your passport or national identity card from your EU/EEA country.", apostille: false, translation: false },
      { document: "Proof of address in Spain", details: "Rental contract, property deed, or empadronamiento certificate from your local town hall.", apostille: false, translation: false },
      { document: "Proof of economic activity or resources", details: "Employment contract, self-employment registration (alta en autónomos), pension statement, or bank statements showing sufficient savings.", apostille: false, translation: false },
      { document: "Health insurance or S1/EHIC form", details: "If not employed in Spain: private health insurance or S1 form from your home country. If employed: you are covered by Spanish social security.", apostille: false, translation: false },
      { document: "NIE application form (EX-18)", details: "The official application form for the NIE and Certificado de Registro.", apostille: false, translation: false },
      { document: "Passport-sized photo", details: "One recent passport-sized photo.", apostille: false, translation: false },
    ],
    steps: [
      { step: 1, title: "Get your empadronamiento", description: "Register your address at your local town hall (Ayuntamiento). You need a rental contract or property deed. This is free and usually done the same day.", timeline: "Same day" },
      { step: 2, title: "Book an appointment at the Oficina de Extranjería", description: "Book an appointment online through the Spanish government's appointment system (sede.administracionespublicas.gob.es). Select 'Certificado de Registro de Ciudadano de la UE'.", timeline: "1–3 weeks wait" },
      { step: 3, title: "Gather your documents", description: "Prepare your passport/ID, proof of address, proof of income or employment, and health insurance documentation.", timeline: "1–2 days" },
      { step: 4, title: "Attend your appointment", description: "Go to the Oficina de Extranjería with all documents. Pay the fee (Tasa 012, approximately €12). You will receive your green Certificado de Registro with your NIE number.", timeline: "Same day" },
    ],
    faqs: [
      { question: "Do EU citizens need a visa to live in Spain?", answer: "No. EU, EEA, and Swiss citizens have the right to live and work in Spain under EU free movement rules (Directive 2004/38/EC). However, if you plan to stay for more than 3 months, you must register and obtain your Certificado de Registro and NIE number." },
      { question: "What is the NIE and why do I need it?", answer: "The NIE (Número de Identidad de Extranjero) is your foreign identity number in Spain. You need it for virtually everything: opening a bank account, signing a rental contract, paying taxes, buying property, registering for social security, and accessing public healthcare. It is assigned when you complete your EU citizen registration." },
      { question: "How long does EU registration take in Spain?", answer: "The registration itself is done in a single appointment at the Oficina de Extranjería and takes about 30 minutes. However, getting an appointment can take 1–3 weeks depending on the city. In Madrid and Barcelona, appointment availability is often limited — booking early is recommended." },
      { question: "Do UK citizens still qualify for EU registration after Brexit?", answer: "No. Since Brexit (January 31, 2020), UK citizens are no longer EU citizens and cannot use the EU registration process. UK citizens who were registered in Spain before December 31, 2020 retain their rights under the Withdrawal Agreement. New UK arrivals must apply for a non-EU visa (Digital Nomad Visa, Non-Lucrative Visa, Work Visa, etc.)." },
    ],
    keyFacts: [
      { label: "Applicable to", value: "EU, EEA, and Swiss citizens" },
      { label: "Legal basis", value: "Real Decreto 240/2007" },
      { label: "Financial requirement", value: "Sufficient resources (no fixed amount)" },
      { label: "Processing time", value: "Same-day (at appointment)" },
      { label: "Appointment wait", value: "1–3 weeks" },
      { label: "Fee", value: "~€12 (Tasa 012)" },
      { label: "Work permitted", value: "Yes — full work rights" },
      { label: "Permanent residency", value: "After 5 years continuous residence" },
    ],
    ctaText: "Get Help With Your EU Registration",
  },
];

export function getGuideBySlug(slug: string): VisaGuide | undefined {
  return VISA_GUIDES.find((g) => g.slug === slug);
}
