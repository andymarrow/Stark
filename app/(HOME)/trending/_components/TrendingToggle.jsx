"use client";
import { motion } from "framer-motion";
import { Box, Users } from "lucide-react";

export default function TrendingToggle({ view, setView }) {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="relative flex p-1 bg-secondary/20 border border-border backdrop-blur-sm">
        
        {/* The Sliding Background */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`absolute top-1 bottom-1 ${view === 'projects' ? 'left-1 w-[140px]' : 'left-[148px] w-[140px]'} bg-accent shadow-[0_0_20px_rgba(220,38,38,0.3)]`}
        />

        <button
          onClick={() => setView("projects")}
          className={`relative z-10 w-[140px] h-10 flex items-center justify-center gap-2 text-sm font-mono font-bold uppercase tracking-wider transition-colors ${view === 'projects' ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Box size={16} />
          Projects
        </button>

        <button
          onClick={() => setView("creators")}
          className={`relative z-10 w-[140px] h-10 flex items-center justify-center gap-2 text-sm font-mono font-bold uppercase tracking-wider transition-colors ${view === 'creators' ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users size={16} />
          Creators
        </button>
      </div>
    </div>
  );
}