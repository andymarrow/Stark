"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ManifestoHero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative h-[80vh] flex flex-col justify-center items-center overflow-hidden border-b border-border">
      
      {/* 1. Background Noise */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern-light dark:bg-grid-pattern-dark opacity-10" />

      {/* 2. Parallax Text */}
      <motion.div style={{ y, opacity }} className="relative z-10 text-center px-4">
        
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="inline-block mb-6 border border-accent/50 bg-accent/5 px-4 py-1 text-xs font-mono text-accent uppercase tracking-[0.2em]"
        >
            System_Manifesto_v1.0
        </motion.div>

        <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8 mix-blend-difference text-foreground">
          DEATH TO<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-500 to-zinc-900 dark:from-zinc-100 dark:to-zinc-800">
            STATIC
          </span>
          <br />
          PIXELS.
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-mono leading-relaxed">
          We believe a design isn't real until it ships. <br/>
          Stark is the bridge between <span className="text-foreground font-bold">Concept</span> and <span className="text-foreground font-bold">Code</span>.
        </p>

      </motion.div>

      {/* 3. Scrolling Marquee at Bottom */}
      <div className="absolute bottom-0 w-full overflow-hidden whitespace-nowrap py-4 border-t border-border bg-secondary/5">
        <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
            className="flex gap-8 font-mono text-xs uppercase tracking-widest text-muted-foreground/50"
        >
            {Array(10).fill("Ship or die trying /// Code is truth /// No more lorem ipsum /// ").map((text, i) => (
                <span key={i}>{text}</span>
            ))}
        </motion.div>
      </div>

    </div>
  );
}