"use client";
import { useState, useEffect, useMemo } from "react"; // Added useMemo
import Image from "next/image";
import Link from "next/link";
import { 
  X, ChevronLeft, ChevronRight, MessageSquare, Heart, 
  Share2, Loader2, Play, Send, Globe, Github, FileCode, Eye 
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import CommentItem from "@/app/(HOME)/project/[slug]/_components/CommentItem";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- HELPERS ---
const isVideo = (url) => url && (url.includes("youtube.com") || url.includes("youtu.be"));

const getEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1];

    if (videoId) {
        const cleanId = videoId.split("?")[0].split("/")[0];
        return `https://www.youtube.com/embed/${cleanId}?autoplay=1&mute=0`;
    }
    return url;
};

const LinkRenderer = (props) => (
    <a href={props.href} target="_blank" rel="noopener noreferrer" className="text-accent underline decoration-accent/50 underline-offset-2 break-all hover:text-accent/80 transition-colors cursor-pointer">
      {props.children}
    </a>
);

export default function FeedModal({ item, isOpen, onClose, initialIndex = 0 }) {
  const { user } = useAuth();
  const [index, setIndex] = useState(initialIndex);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const currentMedia = item?.media?.[index];
  const isChangelog = item?.type === 'changelog';
  const projectId = isChangelog ? item?.project?.id : item?.id; 

  const demoLink = isChangelog ? item?.metadata?.demo_link : item?.demo_link;
  const sourceLink = isChangelog ? item?.metadata?.source_link : item?.source_link;
  const videoLink = isChangelog ? item?.metadata?.video_link : null;
  const viewCount = item?.views || 0;

  useEffect(() => {
    if (isOpen && item) {
        setIndex(initialIndex);
        setLikeCount(item.likes || 0);
        checkLikeStatus();
        fetchComments();
        setIsDescExpanded(false); 
    }
  }, [isOpen, item, initialIndex]);

  // --- PARSE CONTENT (NEW) ---
  const displayContent = useMemo(() => {
      if (!item) return "";
      
      const rawDescription = isChangelog 
        ? (typeof item.content === 'object' ? (item.content.text || item.title) : (item.content || item.title)) 
        : (item.description || "");
        
      // 1. Parse Mentions
      const parsed = rawDescription.replace(
         /@\[([^\]]+)\]\(([^)]+)\)/g, 
         '[@$1](/profile/$2)'
      );

      // 2. Handle Truncation
      const isLongDesc = parsed.length > 200;
      if (!isDescExpanded && isLongDesc) {
          return parsed.slice(0, 200) + "...";
      }
      return parsed;
  }, [item, isChangelog, isDescExpanded]);

  const isLongContent = (item?.description || "").length > 200; // Simplified check for showing button

  const checkLikeStatus = async () => {
      if (!user) return;
      const table = isChangelog ? "project_log_likes" : "project_likes";
      const idColumn = isChangelog ? "log_id" : "project_id";
      const { data } = await supabase.from(table).select("*").eq("user_id", user.id).eq(idColumn, item.id).maybeSingle();
      setIsLiked(!!data);
  };

  const fetchComments = async () => {
      setLoadingComments(true);
      let query = supabase
          .from('comments')
          .select(`id, content, created_at, user_id, likes_count, dislikes_count, author:profiles!user_id(username, avatar_url)`)
          .is('parent_id', null)
          .order('created_at', { ascending: false });

      if (isChangelog) query = query.eq('changelog_id', item.id);
      else query = query.eq('project_id', item.id).is('changelog_id', null);

      const { data } = await query;
      setComments(data || []);
      setLoadingComments(false);
  };

  const handleLike = async () => {
      if (!user) { toast.error("Login Required"); return; }
      const table = isChangelog ? "project_log_likes" : "project_likes";
      const idColumn = isChangelog ? "log_id" : "project_id";
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      if (isLiked) await supabase.from(table).delete().match({ user_id: user.id, [idColumn]: item.id });
      else await supabase.from(table).insert({ user_id: user.id, [idColumn]: item.id });
  };

  const handlePostComment = async () => {
      if (!user) { toast.error("Login Required"); return; }
      if (!commentText.trim()) return;
      setIsSubmitting(true);
      try {
          const payload = {
              project_id: projectId, 
              user_id: user.id,
              content: commentText,
              changelog_id: isChangelog ? item.id : null
          };
          const { data, error } = await supabase.from('comments').insert(payload).select(`*, author:profiles!user_id(username, avatar_url)`).single();
          if (error) throw error;
          setComments(prev => [data, ...prev]);
          setCommentText("");
          toast.success("Sent");
      } catch (err) {
          toast.error("Failed to comment");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleShare = () => {
      const url = `${window.location.origin}/project/${isChangelog ? item.project.slug : item.slug}`;
      navigator.clipboard.writeText(url);
      toast.success("Link Copied");
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[100dvh] md:h-[90vh] p-0 gap-0 bg-black border-border overflow-hidden flex flex-col md:flex-row z-[9999]">
        
        {/* --- LEFT: MEDIA STAGE --- */}
        <div className="flex-1 bg-zinc-950 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-border min-h-[40vh] md:min-h-full transition-all group">
            
            {item.media.length > 1 && (
                <>
                    <button onClick={() => setIndex((prev) => (prev - 1 + item.media.length) % item.media.length)} className="absolute left-4 z-40 p-2 bg-black/50 text-white hover:bg-white/10 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => setIndex((prev) => (prev + 1) % item.media.length)} className="absolute right-4 z-40 p-2 bg-black/50 text-white hover:bg-white/10 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            <div className="relative w-full h-full flex items-center justify-center">
                {isVideo(currentMedia) ? (
                    <iframe 
                        src={getEmbedUrl(currentMedia)} 
                        className="w-full h-full" 
                        allow="autoplay; encrypted-media" 
                        allowFullScreen 
                    />
                ) : (
                    <div className="relative w-full h-full">
                        <Image 
                            src={currentMedia || "/placeholder.jpg"} 
                            alt="Content" 
                            fill 
                            className="object-contain" 
                            unoptimized 
                        />
                    </div>
                )}
            </div>
        </div>

        {/* --- RIGHT: CONTEXT --- */}
        <div className="w-full md:w-[400px] flex flex-col bg-background h-full border-l border-border max-h-[60vh] md:max-h-full">
            
            <div className="p-4 border-b border-border flex items-start gap-3 bg-secondary/5 flex-shrink-0">
                <Link href={`/profile/${item.author.username}`} className="w-10 h-10 relative rounded-full overflow-hidden border border-border flex-shrink-0">
                    <Image src={item.author.avatar_url || "/placeholder.jpg"} alt="avatar" fill className="object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/profile/${item.author.username}`} className="font-bold text-sm hover:underline block">
                                {item.author.full_name}
                            </Link>
                            <span className="text-[10px] text-muted-foreground font-mono">@{item.author.username}</span>
                        </div>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    <div>
                        {isChangelog && (
                            <div className="inline-block px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono mb-2 rounded-sm">
                                PATCH v{item.version}
                            </div>
                        )}
                        <div className="text-sm leading-relaxed font-light text-foreground/90">
                            <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:my-1 prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:bg-secondary/50 prose-code:px-1 prose-code:text-xs prose-pre:bg-black prose-pre:p-2 prose-pre:text-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: LinkRenderer }}>
                                    {displayContent}
                                </ReactMarkdown>
                            </div>
                            
                            {isLongContent && (
                                <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="text-muted-foreground hover:text-foreground mt-2 font-mono text-xs hover:underline block">
                                    {isDescExpanded ? "(show less)" : "...more"}
                                </button>
                            )}
                        </div>
                    </div>

                    {(demoLink || sourceLink || videoLink) && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {demoLink && <a href={demoLink} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 border border-border hover:border-accent hover:text-accent transition-colors text-[10px] font-mono uppercase"><Globe size={12} /> Demo</a>}
                            {sourceLink && <a href={sourceLink} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 border border-border hover:border-foreground hover:text-foreground transition-colors text-[10px] font-mono uppercase"><Github size={12} /> Source</a>}
                            {videoLink && <a href={videoLink} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 border border-border hover:border-red-500 hover:text-red-500 transition-colors text-[10px] font-mono uppercase"><Play size={12} /> Video</a>}
                        </div>
                    )}

                    {item.tech && item.tech.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-4 border-b border-border/50">
                            {item.tech.map((t, i) => (
                                <span key={i} className="px-2 py-1 bg-secondary border border-border text-[10px] font-mono text-muted-foreground">{t}</span>
                            ))}
                        </div>
                    )}

                    <div>
                        <h4 className="text-xs font-mono uppercase text-muted-foreground mb-4">Live Signals ({comments.length})</h4>
                        {loadingComments ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-accent" size={16}/></div>
                        ) : comments.length > 0 ? (
                            <div className="space-y-4">
                                {comments.map(c => <CommentItem key={c.id} comment={c} user={user} projectId={projectId} />)}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border opacity-50">No signals detected.</div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-background flex-shrink-0">
                <div className="flex items-center gap-4 mb-3">
                    <button onClick={handleLike} className={`transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}><Heart size={24} fill={isLiked ? "currentColor" : "none"} /></button>
                    <button onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors"><Share2 size={24} /></button>
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Eye size={24} /><span className="text-xs font-bold font-mono">{viewCount}</span></div>
                    <div className="ml-auto text-xs font-bold font-mono">{likeCount} Likes</div>
                </div>

                <div className="relative mb-3">
                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="w-full bg-secondary/10 border border-border h-10 pl-3 pr-10 text-xs font-mono focus:border-accent outline-none" onKeyDown={(e) => e.key === 'Enter' && handlePostComment()} />
                    <button onClick={handlePostComment} disabled={isSubmitting} className="absolute right-2 top-1/2 -translate-y-1/2 text-accent disabled:opacity-50">{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}</button>
                </div>

                <Link href={`/project/${isChangelog ? item.project.slug : item.slug}`}>
                    <Button className="w-full rounded-none font-mono text-xs uppercase h-10 bg-foreground text-background hover:bg-accent hover:text-white">View Full Project</Button>
                </Link>
            </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}