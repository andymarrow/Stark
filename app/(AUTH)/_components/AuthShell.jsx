// app/(AUTH)/_components/AuthShell.jsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "next-themes";

export default function AuthShell({ children, title, subtitle }) {
  const [nodeCount, setNodeCount] = useState(null);
  
  // Theme State
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // --- INIT MOUNT & FETCH REAL USER COUNT ---
  useEffect(() => {
    setMounted(true);

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        setNodeCount(count);
      }
    };
    fetchCount();
  }, []);

  // Determine image based on theme dynamically
  // We default to dark mode fallback to prevent blinding flashes before hydration
  const currentImage = mounted && resolvedTheme === "light" 
    ? "/loginwhitestark.png" 
    : "/logindarkstark.png";

  return (
    <div className="min-h-screen w-full flex bg-background">
      
      {/* 1. LEFT: The Visual (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-950 overflow-hidden items-center justify-center border-r border-border">
        
        {/* Base Grid (Shows for a split second while "booting" the image) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Dynamic Image Injection with Crossfade */}
        <div className="absolute inset-0 ">
            <AnimatePresence mode="wait">
                {mounted && (
                    <motion.div
                        key={currentImage} // Changing the key forces React to unmount the old image and mount the new one
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute inset-0"
                    >
                        <Image 
                            src={currentImage} 
                            alt="Stark Core Interface" 
                            fill 
                            className="object-cover"
                            priority
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Technical Overlays (Maintains the Stark aesthetic over the image) */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/60 to-zinc-50/90 dark:from-black dark:via-black/40 dark:to-black/80 pointer-events-none" />

        {/* Content Layer */}
        <div className="relative z-10 p-12 w-full max-w-xl">
            <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-10 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 text-accent">
                    <Terminal size={32} />
                    <span className="font-mono font-bold tracking-widest text-sm uppercase">STARK_NET_V2.4</span>
                </div>
                
                <h1 className="text-5xl font-black tracking-tighter mb-6 leading-tight text-zinc-900 dark:text-white drop-shadow-sm uppercase">
                    Build the future. <br/>
                    <span className="text-zinc-400 dark:text-white/60">Share the code.</span>
                </h1>
                
                <div className="space-y-4 font-mono text-xs text-zinc-600 dark:text-white/80">
                    <div className="flex justify-between border-b border-zinc-300 dark:border-white/10 pb-2">
                        <span className="uppercase tracking-widest">System_Status</span>
                        <span className="text-green-600 dark:text-green-500 font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> OPERATIONAL
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-300 dark:border-white/10 pb-2">
                        <span className="uppercase tracking-widest">Active_Nodes</span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                            {nodeCount !== null ? `${nodeCount.toLocaleString()} CREATORS` : "CALCULATING..."}
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-300 dark:border-white/10 pb-2">
                        <span className="uppercase tracking-widest">Encryption</span>
                        <span className="text-zinc-900 dark:text-white">AES-256</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 2. RIGHT: The Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-0 relative z-20">
        <div className="flex-1 flex flex-col lg:justify-center lg:items-center">
            
            <div className="w-full lg:hidden mb-12 flex justify-center">
                <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center font-bold font-mono text-xl shadow-lg border border-border">
                    S
                </div>
            </div>

            <div className="w-full max-w-md space-y-8 m-auto lg:m-0">
                <div className="space-y-2 text-center lg:text-left">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">{subtitle}</p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-secondary/5 border border-border p-6 md:p-8 shadow-2xl"
                >
                    {children}
                </motion.div>

                <div className="pt-8 text-center">
                    <Link href="/" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent font-mono transition-colors">
                        ← Return to Public Access
                    </Link>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}