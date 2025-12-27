"use client";
import { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Camera, Wand2, Trash2, Youtube, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/app/_context/AuthContext";
import Image from "next/image";

// Helper to check if string is a video link
const isVideoUrl = (url) => url.includes("youtube.com") || url.includes("youtu.be");

// Helper to extract YouTube Thumbnail
const getYoutubeThumbnail = (url) => {
    let videoId = "";
    if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1];
    } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("embed/")) {
        videoId = url.split("embed/")[1];
    }
    
    if (videoId) {
        // Clean ID of tracking params
        const cleanId = videoId.split("?")[0].split("/")[0];
        return `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
    }
    return null;
};

export default function StepMedia({ data, updateData, errors }) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [videoLink, setVideoLink] = useState(""); 
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const file = files[0];
    
    if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", { description: "Max size is 5MB." });
        return;
    }

    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `projects/${user?.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);
        
        const newFiles = [...(data.files || []), publicUrl];
        updateData("files", newFiles);
        toast.success("Asset Uploaded");
    } catch (error) {
        console.error(error);
        toast.error("Upload Failed", { description: error.message });
    } finally {
        setIsUploading(false);
    }
  };

  const handleAutoCapture = async () => {
    if (!data.demo_link) {
        toast.error("Missing Link", { description: "Please add a Live Demo URL in Step 2 first." });
        return;
    }

    setIsAutoCapturing(true);
    toast.info("Deploying Scout Bot...", { description: "Visiting site and capturing screens. Please wait..." });

    try {
        const response = await fetch('/api/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: data.demo_link, userId: user.id })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        if (result.images && result.images.length > 0) {
            const newFiles = [...(data.files || []), ...result.images];
            updateData("files", newFiles);
            toast.success("Capture Complete", { description: `${result.images.length} screenshots added.` });
        } else {
             toast.warning("No Images Returned", { description: "The bot visited but returned no data." });
        }
    } catch (error) {
        console.error(error);
        toast.error("Capture Failed", { description: "Could not access the live site. Try manual upload." });
    } finally {
        setIsAutoCapturing(false);
    }
  };

  const handleAddVideo = () => {
    if (!videoLink) return;
    if (!isVideoUrl(videoLink)) {
        toast.error("Invalid Link", { description: "Only YouTube links are supported for now." });
        return;
    }
    
    const newFiles = [...(data.files || []), videoLink];
    updateData("files", newFiles);
    setVideoLink("");
    toast.success("Video Added");
  };

  const removeFile = (indexToRemove) => {
    const newFiles = data.files.filter((_, index) => index !== indexToRemove);
    updateData("files", newFiles);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      
      {/* HEADER WITH CONDITIONAL ERROR STYLING */}
      <div className="text-center space-y-1 mb-6">
        <h3 className={`font-bold transition-colors ${errors?.files ? 'text-red-500' : 'text-foreground'}`}>
            Visual Assets
        </h3>
        
        {errors?.files ? (
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-red-500 uppercase tracking-widest animate-pulse">
                <AlertTriangle size={12} /> Error: {errors.files}
            </div>
        ) : (
            <p className="text-xs text-muted-foreground font-mono">
                {data.files?.length || 0} Assets Loaded (Images & Video)
            </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* A. MAGIC CAPTURE BAR */}
          {data.demo_link ? (
             <div className={`bg-secondary/10 border p-4 flex flex-col justify-between group h-32 transition-colors ${errors?.files ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-accent/20'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-accent/10 text-accent rounded-full ${isAutoCapturing ? 'animate-spin' : 'animate-pulse'}`}>
                        {isAutoCapturing ? <Loader2 size={18} /> : <Wand2 size={18} />}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground">Auto-Capture</h4>
                        <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                            {data.demo_link}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleAutoCapture}
                    disabled={isAutoCapturing}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-accent text-white text-xs font-mono font-bold uppercase tracking-wide hover:bg-accent/90 disabled:opacity-50 transition-all mt-auto"
                >
                    <Camera size={14} /> {isAutoCapturing ? "Capturing..." : "Run Capture"}
                </button>
             </div>
          ) : (
             <div className="bg-secondary/5 border border-border border-dashed p-4 flex items-center justify-center text-muted-foreground h-32 text-center">
                <span className="text-[10px] font-mono uppercase tracking-tighter leading-tight">
                    Add Demo Link in Step 2<br/>to enable Auto-Capture
                </span>
             </div>
          )}

          {/* B. MANUAL DROPZONE */}
          <div 
            className={`h-32 border-2 border-dashed bg-secondary/5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative group ${errors?.files ? 'border-red-500' : 'border-border hover:border-accent/50'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*"
            />
            {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-accent" size={24} />
                    <span className="text-xs font-mono uppercase">Uploading...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    <UploadCloud size={24} className={`mb-2 transition-colors ${errors?.files ? 'text-red-500' : 'text-muted-foreground group-hover:text-accent'}`} />
                    <p className="text-xs font-bold text-foreground">Upload Image</p>
                    <span className="text-[10px] text-muted-foreground uppercase">Max 5MB</span>
                </div>
            )}
          </div>
      </div>

      {/* C. VIDEO INPUT */}
      <div className="space-y-1">
          <div className={`relative flex items-center border transition-colors ${errors?.files ? 'border-red-500' : 'border-border focus-within:border-accent'}`}>
             <div className="absolute left-3 text-muted-foreground">
                <Youtube size={18} />
             </div>
             <input 
                type="text" 
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="Paste YouTube Link..."
                className="w-full h-12 pl-10 pr-24 bg-transparent outline-none font-mono text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
             />
             <button 
                onClick={handleAddVideo}
                disabled={!videoLink}
                className="absolute right-2 px-4 py-1.5 bg-secondary text-foreground text-[10px] font-mono font-bold uppercase hover:bg-accent hover:text-white transition-colors disabled:opacity-30"
             >
                Add Video
             </button>
          </div>
      </div>

      {/* PREVIEW GRID */}
      {data.files && data.files.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {data.files.map((url, idx) => {
                const isVideo = isVideoUrl(url);
                const thumbnail = isVideo ? getYoutubeThumbnail(url) : url;

                return (
                    <div key={idx} className="relative aspect-video group bg-secondary border border-border overflow-hidden">
                        <Image 
                            src={thumbnail || "/placeholder.jpg"} 
                            alt={`Asset ${idx}`} 
                            fill 
                            className="object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                    <Youtube size={16} fill="currentColor" />
                                </div>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <button 
                                onClick={() => removeFile(idx)}
                                className="p-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] font-mono px-2 py-0.5 z-10">
                            {isVideo ? "VIDEO" : `IMG_0${idx + 1}`}
                        </div>
                    </div>
                );
            })}
          </div>
      )}

    </div>
  );
}