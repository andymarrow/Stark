"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, ChevronRight, Crown, PlayCircle } from "lucide-react";

// --- THUMBNAIL HELPER ---
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
    <div className="bg-zinc-950 border border-zinc-800 p-0 overflow-hidden w-full">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Crown size={16} className="text-yellow-500" />
                <h3 className="font-black uppercase text-xs tracking-widest text-white">Hall of Fame</h3>
            </div>
            
            {/* Clearer Filter Toggles */}
            <div className="flex bg-black p-0.5 border border-zinc-800 w-fit">
                {[
                    { id: 'week', label: 'Week' },
                    { id: 'month', label: 'Month' },
                    { id: 'all_time', label: 'All Time' }
                ].map(opt => (
                    <button 
                        key={opt.id}
                        onClick={() => setFilter(opt.id)}
                        className={`text-[9px] font-mono uppercase px-3 py-1 transition-colors
                            ${filter === opt.id 
                                ? 'bg-zinc-800 text-white' 
                                : 'text-zinc-500 hover:text-zinc-300'}
                        `}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>

        {/* List */}
        <div className="divide-y divide-zinc-800">
            {topEntries.map((entry, i) => {
                const thumb = getThumbnail(entry.project.thumbnail_url);
                const isVideo = entry.project.thumbnail_url?.includes("youtube") || entry.project.thumbnail_url?.includes("youtu.be");

                return (
                    <Link key={entry.id} href={`/project/${entry.project.slug}`} className="flex items-center gap-3 p-3 hover:bg-zinc-900 transition-colors group">
                        <div className="font-mono text-xs font-bold text-zinc-600 w-4 text-center">{i + 1}</div>
                        
                        <div className="relative w-10 h-10 bg-black border border-zinc-800 group-hover:border-accent flex-shrink-0 overflow-hidden transition-colors">
                            <Image src={thumb} alt="t" fill className="object-cover" /> {/* Removed grayscale */}
                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <PlayCircle size={12} className="text-white opacity-80" />
                                </div>
                            )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold uppercase truncate text-zinc-300 group-hover:text-white transition-colors">{entry.project.title}</div>
                            <div className="text-[9px] font-mono text-zinc-500 truncate">{entry.contest.title}</div>
                        </div>

                        <div className="text-right">
                            <div className="text-[10px] font-mono text-accent font-bold">
                                {entry.final_score ? Number(entry.final_score).toFixed(1) : '-'}
                            </div>
                            <div className="text-[7px] font-mono text-zinc-600 uppercase">Score</div>
                        </div>
                    </Link>
                );
            })}
        </div>

        {/* Footer */}
        <div className="p-2 bg-zinc-900 border-t border-zinc-800 text-center">
            <Link href="/explore?sort=popular">
                <button className="text-[9px] font-mono uppercase text-zinc-500 hover:text-white flex items-center justify-center gap-1 w-full h-8">
                    Browse All Top Rated <ChevronRight size={10} />
                </button>
            </Link>
        </div>
    </div>
  );
}