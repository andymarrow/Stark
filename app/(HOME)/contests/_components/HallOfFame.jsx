"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Crown, PlayCircle } from "lucide-react";

// --- THUMBNAIL HELPER (Fixed Link) ---
const getThumbnail = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1];
        if (videoId) return `https://img.youtube.com/vi/${videoId.split("?")[0]}/mqdefault.jpg`;
    }
    return url;
};

export default function HallOfFame({ topEntries }) {
  const [filter, setFilter] = useState("all_time"); 

  return (
    <div className="bg-card border border-border p-0 overflow-hidden w-full rounded-none">
        
        {/* Header */}
        <div className="p-4 border-b border-border bg-secondary/30 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Crown size={16} className="text-yellow-500" />
                <h3 className="font-black uppercase text-xs tracking-widest text-foreground">Hall of Fame</h3>
            </div>
            
            {/* Filter Toggles - Stark High Contrast Style */}
            <div className="flex bg-background p-0.5 border border-border w-fit">
                {[
                    { id: 'week', label: 'Week' },
                    { id: 'month', label: 'Month' },
                    { id: 'all_time', label: 'All Time' }
                ].map(opt => (
                    <button 
                        key={opt.id}
                        onClick={() => setFilter(opt.id)}
                        className={`text-[9px] font-mono uppercase px-3 py-1 transition-all
                            ${filter === opt.id 
                                ? 'bg-foreground text-background shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'}
                        `}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>

        {/* List */}
        <div className="divide-y divide-border">
            {topEntries.map((entry, i) => {
                const thumb = getThumbnail(entry.project.thumbnail_url);
                const isVideo = entry.project.thumbnail_url?.includes("youtube") || entry.project.thumbnail_url?.includes("youtu.be");

                return (
                    <Link 
                        key={entry.id} 
                        href={`/project/${entry.project.slug}`} 
                        className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors group relative"
                    >
                        {/* Rank indicator with hover accent */}
                        <div className="font-mono text-xs font-bold text-muted-foreground w-4 text-center group-hover:text-accent transition-colors">
                            {(i + 1).toString().padStart(2, '0')}
                        </div>
                        
                        {/* Thumbnail: Grayscale to Color effect for clinical look */}
                        <div className="relative w-10 h-10 bg-secondary border border-border group-hover:border-accent flex-shrink-0 overflow-hidden transition-all duration-300">
                            <Image 
                                src={thumb} 
                                alt="t" 
                                fill 
                                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                            />
                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <PlayCircle size={12} className="text-white opacity-80" />
                                </div>
                            )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold uppercase truncate text-foreground group-hover:text-accent transition-colors">
                                {entry.project.title}
                            </div>
                            <div className="text-[9px] font-mono text-muted-foreground truncate uppercase tracking-tighter">
                                {entry.contest.title}
                            </div>
                        </div>

                        {/* High Signal Score Visual */}
                        <div className="text-right border-l border-border pl-3 ml-2">
                            <div className="text-[10px] font-mono text-accent font-black">
                                {entry.final_score ? Number(entry.final_score).toFixed(1) : '-'}
                            </div>
                            <div className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest">
                                Score
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>

        {/* Footer */}
        {/* <div className="p-2 bg-secondary/10 border-t border-border text-center">
            <Link href="/explore?sort=popular">
                <button className="text-[9px] font-mono uppercase text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 w-full h-8 transition-colors">
                    Retrieve_Historical_Data <ChevronRight size={10} />
                </button>
            </Link>
        </div> */}
    </div>
  );
}