const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stark.et";

export const metadata = {
  title: "Trending",
  description: "Trending creators and projects on Stark.",
  alternates: { canonical: `${BASE_URL}/trending` },
};

export default function TrendingLayout({ children }) {
  return children;
}
