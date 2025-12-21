"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=1000&auto=format&fit=crop", // Code Screen
    title: "Stop Looking.",
    subtitle: "Start Inspecting.",
    desc: "Don't just stare at static pixels. See the source code, the layers, and the logic behind the world's best work."
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop", // Collaboration/Network
    title: "Global Network.",
    subtitle: "No Borders.",
    desc: "Join 1,200+ developers, designers, and motion artists building the future of the web."
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop", // Motion/Lights
    title: "The Hype Engine.",
    subtitle: "Velocity Matters.",
    desc: "A stock-market style leaderboard. Ship fast, trend high, and get discovered by the industry."
  }
];

export default function MobileOnboarding({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slide = SLIDES[currentIndex];

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col lg:hidden">
      
      {/* 1. TOP SECTION: THE VISUAL (55% Height) */}
      <div className="relative h-[55%] w-full overflow-hidden bg-zinc-900">
        <AnimatePresence initial={false} custom={1}>
            <motion.div
                key={currentIndex}
                custom={1}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="absolute inset-0 w-full h-full"
            >
                <Image 
                    src={slide.image} 
                    alt={slide.title} 
                    fill 
                    className="object-cover opacity-90"
                    priority
                />
                {/* Gradient overlay for text readability if needed, or just style */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            </motion.div>
        </AnimatePresence>

        {/* Skip Button (Top Right) */}
        <button 
            onClick={onComplete}
            className="absolute top-6 right-6 z-20 px-3 py-1 bg-black/20 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest rounded-full"
        >
            Skip
        </button>
      </div>

      {/* 2. BOTTOM SECTION: CONTENT CARD (45% Height) */}
      <div className="flex-1 bg-background relative flex flex-col justify-between px-8 pt-8 pb-10">
        
        {/* Progress Indicators */}
        <div className="flex gap-2 mb-6">
            {SLIDES.map((_, idx) => (
                <motion.div 
                    key={idx}
                    animate={{ 
                        backgroundColor: idx === currentIndex ? "var(--accent)" : "var(--border)",
                        width: idx === currentIndex ? 24 : 8,
                    }}
                    className="h-1.5 rounded-full transition-all duration-300" 
                />
            ))}
        </div>

        {/* Text Content */}
        <div className="flex-1">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                >
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {slide.title}
                        </h2>
                        <h3 className="text-xl font-medium text-muted-foreground">
                            {slide.subtitle}
                        </h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                        {slide.desc}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Action Button */}
        <div className="mt-8">
            <Button 
                onClick={handleNext}
                className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 rounded-none text-sm font-mono uppercase tracking-widest transition-all active:scale-[0.98]"
            >
                <span className="flex items-center gap-2">
                    {currentIndex === SLIDES.length - 1 ? "Enter System" : "Next Step"}
                    <ArrowRight size={16} />
                </span>
            </Button>
        </div>

      </div>
    </div>
  );
}