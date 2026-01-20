"use client";
import { useState, useRef } from "react";
import { UploadCloud, X, Loader2, ChevronLeft, ChevronRight, Youtube, Plus } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/app/_context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Helper: Check if string is a video link
const isVideoUrl = (url) => typeof url === 'string' && (url.includes("youtube.com") || url.includes("youtu.be"));

// Helper: Extract YouTube Thumbnail
const getYoutubeThumbnail = (url) => {
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1];
    
    if (videoId) {
        const cleanId = videoId.split("?")[0].split("/")[0];
        return `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
    }
    return null;
};

export default function AdminMediaManager({ media = [], onChange }) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const fileInputRef = useRef(null);

  // --- 1. HANDLE IMAGE UPLOAD ---
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    const newUrls = [];

    try {
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`Skipped ${file.name}: Too large (Max 5MB)`);
                continue;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `announcements/${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('project-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('project-assets')
                .getPublicUrl(fileName);

            newUrls.push(publicUrl);
        }

        if (newUrls.length > 0) {
            onChange([...media, ...newUrls]);
            toast.success(`${newUrls.length} assets uploaded`);
        }

    } catch (error) {
        console.error(error);
        toast.error("Upload failed");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- 2. HANDLE VIDEO ADD ---
  const handleAddVideo = () => {
    if (!videoLink) return;
    if (!isVideoUrl(videoLink)) {
        toast.error("Invalid Link", { description: "Only YouTube links supported." });
        return;
    }
    onChange([...media, videoLink]);
    setVideoLink("");
    toast.success("Video Added");
  };

  // --- 3. MANIPULATION ---
  const removeMedia = (index) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    onChange(newMedia);
  };

  const moveLeft = (index) => {
    if (index === 0) return;
    const newMedia = [...media];
    [newMedia[index - 1], newMedia[index]] = [newMedia[index], newMedia[index - 1]];
    onChange(newMedia);
  };

  const moveRight = (index) => {
    if (index === media.length - 1) return;
    const newMedia = [...media];
    [newMedia[index + 1], newMedia[index]] = [newMedia[index], newMedia[index + 1]];
    onChange(newMedia);
  };

  return (
    <div className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* A. Upload Area */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-red-600/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all h-24 flex flex-col items-center justify-center cursor-pointer group rounded-sm"
            >
                <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleUpload}
                />
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-[10px] font-mono uppercase">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-500 group-hover:text-zinc-300">
                        <UploadCloud size={20} />
                        <span className="text-[10px] font-mono uppercase">Upload Images</span>
                    </div>
                )}
            </div>

            {/* B. Video Input Area */}
            <div className="h-24 bg-zinc-900/30 border border-white/10 flex flex-col justify-center p-3 gap-2">
                <div className="relative">
                    <Youtube className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <Input 
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        placeholder="YouTube URL..."
                        className="pl-8 h-8 bg-black border-white/10 text-xs font-mono text-white focus:border-red-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
                    />
                </div>
                <Button 
                    onClick={handleAddVideo} 
                    disabled={!videoLink}
                    size="sm" 
                    className="h-7 w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono uppercase rounded-sm border border-white/5"
                >
                    Add Video Asset
                </Button>
            </div>
        </div>

        {/* C. Gallery Grid */}
        {media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {media.map((url, idx) => {
                    const isVideo = isVideoUrl(url);
                    const thumbnail = isVideo ? getYoutubeThumbnail(url) : url;

                    return (
                        <div key={idx} className="relative aspect-video bg-zinc-900 border border-white/10 group overflow-hidden">
                            <Image 
                                src={thumbnail || "/placeholder.jpg"} 
                                alt={`Asset ${idx}`} 
                                fill 
                                className="object-cover" 
                            />
                            
                            {/* Video Indicator */}
                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                        <Youtube size={16} fill="currentColor" />
                                    </div>
                                </div>
                            )}

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); moveLeft(idx); }}
                                    disabled={idx === 0}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 rounded-sm"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeMedia(idx); }}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-sm"
                                >
                                    <X size={14} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); moveRight(idx); }}
                                    disabled={idx === media.length - 1}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 rounded-sm"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-[9px] font-mono text-white flex gap-2">
                                <span>{idx + 1}</span>
                                {isVideo && <span>VIDEO</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
}