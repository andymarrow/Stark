"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  X, ExternalLink, Github, Globe, Save, Loader2, 
  CheckCircle2, XCircle, Star, MessageSquare, Eye 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch"; // Import Switch
import { toast } from "sonner";
import { updateSubmissionNote } from "@/app/actions/updateSubmissionNote";
import { toggleFeatured } from "@/app/actions/toggleFeatured";
import { toggleSubmissionPublic } from "@/app/actions/toggleSubmissionPublic"; // NEW

// Helper for YouTube Embeds
const getEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

export default function SubmissionInspector({ submission, isOpen, onClose, onUpdate }) {
  const [note, setNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  // Sync local state when submission opens
  useEffect(() => {
    if (submission) {
        setNote(submission.internal_notes || "");
    }
  }, [submission]);

  if (!submission) return null;

  const project = submission.project;
  const isVideo = project.thumbnail_url?.includes("youtube") || project.thumbnail_url?.includes("youtu.be");
  const embedUrl = isVideo ? getEmbedUrl(project.thumbnail_url) : null;

  // --- ACTIONS ---

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    const res = await updateSubmissionNote(submission.id, note);
    if (res.success) {
        toast.success("Internal Log Updated");
        onUpdate({ ...submission, internal_notes: note }); // Update parent
    } else {
        toast.error("Save Failed");
    }
    setIsSavingNote(false);
  };

  const handleFeature = async () => {
    const newState = !submission.is_featured;
    const res = await toggleFeatured(submission.id, newState);
    if (res.success) {
        toast.success(newState ? "Project Featured" : "Un-featured");
        onUpdate({ ...submission, is_featured: newState });
    }
  };

  const handleTogglePublic = async (newState) => {
    const res = await toggleSubmissionPublic(submission.id, newState);
    if (res.success) {
        toast.success(newState ? "Project Visible to Public" : "Project Hidden");
        onUpdate({ ...submission, is_public: newState });
    } else {
        toast.error("Action Failed");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 border-l border-border bg-background flex flex-col gap-0 shadow-2xl">
        
        {/* 1. Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-secondary/5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
                <span>Dossier_ID: {submission.id.slice(0, 8)}</span>
                <div className={`px-1.5 py-0.5 border ${submission.status === 'accepted' ? 'border-green-500 text-green-500' : submission.status === 'rejected' ? 'border-red-500 text-red-500' : 'border-border'}`}>
                    {submission.status}
                </div>
            </div>
            
        </div>

        {/* 2. Scrollable Content */}
        <ScrollArea className="flex-1">
            
            {/* Visuals */}
            <div className="w-full aspect-video bg-black relative">
                {isVideo && embedUrl ? (
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
                ) : (
                    <div className="relative w-full h-full">
                        <Image 
                            src={project.thumbnail_url || "/placeholder.jpg"} 
                            alt={project.title} 
                            fill 
                            className="object-contain" 
                        />
                    </div>
                )}
            </div>

            <div className="p-6 space-y-8">
                
                {/* Title & Author */}
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">
                        {project.title}
                    </h2>
                    <Link href={`/profile/${project.author.username}`} target="_blank" className="flex items-center gap-2 group w-fit">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-border">
                            <Image src={project.author.avatar_url || "/placeholder.jpg"} alt="av" fill className="object-cover" />
                        </div>
                        <span className="text-sm font-mono text-muted-foreground group-hover:text-accent transition-colors">
                            @{project.author.username}
                        </span>
                    </Link>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <h3 className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Description</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/80 leading-relaxed">
                        {/* Simple rendering, complex markdown might need the full renderer if desired */}
                        <p>{project.description?.substring(0, 500)}...</p>
                    </div>
                </div>

                {/* Links */}
                <div className="flex gap-3">
                    <Link href={`/project/${project.slug}`} target="_blank" className="flex-1">
                        <Button variant="outline" className="w-full h-10 rounded-none border-border font-mono text-xs uppercase hover:bg-secondary">
                            <ExternalLink size={14} className="mr-2" /> Full Dossier
                        </Button>
                    </Link>
                    {project.demo_link && (
                        <a href={project.demo_link} target="_blank" className="flex-1">
                            <Button variant="outline" className="w-full h-10 rounded-none border-border font-mono text-xs uppercase hover:bg-secondary">
                                <Globe size={14} className="mr-2" /> Live Demo
                            </Button>
                        </a>
                    )}
                </div>

            </div>
        </ScrollArea>

        {/* 3. Admin Console (Sticky Bottom) */}
        <div className="border-t border-border bg-card p-6 space-y-4">
            
            {/* Visibility Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase flex items-center gap-2">
                    <Eye size={14} className={submission.is_public ? "text-green-500" : "text-muted-foreground"} />
                    {submission.is_public ? "Public Visibility: ON" : "Public Visibility: OFF"}
                </span>
                <Switch 
                    checked={submission.is_public}
                    onCheckedChange={handleTogglePublic}
                    className="data-[state=checked]:bg-green-500"
                />
            </div>

            {/* Feature Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase flex items-center gap-2">
                    <Star size={14} className={submission.is_featured ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"} />
                    {submission.is_featured ? "Featured Submission" : "Standard Submission"}
                </span>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleFeature}
                    className="h-7 text-[10px] uppercase font-mono border border-border hover:bg-secondary"
                >
                    {submission.is_featured ? "Remove Star" : "Add Star"}
                </Button>
            </div>

            {/* Internal Notes */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-2">
                        <MessageSquare size={12} /> Internal Log (Private)
                    </label>
                    {note !== submission.internal_notes && (
                        <span className="text-[9px] text-amber-500 font-mono animate-pulse">UNSAVED CHANGES</span>
                    )}
                </div>
                <div className="relative">
                    <Textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add notes for yourself..."
                        className="min-h-[80px] bg-secondary/10 border-border rounded-none resize-none text-xs font-mono focus:border-accent pr-12"
                    />
                    <Button 
                        size="icon" 
                        onClick={handleSaveNote} 
                        disabled={isSavingNote || note === submission.internal_notes}
                        className="absolute bottom-2 right-2 h-6 w-6 rounded-none bg-foreground hover:bg-accent disabled:opacity-0 transition-all"
                    >
                        {isSavingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    </Button>
                </div>
            </div>

        </div>

      </SheetContent>
    </Sheet>
  );
}