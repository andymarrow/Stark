"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

export default function MobileSplash({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsVisible(false), 500); // Wait a bit then fade out
          setTimeout(onComplete, 800); // Tell parent we are done
          return 100;
        }
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center lg:hidden"
        >
          {/* Logo Pulse */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-8 p-4 border-2 border-foreground bg-foreground text-background"
          >
            <span className="text-4xl font-black tracking-tighter">S</span>
          </motion.div>

          {/* Typewriter Text */}
          <div className="h-6 mb-4">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                {progress < 30 ? "Initializing Core..." : 
                 progress < 70 ? "Establishing Secure Link..." : 
                 "System Ready."}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-64 h-1 bg-secondary relative overflow-hidden">
            <motion.div 
                className="absolute top-0 left-0 h-full bg-accent"
                style={{ width: `${progress}%` }}
                layoutId="progress"
            />
          </div>
          
          <div className="mt-2 text-[10px] font-mono text-muted-foreground">
            {progress}%
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}