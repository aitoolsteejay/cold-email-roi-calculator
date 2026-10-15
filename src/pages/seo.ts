/**
 * SEO for /tools/cold-email-roi-calculator. Kept as plain data so it maps directly onto
 * Next.js `export const metadata` when this page moves into the site.
 */
export const SITE_URL = "https://www.myntmore.com";
export const PAGE_PATH = "/tools/cold-email-roi-calculator";

export const coldEmailRoiSeo = {
  title: "Cold Email ROI Calculator | Myntmore",
  description:
    "Free cold email ROI calculator. Estimate meetings, pipeline and revenue from your outreach using 2026 benchmark reply rates.",
  canonical: `${SITE_URL}${PAGE_PATH}`,
  image: `${SITE_URL}/logo.png`,
  keywords: [
    "cold email roi calculator",
    "cold email benchmarks 2026",
    "cold email reply rate benchmark",
    "meetings per 1000 emails",
    "cold email calculator",
    "outbound roi calculator",
  ],
};

export const coldEmailRoiJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cold Email ROI Calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: coldEmailRoiSeo.canonical,
  description: coldEmailRoiSeo.description,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: "Myntmore", url: SITE_URL, logo: coldEmailRoiSeo.image },
};
