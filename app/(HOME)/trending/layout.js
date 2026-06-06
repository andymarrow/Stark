const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stark.et';

export const metadata = {
  title: 'Trending | Stark',
  description: 'See the top trending projects and creators on Stark right now, ranked by views, likes, and hype score.',
  alternates: { canonical: `${BASE_URL}/trending` },
  openGraph: {
    title: 'Trending | Stark',
    description: 'Top trending projects and creators on Stark, ranked by real-time hype score.',
    url: `${BASE_URL}/trending`,
    siteName: 'Stark',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trending | Stark',
    description: 'Top trending projects and creators on Stark, ranked by real-time hype score.',
  },
};

export default function TrendingLayout({ children }) {
  return children;
}
