"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, ArrowUpRight, Trophy, PlayCircle } from "lucide-react";
import { getSmartThumbnail, isVideoUrl } from "@/lib/mediaUtils"; // Import

export default function TrendingHero({ item, type }) {
  const isProject = type === "projects";
  
  // Handle Thumbnail Logic
  const rawImage = isProject ? item.thumbnail : item.coverImage;
  const imageSrc = getSmartThumbnail(rawImage);
  const isVideo = isProject && isVideoUrl(rawImage);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-secondary/5 border border-border overflow-hidden group mb-8"
    >
        {/* 1. Background Image */}
        <div className="absolute inset-0">
            <Image 
                src={imageSrc} // Use smart src
                alt="Background" 
                fill 
                className="object-cover opacity-40 blur-sm scale-105 group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>

        {/* 2. Content */}
        <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center items-start z-10">
            
            <div className="flex items-center gap-2 bg-accent text-white px-3 py-1 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {isVideo ? <PlayCircle size={14} /> : <Trophy size={14} />}
                <span className="text-xs font-mono font-bold uppercase tracking-widest">
                    #1 Trending {isProject ? "Project" : "Creator"}
                </span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground mb-4 uppercase">
                {isProject ? item.title : item.name}
            </h2>
            
            <p className="text-muted-foreground text-lg max-w-xl line-clamp-2 mb-8 font-light">
                {isProject ? item.description : item.bio}
            </p>

            {/* Actions & Stats */}
            <div className="flex items-center gap-8">
                <Link href={isProject ? `/project/${item.slug}` : `/profile/${item.username}`}>
                    <button className="h-12 px-8 bg-foreground hover:bg-accent text-background hover:text-white font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors">
                        View Details <ArrowUpRight size={16} />
                    </button>
                </Link>

                <div className="flex items-center gap-6 text-sm font-mono border-l border-border pl-8">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-[10px] uppercase">Hype Score</span>
                        <div className="flex items-center gap-1 text-accent font-bold">
                            <Flame size={14} /> 99.8
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-[10px] uppercase">{isProject ? "Stars" : "Followers"}</span>
                        <div className="text-foreground font-bold">
                            {isProject ? item.stats.stars : item.stats.followers}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. Decorative "1" */}
        <div className="absolute -right-10 -bottom-20 text-[300px] font-black text-foreground/5 select-none pointer-events-none leading-none">
            1
        </div>
    </motion.div>
  );
}