// app/(HOME)/blog/_components/BroadcastCarousel.jsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Eye, ShieldAlert, Cpu } from "lucide-react"; 
import { getAvatar } from "@/constants/assets";

export default function BroadcastCarousel({ posts }) {
  const [index, setIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || posts.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % posts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, posts.length]);

  if (!posts || posts.length === 0) return null;
  const current = posts[index];

  return (
    <div 
        className="group relative w-full aspect-[21/9] md:aspect-[3/1] bg-black border border-border overflow-hidden mb-12 shadow-sm"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
        >
            {current.cover_image ? (
                <Image 
                    src={current.cover_image} 
                    alt="" 
                    fill 
                    className="object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000"
                    priority
                />
            ) : (
                /* HIGH-END TECHNICAL BLUEPRINT FALLBACK */
                <div className="absolute inset-0 bg-[#050505]">
                    <div className="absolute inset-0 opacity-[0.07]" 
                        style={{ 
                            backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
                            backgroundSize: '40px 40px' 
                        }} 
                    />
                    <div className="absolute inset-0 opacity-[0.03]" 
                        style={{ 
                            backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
                            backgroundSize: '8px 8px' 
                        }} 
                    />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* HUD OVERLAY */}
      <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between z-20 pointer-events-none">
          <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 bg-accent text-white px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.3em]">
                 <div className="w-1.5 h-1.5 bg-white rounded-full" />
                 Broadcasting_Node
              </div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                 Index: {index + 1} / {posts.length}
              </div>
          </div>

          <div className="max-w-3xl pointer-events-auto">
              <motion.div key={`t-${current.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="flex items-center gap-4 text-[10px] font-mono text-accent uppercase tracking-[0.2em] font-bold">
                      <span className="flex items-center gap-1.5"><Clock size={12}/> {current.reading_time || 5} MIN</span>
                      <span className="text-white/20">|</span>
                      <span className="flex items-center gap-1.5"><Eye size={12}/> {current.views} VIEWS</span>
                  </div>
                  
                  <Link href={`/${current.username}/blog/${current.slug}`}>
                    <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none hover:text-accent transition-all">
                        {current.title}
                    </h2>
                  </Link>

                  <div className="flex items-center gap-4 pt-2">
                      <Link href={`/profile/${current.username}`} className="flex items-center gap-2 group/author">
                          <div className="w-6 h-6 relative bg-zinc-800 border border-white/10 overflow-hidden">
                              <Image src={getAvatar(current)} alt="" fill className="object-cover" />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest group-hover/author:text-accent transition-colors">
                            @{current.username}
                          </span>
                      </Link>
                  </div>
              </motion.div>
          </div>
      </div>

      <div className="absolute bottom-10 right-10 flex items-center gap-2 z-30">
          <button onClick={() => setIndex((prev) => (prev - 1 + posts.length) % posts.length)} className="p-3 border border-white/10 bg-black/40 text-white hover:bg-accent hover:border-accent transition-all"><ChevronLeft size={18} /></button>
          <button onClick={() => setIndex((prev) => (prev + 1) % posts.length)} className="p-3 border border-white/10 bg-black/40 text-white hover:bg-accent hover:border-accent transition-all"><ChevronRight size={18} /></button>
      </div>

      <div className="absolute bottom-0 left-0 h-[2px] bg-secondary/20 w-full z-30">
          <motion.div key={index} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 6, ease: "linear" }} className="h-full bg-accent" />
      </div>
    </div>
  );
}