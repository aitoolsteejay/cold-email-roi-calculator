import { Helmet } from "react-helmet-async";
import { coldEmailRoiJsonLd, coldEmailRoiSeo as seo } from "@/pages/seo";

export function ColdEmailRoiSeo() {
  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords.join(", ")} />
      <link rel="canonical" href={seo.canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Myntmore" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={seo.canonical} />
      <meta property="og:image" content={seo.image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      <script type="application/ld+json">{JSON.stringify(coldEmailRoiJsonLd)}</script>
    </Helmet>
  );
}
