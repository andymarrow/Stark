"use client";
import Image from "next/image";
import { Play } from "lucide-react";

// Helper for YouTube
const getThumbnail = (url) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1];
        
        if (videoId) {
             const cleanId = videoId.split("?")[0].split("/")[0];
             return `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
        }
    }
    return url; 
};

const isVideo = (url) => url.includes("youtube") || url.includes("youtu.be");

export default function FeedMediaGrid({ media = [], onOpen }) {
  if (!media.length) return null;

  const displayCount = Math.min(media.length, 4); // Max 4 displayed
  const remainder = media.length - 4;

  const Item = ({ url, index, className }) => (
    <div 
        onClick={() => onOpen(index)}
        className={`relative bg-secondary overflow-hidden cursor-pointer group ${className}`}
    >
        <Image 
            src={getThumbnail(url)} 
            alt="Asset" 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
        />
        {/* Play Icon Overlay */}
        {isVideo(url) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Play size={16} fill="currentColor" />
                </div>
            </div>
        )}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  // --- LAYOUT LOGIC ---
  if (media.length === 1) {
    return <div className="aspect-video w-full"><Item url={media[0]} index={0} className="h-full w-full" /></div>;
  }

  if (media.length === 2) {
    return (
        <div className="grid grid-cols-2 gap-1 aspect-[2/1]">
            <Item url={media[0]} index={0} className="h-full" />
            <Item url={media[1]} index={1} className="h-full" />
        </div>
    );
  }

  if (media.length === 3) {
    return (
        <div className="grid grid-cols-2 gap-1 aspect-[2/1]">
            <Item url={media[0]} index={0} className="h-full" />
            <div className="flex flex-col gap-1 h-full">
                <Item url={media[1]} index={1} className="flex-1" />
                <Item url={media[2]} index={2} className="flex-1" />
            </div>
        </div>
    );
  }

  // 4 or more
  return (
    <div className="grid grid-cols-2 gap-1 aspect-[2/1]">
        <Item url={media[0]} index={0} className="h-full" />
        <div className="flex flex-col gap-1 h-full">
            <Item url={media[1]} index={1} className="flex-1" />
            <div className="flex gap-1 flex-1">
                <Item url={media[2]} index={2} className="flex-1" />
                <div className="flex-1 relative cursor-pointer" onClick={() => onOpen(3)}>
                    <Item url={media[3]} index={3} className="h-full w-full" />
                    {/* Overflow Counter */}
                    {remainder > 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-mono text-xl font-bold backdrop-blur-sm">
                            +{remainder}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}