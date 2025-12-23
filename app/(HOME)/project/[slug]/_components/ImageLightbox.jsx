"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";

export default function ImageLightbox({ isOpen, onClose, images, initialIndex }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  // Sync index when opening
  useEffect(() => {
    setIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, index]);

  const nextImage = () => {
    setIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  };

  const prevImage = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  };

  const toggleZoom = () => {
    setZoom(prev => prev === 1 ? 2 : 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
        >
            
            {/* 1. Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50 z-50">
                <div className="text-white font-mono text-xs">
                    IMG_0{index + 1} <span className="text-zinc-500">/</span> 0{images.length}
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                        <ZoomOut size={20} />
                    </button>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.5))} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                        <ZoomIn size={20} />
                    </button>
                    <div className="w-[1px] h-6 bg-white/10 mx-2" />
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* 2. Main Canvas */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                
                {/* Navigation Click Zones */}
                <button onClick={prevImage} className="absolute left-0 top-0 bottom-0 w-24 flex items-center justify-center group z-40 outline-none">
                    <div className="p-3 bg-black/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <ChevronLeft size={24} />
                    </div>
                </button>
                
                <button onClick={nextImage} className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center group z-40 outline-none">
                    <div className="p-3 bg-black/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <ChevronRight size={24} />
                    </div>
                </button>

                {/* The Image */}
                <motion.div 
                    key={index}
                    className="relative w-full h-full flex items-center justify-center cursor-move"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div 
                        className="relative transition-transform duration-300 ease-out"
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            transform: `scale(${zoom})`,
                            cursor: zoom > 1 ? 'grab' : 'zoom-in'
                        }}
                        onClick={zoom === 1 ? toggleZoom : undefined}
                    >
                        <Image 
                            src={images[index]} 
                            alt="Full Screen Preview" 
                            fill 
                            className="object-contain"
                            quality={100}
                            priority
                        />
                    </div>
                </motion.div>
            </div>

            {/* 3. Footer Data */}
            <div className="p-4 border-t border-white/10 bg-black/50 flex justify-between items-center text-xs font-mono text-zinc-500">
                <div>ZOOM: {Math.round(zoom * 100)}%</div>
                <div className="flex gap-4">
                    <span>RES: 1920x1080</span>
                    <button className="hover:text-white flex items-center gap-1 transition-colors">
                        <Download size={12} /> DOWNLOAD_SOURCE
                    </button>
                </div>
            </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}