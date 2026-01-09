"use client";
import Link from "next/link";
import { Users, Clock, Flame } from "lucide-react"; // Added Flame

export default function ArenaHero({ activeContest }) {
  if (!activeContest) return null;

  return (
    <div className="relative w-full h-[300px] border-b border-border overflow-hidden group">
        {/* Background Image */}
        <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 opacity-40"
            style={{ backgroundImage: `url(${activeContest.cover_image || '/placeholder.jpg'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 max-w-4xl">
            <div className="inline-flex items-center gap-2 border border-green-500/30 bg-green-500/10 px-3 py-1 w-fit mb-4">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono uppercase text-green-400 tracking-widest font-bold">Featured Battle</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-2 leading-none">
                {activeContest.title}
            </h2>
            
            <div className="flex items-center gap-6 text-xs font-mono text-zinc-400 mt-2">
                 <span className="flex items-center gap-2" title="Total Entries">
                    <Users size={14} className="text-zinc-500" /> {activeContest.participant_count} Contenders
                 </span>
                 <span className="flex items-center gap-2" title="Hype Score (Total Likes)">
                    <Flame size={14} className="text-orange-500" /> {activeContest.hype_score} Hype
                 </span>
                 <span className="flex items-center gap-2" title="Time Remaining">
                    <Clock size={14} className="text-zinc-500" /> 
                    {activeContest.days_left > 0 ? `Ends in ${activeContest.days_left} Days` : "Final Stages"}
                 </span>
            </div>

            <div className="mt-8">
                <Link href={`/contests/${activeContest.slug}`}>
                    <button className="h-12 px-8 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-accent hover:text-white transition-all skew-x-[-10deg]">
                        <span className="skew-x-[10deg] inline-block">Enter The Arena</span>
                    </button>
                </Link>
            </div>
        </div>
    </div>
  );
}