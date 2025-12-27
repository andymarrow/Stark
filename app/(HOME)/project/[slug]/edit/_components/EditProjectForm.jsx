"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Trash2, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/app/_context/AuthContext";
import RichTextEditor from "@/app/(HOME)/create/_components/RichTextEditor"; // Import the RichTextEditor

export default function EditProjectForm({ project }) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Initialize state
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || "", // Ensure string
    source_link: project.source_link || "",
    demo_link: project.demo_link || "",
    tagsInput: project.techStack ? project.techStack.map(t => t.name || t).join(", ") : "",
    images: project.images || []
  });

  // --- IMAGE UPLOAD HANDLER ---
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", { description: "Max size is 5MB." });
        return;
    }

    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `projects/${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('project-assets')
            .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
            .from('project-assets')
            .getPublicUrl(fileName);
        
        setFormData(prev => ({ 
            ...prev, 
            images: [...prev.images, publicUrl] 
        }));
        
        toast.success("Asset Added");
    } catch (error) {
        console.error(error);
        toast.error("Upload Failed", { description: error.message });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageRemove = (indexToRemove) => {
    const newImages = formData.images.filter((_, i) => i !== indexToRemove);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    setIsLoading(true);
    try {
        const tagArray = formData.tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        const { error } = await supabase
            .from('projects')
            .update({
                title: formData.title,
                description: formData.description, // Updated via RichTextEditor
                source_link: formData.source_link,
                demo_link: formData.demo_link,
                tags: tagArray,
                images: formData.images,
                thumbnail_url: formData.images.length > 0 ? formData.images[0] : null
            })
            .eq('id', project.id);

        if (error) throw error;

        toast.success("Project Updated", { description: "Changes have been deployed." });
        router.refresh(); 
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
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
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
                <p className="text-xs font-mono text-muted-foreground">ID: {project.id}</p>
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
                disabled={isLoading || isUploading}
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
                    
                    {/* RICH TEXT EDITOR */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold">Description / Readme.md</label>
                        <RichTextEditor 
                            value={formData.description} 
                            onChange={(val) => setFormData({...formData, description: val})} 
                        />
                    </div>
                </div>
            </section>

            {/* Media Management */}
            <section className="bg-background border border-border p-6 space-y-6">
                <div className="flex justify-between items-end border-b border-border pb-2">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        Visual Assets
                    </h3>
                    <span className="text-xs text-muted-foreground">{formData.images.length} Active</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((img, i) => (
                        <div key={i} className="group relative aspect-video bg-secondary border border-border overflow-hidden">
                            <Image src={img} alt="Asset" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={() => handleImageRemove(i)}
                                    className="p-2 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-none"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/50 text-white text-[9px] font-mono px-1">IMG_0{i+1}</span>
                            </div>
                        </div>
                    ))}
                    
                    {/* Upload Button */}
                    <div 
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 transition-colors bg-secondary/5 h-full min-h-[100px] group
                            ${isUploading ? 'cursor-wait opacity-50' : 'cursor-pointer hover:border-accent/50'}
                        `}
                    >
                        {isUploading ? (
                            <Loader2 className="animate-spin text-accent" size={24} />
                        ) : (
                            <UploadCloud size={24} className="text-muted-foreground group-hover:text-accent" />
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {isUploading ? "Uploading..." : "Upload New"}
                        </span>
                    </div>
                </div>
            </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-8">
            {/* Links */}
            <section className="bg-background border border-border p-6 space-y-6">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Source Links</h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Repository URL</label>
                        <Input 
                            value={formData.source_link}
                            onChange={(e) => setFormData({...formData, source_link: e.target.value})}
                            className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Live Demo URL</label>
                        <Input 
                            value={formData.demo_link}
                            onChange={(e) => setFormData({...formData, demo_link: e.target.value})}
                            className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs"
                        />
                    </div>
                </div>
            </section>

            {/* Tags */}
            <section className="bg-background border border-border p-6 space-y-6">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Classifications</h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Tech Stack (Comma sep)</label>
                        <Input 
                            value={formData.tagsInput}
                            onChange={(e) => setFormData({...formData, tagsInput: e.target.value})}
                            className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.tagsInput.split(',').filter(Boolean).map((t, i) => (
                            <span key={i} className="px-2 py-1 bg-secondary text-[10px] font-mono border border-border">{t.trim()}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="border border-destructive/20 bg-destructive/5 p-6 space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle size={16} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Danger Zone</h3>
                </div>
                <p className="text-xs text-muted-foreground">Deleting this project is irreversible.</p>
                <Button 
                    variant="outline" 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-white rounded-none h-10 text-xs font-mono uppercase"
                >
                    Delete Project
                </Button>
            </section>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-destructive/50 bg-background p-0 rounded-none gap-0 sm:max-w-[400px]">
            <DialogHeader className="p-6 border-b border-destructive/20 bg-destructive/5">
                <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle size={20} /> Confirm Deletion
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-muted-foreground mt-2">
                    Are you sure? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-4 bg-background flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-none border-border">Cancel</Button>
                <Button onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-white rounded-none">
                    {isDeleting ? <Loader2 className="animate-spin" /> : "Confirm Delete"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}