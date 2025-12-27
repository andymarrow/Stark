import Link from "next/link";
import Image from "next/image";
import { Eye, Star, Users } from "lucide-react"; // Added Eye icon
import { getSmartThumbnail } from "@/lib/mediaUtils";

export default function LeaderboardRow({ item, rank, type }) {
  const isProject = type === "projects";
  
  // Use Helper
  const rawImage = isProject ? item.thumbnail : item.avatar;
  const imageSrc = getSmartThumbnail(rawImage);

  // Helper for 1.2k, 1m notation
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <Link 
        href={isProject ? `/project/${item.slug}` : `/profile/${item.username}`}
        className="flex items-center gap-4 p-4 border border-border bg-background hover:border-accent/50 hover:bg-secondary/5 transition-all group"
    >
        {/* Rank Number */}
        <div className="w-8 text-2xl font-black text-muted-foreground/30 font-mono group-hover:text-accent transition-colors">
            0{rank}
        </div>

        {/* Thumbnail / Avatar */}
        <div className="relative w-12 h-12 bg-secondary border border-border group-hover:border-accent transition-colors">
            <Image 
                src={imageSrc} 
                alt="thumb" 
                fill 
                className="object-cover" 
            />
        </div>

        {/* Title & Info */}
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold truncate text-foreground group-hover:text-accent transition-colors">
                {isProject ? item.title : item.name}
            </h4>
            <p className="text-[10px] text-muted-foreground font-mono uppercase truncate">
                {isProject ? item.category : item.role}
            </p>
        </div>

        {/* Activity Bar (Visual Decor) */}
        <div className="hidden md:flex flex-col items-end gap-1">
            <div className="flex gap-0.5 items-end h-6">
                {[4,6,3,7,5,8,9].map((h, i) => (
                    <div key={i} className="w-1 bg-accent/20 group-hover:bg-accent" style={{ height: `${h * 10}%` }} />
                ))}
            </div>
        </div>

        {/* Stats Column */}
        <div className="w-20 text-right flex flex-col items-end gap-1">
            
            {/* Primary Metric: Stars (Projects) or Likes (Creators) */}
            <div className="flex items-center justify-end gap-1 text-xs font-bold font-mono text-foreground" title="Stars/Likes">
                {formatNumber(isProject ? item.stats.stars : item.stats.likes)}
                <Star size={10} className={isProject ? "fill-current text-accent" : "text-foreground"} />
            </div>

            {/* Secondary Metric: Views (Projects) or Followers (Creators) */}
            <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground font-mono group-hover:text-foreground transition-colors" title={isProject ? "Total Views" : "Followers"}>
                {formatNumber(isProject ? item.stats.views : item.stats.followers)}
                {isProject ? <Eye size={10} /> : <Users size={10} />}
            </div>

        </div>
    </Link>
  );
}