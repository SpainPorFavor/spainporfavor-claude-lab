/**
 * Terms of Service Page — Legal terms for SpainPorFavor immigration services
 * Accessible at /terms
 */
import SEOHead from "@/components/SEOHead";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Terms of Service — SpainPorFavor"
        description="Terms of Service for SpainPorFavor immigration document preparation services operated by Bayshore Products S.L. Read our service scope, responsibilities, and refund policy."
        path="/terms"
      />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[#1A2332] mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">1. About These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service ("Terms") govern your use of the SpainPorFavor website and services 
              operated by <strong>Bayshore Products S.L.</strong> (C.I.F.: B70778360), a company registered in Spain 
              ("we", "us", "our"). By using our services, you agree to these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              If you do not agree to these Terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">2. What We Do</h2>
            <p className="text-gray-700 leading-relaxed">
              SpainPorFavor is an immigration document preparation and coordination service. We help you prepare, 
              organise, and submit visa applications to the Spanish immigration authorities through licensed 
              Gestores Administrativos (certified immigration specialists registered with their professional body 
              in Spain).
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              <strong>We are not a law firm.</strong> We do not provide legal advice. Our Gestores Administrativos 
              are licensed professionals who prepare and submit administrative applications on your behalf — this is 
              a regulated profession in Spain distinct from legal practice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">3. What We Are Not</h2>
            <p className="text-gray-700 leading-relaxed">To be clear about the scope of our service:</p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>We do not guarantee visa approval. The final decision rests with the Spanish immigration authorities.</li>
              <li>We do not provide legal representation or legal advice.</li>
              <li>We do not act as your employer, sponsor, or financial guarantor.</li>
              <li>We do not provide tax advice (our Beckham Law calculator is for informational purposes only).</li>
              <li>We do not provide health insurance, accommodation, or other relocation services directly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">4. Our Service Process</h2>
            <p className="text-gray-700 leading-relaxed">When you purchase our service, the process works as follows:</p>
            <ol className="list-decimal pl-6 text-gray-700 mt-2 space-y-2">
              <li><strong>Assessment:</strong> You complete our eligibility quiz and provide initial information about your situation.</li>
              <li><strong>Payment:</strong> You pay the service fee for your selected visa type.</li>
              <li><strong>Document collection:</strong> We provide you with a personalised document checklist. You upload your documents through our secure portal.</li>
              <li><strong>Document review:</strong> Our team (including AI-assisted validation and human review) checks your documents for completeness and compliance.</li>
              <li><strong>Preparation and submission:</strong> Your assigned Gestor Administrativo prepares your application package and submits it to the Spanish authorities through official channels.</li>
              <li><strong>Tracking:</strong> We keep you informed of your application status until resolution.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">5. Your Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed">By using our service, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>Provide accurate, truthful, and complete information and documents.</li>
              <li>Not submit forged, altered, or fraudulent documents.</li>
              <li>Respond to document requests and queries within reasonable timeframes.</li>
              <li>Inform us of any changes to your circumstances that may affect your application.</li>
              <li>Ensure you meet the basic eligibility requirements for your chosen visa type before purchasing.</li>
              <li>Obtain any required apostilles, translations, or certifications as instructed.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              <strong>Important:</strong> Submitting false or misleading information to immigration authorities is a 
              criminal offence under Spanish law. We will immediately terminate our service if we discover fraudulent 
              documents or information, without refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">6. Pricing and Payment</h2>
            <p className="text-gray-700 leading-relaxed">
              All prices are displayed in Euros (€) and include our service fee. Prices are as quoted at the 
              time of purchase and are subject to change for future orders.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>What is included:</strong> Document review, application preparation, Gestor submission, 
              and status tracking for the purchased visa type.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>What is not included:</strong> Government filing fees, apostille costs, certified translations, 
              health insurance, travel costs, or any third-party charges. These are your responsibility and will be 
              clearly communicated during the document collection phase.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              Payment is processed securely via Stripe. We do not store your card details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">7. Resubmission Guarantee</h2>
            <p className="text-gray-700 leading-relaxed">
              If your application is rejected by the Spanish authorities due to an error in our preparation or 
              submission, we will resubmit your application at no additional service fee. This guarantee is subject 
              to the following conditions:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>The rejection must be attributable to our preparation, not to your underlying eligibility or documents.</li>
              <li>You must have provided accurate and complete information as requested.</li>
              <li>You must cooperate with any additional document requests needed for resubmission.</li>
              <li>Government filing fees for resubmission (if applicable) remain your responsibility.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              This guarantee does not apply to rejections caused by: ineligibility for the visa type, criminal record 
              issues, insufficient income, fraudulent documents, or changes in immigration law after submission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">8. Refunds and Cancellations</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Before document submission to authorities:</strong> You may cancel and receive a full refund 
              minus a €50 administrative fee, provided we have not yet submitted your application to the Spanish 
              immigration authorities.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>After document submission:</strong> Once your application has been submitted to the authorities, 
              no refund is available as the service has been substantially performed.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>Cooling-off period:</strong> Under EU consumer protection law, you have 14 days from purchase 
              to withdraw without reason. However, if you explicitly request that we begin work before the 14-day 
              period expires (which uploading documents constitutes), you acknowledge that you may lose this right 
              proportionally to the service already provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">9. AI-Assisted Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Parts of our service use artificial intelligence, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li><strong>Document validation:</strong> AI checks your documents for completeness and common issues before human review.</li>
              <li><strong>Chat assistant (Laura):</strong> Our AI assistant answers questions about the visa process and your case status.</li>
              <li><strong>Eligibility assessment:</strong> Our quiz uses automated logic to recommend visa types.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              AI-generated guidance is informational only and does not constitute legal advice. All applications 
              are reviewed by qualified human professionals before submission. You may request human-only review 
              at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">10. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>Our total liability for any claim arising from our service is limited to the amount you paid us for that service.</li>
              <li>We are not liable for indirect, consequential, or incidental damages (including lost income, travel costs, or missed opportunities).</li>
              <li>We are not liable for delays caused by the Spanish immigration authorities, postal services, or third parties.</li>
              <li>We are not liable for visa refusals based on your underlying eligibility or circumstances.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Nothing in these Terms excludes or limits our liability for fraud, death or personal injury caused 
              by our negligence, or any other liability that cannot be excluded by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">11. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content on this website (text, guides, tools, calculators, design) is owned by Bayshore Products S.L. 
              and protected by copyright. You may not reproduce, distribute, or commercially exploit our content 
              without written permission.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              Documents you upload remain your property. We do not claim ownership of your personal documents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">12. Account Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate your account and refuse service if:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>You provide fraudulent or misleading documents or information.</li>
              <li>You violate these Terms.</li>
              <li>You engage in abusive behaviour toward our staff or systems.</li>
              <li>We reasonably believe continuing service would expose us to legal risk.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">13. Governing Law and Disputes</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of Spain. Any disputes arising from these Terms or our services 
              shall be subject to the exclusive jurisdiction of the courts of Spain.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              For EU consumers: you retain any mandatory consumer protection rights granted by the laws of your 
              country of residence. You may also use the EU Online Dispute Resolution platform at{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">
                ec.europa.eu/consumers/odr
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">14. Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. Material changes will be communicated via email or 
              through your portal. Continued use of our service after changes constitutes acceptance of the 
              updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">15. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Bayshore Products S.L.</strong> (trading as SpainPorFavor)<br />
              C.I.F.: B70778360<br />
              Email: info@spainporfavor.com<br />
              Website: www.spainporfavor.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Questions about these terms? Contact us at info@spainporfavor.com
          </p>
        </div>
      </div>
    </div>
  );
}
