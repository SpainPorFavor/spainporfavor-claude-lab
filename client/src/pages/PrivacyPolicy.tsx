/**
 * Privacy Policy Page — GDPR-compliant privacy notice
 * Accessible at /privacy
 */
import SEOHead from "@/components/SEOHead";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Privacy Policy — SpainPorFavor"
        description="SpainPorFavor privacy policy. How we collect, use, and protect your personal data. GDPR-compliant, AES-256 encryption, 30-day document deletion after case closure."
        path="/privacy"
      />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[#1A2332] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">1. Who We Are</h2>
            <p className="text-gray-700 leading-relaxed">
              SpainPorFavor is an immigration document preparation service that connects clients with licensed Gestores Administrativos 
              in Spain. We process personal data to prepare and submit visa applications on your behalf.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>Data Controller:</strong> Bayshore Products S.L. (trading as SpainPorFavor)<br />
              <strong>C.I.F.:</strong> B70778360<br />
              <strong>Contact:</strong> info@spainporfavor.com<br />
              <strong>Data Protection Officer:</strong> info@spainporfavor.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">2. What Data We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We collect and process the following categories of personal data:</p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Category</th>
                  <th className="text-left py-2 font-semibold">Examples</th>
                  <th className="text-left py-2 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="py-2">Identity documents</td>
                  <td className="py-2">Passport, criminal record, birth certificate</td>
                  <td className="py-2">Visa application preparation</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Financial documents</td>
                  <td className="py-2">Bank statements, employment contracts</td>
                  <td className="py-2">Income verification for visa requirements</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Contact information</td>
                  <td className="py-2">Name, email, phone number</td>
                  <td className="py-2">Service delivery and communication</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Health insurance</td>
                  <td className="py-2">Insurance policy documents</td>
                  <td className="py-2">Visa requirement compliance</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Usage data</td>
                  <td className="py-2">Login times, document upload history</td>
                  <td className="py-2">Service improvement and security</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">3. Legal Basis for Processing</h2>
            <p className="text-gray-700 leading-relaxed">We process your data under the following legal bases (GDPR Article 6):</p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li><strong>Contract performance (Art. 6(1)(b)):</strong> Processing necessary to deliver our visa preparation service.</li>
              <li><strong>Consent (Art. 6(1)(a)):</strong> For AI-powered document validation and optional marketing communications.</li>
              <li><strong>Legitimate interest (Art. 6(1)(f)):</strong> For security monitoring, fraud prevention, and service improvement.</li>
              <li><strong>Legal obligation (Art. 6(1)(c)):</strong> Where required by law (e.g., anti-money laundering checks).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">4. How We Use AI</h2>
            <p className="text-gray-700 leading-relaxed">
              We use AI-powered document validation to check your uploaded documents for completeness, accuracy, and compliance 
              with Spanish immigration requirements. This includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>Checking document dates and validity periods</li>
              <li>Verifying name consistency across documents</li>
              <li>Detecting missing apostille stamps or translations</li>
              <li>Identifying formatting or quality issues</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Document images are processed by our AI system for validation purposes only. No document data is retained by the 
              AI system after processing. You can opt out of AI validation at any time (documents will then be reviewed manually 
              by our team, which may take longer).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">5. Who Has Access to Your Data</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Your assigned Gestor:</strong> Licensed immigration specialist who prepares your application. Bound by professional confidentiality under Spanish law.</li>
              <li><strong>SpainPorFavor administrators:</strong> For quality control and support purposes.</li>
              <li><strong>Spanish immigration authorities:</strong> Your documents are submitted as part of your visa application.</li>
              <li><strong>Cloud infrastructure providers:</strong> For secure data storage (encrypted at rest).</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              We never sell your data. We never share your data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Active cases:</strong> Your documents and data are retained for the duration of your case plus 30 days after resolution (approval or rejection).<br /><br />
              <strong>After case closure:</strong> All uploaded documents are permanently deleted 30 days after your visa is approved or your case is otherwise resolved. 
              Your case record is anonymized (personal identifiers removed) but retained for our internal compliance records.<br /><br />
              <strong>Renewal clients:</strong> If you opt into our renewal service, your data is retained until you cancel or your case concludes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">7. Your Rights (GDPR Articles 15-22)</h2>
            <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Access:</strong> Request a copy of all data we hold about you.</li>
              <li><strong>Rectification:</strong> Correct inaccurate data.</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten"). You can do this directly from your portal.</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format.</li>
              <li><strong>Restriction:</strong> Limit how we process your data.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
              <li><strong>Withdraw consent:</strong> Revoke any consent you've given, at any time.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              To exercise any of these rights, use the controls in your client portal or email info@spainporfavor.com. 
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">8. Data Security</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>All data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>Access controlled by role-based permissions (you, your Gestor, administrators only)</li>
              <li>All document access logged in audit trail</li>
              <li>EXIF metadata stripped from uploaded images (GPS, device info removed)</li>
              <li>Rate limiting on all API endpoints</li>
              <li>Session-based authentication with HTTP-only cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">9. International Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data is stored on servers within the European Union. Where data is processed outside the EU 
              (e.g., AI validation services), we ensure adequate protection through Standard Contractual Clauses (SCCs) 
              or equivalent safeguards as required by GDPR Chapter V.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">10. Complaints</h2>
            <p className="text-gray-700 leading-relaxed">
              If you believe your data protection rights have been violated, you have the right to lodge a complaint with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li><strong>Spanish Data Protection Agency (AEPD):</strong> www.aepd.es</li>
              <li><strong>Your local supervisory authority</strong> if you are based in another EU/EEA country.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this policy from time to time. If we make material changes, we will notify you via your 
              portal or email before the changes take effect.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Questions about this policy? Contact us at info@spainporfavor.com
          </p>
        </div>
      </div>
    </div>
  );
}
