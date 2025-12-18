"use client"; // <--- This is the magic line

import NextTopLoader from "nextjs-toploader";

export default function ProgressBar() {
  return (
    <NextTopLoader
      color="#10b981" // Matched to brand-500 from your config
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      // Shadow updated to create a matching green glow
      shadow="0 0 10px #10b981,0 0 5px #10b981"
      zIndex={1600}
    />
  );
}