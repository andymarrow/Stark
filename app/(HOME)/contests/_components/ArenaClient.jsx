"use client";
import { useState } from "react";
import { Zap, Trophy, RefreshCw, Layers, Terminal, Grid, List, Plus, Swords, AlertCircle, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import ArenaHero from "./ArenaHero";
import CyberCard from "./CyberCard";
import HallOfFame from "./HallOfFame";
import ArenaFeed from "./ArenaFeed"; 
import ContestListModal from "./ContestListModal";

export default function ArenaClient({ initialContests, activeContest, hallOfFame, initialFeed }) {
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'feed'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feed, setFeed] = useState(initialFeed);
  const [isShuffling, setIsShuffling] = useState(false);

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
        setFeed([...feed].sort(() => 0.5 - Math.random()));
        setIsShuffling(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black pb-20">
        <ArenaHero activeContest={activeContest} />

        <div className="container mx-auto px-4 max-w-[1400px] mt-8">
            <div className="flex flex-col lg:flex-row gap-8">
                
                <div className="lg:w-[75%]">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-zinc-900 pb-6">
                        
                        {/* MODE SWITCHER */}
                        <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1">
                            <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-6 py-2 text-xs font-mono uppercase transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                <Grid size={14} /> GRID
                            </button>
                            <button onClick={() => setViewMode('feed')} className={`flex items-center gap-2 px-6 py-2 text-xs font-mono uppercase transition-all ${viewMode === 'feed' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                <List size={14} /> FEED
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            
                            {viewMode === 'grid' && (
                                <button onClick={handleShuffle} disabled={isShuffling} className="h-10 px-4 border border-zinc-800 bg-zinc-950 text-[10px] font-mono uppercase flex items-center gap-2 text-zinc-400 hover:text-accent transition-all">
                                    <RefreshCw size={12} className={isShuffling ? "animate-spin" : ""} /> Randomize
                                </button>
                            )}
                            <button onClick={() => setIsModalOpen(true)} className="h-10 px-6 bg-zinc-950 border border-zinc-800 text-white text-[10px] font-mono uppercase hover:border-accent transition-all">
                                <Trophy size={14} className="inline mr-2 text-accent" /> All Contests
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {viewMode === 'grid' ? (
                            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {feed.map((entry) => <CyberCard key={entry.id} entry={entry} />)}
                            </motion.div>
                        ) : (
                            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <ArenaFeed />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* SIDEBAR */}
                <div className="lg:w-[25%] space-y-6">
                    {/* ENHANCED HOST EVENT CARD */}
                    <Link href="/contests/create" className="block group relative">
                        {/* Outer Glow Effect */}
                        <div className="absolute -inset-0.5 bg-accent opacity-20 group-hover:opacity-50 blur transition duration-500"></div>
                        
                        <div className="relative overflow-hidden bg-zinc-950 text-white p-6 border border-accent transition-all">
                            {/* Animated Scanline */}
                            <motion.div 
                                animate={{ top: ["-100%", "200%"] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-accent/10 to-transparent pointer-events-none"
                            />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-accent text-white">
                                        <Swords size={20} />
                                    </div>
                                    
                                </div>

                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1 group-hover:text-accent transition-colors">
                                    Host Event
                                </h3>
                                <p className="text-[10px] font-mono text-zinc-400 uppercase leading-relaxed mb-6">
                                    Initialize a new arena protocol and invite challengers.
                                </p>

                                <div className="flex items-center justify-between py-2 border-t border-zinc-900">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Auth_Level: 01</span>
                                    <div className="flex items-center gap-1 text-accent text-[10px] font-bold font-mono">
                                        INITIATE <Plus size={12} />
                                    </div>
                                </div>
                            </div>

                            {/* Background Tech Icon */}
                            <Cpu size={80} className="absolute -bottom-4 -right-4 p-4 text-zinc-900 opacity-20 group-hover:text-accent/20 transition-colors" />
                        </div>
                    </Link>

                    <HallOfFame topEntries={hallOfFame} />
                </div>
            </div>
        </div>

        <ContestListModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} contests={initialContests} />
    </div>
  );
}