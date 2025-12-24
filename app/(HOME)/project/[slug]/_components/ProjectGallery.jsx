"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, ImageOff } from "lucide-react"; // Added ImageOff
import ImageLightbox from "./ImageLightbox";

export default function ProjectGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // SAFEGUARD: If no images, show nothing or a placeholder
  if (!images || images.length === 0) {
    return (
        <div className="w-full aspect-video bg-secondary/10 border border-border flex flex-col items-center justify-center text-muted-foreground">
            <ImageOff size={48} className="mb-2 opacity-50" />
            <p className="text-xs font-mono uppercase">NO_VISUAL_DATA_AVAILABLE</p>
        </div>
    );
  }

  // Ensure current index is valid
  const validIndex = currentIndex >= 0 && currentIndex < images.length ? currentIndex : 0;
  const currentImageSrc = images[validIndex];

  // If the specific image source is invalid/null
  if (!currentImageSrc) return null;

  const nextImage = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
        <div className="space-y-4">
        {/* Main Viewport */}
        <div 
            className="relative w-full aspect-video bg-black border border-border group overflow-hidden cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
        >
            
            <AnimatePresence mode="wait">
            <motion.div
                key={validIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
            >
                <Image 
                    src={currentImageSrc} 
                    alt="Project Preview" 
                    fill 
                    className="object-cover"
                    priority
                />
            </motion.div>
            </AnimatePresence>

            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 border border-white/10 uppercase tracking-widest">
                    IMG_0{validIndex + 1} // PREVIEW_MODE
                </span>
            </div>

            {images.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center hover:bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        <ChevronLeft size={32} strokeWidth={1.5} />
                    </button>
                    <button onClick={nextImage} className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center hover:bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        <ChevronRight size={32} strokeWidth={1.5} />
                    </button>
                </>
            )}
            
            <button 
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-accent hover:border-accent transition-colors z-20"
            >
                <Maximize2 size={16} />
            </button>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`
                        relative w-24 h-16 flex-shrink-0 border transition-all duration-200
                        ${validIndex === idx ? "border-accent opacity-100" : "border-transparent opacity-50 hover:opacity-80"}
                    `}
                >
                    {img && <Image src={img} alt="thumb" fill className="object-cover" />}
                </button>
                ))}
            </div>
        )}
        </div>

        {/* --- LIGHTBOX OVERLAY --- */}
        <ImageLightbox 
            isOpen={isLightboxOpen} 
            onClose={() => setIsLightboxOpen(false)} 
            images={images} 
            initialIndex={validIndex}
        />
    </>
  );
}