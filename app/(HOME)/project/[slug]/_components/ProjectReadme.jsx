export default function ProjectReadme() {
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      {/* Simulation of a Markdown rendered area */}
      
      <h3 className="font-bold text-xl mb-4">Features</h3>
      <ul className="list-none pl-0 space-y-2">
        {['Real-time Metrics: Monitor your ML models with sub-second latency', 
          'Custom Visualizations: Built-in charting library optimized for time-series data',
          'Alert System: Configure thresholds and get notified instantly',
          'Multi-tenant: Support for teams with role-based access control'].map((item, i) => (
            <li key={i} className="flex gap-2 text-muted-foreground">
                <span className="text-accent font-bold">→</span>
                <span>{item}</span>
            </li>
        ))}
      </ul>

      <h3 className="font-bold text-xl mt-8 mb-4">Architecture</h3>
      <p className="text-muted-foreground">
        The dashboard uses a microservices architecture with:
      </p>
      <ul className="list-none pl-0 space-y-2 mt-4">
        <li className="flex gap-2 text-muted-foreground">
             <span className="text-accent font-bold">→</span>
             React frontend with Zustand for state management
        </li>
        <li className="flex gap-2 text-muted-foreground">
             <span className="text-accent font-bold">→</span>
             Go backend for high-throughput data processing
        </li>
        <li className="flex gap-2 text-muted-foreground">
             <span className="text-accent font-bold">→</span>
             TimescaleDB for time-series storage
        </li>
        <li className="flex gap-2 text-muted-foreground">
             <span className="text-accent font-bold">→</span>
             Redis for caching and pub/sub
        </li>
      </ul>

      <div className="mt-8 p-4 border border-border bg-secondary/10 rounded-none">
        <h4 className="font-mono text-sm font-bold mb-2">Performance</h4>
        <p className="text-sm text-muted-foreground font-mono">
            Tested with 10,000+ concurrent connections handling 1M events/second.
        </p>
      </div>

    </article>
  );
}