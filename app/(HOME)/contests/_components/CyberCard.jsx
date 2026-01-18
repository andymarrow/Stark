"use client";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Eye, Zap, PlayCircle, ChevronRight } from "lucide-react";

export default function CyberCard({ entry }) {
  // Thumbnail logic for YouTube and standard images
  const getThumbnail = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        if (videoId) return `https://img.youtube.com/vi/${videoId.split("?")[0]}/mqdefault.jpg`;
    }
    return url;
  };

  const thumb = getThumbnail(entry.project.thumbnail_url);
  const isVideo = entry.project.thumbnail_url?.includes("youtube") || entry.project.thumbnail_url?.includes("youtu.be");
  
  return (
    <div className="group relative bg-card border border-border hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(255,0,0,0.1)] transition-all duration-300 rounded-none overflow-hidden">
      
      {/* Visual Decor Corners - They turn Red on hover */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-border group-hover:border-accent transition-colors z-20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-border group-hover:border-accent transition-colors z-20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-border group-hover:border-accent transition-colors z-20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-border group-hover:border-accent transition-colors z-20" />

      {/* Image Area - Grayscale REMOVED, Colors always active */}
      <div className="relative aspect-video w-full overflow-hidden bg-secondary border-b border-border">
        <Image 
            src={thumb} 
            alt={entry.project.title} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105" 
            sizes="(max-width: 768px) 100vw, 33vw"
        />
        
        {/* Video Overlay */}
        {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/10">
                <PlayCircle size={32} className="text-white opacity-90 group-hover:scale-110 transition-transform" />
            </div>
        )}
        
        {/* Floating Contest Label */}
        <div className="absolute top-2 left-2 z-10 bg-background/90 border border-border px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm group-hover:border-accent/50 transition-colors">
            <Trophy size={10} className="text-yellow-500" />
            <span className="text-[8px] font-mono uppercase text-foreground tracking-widest truncate max-w-[150px]">
                {entry.contest.title}
            </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 relative">
        {/* Animated Tech Line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

        <div className="flex justify-between items-start mb-2">
            <div className="overflow-hidden flex-1 mr-2">
                <Link href={`/project/${entry.project.slug}`} className="block">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground group-hover:text-accent transition-colors truncate w-full">
                        {entry.project.title}
                    </h3>
                </Link>
                <Link href={`/profile/${entry.project.owner.username}`} className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors block mt-0.5">
                    @{entry.project.owner.username}
                </Link>
            </div>
            
            {/* Prize/Rank Badge */}
            {entry.rank && entry.rank <= 3 && (
                <div className={`px-2 py-1 text-[9px] font-black uppercase border flex-shrink-0
                    ${entry.rank === 1 ? 'border-yellow-500 text-yellow-600 bg-yellow-500/10' : 'border-border text-muted-foreground'}`}>
                    #{entry.rank}
                </div>
            )}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-dashed border-border">
            <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><Zap size={10} className="text-accent" /> {entry.project.likes_count}</span>
                <span className="flex items-center gap-1"><Eye size={10} /> {entry.project.views}</span>
            </div>
            
            <Link href={`/project/${entry.project.slug}`} className="group/btn">
                <span className="text-[9px] uppercase font-bold text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer flex items-center gap-1">
                    INSPECT_NODE <ChevronRight size={8} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </span>
            </Link>
        </div>
      </div>
    </div>
  );
}