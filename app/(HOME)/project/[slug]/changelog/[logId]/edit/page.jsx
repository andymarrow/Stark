"use client";
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Layers, ChevronRight, Loader2, GitCommit, 
  Link as LinkIcon, Github, Globe, Play, UploadCloud, X, Users, Plus, Trash2, GripVertical, Youtube 
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

// --- HELPERS ---
const isVideoUrl = (url) => url.includes("youtube.com") || url.includes("youtu.be");

const getYoutubeThumbnail = (url) => {
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1];
    
    if (videoId) {
        const cleanId = videoId.split("?")[0].split("/")[0];
        return `https://img.youtube.com/vi/${cleanId}/0.jpg`;
    }
    return null;
};

// HELPER: Extract Mentions
const extractMentions = (text) => {
    if (!text) return [];
    // Regex to match @[display](username) pattern used by Mention extension
    const regex = /@\[[^\]]+\]\(([^)]+)\)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]); // capturing group 1 is the username
    }
    return [...new Set(matches)]; // unique usernames
};

export default function EditChangelogPage({ params }) {
  const unwrappedParams = use(params);
  const { slug, logId } = unwrappedParams;

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [project, setProject] = useState(null);
  
  const [youtubeInput, setYoutubeInput] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const [formData, setFormData] = useState({
    version: "",
    title: "",
    content: "",
    files: [], 
    demo_link: "",
    source_link: "",
    video_link: "",
    collaborators: []
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (!slug || !logId) return;

    const init = async () => {
      try {
        const { data: projectData, error: projError } = await supabase
          .from("projects")
          .select("id, title, owner_id")
          .eq("slug", slug)
          .single();

        if (projError || !projectData) throw new Error("Project not found");
        if (projectData.owner_id !== user.id) {
            toast.error("Unauthorized");
            router.push(`/project/${slug}`);
            return;
        }
        setProject(projectData);

        const { data: logData, error: logError } = await supabase
            .from("project_logs")
            .select("*")
            .eq("id", logId)
            .single();

        if (logError) throw logError;

        setFormData({
            version: logData.version || "",
            title: logData.title || "",
            content: typeof logData.content === 'object' ? (logData.content.text || "") : (logData.content || ""),
            files: logData.media_urls || [],
            demo_link: logData.metadata?.demo_link || "",
            source_link: logData.metadata?.source_link || "",
            video_link: logData.metadata?.video_link || "",
            collaborators: [] 
        });

      } catch (err) {
        console.error(err);
        toast.error("Failed to load changelog data");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [slug, logId, user, authLoading, router]);

  // --- FILE PROCESSING ---
  const processFiles = async (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    
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

  // --- DRAG UPLOAD ---
  const handleDragOverUpload = (e) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeaveUpload = (e) => { e.preventDefault(); setIsDraggingOver(false); };
  const handleDropUpload = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    processFiles(e.dataTransfer.files);
  };

  // --- REORDERING ---
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

  // --- COLLABORATORS ---
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

  // --- SAVE ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
        const payload = {
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
        const { error } = await supabase.from("project_logs").update(payload).eq("id", logId);
        if (error) throw error;

        // 2. HANDLE MENTIONS IN DESCRIPTION (The Fix)
        const mentionedUsernames = extractMentions(formData.content);
        
        if (mentionedUsernames.length > 0) {
            // Fetch IDs
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, username')
                .in('username', mentionedUsernames);

            if (usersData?.length > 0) {
                // For updates, we usually only notify NEW mentions, but simple logic is notify all.
                // Or better: filter out users who already received a mention for this log (advanced)
                // For now, simple implementation:
                const notifications = usersData
                    .filter(u => u.id !== user.id)
                    .map(u => ({
                        receiver_id: u.id,
                        sender_id: user.id,
                        type: 'mention_in_project', // Reusing this type, works for changelogs too if link is correct
                        message: `mentioned you in an update for '${project.title}'.`,
                        link: `/project/${slug}` // Link to project main page
                    }));

                // Only insert if not exists recently? Or simple insert:
                if (notifications.length > 0) {
                    await supabase.from('notifications').insert(notifications);
                }
            }
        }

        toast.success("Log Updated");
        router.push(`/project/${slug}`);
    } catch (error) {
        toast.error("Failed to update");
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading || !project) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
            <div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                    <span>{project?.title}</span><ChevronRight size={12} /><span className="text-foreground">Edit_Log</span>
                </div>
                <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3"><Layers size={28} className="text-accent" /> Edit Update</h1>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.back()} className="h-10 rounded-none border-border font-mono text-xs uppercase">Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving} className="h-10 px-6 bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest">{isSaving ? <Loader2 className="animate-spin" size={16} /> : "Save Changes"}</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                
                {/* Meta Inputs */}
                <div className="p-5 border border-border bg-secondary/5 space-y-4 relative group">
                    <div className="absolute top-0 right-0 p-1"><div className="w-2 h-2 bg-accent/50 rounded-full animate-pulse" /></div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Version</label>
                        <Input value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} className="pl-6 h-10 rounded-none bg-background border-border" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Title</label>
                        <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="h-10 rounded-none bg-background border-border font-bold" />
                    </div>
                </div>

                {/* Endpoints */}
                <div className="p-5 border border-border bg-secondary/5 space-y-4">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest block border-b border-border/50 pb-2">Endpoints</label>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Globe size={12} /> <span>Live Demo</span></div>
                        <Input value={formData.demo_link} onChange={(e) => setFormData({...formData, demo_link: e.target.value})} className="h-9 rounded-none bg-background border-border text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Github size={12} /> <span>Repository</span></div>
                        <Input value={formData.source_link} onChange={(e) => setFormData({...formData, source_link: e.target.value})} className="h-9 rounded-none bg-background border-border text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Play size={12} /> <span>Video Walkthrough</span></div>
                        <Input value={formData.video_link} onChange={(e) => setFormData({...formData, video_link: e.target.value})} className="h-9 rounded-none bg-background border-border text-xs font-mono" />
                    </div>
                </div>

                {/* Collaborators */}
                <div className="p-5 border border-border bg-secondary/5">
                    <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                        <Users size={14} className="text-accent" /><label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Add Collaborators</label>
                    </div>
                    <CollaboratorManager collaborators={formData.collaborators} onAdd={handleAddCollaborator} onRemove={handleRemoveCollaborator} />
                </div>

                {/* --- ASSETS SECTION (WITH THUMBNAILS) --- */}
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

                                    {/* Play Overlay for Video */}
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

            {/* Right Column: Editor */}
            <div className="lg:col-span-2 flex flex-col">
                <div className="border border-border bg-background flex-1 flex flex-col min-h-[600px]">
                    <div className="p-3 border-b border-border bg-secondary/10"><span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">./changelog.md</span></div>
                    <div className="flex-1 flex flex-col">
                        <RichTextEditor value={formData.content} onChange={(val) => setFormData({...formData, content: val})} />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}