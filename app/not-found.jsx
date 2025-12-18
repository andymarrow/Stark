"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Home, RefreshCcw, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [isScrambling, setIsScrambling] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden select-none">
      
      {/* 1. Background Architecture (Reusing your Hero Vibe) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         {/* Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         {/* Large Circle Guide */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-border/30 rounded-full border-dashed animate-[spin_60s_linear_infinite]" />
         {/* Crosshairs */}
         <div className="absolute top-10 left-10 text-border">+</div>
         <div className="absolute bottom-10 right-10 text-border">+</div>
      </div>

      <div className="container px-4 relative z-10 flex flex-col items-center text-center">
        
        {/* 2. The Main "404" Decrypt Effect */}
        <div 
          className="relative mb-8 cursor-default"
          onMouseEnter={() => setIsScrambling(true)}
        >
            <div className="text-[120px] md:text-[200px] font-black tracking-tighter leading-none text-foreground mix-blend-difference relative z-10">
                <DecryptedText text="404" animateOnHover={true} />
            </div>
            {/* Shadow/Glitch Layer */}
            <div className="absolute top-1 left-1 text-[120px] md:text-[200px] font-black tracking-tighter leading-none text-accent/20 select-none z-0">
                404
            </div>
        </div>

        {/* 3. The "System Status" Box */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md border border-border bg-background p-6 mb-12 relative group hover:border-accent/50 transition-colors"
        >
            {/* Decor corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-foreground" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-foreground" />

            <div className="flex items-center gap-3 mb-4 text-accent">
                <AlertOctagon size={20} />
                <span className="font-mono font-bold uppercase tracking-widest text-sm">Resource_Missing</span>
            </div>
            
            <p className="text-muted-foreground font-light text-sm leading-relaxed mb-6">
                The asset you are looking for—whether it's <span className="text-foreground">Code</span>, <span className="text-foreground">Design</span>, or <span className="text-foreground">Motion</span>—could not be located in the current directory.
            </p>

            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase border-t border-dashed border-border pt-4">
                <span>Error_Code: 0x404</span>
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Offline
                </span>
            </div>
        </motion.div>

        {/* 4. Actions */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
        >
            <Link href="/">
                <Button className="h-12 px-8 bg-foreground hover:bg-foreground/90 text-background rounded-none font-mono tracking-wider uppercase text-xs">
                    <Home size={14} className="mr-2" />
                    Return Home
                </Button>
            </Link>
            
            <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="h-12 px-8 rounded-none border-border hover:border-accent hover:text-accent font-mono tracking-wider bg-transparent uppercase text-xs"
            >
                <RefreshCcw size={14} className="mr-2" />
                Reload System
            </Button>
        </motion.div>

      </div>
    </div>
  );
}

// --- The "Amazing" Decrypt Animation Component ---
const CHARS = "ABCDEF0123456789!@#$%^&*()_+";

function DecryptedText({ text, animateOnHover = false }) {
    const [display, setDisplay] = useState(text);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        scramble(); // Initial scramble on load
    }, []);

    const scramble = () => {
        if (animating) return;
        setAnimating(true);
        let iterations = 0;
        
        const interval = setInterval(() => {
            setDisplay((prev) => 
                text.split("").map((char, index) => {
                    if (index < iterations) return text[index];
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                }).join("")
            );

            if (iterations >= text.length) {
                clearInterval(interval);
                setAnimating(false);
            }
            iterations += 1/3; // Speed of decoding
        }, 30);
    };

    return (
        <span 
            onMouseEnter={animateOnHover ? scramble : undefined}
            className="inline-block font-mono"
        >
            {display}
        </span>
    );
}