"use client";
import { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, 
  Loader2, 
  Camera, 
  Wand2, 
  Trash2, 
  Youtube, 
  AlertTriangle, 
  GripVertical, 
  Plus,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/_context/AuthContext";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Helper: Check if string is a video link
const isVideoUrl = (url) => url.includes("youtube.com") || url.includes("youtu.be");

// Helper: Extract YouTube Thumbnail
const getYoutubeThumbnail = (url) => {
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1];
    
    if (videoId) {
        const cleanId = videoId.split("?")[0].split("/")[0];
        return `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`;
    }
    return null;
};

export default function StepMedia({ data, updateData, errors }) {
  const { user } = useAuth();
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [videoLink, setVideoLink] = useState(""); 
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  
  const fileInputRef = useRef(null);

  // --- 1. UNIFIED FILE PROCESSOR (Handles Drop, Paste, Input) ---
  const processFiles = (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    // Validate size
    for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
            toast.error(`Skipped ${file.name}`, { description: "File too large (Max 5MB)." });
            return;
        }
        if (!file.type.startsWith("image/")) {
            toast.error(`Skipped ${file.name}`, { description: "Only image files are allowed." });
            return;
        }
    }

    // Create Local Previews
    const newRawFiles = [];
    const newPreviewUrls = [];

    files.forEach(file => {
        const objectUrl = URL.createObjectURL(file);
        newPreviewUrls.push(objectUrl);
        newRawFiles.push({ preview: objectUrl, file: file });
    });

    // Update Parent State
    updateData("files", [...(data.files || []), ...newPreviewUrls]);
    
    // Merge rawFiles for deferred upload
    const currentRaw = data.rawFiles || [];
    updateData("rawFiles", [...currentRaw, ...newRawFiles]);

    toast.success(`${files.length} Assets Added`);
  };

  // --- 2. GLOBAL PASTE LISTENER ---
  useEffect(() => {
    const handlePaste = (e) => {
        if (e.clipboardData && e.clipboardData.files.length > 0) {
            e.preventDefault();
            processFiles(e.clipboardData.files);
        }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [data.files]); // Re-bind if needed

  // --- 3. DRAG & DROP UPLOAD HANDLERS ---
  const handleDragOverUpload = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeaveUpload = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDropUpload = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    processFiles(e.dataTransfer.files);
  };

  // --- 4. REORDERING LOGIC (GRID SORT) ---
  const handleDragStart = (index) => {
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newFiles = [...data.files];
    const draggedItem = newFiles[draggedItemIndex];

    // Remove from old pos and insert at new pos
    newFiles.splice(draggedItemIndex, 1);
    newFiles.splice(index, 0, draggedItem);

    updateData("files", newFiles);
    setDraggedItemIndex(index); // Update index to track the item in its new slot
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  // --- 5. UTILITIES ---
  const handleAutoCapture = async () => {
    if (!data.demo_link) {
        toast.error("Missing Link", { description: "Please add a Live Demo URL in Step 2 first." });
        return;
    }
    setIsAutoCapturing(true);
    toast.info("Deploying Scout Bot...", { description: "Capturing screens..." });

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
            toast.success("Capture Complete");
        }
    } catch (error) {
        toast.error("Capture Failed");
    } finally {
        setIsAutoCapturing(false);
    }
  };

  const handleAddVideo = () => {
    if (!videoLink) return;
    if (!isVideoUrl(videoLink)) {
        toast.error("Invalid Link", { description: "Only YouTube links supported." });
        return;
    }
    const newFiles = [...(data.files || []), videoLink];
    updateData("files", newFiles);
    setVideoLink("");
    toast.success("Video Added");
  };

  const removeFile = (indexToRemove) => {
    const fileToRemove = data.files[indexToRemove];
    if (fileToRemove.startsWith('blob:')) URL.revokeObjectURL(fileToRemove);

    const newFiles = data.files.filter((_, index) => index !== indexToRemove);
    updateData("files", newFiles);

    if (data.rawFiles) {
        const newRaw = data.rawFiles.filter(r => r.preview !== fileToRemove);
        updateData("rawFiles", newRaw);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      
      {/* HEADER */}
      <div className="text-center space-y-1">
        <h3 className={`font-bold transition-colors ${errors?.files ? 'text-red-500' : 'text-foreground'}`}>
            Visual Assets
        </h3>
        {errors?.files ? (
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-red-500 uppercase tracking-widest animate-pulse">
                <AlertTriangle size={12} /> Error: {errors.files}
            </div>
        ) : (
            <p className="text-xs text-muted-foreground font-mono">
                Drag & Drop to Reorder • Ctrl+V to Paste
            </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* A. MAGIC CAPTURE BAR */}
          {data.demo_link ? (
             <div className={`bg-secondary/10 border p-4 flex flex-col justify-between group h-36 transition-colors ${errors?.files ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-accent/20'}`}>
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
                    <Camera size={14} /> {isAutoCapturing ? "Scanning..." : "Run Bot"}
                </button>
             </div>
          ) : (
             <div className="bg-secondary/5 border border-border border-dashed p-4 flex items-center justify-center text-muted-foreground h-36 text-center">
                <span className="text-[10px] font-mono uppercase tracking-tighter leading-tight">
                    Add Demo Link in Step 2<br/>to enable Auto-Capture
                </span>
             </div>
          )}

          {/* B. DROPZONE (Upload) */}
          <div 
            className={`h-36 border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative group 
                ${isDraggingOver 
                    ? 'border-accent bg-accent/5 scale-[1.02] shadow-xl' 
                    : errors?.files ? 'border-red-500 bg-secondary/5' : 'border-border hover:border-accent/50 bg-secondary/5'
                }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOverUpload}
            onDragLeave={handleDragLeaveUpload}
            onDrop={handleDropUpload}
          >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => processFiles(e.target.files)} 
                className="hidden" 
                accept="image/*"
                multiple 
            />
            <div className="flex flex-col items-center text-center pointer-events-none">
                <UploadCloud size={24} className={`mb-2 transition-colors ${isDraggingOver || !errors?.files ? 'text-accent' : 'text-red-500'}`} />
                <p className="text-xs font-bold text-foreground">
                    {isDraggingOver ? "Drop Files Here" : "Upload Images"}
                </p>
                <span className="text-[10px] text-muted-foreground uppercase mt-1">
                    Or Paste (Ctrl+V)
                </span>
            </div>
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
                Add
             </button>
          </div>
      </div>

      {/* D. SORTABLE PREVIEW GRID */}
      {data.files && data.files.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Sequence Order ({data.files.length})
                </span>
                <span className="text-[10px] text-accent animate-pulse font-mono uppercase">
                    Drag to Reorder
                </span>
            </div>

            <motion.div 
                layout
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
                <AnimatePresence>
                {data.files.map((url, idx) => {
                    const isVideo = isVideoUrl(url);
                    const thumbnail = isVideo ? getYoutubeThumbnail(url) : url;
                    const isBeingDragged = draggedItemIndex === idx;

                    return (
                        <motion.div
                            layout
                            key={url} // URL must be unique
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", damping: 25, stiffness: 500 }}
                            
                            // Drag Attributes
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragEnter={() => handleDragEnter(idx)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()} // Necessary for drop

                            className={`relative aspect-video group bg-secondary border overflow-hidden cursor-grab active:cursor-grabbing transition-all
                                ${isBeingDragged ? 'border-accent opacity-50 scale-95 z-50' : 'border-border hover:border-accent/50'}
                            `}
                        >
                            {/* Grip Handle (Visual Cue) */}
                            <div className="absolute top-2 left-2 z-20 bg-black/50 text-white p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <GripVertical size={12} />
                            </div>

                            <Image 
                                src={thumbnail || "/placeholder.jpg"} 
                                alt={`Asset ${idx}`} 
                                fill 
                                className="object-cover pointer-events-none select-none" 
                            />
                            
                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                        <Youtube size={16} fill="currentColor" />
                                    </div>
                                </div>
                            )}

                            {/* Delete Overlay */}
                            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent drag start on click
                                        removeFile(idx);
                                    }}
                                    className="p-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Index Label */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] font-mono px-2 py-1 flex justify-between items-center pointer-events-none">
                                <span>{isVideo ? "VIDEO_LINK" : `IMG_0${idx + 1}`}</span>
                                <span className="opacity-50">#{idx + 1}</span>
                            </div>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
                
                {/* Add More Placeholder (Visual Balance) */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/50 hover:bg-accent/5 cursor-pointer transition-colors"
                >
                    <div className="flex flex-col items-center gap-1">
                        <Plus size={20} />
                        <span className="text-[9px] font-mono uppercase">Add Asset</span>
                    </div>
                </div>

            </motion.div>
          </div>
      )}

    </div>
  );
}