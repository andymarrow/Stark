const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stark.et';

export const metadata = {
  title: 'Explore | Stark',
  description: 'Discover projects, resources, and creators from the Stark network. Browse the best developer and designer portfolios in one place.',
  alternates: { canonical: `${BASE_URL}/explore` },
  openGraph: {
    title: 'Explore | Stark',
    description: 'Discover projects, resources, and creators from the Stark network.',
    url: `${BASE_URL}/explore`,
    siteName: 'Stark',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore | Stark',
    description: 'Discover projects, resources, and creators from the Stark network.',
  },
};

export default function ExploreLayout({ children }) {
  return children;
}
