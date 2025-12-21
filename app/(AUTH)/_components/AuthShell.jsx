"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Terminal } from "lucide-react";

export default function AuthShell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen w-full flex">
      
      {/* 1. LEFT: The Visual (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-50 dark:bg-black overflow-hidden items-center justify-center border-r border-border">
        
        {/* Background Image */}
        <div className="absolute inset-0 opacity-40 dark:opacity-50">
            <Image 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop" 
                alt="System Core" 
                fill 
                className="object-cover grayscale hover:grayscale-0 transition-all duration-[2s]"
                priority
            />
        </div>

        {/* Technical Overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(0,0,0,0.05)_2px,transparent_2px)] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.05)_2px,transparent_2px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-zinc-50 via-zinc-50/60 to-zinc-50/90 dark:from-black dark:via-black/40 dark:to-black/80" />

        {/* Content Layer */}
        <div className="relative z-10 p-12 w-full max-w-xl">
            <div className="bg-white/60 dark:bg-black/20 backdrop-blur-md border border-zinc-200 dark:border-white/5 p-10 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-3 mb-6 text-accent">
                    <Terminal size={32} />
                    <span className="font-mono font-bold tracking-widest text-sm">STARK_NET_V1.0</span>
                </div>
                
                <h1 className="text-5xl font-black tracking-tighter mb-6 leading-tight text-zinc-900 dark:text-white drop-shadow-sm">
                    Build the future. <br/>
                    <span className="text-zinc-400 dark:text-white/60">Share the code.</span>
                </h1>
                
                <div className="space-y-4 font-mono text-xs text-zinc-600 dark:text-white/80">
                    <div className="flex justify-between border-b border-zinc-300 dark:border-white/10 pb-2">
                        <span>SYSTEM_STATUS</span>
                        <span className="text-green-600 dark:text-green-400 font-bold">OPERATIONAL</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-300 dark:border-white/10 pb-2">
                        <span>ACTIVE_NODES</span>
                        <span>1,204 CREATORS</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-300 dark:border-white/10 pb-2">
                        <span>ENCRYPTION</span>
                        <span>AES-256</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 2. RIGHT: The Form Area */}
      {/* FIX: Changed layout to flex-col with auto margins to prevent overlap */}
      <div className="w-full lg:w-1/2 bg-background flex flex-col p-8 lg:p-0">
        
        {/* Inner container to center content on desktop, but allow flow on mobile */}
        <div className="flex-1 flex flex-col lg:justify-center lg:items-center">
            
            {/* Mobile Logo - STATIC positioning prevents overlap */}
            <div className="w-full lg:hidden mb-12">
                <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-bold">S</div>
            </div>

            <div className="w-full max-w-md space-y-8 m-auto lg:m-0">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground font-mono">{subtitle}</p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {children}
                </motion.div>

                <div className="pt-8 text-center">
                    <Link href="/" className="text-xs text-muted-foreground hover:text-foreground font-mono underline decoration-dotted">
                        Return to Public Access
                    </Link>
                </div>
            </div>
        </div>

      </div>

    </div>
  );
}