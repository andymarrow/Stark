"use client";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Eye, Zap, PlayCircle, ChevronRight } from "lucide-react";

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

export default function CyberCard({ entry }) {
  const thumb = getThumbnail(entry.project.thumbnail_url);
  const isVideo = entry.project.thumbnail_url?.includes("youtube") || entry.project.thumbnail_url?.includes("youtu.be");
  
  return (
    <div className="group relative bg-black border border-zinc-800 hover:border-accent hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all duration-300">
      
      {/* Cyber Decor Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-zinc-600 group-hover:border-accent transition-colors z-20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-zinc-600 group-hover:border-accent transition-colors z-20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-zinc-600 group-hover:border-accent transition-colors z-20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-zinc-600 group-hover:border-accent transition-colors z-20" />

      {/* Image Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900 border-b border-zinc-800">
        <Image 
            src={thumb} 
            alt={entry.project.title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20">
                <PlayCircle size={32} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
            </div>
        )}
        
        {/* Contest Tag Overlay */}
        <div className="absolute top-2 left-2 z-10 bg-black/80 border border-zinc-700 px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm group-hover:border-accent/50 transition-colors">
            <Trophy size={10} className="text-yellow-500" />
            <span className="text-[8px] font-mono uppercase text-zinc-300 tracking-wider truncate max-w-[150px]">
                {entry.contest.title}
            </span>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-4 relative">
        {/* Tech Lines */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

        <div className="flex justify-between items-start mb-2">
            <div className="overflow-hidden">
                <Link href={`/project/${entry.project.slug}`} className="block">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-accent transition-colors truncate w-full">
                        {entry.project.title}
                    </h3>
                </Link>
                <Link href={`/profile/${entry.project.owner.username}`} className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors block mt-0.5">
                    @{entry.project.owner.username}
                </Link>
            </div>
            
            {/* Rank Badge (If Winner) */}
            {entry.rank && entry.rank <= 3 && (
                <div className={`px-2 py-1 text-[9px] font-black uppercase border flex-shrink-0
                    ${entry.rank === 1 ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-zinc-500 text-zinc-400'}`}>
                    #{entry.rank}
                </div>
            )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-dashed border-zinc-800">
            <div className="flex gap-3 text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1"><Zap size={10} /> {entry.project.likes_count}</span>
                <span className="flex items-center gap-1"><Eye size={10} /> {entry.project.views}</span>
            </div>
            <Link href={`/project/${entry.project.slug}`}>
                <span className="text-[9px] uppercase font-bold text-zinc-600 group-hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                    Inspect_Node <ChevronRight size={8} />
                </span>
            </Link>
        </div>
      </div>
    </div>
  );
}