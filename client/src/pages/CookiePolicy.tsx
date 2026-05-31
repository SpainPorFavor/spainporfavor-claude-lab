/**
 * Cookie Policy Page — Cookie usage and consent information
 * Accessible at /cookies
 */
import SEOHead from "@/components/SEOHead";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Cookie Policy — SpainPorFavor"
        description="SpainPorFavor cookie policy. We use minimal cookies: session authentication and Umami cookieless analytics. No ad tracking, no Google Analytics."
        path="/cookies"
      />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[#1A2332] mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">1. What Are Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help the
              site remember your preferences, keep you logged in, and understand how visitors use the site.
              This policy explains which cookies SpainPorFavor uses and why.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">2. Cookies We Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use a minimal set of cookies, limited to what is necessary for the site to function and
              to understand aggregate usage patterns:
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Cookie</th>
                  <th className="text-left py-2 font-semibold">Type</th>
                  <th className="text-left py-2 font-semibold">Purpose</th>
                  <th className="text-left py-2 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="py-2">Session cookie</td>
                  <td className="py-2">Strictly necessary</td>
                  <td className="py-2">Keeps you logged in to your client portal. Contains an encrypted session token — no personal data.</td>
                  <td className="py-2">1 year (or until logout)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Umami analytics</td>
                  <td className="py-2">Analytics</td>
                  <td className="py-2">Privacy-friendly, cookieless analytics. Tracks page views and referral sources in aggregate. No personal data is collected, no cross-site tracking, and no data is shared with third parties.</td>
                  <td className="py-2">No cookie stored</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Stripe</td>
                  <td className="py-2">Strictly necessary</td>
                  <td className="py-2">Set by Stripe during checkout to process payments securely and prevent fraud.</td>
                  <td className="py-2">Session / up to 2 years</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">3. Cookies We Do Not Use</h2>
            <p className="text-gray-700 leading-relaxed">
              To be clear about what we do <strong>not</strong> do:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>We do not use advertising or retargeting cookies.</li>
              <li>We do not use Google Analytics or any tracking that shares data with third-party ad networks.</li>
              <li>We do not build behavioural profiles of our visitors.</li>
              <li>We do not sell or share cookie data with any third party.</li>
              <li>We do not use cross-site tracking of any kind.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">4. Analytics — Umami</h2>
            <p className="text-gray-700 leading-relaxed">
              We use <strong>Umami</strong>, a privacy-focused analytics tool, to understand how visitors
              use our site in aggregate (which pages are visited, where traffic comes from). Umami is
              designed to be GDPR-compliant by default:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>It does not use cookies or store any data on your device.</li>
              <li>It does not collect personal information (no IP addresses, no device fingerprints).</li>
              <li>It does not track users across websites.</li>
              <li>All data is aggregated and anonymous.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Because Umami does not use cookies or collect personal data, it does not require consent
              under GDPR or the ePrivacy Directive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">5. Strictly Necessary Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Our session cookie and Stripe's payment cookies are classified as <strong>strictly necessary</strong> under
              the ePrivacy Directive (Directive 2002/58/EC, as amended). These cookies are essential for the
              website to function — without them, you cannot log in or complete a payment. Strictly necessary
              cookies do not require consent under EU law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">6. Managing Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>View which cookies are stored on your device.</li>
              <li>Delete individual or all cookies.</li>
              <li>Block cookies from specific or all websites.</li>
              <li>Set your browser to notify you when a cookie is being set.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              <strong>Note:</strong> If you block our session cookie, you will not be able to log in to your
              client portal. The rest of the website (guides, blog, tools) will continue to work normally.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">7. Third-Party Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              The only third-party cookies on our site are set by <strong>Stripe</strong> during the checkout
              process. Stripe uses these cookies to process your payment securely and to detect and prevent
              fraud. You can review Stripe's cookie policy at{" "}
              <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">
                stripe.com/cookies-policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">8. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              If we introduce new cookies (for example, if we add a live chat widget or marketing tools in
              the future), we will update this policy and, where required by law, obtain your consent before
              setting non-essential cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-3">9. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about our use of cookies:
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>Bayshore Products S.L.</strong> (trading as SpainPorFavor)<br />
              C.I.F.: B70778360<br />
              Email: info@spainporfavor.com<br />
              Website: www.spainporfavor.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            This page supplements our{" "}
            <a href="/privacy" className="text-amber-600 underline">Privacy Policy</a>
            {" "}and{" "}
            <a href="/gdpr" className="text-amber-600 underline">GDPR Compliance</a> page.
            For questions, contact info@spainporfavor.com.
          </p>
        </div>
      </div>
    </div>
  );
}
