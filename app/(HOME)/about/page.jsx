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
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Stark – The Creator Network',
    description: 'Built for creators who ship. Read the Stark manifesto.',
  },
};

import ManifestoHero from "./_components/ManifestoHero";
import BeliefSystem from "./_components/BeliefSystem";
import InteractiveCommit from "./_components/InteractiveCommit";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <ManifestoHero />
      <BeliefSystem />
      <InteractiveCommit />
    </div>
  );
}