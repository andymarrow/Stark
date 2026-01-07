"use client";
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Layers, ChevronRight, Loader2, GitCommit, 
  Link as LinkIcon, Github, Globe, Play, UploadCloud, X, Users, Plus, GripVertical, Youtube 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import RichTextEditor from "@/app/(HOME)/create/_components/RichTextEditor"; 
import CollaboratorManager from "@/app/(HOME)/create/_components/CollaboratorManager";
import { sendCollaboratorInvite } from "@/app/actions/inviteCollaborator"; 

// --- HELPERS ---
const isVideoUrl = (url) => url.includes("youtube.com") || url.includes("youtu.be");

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

export default function CreateChangelogPage({ params }) {
  const unwrappedParams = use(params);
  const { slug } = unwrappedParams;

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [project, setProject] = useState(null);
  
  // Interaction State
  const [youtubeInput, setYoutubeInput] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    content: "",
    files: [], // Array of URLs
    demo_link: "",
    source_link: "",
    video_link: "",
    collaborators: [] 
  });

  // 1. Fetch Project & Verify Ownership
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    const init = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, owner_id, demo_link, source_link")
          .eq("slug", slug)
          .single();

        if (error || !data) throw new Error("Project not found");
        
        if (data.owner_id !== user.id) {
            toast.error("Unauthorized");
            router.push(`/project/${slug}`);
            return;
        }

        setProject(data);
        // Pre-fill links
        setFormData(prev => ({
            ...prev,
            demo_link: data.demo_link || "",
            source_link: data.source_link || ""
        }));

      } catch (err) {
        console.error(err);
        toast.error("Initialization Failed");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [slug, user, authLoading, router]);

  // --- FILE PROCESSING LOGIC ---
  const processFiles = async (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    
    // Check limit
    if (formData.files.length + files.length > 4) {
        toast.error("Max 4 assets allowed");
        return;
    }

    setIsUploading(true);
    const uploadedUrls = [];

    try {
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`Skipped ${file.name} (Too large)`);
                continue;
            }
            
            const fileExt = file.name.split('.').pop();
            const fileName = `changelogs/${project.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, file);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from('project-assets').getPublicUrl(fileName);
            uploadedUrls.push(data.publicUrl);
        }

        setFormData(prev => ({ ...prev, files: [...prev.files, ...uploadedUrls] }));
        toast.success("Uploaded Successfully");

    } catch (error) {
        toast.error("Upload Error");
    } finally {
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- DRAG UPLOAD HANDLERS ---
  const handleDragOverUpload = (e) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeaveUpload = (e) => { e.preventDefault(); setIsDraggingOver(false); };
  const handleDropUpload = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    processFiles(e.dataTransfer.files);
  };

  // --- REORDERING HANDLERS ---
  const handleDragStart = (index) => setDraggedItemIndex(index);
  const handleDragEnter = (index) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newFiles = [...formData.files];
    const item = newFiles[draggedItemIndex];
    newFiles.splice(draggedItemIndex, 1);
    newFiles.splice(index, 0, item);
    setFormData(prev => ({ ...prev, files: newFiles }));
    setDraggedItemIndex(index);
  };
  const handleDragEnd = () => setDraggedItemIndex(null);

  // --- YOUTUBE LOGIC ---
  const addYoutubeLink = () => {
    if (!youtubeInput.trim()) return;
    if (formData.files.length >= 4) { toast.error("Max 4 assets"); return; }
    if (!isVideoUrl(youtubeInput)) {
        toast.error("Invalid YouTube URL");
        return;
    }
    setFormData(prev => ({ ...prev, files: [...prev.files, youtubeInput] }));
    setYoutubeInput("");
  };

  const removeFile = (indexToRemove) => {
    setFormData(prev => ({
        ...prev,
        files: prev.files.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // --- COLLABORATOR HANDLERS ---
  const handleAddCollaborator = (newCollaborator) => {
    setFormData(prev => {
        const exists = prev.collaborators.some(c => (c.id && c.id === newCollaborator.id) || (c.email && c.email === newCollaborator.email));
        if (exists) return prev;
        return { ...prev, collaborators: [...prev.collaborators, newCollaborator] };
    });
  };
  const handleRemoveCollaborator = (cToRemove) => {
    setFormData(prev => ({
        ...prev,
        collaborators: prev.collaborators.filter(c => c.id !== cToRemove.id && c.email !== cToRemove.email)
    }));
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async () => {
    if (!formData.version || !formData.title) {
        toast.error("Missing Data", { description: "Version and Title are required." });
        return;
    }

    setIsSaving(true);
    try {
        // 1. Create Log Entry
        const payload = {
            project_id: project.id,
            version: formData.version,
            title: formData.title,
            content: { type: "markdown", text: formData.content }, 
            media_urls: formData.files,
            metadata: {
                demo_link: formData.demo_link,
                source_link: formData.source_link,
                video_link: formData.video_link
            }
        };

        const { error: logError } = await supabase.from("project_logs").insert(payload);
        if (logError) throw logError;

        // 2. Handle New Collaborators
        if (formData.collaborators.length > 0) {
            const collabRows = formData.collaborators.map(c => ({
                project_id: project.id,
                user_id: c.type === 'user' ? c.user_id : null,
                invite_email: c.type === 'ghost' ? c.email : null,
                status: 'pending' 
            }));

            const { error: collabError } = await supabase.from('collaborations').insert(collabRows);
            if (!collabError) {
                // Send Invites
                formData.collaborators.filter(c => c.type === 'ghost').forEach(async (ghost) => {
                    const inviterName = user.user_metadata?.full_name || user.email;
                    await sendCollaboratorInvite(ghost.email, project.title, inviterName);
                });
            }
        }

        toast.success("Patch Deployed", { description: `${formData.version} is live.` });
        router.push(`/project/${slug}`);

    } catch (error) {
        console.error(error);
        toast.error("Deployment Failed", { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 animate-pulse">
            <GitCommit size={32} className="text-accent" />
            <span className="text-xs font-mono uppercase tracking-widest">Initializing Protocol...</span>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
            <div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                    <span>{project.title}</span>
                    <ChevronRight size={12} />
                    <span className="text-foreground">New_Log</span>
                </div>
                <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
                    <Layers size={28} className="text-accent" />
                    Deploy Update
                </h1>
            </div>
            
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.back()} className="h-10 rounded-none border-border font-mono text-xs uppercase">Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSaving} className="h-10 px-6 bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Push to Main"}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Metadata & Links */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* 1. Version Info */}
                <div className="p-5 border border-border bg-secondary/5 space-y-4 relative group">
                    <div className="absolute top-0 right-0 p-1">
                        <div className="w-2 h-2 bg-accent/50 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Version Tag</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">v</span>
                            <Input 
                                value={formData.version}
                                onChange={(e) => setFormData({...formData, version: e.target.value.replace(/[^0-9.]/g, '')})}
                                placeholder="1.0.0"
                                className="pl-6 h-10 rounded-none bg-background border-border focus:border-accent font-mono text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Update Title</label>
                        <Input 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="e.g. Major UI Overhaul"
                            className="h-10 rounded-none bg-background border-border focus:border-accent font-bold"
                        />
                    </div>
                </div>

                {/* 2. Metadata Links */}
                <div className="p-5 border border-border bg-secondary/5 space-y-4">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest block border-b border-border/50 pb-2">
                        Updated Endpoints
                    </label>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Globe size={12} /> <span>Live Demo</span></div>
                        <Input value={formData.demo_link} onChange={(e) => setFormData({...formData, demo_link: e.target.value})} placeholder="https://..." className="h-9 rounded-none bg-background border-border text-xs font-mono focus:border-accent" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Github size={12} /> <span>Repository</span></div>
                        <Input value={formData.source_link} onChange={(e) => setFormData({...formData, source_link: e.target.value})} placeholder="https://github.com/..." className="h-9 rounded-none bg-background border-border text-xs font-mono focus:border-accent" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Play size={12} /> <span>Video / Demo</span></div>
                        <Input value={formData.video_link} onChange={(e) => setFormData({...formData, video_link: e.target.value})} placeholder="https://youtube.com/..." className="h-9 rounded-none bg-background border-border text-xs font-mono focus:border-accent" />
                    </div>
                </div>

                {/* 3. New Collaborators */}
                <div className="p-5 border border-border bg-secondary/5">
                    <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                        <Users size={14} className="text-accent" /><label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Add Collaborators</label>
                    </div>
                    <CollaboratorManager 
                        collaborators={formData.collaborators} 
                        onAdd={handleAddCollaborator} 
                        onRemove={handleRemoveCollaborator} 
                    />
                </div>

                {/* 4. Visual Assets (Full Features) */}
                <div className="p-5 border border-border bg-secondary/5">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Assets</label>
                        <span className="text-[9px] font-mono text-muted-foreground">{formData.files.length}/4</span>
                    </div>
                    
                    {/* Draggable Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4 relative">
                        <AnimatePresence>
                        {formData.files.map((url, idx) => {
                            const isBeingDragged = draggedItemIndex === idx;
                            const isVideo = isVideoUrl(url);
                            const thumbnail = isVideo ? getYoutubeThumbnail(url) : url;

                            return (
                                <motion.div 
                                    layout
                                    key={url}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 500 }}
                                    
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragEnter={() => handleDragEnter(idx)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()} 

                                    className={`relative aspect-video bg-black border overflow-hidden cursor-grab active:cursor-grabbing group
                                        ${isBeingDragged ? 'border-accent opacity-50 scale-95 z-50' : 'border-border hover:border-accent/50'}
                                    `}
                                >
                                    {/* Grip Handle */}
                                    <div className="absolute top-1 left-1 z-20 bg-black/50 text-white p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <GripVertical size={10} />
                                    </div>

                                    {/* Thumbnail Image */}
                                    <Image 
                                        src={thumbnail || "/placeholder.jpg"} 
                                        alt={`Asset ${idx}`} 
                                        fill 
                                        className={`object-cover pointer-events-none select-none ${isVideo ? 'opacity-80' : ''}`} 
                                        unoptimized={true} 
                                    />

                                    {/* Play Overlay */}
                                    {isVideo && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                                <Youtube size={16} fill="currentColor" />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, files: prev.files.filter((_, i) => i !== idx)})) }} 
                                        className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                    >
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            );
                        })}
                        </AnimatePresence>
                    </div>

                    {/* Unified Upload Area */}
                    {formData.files.length < 4 && (
                        <div className="space-y-3">
                            <div 
                                onClick={() => fileInputRef.current?.click()} 
                                onDragOver={handleDragOverUpload}
                                onDragLeave={handleDragLeaveUpload}
                                onDrop={handleDropUpload}
                                className={`w-full h-24 border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all group
                                    ${isDraggingOver ? 'border-accent bg-accent/10 scale-[1.02]' : 'border-border hover:border-accent/50 bg-background'}
                                `}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={(e) => processFiles(e.target.files)} />
                                {isUploading ? <Loader2 className="animate-spin text-accent" /> : <UploadCloud className={`transition-colors ${isDraggingOver ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'}`} />}
                                <span className="text-[9px] font-mono uppercase text-muted-foreground">{isDraggingOver ? "Drop Files Now" : "Upload Images"}</span>
                            </div>
                            
                            <div className="flex gap-2">
                                <Input 
                                    value={youtubeInput} 
                                    onChange={(e) => setYoutubeInput(e.target.value)} 
                                    placeholder="or paste YouTube URL..." 
                                    className="h-9 rounded-none bg-background border-border text-xs font-mono focus:border-accent"
                                />
                                <Button onClick={addYoutubeLink} size="sm" className="h-9 w-9 rounded-none bg-secondary hover:bg-accent text-foreground hover:text-white p-0">
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Content Editor */}
            <div className="lg:col-span-2 flex flex-col">
                <div className="border border-border bg-background flex-1 flex flex-col min-h-[600px]">
                    <div className="p-3 border-b border-border bg-secondary/10 flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">./changelog.md</span>
                        <div className="flex gap-1.5 opacity-50">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                    </div>
                    {/* Editor takes full remaining height */}
                    <div className="flex-1 flex flex-col">
                        <RichTextEditor 
                            value={formData.content} 
                            onChange={(val) => setFormData({...formData, content: val})} 
                        />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}