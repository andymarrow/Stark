"use client";
import Image from "next/image";
import { CheckCircle, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function JudgeGrid({ entries, onSelectEntry }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {entries.map((entry, idx) => {
        const isComplete = Object.keys(entry.existingScores || {}).length > 0;
        
        // Calculate a quick sum of raw scores for visual feedback
        const totalPoints = Object.values(entry.existingScores || {}).reduce((a, b) => a + b, 0);

        return (
          <motion.div 
            key={entry.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectEntry(entry)}
            className={`
                group relative flex items-center gap-4 p-4 border transition-all cursor-pointer overflow-hidden
                ${isComplete 
                    ? 'bg-secondary/5 border-border' 
                    : 'bg-background border-border hover:border-accent shadow-sm'}
            `}
          >
            {/* Status Indicator (The Left Border) */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isComplete ? 'bg-green-500/50' : 'bg-transparent group-hover:bg-accent'}`} />

            {/* Thumbnail */}
            <div className="relative w-24 aspect-video bg-zinc-900 border border-border flex-shrink-0 overflow-hidden">
                <Image 
                    src={entry.project.thumbnail_url || "/placeholder.jpg"} 
                    alt="p" 
                    fill 
                    className={`object-cover transition-all duration-500 
                        ${isComplete ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} 
                />
                {!isComplete && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-mono text-white bg-accent px-1.5 py-0.5">EVALUATE</span>
                    </div>
                )}
            </div>
            
            {/* Text Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
                    {entry.project.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    {isComplete ? (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-green-500 uppercase flex items-center gap-1 font-bold">
                                <CheckCircle size={10} /> Sync_Complete
                            </span>
                            <span className="text-[9px] text-zinc-600 font-mono">/ {totalPoints} PTS</span>
                        </div>
                    ) : (
                        <span className="text-[9px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                            <Clock size={10} /> Pending_Input
                        </span>
                    )}
                </div>
            </div>

            {/* Right Action Icon */}
            <div className="flex-shrink-0">
                <ChevronRight 
                    size={16} 
                    className={`transition-all duration-300 ${isComplete ? 'text-zinc-700' : 'text-zinc-500 group-hover:text-accent translate-x-0 group-hover:translate-x-1'}`} 
                />
            </div>

            {/* Background Accent Gradient on Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        );
      })}
    </div>
  );
}