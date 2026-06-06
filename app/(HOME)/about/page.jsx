import ManifestoHero from "./_components/ManifestoHero";
import BeliefSystem from "./_components/BeliefSystem";
import InteractiveCommit from "./_components/InteractiveCommit";
import JsonLd from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stark.et';

export const metadata = {
  title: 'About | Stark',
  description: 'Stark is the open-source portfolio network built for developers, designers, and motion creators who ship. Read our manifesto and beliefs.',
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: 'About Stark – The Creator Network',
    description: 'Built for creators who ship. Read the Stark manifesto.',
    url: `${BASE_URL}/about`,
    siteName: 'Stark',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Stark – The Creator Hub' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Stark – The Creator Network',
    description: 'Built for creators who ship. Read the Stark manifesto.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Stark",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
      description: "The open-source portfolio network for developers, designers, and motion creators who ship.",
      sameAs: [],
    },
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/about`,
      url: `${BASE_URL}/about`,
      name: "About Stark – The Creator Network",
      description: "Read the Stark manifesto and learn about the beliefs behind the platform.",
      isPartOf: { "@id": `${BASE_URL}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Stark", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "About", item: `${BASE_URL}/about` },
      ],
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={jsonLd} />
      <ManifestoHero />
      <BeliefSystem />
      <InteractiveCommit />
    </div>
  );
}
