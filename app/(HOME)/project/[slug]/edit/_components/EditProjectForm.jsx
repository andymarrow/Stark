"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, Trash2, AlertTriangle, ArrowLeft, Loader2, Users, 
  Youtube, GripVertical, Plus, ImageIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/app/_context/AuthContext";
import { motion, AnimatePresence } from "framer-motion"; // Added for Reordering
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
        return `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`;
    }
    return null;
};

// Helper: Extract Mentions
const extractMentions = (text) => {
    if (!text) return [];
    const regex = /@\[[^\]]+\]\(([^)]+)\)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]); // username
    }
    return [...new Set(matches)];
};

// Helper: Slug Generator
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

export default function EditProjectForm({ project }) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Media State
  const [videoLink, setVideoLink] = useState(""); 
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  // Initialize state
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || "", 
    source_link: project.source_link || "",
    demo_link: project.demo_link || "",
    tagsInput: project.techStack ? project.techStack.map(t => t.name || t).join(", ") : "",
    images: project.images || [],
    rawFiles: [], // Stores pending uploads { preview: 'blob...', file: File }
    collaborators: [] 
  });

  // --- 1. FETCH COLLABORATORS ---
  useEffect(() => {
    const fetchCollaborators = async () => {
        const { data, error } = await supabase
            .from('collaborations')
            .select(`id, status, user:profiles!user_id(id, username, avatar_url), invite_email`)
            .eq('project_id', project.id);

        if (!error && data) {
            const formatted = data.map(c => ({
                type: c.user ? 'user' : 'ghost',
                id: c.user?.id || c.invite_email,
                dbId: c.id,
                username: c.user?.username,
                avatar_url: c.user?.avatar_url,
                email: c.invite_email,
                status: c.status
            }));
            setFormData(prev => ({ ...prev, collaborators: formatted }));
        }
    };
    fetchCollaborators();
  }, [project.id]);

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
  }, [formData.images]);

  // --- 3. MEDIA HANDLERS ---

  const processFiles = (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
            toast.error(`Skipped ${file.name} (Max 5MB)`);
            return;
        }
    }

    const newRawFiles = [];
    const newPreviewUrls = [];

    files.forEach(file => {
        const objectUrl = URL.createObjectURL(file);
        newPreviewUrls.push(objectUrl);
        newRawFiles.push({ preview: objectUrl, file: file });
    });

    setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newPreviewUrls],
        rawFiles: [...prev.rawFiles, ...newRawFiles]
    }));

    toast.success(`${files.length} Assets Added`);
  };

  const handleDragOverUpload = (e) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeaveUpload = (e) => { e.preventDefault(); setIsDraggingOver(false); };
  const handleDropUpload = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleAddVideo = () => {
    if (!videoLink) return;
    if (!isVideoUrl(videoLink)) {
        toast.error("Invalid Link", { description: "Only YouTube links supported." });
        return;
    }
    setFormData(prev => ({
        ...prev,
        images: [...prev.images, videoLink]
    }));
    setVideoLink("");
    toast.success("Video Added");
  };

  // --- 4. REORDERING LOGIC ---
  const handleDragStart = (index) => setDraggedItemIndex(index);
  const handleDragEnter = (index) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newImages = [...formData.images];
    const draggedItem = newImages[draggedItemIndex];
    newImages.splice(draggedItemIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setFormData(prev => ({ ...prev, images: newImages }));
    setDraggedItemIndex(index);
  };
  const handleDragEnd = () => setDraggedItemIndex(null);

  const handleRemoveMedia = (indexToRemove) => {
    const fileToRemove = formData.images[indexToRemove];
    if (fileToRemove.startsWith('blob:')) URL.revokeObjectURL(fileToRemove); // Clean up memory

    setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== indexToRemove),
        rawFiles: prev.rawFiles.filter(r => r.preview !== fileToRemove)
    }));
  };

  // --- 5. COLLABORATOR HANDLERS ---
  const handleAddCollaborator = (newCollab) => {
    setFormData(prev => ({ ...prev, collaborators: [...prev.collaborators, { ...newCollab, isNew: true }] }));
  };

  const handleRemoveCollaborator = async (collabToRemove) => {
    if (collabToRemove.isNew) {
        setFormData(prev => ({ ...prev, collaborators: prev.collaborators.filter(c => c !== collabToRemove) }));
        return;
    }
    try {
        const { error } = await supabase.from('collaborations').delete().eq('id', collabToRemove.dbId);
        if (error) throw error;
        setFormData(prev => ({ ...prev, collaborators: prev.collaborators.filter(c => c.dbId !== collabToRemove.dbId) }));
        toast.success("Collaborator Removed");
    } catch (err) {
        toast.error("Failed to remove collaborator");
    }
  };

  // --- 6. SAVE LOGIC ---
  const handleSave = async () => {
    setIsLoading(true);
    try {
        // A. Upload New Images (Blobs)
        const finalImages = await Promise.all(formData.images.map(async (url) => {
            if (url.startsWith('blob:')) {
                const rawEntry = formData.rawFiles.find(r => r.preview === url);
                if (rawEntry && rawEntry.file) {
                    const fileExt = rawEntry.file.name.split('.').pop();
                    const fileName = `projects/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, rawEntry.file);
                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);
                    return publicUrl;
                }
            }
            return url; // Existing URL (Supabase or YouTube)
        }));

        const tagArray = formData.tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        // B. Generate new slug if title changed (FIXED)
        let newSlug = project.slug;
        if (formData.title !== project.title) {
            const baseSlug = generateSlug(formData.title);
            // Append random string to ensure uniqueness
            newSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
        }

        // C. Update Project
        const { error: projectError } = await supabase
            .from('projects')
            .update({
                title: formData.title,
                slug: newSlug, // <--- UPDATE SLUG
                description: formData.description,
                source_link: formData.source_link,
                demo_link: formData.demo_link,
                tags: tagArray,
                images: finalImages,
                thumbnail_url: finalImages[0] || null
            })
            .eq('id', project.id);

        if (projectError) throw projectError;

        // D. Process New Collaborators
        const newCollaborators = formData.collaborators.filter(c => c.isNew);
        if (newCollaborators.length > 0) {
            const collabRows = newCollaborators.map(c => ({
                project_id: project.id,
                user_id: c.type === 'user' ? c.id : null,
                invite_email: c.type === 'ghost' ? c.email : null,
                status: 'pending' 
            }));

            const { error: collabError } = await supabase.from('collaborations').insert(collabRows);
            if (!collabError) {
                const ghostInvites = newCollaborators.filter(c => c.type === 'ghost');
                ghostInvites.forEach(async (ghost) => {
                    const inviterName = user.user_metadata?.full_name || user.email;
                    await sendCollaboratorInvite(ghost.email, formData.title, inviterName);
                });
            }
        }

        // E. HANDLE MENTIONS IN DESCRIPTION
        const mentionedUsernames = extractMentions(formData.description);
        
        if (mentionedUsernames.length > 0) {
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, username')
                .in('username', mentionedUsernames);

            if (usersData?.length > 0) {
                const notifications = usersData
                    .filter(u => u.id !== user.id) 
                    .map(u => ({
                        receiver_id: u.id,
                        sender_id: user.id,
                        type: 'mention_in_project', 
                        message: `mentioned you in the updated documentation for '${formData.title}'.`,
                        link: `/project/${newSlug}` // Updated link to new slug
                    }));

                if (notifications.length > 0) {
                    await supabase.from('notifications').insert(notifications);
                }
            }
        }

        toast.success("Project Updated", { description: "Changes have been deployed." });
        
        // F. Handle Redirect if slug changed
        if (newSlug !== project.slug) {
            router.push(`/project/${newSlug}`); 
        } else {
            router.refresh();
        }

    } catch (error) {
        toast.error("Update Failed", { description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        const { error } = await supabase.from('projects').delete().eq('id', project.id);
        if (error) throw error;
        toast.success("Project Deleted");
        router.push("/profile");
    } catch (error) {
        toast.error("Delete Failed", { description: error.message });
        setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* Hidden Inputs for Button Triggers */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => processFiles(e.target.files)} 
        className="hidden" 
        accept="image/*"
        multiple
      />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Link href={`/project/${project.slug}`}>
                <Button variant="ghost" className="h-10 w-10 p-0 rounded-none border border-border text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={18} />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    TARGET: <span className="text-foreground font-bold">{project.title}</span>
                </p>
            </div>
        </div>
        <div className="flex gap-3">
            <Link href={`/project/${project.slug}`}>
                <Button variant="outline" className="h-12 rounded-none border-border font-mono text-xs uppercase hidden sm:flex">
                    Cancel
                </Button>
            </Link>
            <Button 
                onClick={handleSave}
                disabled={isLoading}
                className="h-12 px-8 bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest min-w-[140px]"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : "Save Changes"}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* General */}
            <section className="bg-background border border-border p-6 space-y-6">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    General Configuration
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold">Project Title</label>
                        <Input 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="h-12 rounded-none bg-secondary/5 border-border focus:border-accent font-bold"
                        />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold">Description / Readme.md</label>
                        <RichTextEditor 
                            value={formData.description} 
                            onChange={(val) => setFormData({...formData, description: val})} 
                        />
                    </div>
                </div>
            </section>

            {/* COLLABORATORS */}
            <section className="bg-background border border-border p-6 space-y-6">
                <div className="flex justify-between items-end border-b border-border pb-2">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        Team & Access
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users size={14} />
                        {formData.collaborators.length} Members
                    </div>
                </div>
                <CollaboratorManager 
                    collaborators={formData.collaborators}
                    onAdd={handleAddCollaborator}
                    onRemove={handleRemoveCollaborator}
                />
            </section>

            {/* MEDIA MANAGEMENT (NEW & IMPROVED) */}
            <section className="bg-background border border-border p-6 space-y-6">
                <div className="flex justify-between items-end border-b border-border pb-2">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        Visual Assets
                    </h3>
                    <span className="text-xs text-muted-foreground">{formData.images.length} Active</span>
                </div>

                {/* 1. Add Video Input */}
                <div className="relative flex items-center border border-border focus-within:border-accent transition-colors">
                    <div className="absolute left-3 text-muted-foreground"><Youtube size={18} /></div>
                    <input 
                        type="text" 
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        placeholder="Paste YouTube Link..."
                        className="w-full h-10 pl-10 pr-20 bg-transparent outline-none font-mono text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
                    />
                    <button onClick={handleAddVideo} disabled={!videoLink} className="absolute right-2 px-3 py-1 bg-secondary text-foreground text-[9px] font-mono uppercase hover:bg-accent hover:text-white transition-colors">
                        Add Video
                    </button>
                </div>

                {/* 2. Drag & Drop Zone */}
                <div 
                    className={`
                        h-24 border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group
                        ${isDraggingOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 bg-secondary/5'}
                    `}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOverUpload}
                    onDragLeave={handleDragLeaveUpload}
                    onDrop={handleDropUpload}
                >
                    <div className="flex flex-col items-center text-center pointer-events-none">
                        <UploadCloud size={20} className={isDraggingOver ? 'text-accent' : 'text-muted-foreground'} />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                            Drag & Drop / Paste Images
                        </span>
                    </div>
                </div>

                {/* 3. Sortable Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {formData.images.map((url, idx) => {
                            const isVideo = isVideoUrl(url);
                            const thumbnail = isVideo ? getYoutubeThumbnail(url) : url;
                            const isBeingDragged = draggedItemIndex === idx;

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
                                    className={`relative aspect-video group bg-secondary border overflow-hidden cursor-grab active:cursor-grabbing
                                        ${isBeingDragged ? 'border-accent opacity-50 z-50' : 'border-border hover:border-accent/50'}
                                    `}
                                >
                                    {/* Handle */}
                                    <div className="absolute top-2 left-2 z-20 bg-black/50 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <GripVertical size={12} />
                                    </div>

                                    <Image src={thumbnail || "/placeholder.jpg"} alt="Asset" fill className="object-cover pointer-events-none" />
                                    
                                    {isVideo && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white"><Youtube size={16} fill="currentColor" /></div>
                                        </div>
                                    )}

                                    {/* Delete */}
                                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveMedia(idx); }} className="p-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] font-mono px-2 py-1 flex justify-between pointer-events-none">
                                        <span>{isVideo ? "VIDEO" : `IMG_0${idx+1}`}</span>
                                        <span className="opacity-50">#{idx+1}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-8">
            {/* Links & Tags Sections remain same */}
            <section className="bg-background border border-border p-6 space-y-6">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Source Links</h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Repository URL</label>
                        <Input value={formData.source_link} onChange={(e) => setFormData({...formData, source_link: e.target.value})} className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Live Demo URL</label>
                        <Input value={formData.demo_link} onChange={(e) => setFormData({...formData, demo_link: e.target.value})} className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs" />
                    </div>
                </div>
            </section>

            <section className="bg-background border border-border p-6 space-y-6">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Classifications</h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Tech Stack (Comma sep)</label>
                        <Input value={formData.tagsInput} onChange={(e) => setFormData({...formData, tagsInput: e.target.value})} className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.tagsInput.split(',').filter(Boolean).map((t, i) => (
                            <span key={i} className="px-2 py-1 bg-secondary text-[10px] font-mono border border-border">{t.trim()}</span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border border-destructive/20 bg-destructive/5 p-6 space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle size={16} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Danger Zone</h3>
                </div>
                <p className="text-xs text-muted-foreground">Deleting this project is irreversible.</p>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-white rounded-none h-10 text-xs font-mono uppercase">Delete Project</Button>
            </section>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-destructive/50 bg-background p-0 rounded-none gap-0 sm:max-w-[400px]">
            <DialogHeader className="p-6 border-b border-destructive/20 bg-destructive/5">
                <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2"><AlertTriangle size={20} /> Confirm Deletion</DialogTitle>
                <DialogDescription className="text-xs font-mono text-muted-foreground mt-2">Are you sure? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-4 bg-background flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-none border-border">Cancel</Button>
                <Button onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-white rounded-none">{isDeleting ? <Loader2 className="animate-spin" /> : "Confirm Delete"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}