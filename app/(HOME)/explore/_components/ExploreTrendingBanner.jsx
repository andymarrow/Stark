"use client";
import Link from "next/link";
import { Flame, ArrowUpRight, Activity, Trophy, Clock, Terminal, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function ExploreTrendingBanner() {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* 1. TRENDING BANNER (Left - Red) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="group h-full"
      >
        <Link href="/trending" className="block h-full">
          <div className="relative h-full overflow-hidden border border-accent/30 bg-accent/5 p-4 transition-all duration-300 hover:border-accent hover:bg-accent/10 hover:shadow-[0_0_20px_rgba(220,38,38,0.1)] flex flex-col justify-between">
            
            {/* Background Visual */}
            <div className="absolute top-0 right-0 h-full w-1/2 pointer-events-none opacity-20">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(220,38,38,0.2),transparent_70%)]" />
               <Activity className="absolute right-[-20%] top-1/2 -translate-y-1/2 w-48 h-48 text-accent/20 rotate-12" />
            </div>

            <div className="flex items-start justify-between relative z-10">
                <div className="w-10 h-10 bg-accent text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-active:shadow-none group-active:translate-x-1 group-active:translate-y-1 transition-all">
                  <Flame size={20} className="animate-pulse" />
                </div>
                <div className="flex items-center gap-1 text-accent font-mono text-[9px] font-bold uppercase">
                   <span className="hidden sm:inline">Leaderboard</span>
                   <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
            </div>

            <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-accent text-white text-[7px] font-bold px-1.5 py-0.5 uppercase tracking-widest animate-bounce">
                        Live
                    </span>
                    <h3 className="text-sm md:text-lg font-bold font-mono uppercase tracking-tight text-foreground">
                        Global Hype
                    </h3>
                </div>
                <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">
                    // Top ranking projects & creators
                </p>
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

      {/* 2. CONTEST BANNER (Middle - Yellow) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="group h-full"
      >
        <Link href="/contests" className="block h-full">
          <div className="relative h-full overflow-hidden border border-yellow-500/30 bg-yellow-500/5 p-4 transition-all duration-300 hover:border-yellow-500 hover:bg-yellow-500/10 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] flex flex-col justify-between">
            
            {/* Background Visual */}
            <div className="absolute top-0 right-0 h-full w-1/2 pointer-events-none opacity-20">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(234,179,8,0.2),transparent_70%)]" />
               <Trophy className="absolute right-[-20%] top-1/2 -translate-y-1/2 w-48 h-48 text-yellow-500/20 -rotate-12" />
            </div>

            <div className="flex items-start justify-between relative z-10">
                <div className="w-10 h-10 bg-yellow-500 text-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-active:shadow-none group-active:translate-x-1 group-active:translate-y-1 transition-all">
                  <Trophy size={20} />
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-mono text-[9px] font-bold uppercase">
                   <span className="hidden sm:inline">The Arena</span>
                   <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
            </div>

            <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-yellow-500 text-black text-[7px] font-bold px-1.5 py-0.5 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={8} /> Active
                    </span>
                    <h3 className="text-sm md:text-lg font-bold font-mono uppercase tracking-tight text-foreground">
                        Hackathons
                    </h3>
                </div>
                <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">
                    // Compete for prizes & glory
                </p>
            </div>
            
            {/* Bottom Scanner Line */}
            <div className="absolute bottom-0 left-0 h-[1px] bg-yellow-500/50 w-full">
              <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 1 }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
              />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* 3. BLOG / NETWORK INTEL BANNER (Right - Blue) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="group h-full"
      >
        <Link href="/blog" className="block h-full">
          <div className="relative h-full overflow-hidden border border-blue-500/30 bg-blue-500/5 p-4 transition-all duration-300 hover:border-blue-500 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] flex flex-col justify-between">
            
            {/* Background Visual */}
            <div className="absolute top-0 right-0 h-full w-1/2 pointer-events-none opacity-20">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(59,130,246,0.2),transparent_70%)]" />
               <Terminal className="absolute right-[-20%] top-1/2 -translate-y-1/2 w-48 h-48 text-blue-500/20 rotate-12" />
            </div>

            <div className="flex items-start justify-between relative z-10">
                <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-active:shadow-none group-active:translate-x-1 group-active:translate-y-1 transition-all">
                  <Globe size={20} />
                </div>
                <div className="flex items-center gap-1 text-blue-500 font-mono text-[9px] font-bold uppercase">
                   <span className="hidden sm:inline">Intel_Log</span>
                   <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
            </div>

            <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-500 text-white text-[7px] font-bold px-1.5 py-0.5 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> Signal
                    </span>
                    <h3 className="text-sm md:text-lg font-bold font-mono uppercase tracking-tight text-foreground">
                        Network Blogs
                    </h3>
                </div>
                <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">
                    // Engineering reports & guides
                </p>
            </div>
            
            {/* Bottom Scanner Line */}
            <div className="absolute bottom-0 left-0 h-[1px] bg-blue-500/50 w-full">
              <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "linear", delay: 0.5 }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
            </div>
          </div>
        </Link>
      </motion.div>

    </div>
  );
}