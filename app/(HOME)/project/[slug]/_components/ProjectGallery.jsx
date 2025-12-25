"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, ImageOff, PlayCircle } from "lucide-react"; 
import ImageLightbox from "./ImageLightbox";

// Helper to detect video
const isVideoUrl = (url) => url && (url.includes("youtube.com") || url.includes("youtu.be"));

// Helper to get embed URL
const getEmbedUrl = (url) => {
    let videoId = "";
    if (url.includes("youtu.be")) {
        videoId = url.split("/").pop();
    } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
};

// Helper for thumbnail
const getThumbnail = (url) => {
    if (isVideoUrl(url)) {
        let videoId = "";
        if (url.includes("youtu.be")) videoId = url.split("/").pop();
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return url;
};

export default function ProjectGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
        <div className="w-full aspect-video bg-secondary/10 border border-border flex flex-col items-center justify-center text-muted-foreground">
            <ImageOff size={48} className="mb-2 opacity-50" />
            <p className="text-xs font-mono uppercase">NO_VISUAL_DATA_AVAILABLE</p>
        </div>
    );
  }

  const validIndex = currentIndex >= 0 && currentIndex < images.length ? currentIndex : 0;
  const currentMediaSrc = images[validIndex];
  const isVideo = isVideoUrl(currentMediaSrc);

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
            className="relative w-full aspect-video bg-black border border-border group overflow-hidden"
        >
            <AnimatePresence mode="wait">
            <motion.div
                key={validIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
            >
                {isVideo ? (
                    <iframe 
                        src={getEmbedUrl(currentMediaSrc)} 
                        title="YouTube video player" 
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    />
                ) : (
                    <div 
                        className="relative w-full h-full cursor-zoom-in" 
                        onClick={() => setIsLightboxOpen(true)}
                    >
                        <Image 
                            src={currentMediaSrc} 
                            alt="Project Preview" 
                            fill 
                            className="object-contain" // Changed to contain for better aspect ratio
                            priority
                        />
                    </div>
                )}
            </motion.div>
            </AnimatePresence>

            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 border border-white/10 uppercase tracking-widest">
                    {isVideo ? "VIDEO_FEED" : `IMG_0${validIndex + 1}`} // PREVIEW_MODE
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
            
            {!isVideo && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-accent hover:border-accent transition-colors z-20"
                >
                    <Maximize2 size={16} />
                </button>
            )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((item, idx) => {
                    const isItemVideo = isVideoUrl(item);
                    return (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`
                                relative w-24 h-16 flex-shrink-0 border transition-all duration-200 overflow-hidden bg-secondary
                                ${validIndex === idx ? "border-accent opacity-100" : "border-transparent opacity-50 hover:opacity-80"}
                            `}
                        >
                            <Image 
                                src={getThumbnail(item)} 
                                alt="thumb" 
                                fill 
                                className="object-cover" 
                            />
                            {isItemVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <PlayCircle size={20} className="text-white" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        )}
        </div>

        {/* --- LIGHTBOX OVERLAY (Only for Images) --- */}
        {!isVideo && (
            <ImageLightbox 
                isOpen={isLightboxOpen} 
                onClose={() => setIsLightboxOpen(false)} 
                images={images.filter(img => !isVideoUrl(img))} 
                initialIndex={0} // Simplified index logic for lightbox if mixed media
            />
        )}
    </>
  );
}