"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export default function ProjectGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Viewport - "The Monitor" */}
      <div className="relative w-full aspect-video bg-black border border-border group overflow-hidden">
        
        {/* The Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Image 
                src={images[currentIndex]} 
                alt="Project Preview" 
                fill 
                className="object-cover"
                priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Technical Overlays */}
        <div className="absolute top-4 left-4 z-10">
            <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 border border-white/10 uppercase tracking-widest">
                IMG_0{currentIndex + 1} // PREVIEW_MODE
            </span>
        </div>

        {/* Navigation Arrows (Hidden until hover) */}
        <button 
            onClick={prevImage}
            className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center hover:bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
            <ChevronLeft size={32} strokeWidth={1.5} />
        </button>
        <button 
            onClick={nextImage}
            className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center hover:bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
            <ChevronRight size={32} strokeWidth={1.5} />
        </button>
        
        {/* Fullscreen Trigger */}
        <button className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-accent hover:border-accent transition-colors">
            <Maximize2 size={16} />
        </button>
      </div>

      {/* Thumbnails - "The Filmstrip" */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`
                relative w-24 h-16 flex-shrink-0 border transition-all duration-200
                ${currentIndex === idx ? "border-accent opacity-100" : "border-transparent opacity-50 hover:opacity-80"}
            `}
          >
            <Image src={img} alt="thumb" fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}