import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Star, Users } from "lucide-react";

export default function LeaderboardRow({ item, rank, type }) {
  const isProject = type === "projects";

  return (
    <Link 
        href={isProject ? `/project/${item.slug}` : `/profile/${item.username}`}
        className="flex items-center gap-4 p-4 border border-border bg-background hover:border-accent/50 hover:bg-secondary/5 transition-all group"
    >
        {/* Rank Number */}
        <div className="w-8 text-2xl font-black text-muted-foreground/30 font-mono group-hover:text-accent transition-colors">
            0{rank}
        </div>

        {/* Avatar/Thumb */}
        <div className="relative w-12 h-12 bg-secondary border border-border group-hover:border-accent transition-colors">
            <Image 
                src={isProject ? item.thumbnail : item.avatar} 
                alt="thumb" 
                fill 
                className="object-cover" 
            />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold truncate text-foreground group-hover:text-accent transition-colors">
                {isProject ? item.title : item.name}
            </h4>
            <p className="text-[10px] text-muted-foreground font-mono uppercase truncate">
                {isProject ? item.category : item.role}
            </p>
        </div>

        {/* Velocity Graph (Fake Visual) */}
        <div className="hidden md:flex flex-col items-end gap-1">
            <div className="flex gap-0.5 items-end h-6">
                {[4,6,3,7,5,8,9].map((h, i) => (
                    <div key={i} className="w-1 bg-accent/20 group-hover:bg-accent" style={{ height: `${h * 10}%` }} />
                ))}
            </div>
        </div>

        {/* Main Stat */}
        <div className="w-20 text-right">
            <div className="flex items-center justify-end gap-1 text-xs font-bold font-mono text-foreground">
                {isProject ? item.stats.stars : item.stats.followers}
                {isProject ? <Star size={10} /> : <Users size={10} />}
            </div>
            <div className="flex items-center justify-end gap-1 text-[9px] text-green-500 font-mono">
                <TrendingUp size={8} /> +12%
            </div>
        </div>
    </Link>
  );
}