const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stark.et";

export const metadata = {
  title: "Explore",
  description:
    "Explore projects and portfolios on Stark. Discover open-source UI, demos, and creator work.",
  alternates: { canonical: `${BASE_URL}/explore` },
};

export default function ExploreLayout({ children }) {
  return children;
}
