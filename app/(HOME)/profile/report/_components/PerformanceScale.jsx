"use client";
import { motion } from "framer-motion";

export default function PerformanceScale({ percentile }) {
  // A percentile of 0 means they are #1. A percentile of 90 means 90% are better.
  // We flip it for the visual: 100% = Top Rank.
  const visualPos = 100 - percentile;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Sector_Standing</span>
            <h4 className="text-xl font-bold uppercase italic">
                {percentile <= 5 ? "ELITE_NODE" : percentile <= 20 ? "HIGH_VELOCITY" : "ACTIVE_OPERATOR"}
            </h4>
        </div>
        <div className="text-right">
            <span className="text-2xl font-black text-accent">{visualPos.toFixed(0)}%</span>
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">RANK_PROXIMITY</span>
        </div>
      </div>

      <div className="relative h-12 border border-border bg-secondary/5 overflow-hidden flex items-center px-4">
        {/* The Track */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_98%,rgba(255,255,255,0.1)_98%)] bg-[size:10%_100%] pointer-events-none" />
        
        {/* The Slider */}
        <div className="w-full h-1 bg-zinc-800 relative">
            <motion.div 
                initial={{ left: 0 }}
                animate={{ left: `${visualPos}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-accent border-2 border-background shadow-[0_0_15px_rgba(255,0,0,0.5)] rotate-45"
            />
            {/* Average Marker */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 flex flex-col items-center">
                <div className="w-px h-2 bg-zinc-600" />
                <span className="text-[8px] font-mono text-zinc-600 uppercase">SYS_AVG</span>
            </div>
        </div>
      </div>
      
      <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
         Analysis: Your node velocity is currently higher than <span className="text-foreground font-bold">{visualPos.toFixed(0)}%</span> of active creators in the network.
      </p>
    </div>
  );
}