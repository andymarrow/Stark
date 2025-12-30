"use client";
import Link from "next/link";
import { Flame, ArrowUpRight, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function ExploreTrendingBanner() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 group"
    >
      <Link href="/trending">
        <div className="relative overflow-hidden border border-accent/30 bg-accent/5 p-4 md:p-6 transition-all duration-300 hover:border-accent hover:bg-accent/10 hover:shadow-[0_0_20px_rgba(220,38,38,0.1)]">
          
          {/* Background Visual: Animated Waveform */}
          <div className="absolute top-0 right-0 h-full w-1/2 pointer-events-none opacity-20">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(220,38,38,0.2),transparent_70%)]" />
             <Activity className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-64 h-64 text-accent/20 rotate-12" />
          </div>

          <div className="flex flex-row items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Icon Box */}
              <div className="w-12 h-12 bg-accent text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-active:shadow-none group-active:translate-x-1 group-active:translate-y-1 transition-all">
                <Flame size={24} className="animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-accent text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-widest animate-bounce">
                        Live
                    </span>
                    <h3 className="text-sm md:text-lg font-bold font-mono uppercase tracking-tight text-foreground">
                        Global_Hype_Index
                    </h3>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-tighter truncate max-w-[200px] md:max-w-none">
                    // Top projects and creators trending worldwide
                </p>
              </div>
            </div>

            {/* Action Cta */}
            <div className="flex items-center gap-2 text-accent font-mono text-[10px] md:text-xs font-bold uppercase">
               <span className="hidden sm:inline">Enter_Leaderboard</span>
               <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Bottom Scanner Line */}
          <div className="absolute bottom-0 left-0 h-[1px] bg-accent/50 w-full">
            <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}