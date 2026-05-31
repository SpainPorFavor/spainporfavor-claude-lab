import { Helmet } from "react-helmet-async";

const BASE_URL = "https://www.spainporfavor.com";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028259905/ZhZM5zouxMCf2dF6jAeR8b/spainporfavor-og-image-TbNigawBayre4zkFf76fBc.png";
const SITE_NAME = "SpainPorFavor";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  children?: React.ReactNode;
}

/**
 * Reusable SEO component that renders:
 * - <title>
 * - meta description + keywords
 * - canonical URL
 * - Open Graph tags (og:title, og:description, og:image, og:url, og:type, og:site_name)
 * - Twitter Card tags (summary_large_image)
 */
export default function SEOHead({
  title,
  description,
  path,
  keywords,
  type = "website",
  image = DEFAULT_OG_IMAGE,
  imageAlt = "SpainPorFavor — The Smartest Way to Move to Spain",
  publishedTime,
  modifiedTime,
  children,
}: SEOHeadProps) {
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Article-specific OG */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {children}
    </Helmet>
  );
}
