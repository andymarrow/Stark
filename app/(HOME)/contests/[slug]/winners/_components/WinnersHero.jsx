"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Medal, PlayCircle, User, Trophy, Sparkles } from "lucide-react";

// YouTube Thumbnail Helper (Logic preserved, slight syntax fix for string interpolation to ensure image renders)
const getThumbnail = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1];
        
        // Fixed syntax to ensure UI renders the image correctly
        if (videoId) return `https://img.youtube.com/vi/${videoId.split("?")[0]}/mqdefault.jpg`;
    }
    return url;
};

export default function WinnersHero({ contest, winners }) {
  if (winners.length === 0) return null;

  // Ordering for visual podium: [2nd, 1st, 3rd]
  const podium = [winners[1], winners[0], winners[2]].filter(Boolean);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-[#050505] ">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-24 space-y-2">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex items-center justify-center gap-2 text-xs font-mono text-accent/80 uppercase tracking-[0.4em] font-bold"
            >
                <Sparkles size={12} />
                <span>Final_Resolution_Revealed</span>
                <Sparkles size={12} />
            </motion.div>
            <motion.h1 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl"
            >
                {contest.title}
            </motion.h1>
        </div>

        <div className="flex flex-col md:flex-row items-end justify-center gap-12 md:gap-6 max-w-7xl mx-auto pb-12">
            {podium.map((winner, i) => {
                const isFirst = winner.id === winners[0].id;
                const isSecond = winner.id === winners[1]?.id;
                const rank = isFirst ? 1 : isSecond ? 2 : 3;
                const thumb = getThumbnail(winner.project.thumbnail_url);
                const isVideo = winner.project.thumbnail_url?.includes("youtube");

                // Dynamic Styling based on Rank
                const rankStyles = {
                    1: {
                        color: "text-yellow-400",
                        border: "border-yellow-500/50",
                        glow: "shadow-yellow-500/20",
                        gradient: "from-yellow-500/20 to-black",
                        badge: "bg-yellow-400 text-black"
                    },
                    2: {
                        color: "text-zinc-300",
                        border: "border-zinc-400/50",
                        glow: "shadow-zinc-500/20",
                        gradient: "from-zinc-400/20 to-black",
                        badge: "bg-zinc-300 text-black"
                    },
                    3: {
                        color: "text-orange-700",
                        border: "border-orange-800/50",
                        glow: "shadow-orange-900/20",
                        gradient: "from-orange-800/20 to-black",
                        badge: "bg-orange-800 text-white"
                    }
                }[rank];

                return (
                    <motion.div 
                        key={winner.id}
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15, duration: 0.8, type: "spring", bounce: 0.4 }}
                        className={`relative w-full md:w-1/3 flex flex-col items-center group ${isFirst ? 'z-20 md:-mt-12 scale-110' : 'z-10'}`}
                    >
                        {/* THE CARD */}
                        <div className="relative w-full max-w-[340px] perspective-1000">
                            
                            {/* Floating Rank Badge */}
                            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center`}>
                                <div className={`px-4 py-1 font-black text-xs uppercase tracking-widest ${rankStyles.badge} clip-path-badge shadow-lg`}>
                                    {rank === 1 ? 'Champion' : rank === 2 ? 'Runner Up' : 'Finalist'}
                                </div>
                                <div className={`w-0.5 h-6 ${rankStyles.badge.split(' ')[0]}`}></div>
                            </div>

                            {/* Main Card Chassis */}
                            <motion.div 
                                whileHover={{ y: -10 }}
                                className={`relative bg-zinc-950 border ${rankStyles.border} backdrop-blur-sm overflow-hidden`}
                                style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
                            >
                                {/* Background Glow */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${rankStyles.gradient} opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500`} />

                                {/* Image Section */}
                                <div className="relative aspect-video w-full overflow-hidden border-b border-white/5">
                                    <Image 
                                        src={thumb} 
                                        alt="winner" 
                                        fill 
                                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                                    
                                    {isVideo && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className={`p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform ${rankStyles.color}`}>
                                                <PlayCircle size={32} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Content Section */}
                                <div className="p-6 relative">
                                    {/* Decorative Lines */}
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10" />

                                    <h3 className="font-black uppercase text-lg leading-tight truncate text-white mb-2 group-hover:text-accent transition-colors">
                                        {winner.project.title}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between mb-6">
                                        <p className="text-xs font-mono text-zinc-400 uppercase flex items-center gap-2">
                                            <span className={`p-1 rounded bg-white/5 ${rankStyles.color}`}><User size={12} /></span>
                                            {winner.project.owner.username}
                                        </p>
                                        <Trophy size={14} className={rankStyles.color} />
                                    </div>

                                    <Link href={`/project/${winner.project.slug}`} className="block">
                                        <button className={`w-full relative h-10 overflow-hidden bg-white/5 border border-white/10 hover:border-accent/50 group/btn transition-all`}>
                                            <div className={`absolute inset-0 w-0 bg-accent transition-all duration-300 group-hover/btn:w-full opacity-20`} />
                                            <span className="relative z-10 font-black uppercase text-[10px] tracking-[0.2em] text-white group-hover/btn:text-accent-foreground flex items-center justify-center gap-2">
                                                Inspect_Source <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity">→</span>
                                            </span>
                                        </button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>

                        {/* THE PEDESTAL (Holographic/Tech Style) */}
                        <div className={`w-full max-w-[300px] flex flex-col items-center justify-start relative mt-4
                            ${rank === 1 ? 'h-40' : rank === 2 ? 'h-24' : 'h-16'}`}>
                            
                            {/* Energy Beam */}
                            <div className={`absolute inset-x-4 top-0 bottom-0 bg-gradient-to-b ${rankStyles.gradient} to-transparent opacity-30`} 
                                 style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)" }}
                            />
                            
                            {/* Grid Lines */}
                            <div className="absolute inset-0 w-full h-full opacity-20" 
                                style={{ 
                                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)", 
                                    backgroundSize: "20px 20px",
                                    maskImage: "linear-gradient(to bottom, black, transparent)"
                                }}
                            />

                            {/* Rank Number */}
                            <div className="relative z-10 flex flex-col items-center mt-2">
                                <span className={`font-black text-6xl leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-transparent opacity-50`}>
                                    {rank}
                                </span>
                            </div>
                            
                            {/* Floor Glow */}
                            <div className={`absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-${rank === 1 ? 'yellow' : rank === 2 ? 'zinc' : 'orange'}-500 to-transparent blur-sm`} />
                        </div>
                    </motion.div>
                );
            })}
        </div>
      </div>

      <style jsx global>{`
        .clip-path-badge {
            clip-path: polygon(10% 0, 100% 0, 100% 100%, 90% 100%, 0% 100%, 0% 0%);
        }
      `}</style>
    </section>
  );
}