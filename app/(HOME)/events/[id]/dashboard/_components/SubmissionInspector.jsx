"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  X, ExternalLink, Globe, Save, Loader2, 
  Star, MessageSquare, Eye, Edit3, EyeOff,
  FileText, Radio, ShieldCheck, Terminal,
  Calendar, Zap, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { updateSubmissionNote } from "@/app/actions/updateSubmissionNote";
import { toggleFeatured } from "@/app/actions/toggleFeatured";
import { toggleSubmissionPublic } from "@/app/actions/toggleSubmissionPublic";
import ProjectChatTerminal from "@/app/(HOME)/project/[slug]/_components/ProjectChatTerminal";
import ProjectComments from "@/app/(HOME)/project/[slug]/_components/ProjectComments";

// Helper for YouTube Embeds
const getEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

// Helper: Ensure URLs have http:// so they don't break Next.js routing
const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

export default function SubmissionInspector({ submission, isOpen, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("details");
  const [note, setNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  useEffect(() => {
    if (submission) {
        setNote(submission.internal_notes || "");
        setActiveTab("details");
        setIsEditingNote(false);
    }
  }, [submission]);

  if (!submission) return null;

  const project = submission.project;
  const isVideo = project.thumbnail_url?.includes("youtube") || project.thumbnail_url?.includes("youtu.be");
  const embedUrl = isVideo ? getEmbedUrl(project.thumbnail_url) : null;
  const liveLink = ensureAbsoluteUrl(project.demo_link);

  // --- ACTIONS ---

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    const res = await updateSubmissionNote(submission.id, note);
    if (res.success) {
        toast.success("Log Entry Committed", {
            description: "Internal dossier has been synchronized."
        });
        onUpdate({ ...submission, internal_notes: note });
        setIsEditingNote(false);
    } else {
        toast.error("Sync Failure");
    }
    setIsSavingNote(false);
  };

  const handleFeature = async () => {
    const newState = !submission.is_featured;
    const res = await toggleFeatured(submission.id, newState);
    if (res.success) {
        toast.success(newState ? "Node Prioritized" : "Priority Cleared");
        onUpdate({ ...submission, is_featured: newState });
    }
  };

  const handleTogglePublic = async (newState) => {
    const res = await toggleSubmissionPublic(submission.id, newState);
    if (res.success) {
        toast.success(newState ? "Sector Made Public" : "Sector Hidden");
        onUpdate({ ...submission, is_public: newState });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0 border-l border-border bg-background flex flex-col gap-0 shadow-2xl overflow-hidden">
        
        {/* 1. MASTER HEADER */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-secondary/5 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
                    <span className="text-accent font-bold">NODE_ID:</span> {submission.id.slice(0, 8)}
                </div>
                <div className={`px-2 py-0.5 text-[9px] font-mono uppercase border font-bold ${submission.status === 'accepted' ? 'border-green-500 text-green-500 bg-green-500/5' : submission.status === 'rejected' ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-border'}`}>
                    {submission.status}
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-sm transition-colors text-muted-foreground">
                <X size={18} />
            </button>
        </div>

        {/* 2. SUB-NAVIGATION TABS */}
        <div className="flex bg-secondary/10 border-b border-border shrink-0">
            <TabTrigger 
                label="Dossier_Briefing" 
                icon={FileText} 
                active={activeTab === 'details'} 
                onClick={() => setActiveTab('details')} 
            />
            <TabTrigger 
                label="Comms_Channel" 
                icon={Radio} 
                active={activeTab === 'comms'} 
                onClick={() => setActiveTab('comms')} 
                isSpecial
            />
        </div>

        {/* 3. DYNAMIC CONTENT AREA */}
        <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
                {activeTab === 'details' ? (
                    <motion.div 
                        key="details" 
                        initial={{ opacity: 0, scale: 0.98 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="h-full flex flex-col"
                    >
                        <ScrollArea className="flex-1">
                            {/* Visual Preview Section */}
                            <div className="w-full aspect-video bg-black relative border-b border-border group">
                                {isVideo && embedUrl ? (
                                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
                                ) : (
                                    <Image 
                                        src={project.thumbnail_url || "/placeholder.jpg"} 
                                        alt={project.title} 
                                        fill 
                                        className="object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                                    />
                                )}
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Link href={`/project/${project.slug}`} target="_blank">
                                        <Button size="sm" className="rounded-none h-8 bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[9px] uppercase">
                                            Open Full View <ExternalLink size={10} className="ml-2" />
                                        </Button>
                                     </Link>
                                </div>
                            </div>

                            <div className="p-8 space-y-10">
                                
                                {/* A. Metadata Row (Views, Stars, Date) */}
                                <div className="grid grid-cols-3 gap-2 py-4 border-y border-border border-dashed text-center">
                                    <div className="flex flex-col gap-1">
                                        <Star size={14} className="mx-auto text-accent fill-accent" />
                                        <span className="text-lg font-bold font-mono leading-none">{project.likes_count || 0}</span>
                                        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Stars</span>
                                    </div>
                                    <div className="flex flex-col gap-1 border-l border-border">
                                        <Eye size={14} className="mx-auto text-muted-foreground" />
                                        <span className="text-lg font-bold font-mono leading-none">{project.views || 0}</span>
                                        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Views</span>
                                    </div>
                                    <div className="flex flex-col gap-1 border-l border-border">
                                        <Calendar size={14} className="mx-auto text-muted-foreground" />
                                        <span className="text-sm font-bold font-mono leading-none mt-1">{new Date(project.created_at).toLocaleDateString()}</span>
                                        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Created</span>
                                    </div>
                                </div>

                                {/* B. Title & Actions Block */}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1 max-w-[65%]">
                                        <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">{project.title}</h2>
                                        
                                        {/* Toolkit Tags */}
                                        {project.tags && project.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2">
                                                {project.tags.map((tag, i) => (
                                                    <span key={i} className="text-[9px] font-mono border border-border px-1.5 py-0.5 uppercase bg-secondary/10">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col items-end gap-2">
                                        {liveLink ? (
                                            <a href={liveLink} target="_blank" rel="noopener noreferrer" className="w-full">
                                                <Button size="sm" className="w-full h-9 rounded-none bg-foreground text-background hover:bg-accent hover:text-white font-mono text-[10px] uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                                                    Live_Deployment <Globe size={12} className="ml-2" />
                                                </Button>
                                            </a>
                                        ) : (
                                            <Button disabled size="sm" className="h-9 rounded-none font-mono text-[10px] uppercase opacity-50 cursor-not-allowed">
                                                No Demo Link
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* C. Description (FIXED: Re-added Description) */}
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.2em]">Project_Description</h3>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/80 leading-relaxed font-light bg-secondary/5 border border-border p-4">
                                        <p>{project.description || "// No description provided."}</p>
                                    </div>
                                </div>

                                {/* D. Personnel (Author & Team) */}
                                <div className="p-4 bg-secondary/5 border border-border flex flex-col md:flex-row gap-4 justify-between">
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest block">Owner / Lead</span>
                                        <Link href={`/profile/${project.author.username}`} target="_blank" className="flex items-center gap-2 group w-fit">
                                            <div className="relative w-8 h-8 border border-border overflow-hidden">
                                                <Image src={project.author.avatar_url || "/placeholder.jpg"} alt="av" fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase group-hover:text-accent transition-colors truncate max-w-[150px]">{project.author.full_name || project.author.username}</p>
                                                <p className="text-[9px] font-mono text-muted-foreground">@{project.author.username}</p>
                                            </div>
                                        </Link>
                                    </div>
                                    
                                    {project.collaborators && project.collaborators.length > 0 && (
                                        <div className="space-y-2 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-dashed border-border pt-2 md:pt-0">
                                            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                <Users size={10} /> Collaborators ({project.collaborators.length})
                                            </span>
                                            <div className="flex -space-x-2">
                                                {project.collaborators.map((c, i) => c.user && (
                                                    <Link key={i} href={`/profile/${c.user.username}`} target="_blank" title={`@${c.user.username}`}>
                                                        <div className="relative w-8 h-8 rounded-full border-2 border-background overflow-hidden hover:-translate-y-1 transition-transform">
                                                            <Image src={c.user.avatar_url || "/placeholder.jpg"} alt="collab" fill className="object-cover" />
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* E. Internal Mission Log Overhaul */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-border pb-2">
                                        <h3 className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-2">
                                            <Terminal size={14} className="text-accent" /> Internal_Mission_Log
                                        </h3>
                                        {!isEditingNote && (
                                            <button 
                                                onClick={() => setIsEditingNote(true)}
                                                className="text-[9px] font-mono text-accent hover:underline flex items-center gap-1 uppercase"
                                            >
                                                <Edit3 size={10} /> Edit_Entry
                                            </button>
                                        )}
                                    </div>

                                    {isEditingNote ? (
                                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="relative border border-accent/30 bg-accent/5 p-1">
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-accent/20" />
                                                <Textarea 
                                                    value={note} 
                                                    onChange={(e) => setNote(e.target.value)} 
                                                    placeholder="Log your findings for this node..." 
                                                    className="min-h-[150px] bg-transparent border-none rounded-none resize-none text-sm font-mono focus-visible:ring-0 p-3 leading-relaxed"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button onClick={() => setIsEditingNote(false)} variant="ghost" className="h-8 rounded-none text-[10px] font-mono uppercase text-muted-foreground hover:bg-secondary">
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleSaveNote} disabled={isSavingNote} className="h-8 rounded-none bg-accent hover:bg-red-700 text-white font-mono text-[10px] uppercase px-6">
                                                    {isSavingNote ? <Loader2 size={12} className="animate-spin mr-2" /> : <Save size={12} className="mr-2" />}
                                                    Commit_Log
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => setIsEditingNote(true)}
                                            className="group cursor-text p-4 bg-secondary/10 border border-border border-dashed hover:border-accent/30 transition-colors min-h-[100px] relative"
                                        >
                                            <p className={`text-sm font-mono leading-relaxed ${!note ? 'text-zinc-700 italic' : 'text-foreground/80'}`}>
                                                {note || "// NO_LOG_ENTRIES_FOR_THIS_NODE"}
                                            </p>
                                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono text-accent">
                                                CLICK_TO_EDIT
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
                                        <span>Status: {isSavingNote ? 'Syncing...' : 'Encrypted'}</span>
                                        <span>•</span>
                                        <span>Protocol: Internal_Review_v4</span>
                                    </div>
                                </div>
                                
                                {/* F. Public Community Feedback Embed */}
                                <div className="pt-8 border-t border-border">
                                    <ProjectComments projectId={project.id} />
                                </div>

                            </div>
                        </ScrollArea>

                        {/* Status Gating Console (Sticky Bottom) */}
                        <div className="border-t border-border bg-card p-6 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] shrink-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 border border-border bg-background/50">
                                    <div className="flex items-center gap-3">
                                        {submission.is_public ? <Eye size={16} className="text-green-500" /> : <EyeOff size={16} className="text-muted-foreground" />}
                                        <span className="text-[10px] font-mono font-bold uppercase">Visibility</span>
                                    </div>
                                    <Switch checked={submission.is_public} onCheckedChange={handleTogglePublic} className="data-[state=checked]:bg-green-500 scale-75" />
                                </div>

                                <div className="flex items-center justify-between p-3 border border-border bg-background/50">
                                    <div className="flex items-center gap-3">
                                        <Star size={16} className={submission.is_featured ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"} />
                                        <span className="text-[10px] font-mono font-bold uppercase">Featured</span>
                                    </div>
                                    <button 
                                        onClick={handleFeature}
                                        className={`px-2 py-1 border text-[9px] font-mono uppercase transition-colors ${submission.is_featured ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5' : 'border-border text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {submission.is_featured ? 'Remove' : 'Set'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="comms" 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 20 }}
                        className="h-full bg-zinc-950"
                    >
                        <ProjectChatTerminal 
                            submissionId={submission.id} 
                            role="HOST" 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- SUB-COMPONENTS ---

function TabTrigger({ label, icon: Icon, active, onClick, isSpecial }) {
    return (
        <button 
            onClick={onClick}
            className={`
                flex-1 flex items-center justify-center gap-3 h-14 font-mono text-[11px] uppercase tracking-widest transition-all relative border-r last:border-r-0 border-border
                ${active 
                    ? isSpecial ? 'bg-accent text-white' : 'bg-background text-foreground' 
                    : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground'}
            `}
        >
            <Icon size={14} className={isSpecial && active ? 'animate-pulse' : ''} />
            <span className="font-bold">{label}</span>
            {active && !isSpecial && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-accent" />}
        </button>
    )
}