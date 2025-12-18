import Link from "next/link";
import Image from "next/image";
import { UserPlus, Star } from "lucide-react";

export default function CreatorCard({ creator }) {
  return (
    <Link href={`/profile/${creator.username}`} className="group block h-full">
      <div className="h-full border border-border bg-card p-5 hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(var(--accent),0.1)] transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 border border-border">
                    <Image src={creator.avatar} alt={creator.name} fill className="object-cover" />
                </div>
                <div>
                    <h3 className="font-bold text-sm group-hover:text-accent transition-colors">{creator.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">@{creator.username}</p>
                </div>
            </div>
            {creator.isForHire && (
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" title="Hiring" />
            )}
        </div>

        {/* Mini Portfolio Preview */}
        <div className="grid grid-cols-3 gap-1 mb-4 h-16">
            {creator.topProjects.map((img, i) => (
                <div key={i} className="relative w-full h-full bg-secondary">
                    <Image src={img} alt="work" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
            ))}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-border border-dashed text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1">
                <Star size={10} />
                <span>{creator.stats.likes} Likes</span>
            </div>
            <div className="flex items-center gap-1 text-foreground group-hover:text-accent">
                <UserPlus size={10} />
                <span>Follow</span>
            </div>
        </div>

      </div>
    </Link>
  );
}