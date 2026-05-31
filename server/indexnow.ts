/**
 * IndexNow Integration — Instant URL submission to Bing, Yandex, and all participating search engines.
 * This notifies search engines (and AI crawlers that rely on them) whenever content is added or updated.
 *
 * IndexNow is supported by: Bing, Yandex, Seznam, Naver, and shared with all participating engines.
 * Google does NOT participate in IndexNow but respects the sitemap.xml Sitemap: directive in robots.txt.
 *
 * Usage:
 *   import { submitUrlsToIndexNow } from "./indexnow";
 *   await submitUrlsToIndexNow(["https://www.spainporfavor.com/blog/new-article"]);
 */

const INDEXNOW_KEY = "b3df672df3c054b21f7769a47408c6ed";
const SITE_HOST = "www.spainporfavor.com";

// Submit to Bing's IndexNow endpoint (shared with all participating engines)
const INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow";

export async function submitUrlsToIndexNow(urls: string[]): Promise<{ success: boolean; status?: number; error?: string }> {
  if (urls.length === 0) return { success: true };

  try {
    const body = {
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    };

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`[IndexNow] Successfully submitted ${urls.length} URLs to Bing/IndexNow`);
      return { success: true, status: response.status };
    } else {
      const text = await response.text().catch(() => "");
      console.warn(`[IndexNow] Submission returned status ${response.status}: ${text}`);
      return { success: false, status: response.status, error: text };
    }
  } catch (err: any) {
    console.error(`[IndexNow] Submission failed:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Submit all known public pages to IndexNow.
 * Call this once after deployment or when content is updated.
 */
export async function submitAllPagesToIndexNow(): Promise<void> {
  const allUrls = [
    `https://${SITE_HOST}/`,
    `https://${SITE_HOST}/guides`,
    `https://${SITE_HOST}/guides/digital-nomad-visa`,
    `https://${SITE_HOST}/guides/non-lucrative-visa`,
    `https://${SITE_HOST}/guides/student-visa`,
    `https://${SITE_HOST}/guides/work-visa`,
    `https://${SITE_HOST}/guides/eu-registration`,
    `https://${SITE_HOST}/free-assessment`,
    `https://${SITE_HOST}/blog`,
    `https://${SITE_HOST}/blog/work-remotely-spain-american-2026`,
    `https://${SITE_HOST}/blog/spain-vs-portugal-digital-nomad-visa-2026`,
    `https://${SITE_HOST}/blog/how-much-money-move-to-spain-2026`,
    `https://${SITE_HOST}/blog/spain-beckham-law-tax-benefits-digital-nomad`,
    `https://${SITE_HOST}/blog/nie-number-spain-guide-2026`,
    `https://${SITE_HOST}/tools/beckham-calculator`,
    `https://${SITE_HOST}/tools/checklists`,
    `https://${SITE_HOST}/about`,
  ];

  const result = await submitUrlsToIndexNow(allUrls);
  if (result.success) {
    console.log(`[IndexNow] All ${allUrls.length} pages submitted successfully`);
  } else {
    console.warn(`[IndexNow] Batch submission issue: ${result.error}`);
  }
}
