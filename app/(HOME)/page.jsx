import Hero from "./_components/Hero";
import FeaturedProjects from "./_components/FeaturedProjects";
import JsonLd from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stark.et";

export const metadata = {
  alternates: { canonical: BASE_URL },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Stark",
        url: BASE_URL,
        logo: `${BASE_URL}/og-image.png`,
        description: "The creator hub for developers and designers. Build, share, and inspire with portfolios, projects, and contests.",
      },
      {
        "@type": "WebSite",
        name: "Stark",
        url: BASE_URL,
        description: "Stark – the definitive portfolio network for creators who ship. See source code, live demos, and architecture.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BASE_URL}/explore?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd data={jsonLd} />
      <Hero />
      <FeaturedProjects />
    </div>
  );
}