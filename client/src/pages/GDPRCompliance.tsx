/**
 * GDPR Compliance Page — Data protection rights and practices
 * Accessible at /gdpr
 */
import SEOHead from "@/components/SEOHead";

export default function GDPRCompliance() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="GDPR Compliance — SpainPorFavor"
        description="How SpainPorFavor protects your personal data under GDPR. Data retention, right to erasure, security measures, and AEPD registration details."
        path="/gdpr"
      />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[#1A2332] mb-2">GDPR Compliance</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">1. Data Controller</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Bayshore Products S.L.</strong> (trading as SpainPorFavor) is the data controller
              responsible for your personal data under the EU General Data Protection Regulation (GDPR)
              and Spain's Ley Orgánica 3/2018 de Protección de Datos Personales (LOPDGDD).
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>C.I.F.:</strong> B70778360<br />
              <strong>Data Protection Contact:</strong> info@spainporfavor.com<br />
              <strong>Supervisory Authority:</strong> Agencia Española de Protección de Datos (AEPD)
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">2. What Data We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We collect only the data necessary to prepare and submit your visa application:
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Data Category</th>
                  <th className="text-left py-2 font-semibold">Examples</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="py-2">Identity documents</td>
                  <td className="py-2">Passport, criminal record certificate, birth certificate</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Financial documents</td>
                  <td className="py-2">Bank statements, employment contracts, tax returns</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Contact information</td>
                  <td className="py-2">Name, email address, phone number</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Health insurance</td>
                  <td className="py-2">Insurance policy documents</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Account and usage data</td>
                  <td className="py-2">Login times, document upload history, chat transcripts</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">3. Legal Basis for Processing</h2>
            <p className="text-gray-700 leading-relaxed">
              We process your personal data under the following legal bases (GDPR Article 6):
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li><strong>Contract performance (Art. 6(1)(b)):</strong> Processing necessary to deliver the visa preparation service you purchased.</li>
              <li><strong>Consent (Art. 6(1)(a)):</strong> For AI-powered document validation and optional marketing communications. You may withdraw consent at any time.</li>
              <li><strong>Legitimate interest (Art. 6(1)(f)):</strong> For security monitoring, fraud prevention, and service improvement.</li>
              <li><strong>Legal obligation (Art. 6(1)(c)):</strong> Where required by Spanish or EU law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">4. Data Retention Periods</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We retain your data only as long as necessary for the purposes described above:
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Data Type</th>
                  <th className="text-left py-2 font-semibold">Retention Period</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="py-2">Uploaded documents (passport, bank statements, etc.)</td>
                  <td className="py-2">Deleted 30 days after visa approval or case closure</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Account data (name, email)</td>
                  <td className="py-2">Retained while your account is active; deleted upon account deletion request</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Case records</td>
                  <td className="py-2">Anonymised after case closure and retained for compliance records</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Chat transcripts</td>
                  <td className="py-2">Deleted 30 days after case closure</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Payment records</td>
                  <td className="py-2">Retained for 5 years as required by Spanish tax law</td>
                </tr>
              </tbody>
            </table>
            <p className="text-gray-700 leading-relaxed mt-3">
              Renewal clients who opt into ongoing services retain their data until they cancel or their case concludes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">5. Your Rights Under GDPR</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Under GDPR Articles 15–22, you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Right of access (Art. 15):</strong> Request a copy of all personal data we hold about you.</li>
              <li><strong>Right to rectification (Art. 16):</strong> Correct inaccurate or incomplete data.</li>
              <li><strong>Right to erasure (Art. 17):</strong> Request deletion of your personal data (see Section 6 below).</li>
              <li><strong>Right to restriction (Art. 18):</strong> Limit how we process your data in certain circumstances.</li>
              <li><strong>Right to data portability (Art. 20):</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to object (Art. 21):</strong> Object to processing based on legitimate interest.</li>
              <li><strong>Right to withdraw consent (Art. 7(3)):</strong> Withdraw any consent you have given, at any time, without affecting the lawfulness of prior processing.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise any of these rights, email <strong>info@spainporfavor.com</strong> or use the
              data controls in your client portal. We will respond within 30 days as required by GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">6. Right to Erasure — How It Works</h2>
            <p className="text-gray-700 leading-relaxed">
              You may request deletion of your personal data at any time. Here is how the process works:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mt-2 space-y-2">
              <li><strong>Submit your request:</strong> Email info@spainporfavor.com or use the "Delete my data" option in your client portal.</li>
              <li><strong>Confirmation:</strong> We send a double opt-in confirmation email to verify the request is genuine.</li>
              <li><strong>Processing:</strong> Once confirmed, we delete all your uploaded documents, chat transcripts, and personal data within 30 days.</li>
              <li><strong>Exceptions:</strong> We may retain anonymised case records and payment records where required by Spanish tax law (Ley General Tributaria).</li>
            </ol>
            <p className="text-gray-700 leading-relaxed mt-3">
              <strong>Important:</strong> If your visa application is currently being processed by the Spanish authorities,
              erasure of your documents may prevent us from completing your application. We will inform you of this
              before proceeding.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">7. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organisational measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>All data encrypted at rest (AES-256) and in transit (TLS 1.3)</li>
              <li>EXIF metadata stripped from uploaded images (GPS coordinates, device information removed)</li>
              <li>Role-based access control — only you, your assigned Gestor, and authorised administrators can access your data</li>
              <li>All document access logged in an audit trail</li>
              <li>Rate limiting and session-based authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">8. International Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data is stored on servers within the European Union. Where data is processed outside the EU
              (for example, AI-powered document validation), we ensure adequate protection through Standard
              Contractual Clauses (SCCs) or equivalent safeguards as required by GDPR Chapter V.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">9. AEPD Registration and Complaints</h2>
            <p className="text-gray-700 leading-relaxed">
              Bayshore Products S.L. is registered as a data processor with the <strong>Agencia Española de
              Protección de Datos (AEPD)</strong>, Spain's supervisory authority for data protection under
              GDPR and the LOPDGDD.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              If you believe your data protection rights have been violated, you have the right to lodge a
              complaint directly with the AEPD:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>
                <strong>AEPD website:</strong>{" "}
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">
                  www.aepd.es
                </a>
              </li>
              <li>
                <strong>AEPD complaints portal:</strong>{" "}
                <a href="https://sedeagpd.gob.es/sede-electronica-web/vistas/formReclamaciones/reclamaciones.jsf" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">
                  sedeagpd.gob.es
                </a>
              </li>
              <li><strong>Address:</strong> C/ Jorge Juan 6, 28001 Madrid, Spain</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              If you are based in another EU/EEA country, you may also lodge a complaint with your local
              supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">10. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              For any questions about this GDPR compliance notice or your data protection rights:
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>Bayshore Products S.L.</strong> (trading as SpainPorFavor)<br />
              C.I.F.: B70778360<br />
              Data Protection Contact: info@spainporfavor.com<br />
              General enquiries: info@spainporfavor.com<br />
              Website: www.spainporfavor.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            This page supplements our{" "}
            <a href="/privacy" className="text-amber-600 underline">Privacy Policy</a>
            {" "}and{" "}
            <a href="/terms" className="text-amber-600 underline">Terms of Service</a>.
            For questions, contact info@spainporfavor.com.
          </p>
        </div>
      </div>
    </div>
  );
}
