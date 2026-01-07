"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitCommit, ChevronDown, Calendar, Heart, 
  Globe, Github, Trash2, Edit3, MoreHorizontal, Play, AlertTriangle, Loader2, X 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import ProjectComments from "./ProjectComments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ImageLightbox from "./ImageLightbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// --- HELPERS ---
const isVideoUrl = (url) => url && (url.includes("youtube.com") || url.includes("youtu.be"));

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

const getEmbedUrl = (url) => {
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1];
    
    if (videoId) {
        const cleanId = videoId.split("?")[0].split("/")[0];
        return `https://www.youtube.com/embed/${cleanId}?autoplay=1`;
    }
    return url;
};

export default function ChangelogTimeline({ projectId, isOwner, projectSlug }) {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [likedLogs, setLikedLogs] = useState(new Set());
  
  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Active Video State
  const [playingVideo, setPlayingVideo] = useState(null);

  // Delete State
  const [logToDelete, setLogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 1. POINTER_EVENT RECOVERY LOGIC (FIX FOR STUCK UI) ---
  useEffect(() => {
    if (!logToDelete) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = "auto";
        document.body.style.overflow = "auto";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [logToDelete]);

  useEffect(() => {
    if (!projectId) return;
    fetchLogs();
  }, [projectId]);

  const fetchLogs = async () => {
    try {
      const { data: logsData, error } = await supabase
        .from("project_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      if (logsData) {
        setLogs(logsData);
        if(logsData.length > 0 && !expandedId) setExpandedId(logsData[0].id);
      }

      if (user) {
          const { data: likes } = await supabase.from("project_log_likes").select("log_id").eq("user_id", user.id);
          if (likes) setLikedLogs(new Set(likes.map(l => l.log_id)));
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- STRICT DELETE HANDLER ---
  const confirmDelete = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    
    try {
        const { error, count } = await supabase
            .from("project_logs")
            .delete()
            .eq("id", logToDelete.id)
            .select(); 

        if (error) throw new Error(error.message);
        if (count === 0 && !error) throw new Error("Permission denied or log not found.");
        
        // Optimistic UI update
        setLogs(prev => prev.filter(l => l.id !== logToDelete.id));
        toast.success("Log Purged Successfully");
        setLogToDelete(null); 
    } catch (error) {
        console.error("Delete Error:", error);
        toast.error("Delete Failed: " + error.message);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleEdit = (id) => {
    router.push(`/project/${projectSlug}/changelog/${id}/edit`);
  };

  const handleLike = async (e, log) => {
    e.stopPropagation();
    if (!user) { toast.error("Login Required"); return; }

    const isLiked = likedLogs.has(log.id);
    const newSet = new Set(likedLogs);
    if (isLiked) newSet.delete(log.id); else newSet.add(log.id);
    setLikedLogs(newSet);

    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, likes_count: isLiked ? l.likes_count - 1 : l.likes_count + 1 } : l));

    if (isLiked) await supabase.from("project_log_likes").delete().match({ user_id: user.id, log_id: log.id });
    else await supabase.from("project_log_likes").insert({ user_id: user.id, log_id: log.id });
  };

  const handleMediaClick = (url, index, allMedia) => {
    // Pass ALL media (images + videos) to lightbox
    setLightboxImages(allMedia);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) return <div className="py-12 text-center text-xs font-mono animate-pulse">SYNCING_TIMELINE...</div>;

  if (logs.length === 0) return (
    <div className="border border-dashed border-border bg-secondary/5 p-12 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"><GitCommit size={24} /></div>
        <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">No Version History</p>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Initial Release Only</p>
        </div>
    </div>
  );

  return (
    <div className="relative pl-4">
      {/* Spine */}
      <div className="absolute left-[27px] top-6 bottom-6 w-px border-l border-dashed border-border/50" />

      {logs.map((log) => {
        const isExpanded = expandedId === log.id;
        const isLiked = likedLogs.has(log.id);
        const hasMedia = log.media_urls && log.media_urls.length > 0;
        
        return (
          <div key={log.id} className="relative pl-10 pb-10 group">
            
            {/* Connector Node */}
            <button 
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className={`
                    absolute left-3 w-8 h-8 -translate-x-1/2 flex items-center justify-center border transition-all z-10
                    ${isExpanded 
                        ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                        : 'bg-background border-border text-muted-foreground hover:border-foreground'}
                `}
                style={{ transform: "rotate(45deg) translateX(-50%)" }}
            >
                <div style={{ transform: "rotate(-45deg)" }}><GitCommit size={14} /></div>
            </button>

            {/* Main Card */}
            <motion.div 
                layout
                className={`border transition-all duration-300 overflow-hidden relative ${isExpanded ? 'bg-background border-accent/50 shadow-lg' : 'bg-card border-border'}`}
            >
                {/* Header Row */}
                <div onClick={() => setExpandedId(isExpanded ? null : log.id)} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none">
                    <div className="flex items-center gap-4">
                        <span className={`text-xs font-mono px-2 py-1 border uppercase font-bold ${isExpanded ? 'bg-accent/10 text-accent border-accent/20' : 'bg-secondary text-foreground border-border'}`}>
                            v{log.version}
                        </span>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">{log.title}</h3>
                            <span className="text-[10px] font-mono text-muted-foreground md:hidden">{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 text-xs font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(log.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => handleLike(e, log)}
                                className={`flex items-center gap-1.5 text-xs font-mono transition-colors border px-3 py-1.5 hover:border-accent ${isLiked ? 'text-accent border-accent/30 bg-accent/5' : 'text-muted-foreground border-transparent'}`}
                            >
                                <Heart size={12} fill={isLiked ? "currentColor" : "none"} /> {log.likes_count}
                            </button>

                            {isOwner && (
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-none border-border bg-black text-zinc-400 min-w-[140px] z-50">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(log.id); }} className="focus:text-foreground cursor-pointer text-xs font-mono uppercase">
                                            <Edit3 className="mr-2 h-3 w-3" /> Edit Log
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLogToDelete(log); }} className="text-red-500 focus:text-red-400 focus:bg-red-900/10 cursor-pointer text-xs font-mono uppercase">
                                            <Trash2 className="mr-2 h-3 w-3" /> Purge
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            
                            <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180 text-accent' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                            <div className="px-6 pb-8 border-t border-border/50 pt-6">
                                
                                {/* 1. Metadata Links */}
                                {log.metadata && (log.metadata.demo_link || log.metadata.source_link || log.metadata.video_link) && (
                                    <div className="flex flex-wrap gap-3 mb-8 pb-6 border-b border-dashed border-border/50">
                                        {log.metadata.demo_link && (
                                            <a href={log.metadata.demo_link} target="_blank" className="flex items-center gap-2 text-xs font-mono uppercase text-accent hover:underline border border-accent/20 px-3 py-1.5 bg-accent/5 transition-colors hover:bg-accent/10">
                                                <Globe size={12} /> Live Demo
                                            </a>
                                        )}
                                        {log.metadata.source_link && (
                                            <a href={log.metadata.source_link} target="_blank" className="flex items-center gap-2 text-xs font-mono uppercase text-foreground hover:underline border border-border px-3 py-1.5 bg-secondary/10 transition-colors hover:bg-secondary/30">
                                                <Github size={12} /> Source
                                            </a>
                                        )}
                                        {log.metadata.video_link && (
                                            <a href={log.metadata.video_link} target="_blank" className="flex items-center gap-2 text-xs font-mono uppercase text-red-400 hover:underline border border-red-500/20 px-3 py-1.5 bg-red-500/5 transition-colors hover:bg-red-500/10">
                                                <Play size={12} /> Watch Video
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* 2. Markdown Text */}
                                <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-a:text-accent prose-code:bg-secondary/50 prose-code:px-1 prose-code:rounded-none prose-code:text-xs">
                                    <ReactMarkdown>{typeof log.content === 'object' ? log.content.text : log.content}</ReactMarkdown>
                                </div>

                                {/* 3. Media Gallery */}
                                {hasMedia && (
                                    <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {log.media_urls.map((url, i) => {
                                            const isVid = isVideoUrl(url);
                                            const thumb = isVid ? getYoutubeThumbnail(url) : url;
                                            
                                            // INLINE PLAYER LOGIC
                                            if (playingVideo === url && isVid) {
                                                return (
                                                    <div key={i} className="relative aspect-video bg-black border border-border group overflow-hidden">
                                                        <iframe 
                                                            src={getEmbedUrl(url)} 
                                                            className="w-full h-full" 
                                                            allow="autoplay; encrypted-media" 
                                                            allowFullScreen 
                                                        />
                                                        <button 
                                                            onClick={() => setPlayingVideo(null)}
                                                            className="absolute top-2 right-2 bg-black/50 text-white p-1 hover:bg-red-600 transition-colors z-20"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={() => handleMediaClick(url, i, log.media_urls)}
                                                    className="relative aspect-video bg-black border border-border cursor-zoom-in group overflow-hidden"
                                                >
                                                    <Image 
                                                        src={thumb || "/placeholder.jpg"} 
                                                        alt={`Log asset ${i}`} 
                                                        fill 
                                                        className={`object-cover opacity-90 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100 ${isVid ? 'opacity-80' : ''}`} 
                                                        unoptimized={true}
                                                    />
                                                    {isVid && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 group-hover:bg-black/10 transition-colors">
                                                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                                                <Play size={18} fill="currentColor" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* 4. Isolated Comments */}
                                <div className="mt-10">
                                    <ProjectComments projectId={projectId} changelogId={log.id} />
                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
          </div>
        );
      })}

      <ImageLightbox isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} images={lightboxImages} initialIndex={lightboxIndex} />

      {/* --- DELETE CONFIRMATION DIALOG (Z-INDEX FIXED) --- */}
      <Dialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <DialogContent className="z-[9999] border-destructive/50 bg-black p-0 rounded-none gap-0 sm:max-w-[400px]">
            <DialogHeader className="p-6 border-b border-destructive/20 bg-red-950/10">
                <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle size={20} /> Confirm Purge
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-muted-foreground mt-2">
                    This will permanently delete version <span className="text-foreground font-bold">{logToDelete?.version}</span>.
                    This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-4 bg-background flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setLogToDelete(null)} className="rounded-none border-border">Cancel</Button>
                <Button 
                    onClick={confirmDelete} 
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90 text-white rounded-none min-w-[120px]"
                >
                    {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "Confirm Delete"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}