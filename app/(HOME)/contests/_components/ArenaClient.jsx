"use client";
import { useState } from "react";
import { 
  Zap, Trophy, RefreshCw, Layers, 
  Terminal, Search 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ArenaHero from "./ArenaHero";
import CyberCard from "./CyberCard";
import HallOfFame from "./HallOfFame";
import ContestListModal from "./ContestListModal";

export default function ArenaClient({ initialContests, activeContest, hallOfFame, initialFeed }) {
  const [viewMode, setViewMode] = useState("feed"); 
  const [feed, setFeed] = useState(initialFeed);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Mock Shuffle Logic (In production, this would call an API for random row selection)
  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
        // Simple Fisher-Yates shuffle for demo feel
        const shuffled = [...feed].sort(() => 0.5 - Math.random());
        setFeed(shuffled);
        setIsShuffling(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black pb-20">
        
        {/* TOP: Global Stats Ticker (Visual Flair) */}
        <div className="h-8 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest overflow-hidden">
            <div className="flex gap-4">
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> SYSTEM_ONLINE</span>
                <span>Active_Nodes: {initialContests.length}</span>
                <span>Total_Entries: {feed.length}</span>
            </div>
            <div className="hidden md:block opacity-50">STARK_NET_V2 // THE_ARENA</div>
        </div>

        {/* HERO SECTION */}
        <ArenaHero activeContest={activeContest} />

        {/* MAIN LAYOUT */}
        <div className="container mx-auto px-4 max-w-[1400px] mt-8">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* LEFT: THE FEED (75%) */}
                <div className="lg:w-[75%]">
                    
                    {/* Control Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        
                        {/* Frequency Switcher */}
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1">
                            <button 
                                onClick={() => setViewMode("feed")}
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase transition-all
                                    ${viewMode === 'feed' ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}
                                `}
                            >
                                <Zap size={14} /> Live Feed
                            </button>
                            <button 
                                onClick={() => setIsModalOpen(true)} // Opens Modal instead of switching view
                                className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase text-zinc-500 hover:text-white transition-all"
                            >
                                <Trophy size={14} /> All Competitions
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleShuffle}
                                disabled={isShuffling}
                                className="h-9 px-4 border border-zinc-800 bg-black text-zinc-400 hover:text-accent hover:border-accent/50 text-[10px] font-mono uppercase flex items-center gap-2 transition-all"
                            >
                                <RefreshCw size={12} className={isShuffling ? "animate-spin" : ""} />
                                {isShuffling ? "Rerouting..." : "Randomize Feed"}
                            </button>
                        </div>
                    </div>

                    {/* The Grid */}
                    <motion.div 
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    >
                        <AnimatePresence mode="popLayout">
                            {feed.map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <CyberCard entry={entry} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                    
                    {/* Load More Trigger */}
                    <div className="mt-8 flex justify-center">
                        <button className="text-xs font-mono text-zinc-600 hover:text-white flex items-center gap-2 group">
                            <Terminal size={14} /> 
                            <span className="group-hover:underline decoration-dashed underline-offset-4">Load_Next_Batch()</span>
                        </button>
                    </div>

                </div>

                {/* RIGHT: SIDEBAR (25%) */}
                <div className="lg:w-[25%] space-y-6">
                    <HallOfFame topEntries={hallOfFame} />
                    
                    {/* Ad / Promo Block */}
                    <div className="border border-dashed border-zinc-800 p-6 text-center">
                        <Trophy size={24} className="mx-auto text-zinc-700 mb-2" />
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">
                            Your Project Here?<br/>
                            Join a contest to get featured.
                        </p>
                    </div>
                </div>

            </div>
        </div>

        {/* MODAL: ALL COMPETITIONS */}
        <ContestListModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            contests={initialContests} 
        />

    </div>
  );
}