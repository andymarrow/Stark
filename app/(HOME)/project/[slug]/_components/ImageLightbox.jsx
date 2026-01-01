"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";

export default function ImageLightbox({ isOpen, onClose, images, initialIndex }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);

  // 1. Handle Mounting for Portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync index when opening
  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex);
      setZoom(1);
    }
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

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 1));

  const toggleZoom = () => {
    setZoom((prev) => (prev > 1 ? 1 : 2));
  };

  // If not mounted yet, return null (SSR safety)
  if (!mounted) return null;

  // 2. Render via Portal to document.body
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col w-screen h-screen select-none"
        >
          {/* 1. Toolbar (Fixed Top) */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 border-b border-white/10 bg-black/50 z-[10000]">
            <div className="text-white font-mono text-xs">
              IMG_0{index + 1} <span className="text-zinc-500">/</span> 0{images.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors rounded-full"
              >
                <ZoomOut size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors rounded-full"
              >
                <ZoomIn size={20} />
              </button>
              <div className="w-[1px] h-6 bg-white/10 mx-2" />
              
              {/* FIX: Robust Close Button */}
              <button
                type="button"
                onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation(); 
                    onClose(); 
                }}
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-white/10 transition-colors rounded-full cursor-pointer pointer-events-auto relative z-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* 2. Main Canvas */}
          <div 
            className="flex-1 relative overflow-hidden flex items-center justify-center w-full h-full"
            onClick={onClose} // Optional: Close when clicking empty space
          >
            
            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 border border-white/10 text-white rounded-full hover:bg-white/10 transition-colors z-[10000] cursor-pointer"
                    >
                    <ChevronLeft size={24} />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 border border-white/10 text-white rounded-full hover:bg-white/10 transition-colors z-[10000] cursor-pointer"
                    >
                    <ChevronRight size={24} />
                    </button>
                </>
            )}

            {/* The Image Container */}
            <div 
                className="w-full h-full flex items-center justify-center overflow-hidden cursor-move"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image wrapper
            >
              <motion.div
                key={index}
                drag={zoom > 1}
                dragConstraints={{ left: -400 * zoom, right: 400 * zoom, top: -300 * zoom, bottom: 300 * zoom }}
                dragElastic={0.1}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: zoom, x: zoom === 1 ? 0 : undefined, y: zoom === 1 ? 0 : undefined }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full h-full flex items-center justify-center"
                onDoubleClick={(e) => { e.stopPropagation(); toggleZoom(); }}
              >
                {/* Image Wrapper */}
                <div className="relative w-full h-full max-w-[95vw] max-h-[85vh]">
                    <Image
                        src={images[index]}
                        alt="Preview"
                        fill
                        className="object-contain pointer-events-none"
                        quality={100}
                        priority
                    />
                </div>
              </motion.div>
            </div>
          </div>

          {/* 3. Footer Data */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/50 flex justify-between items-center text-xs font-mono text-zinc-500 z-[10000]">
            <div className="flex items-center gap-4">
               <div>ZOOM: {Math.round(zoom * 100)}%</div>
               <div className="hidden sm:block text-[10px] text-zinc-700">DBL_CLICK TO TOGGLE</div>
            </div>
            <button className="hover:text-white flex items-center gap-1 transition-colors">
                <Download size={12} /> DOWNLOAD_SOURCE
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body // Renders at the root of the document
  );
}