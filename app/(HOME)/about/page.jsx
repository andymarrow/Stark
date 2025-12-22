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