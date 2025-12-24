"use client";
import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, Loader2, Camera, Wand2, MonitorPlay, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "../../../_context/AuthContext";
import Image from "next/image";

export default function StepMedia({ data, updateData }) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const fileInputRef = useRef(null);

  // --- 1. MANUAL UPLOAD ---
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
        
        // Append to existing files
        const newFiles = [...(data.files || []), publicUrl];
        updateData("files", newFiles);
        
        toast.success("Asset Uploaded");
    } catch (error) {
        toast.error("Upload Failed", { description: error.message });
    } finally {
        setIsUploading(false);
    }
  };

  // --- 2. AUTO CAPTURE ---
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
            // Append new images to state immediately
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

  const removeFile = (indexToRemove) => {
    const newFiles = data.files.filter((_, index) => index !== indexToRemove);
    updateData("files", newFiles);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      
      <div className="text-center space-y-1 mb-6">
        <h3 className="font-bold text-foreground">Visual Assets</h3>
        <p className="text-xs text-muted-foreground font-mono">
            {data.files?.length || 0} Assets Loaded
        </p>
      </div>

      {/* --- MAGIC CAPTURE BAR --- */}
      {data.demo_link && (
         <div className="bg-secondary/10 border border-accent/20 p-4 flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className={`p-2 bg-accent/10 text-accent rounded-full ${isAutoCapturing ? 'animate-spin' : 'animate-pulse'}`}>
                    {isAutoCapturing ? <Loader2 size={18} /> : <Wand2 size={18} />}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-foreground">
                        {isAutoCapturing ? "Scanning Target..." : "Auto-Capture Available"}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                        {data.demo_link}
                    </p>
                </div>
            </div>
            
            <button 
                onClick={handleAutoCapture}
                disabled={isAutoCapturing}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-mono font-bold uppercase tracking-wide hover:bg-accent/90 disabled:opacity-50 transition-all"
            >
                <Camera size={14} /> {isAutoCapturing ? "Capturing..." : "Run Capture"}
            </button>
         </div>
      )}

      {/* --- MANUAL DROPZONE --- */}
      <div 
        className="w-full h-32 border-2 border-dashed border-border hover:border-accent/50 bg-secondary/5 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer relative group"
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
                <span className="text-xs font-mono">UPLOADING...</span>
            </div>
        ) : (
            <div className="flex flex-col items-center">
                <UploadCloud size={24} className="text-muted-foreground group-hover:text-accent transition-colors mb-2" />
                <p className="text-xs font-bold text-foreground">Click to Upload Manually</p>
            </div>
        )}
      </div>

      {/* --- PREVIEW GRID (THE FIX) --- */}
      {/* Visualizes the images immediately */}
      {data.files && data.files.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {data.files.map((url, idx) => (
                <div key={idx} className="relative aspect-video group bg-secondary border border-border overflow-hidden">
                    <Image 
                        src={url} 
                        alt={`Screenshot ${idx}`} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    
                    {/* Delete Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                            onClick={() => removeFile(idx)}
                            className="p-2 bg-red-600 text-white rounded-none hover:bg-red-700 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] font-mono px-2 py-0.5">
                        IMG_0{idx + 1}
                    </div>
                </div>
            ))}
          </div>
      )}

    </div>
  );
}