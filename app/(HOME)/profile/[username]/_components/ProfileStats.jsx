export default function ProfileStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border border-border divide-x divide-border bg-background">
      <StatItem label="Projects" value={stats.projects} />
      <StatItem label="Followers" value={stats.followers} />
      <StatItem label="Following" value={stats.following} />
      <StatItem label="Total Likes" value={stats.likes} highlight />
    </div>
  );
}

function StatItem({ label, value, highlight }) {
  return (
    <div className="p-5 flex flex-col items-center justify-center hover:bg-secondary/10 transition-colors group cursor-default">
      <span className={`text-3xl font-bold font-mono ${highlight ? 'text-accent' : 'text-foreground'}`}>
        {formatNumber(value)}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors mt-2">
        {label}
      </span>
    </div>
  );
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
}