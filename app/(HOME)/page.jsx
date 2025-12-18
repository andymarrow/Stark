import Hero from "./_components/Hero";
import FeaturedProjects from "./_components/FeaturedProjects";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <FeaturedProjects />
    </div>
  );
}