"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  ChevronLeft, ChevronRight, MessageSquare, Share2, Loader2, Send, Eye, ShieldAlert, Heart, X
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link'; 

// --- HELPERS ---
const renderTipTapContent = (json) => {
    if (!json || typeof json !== 'object') return "";
    try {
        return generateHTML(json, [
            StarterKit,
            Link.configure({ openOnClick: false })
        ]);
    } catch (e) {
        return "<p>Error rendering content.</p>";
    }
};

const getEmbedUrl = (url) => {
    if (!url) return "";
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

const Comment = ({ comment, isAdmin, onDelete }) => (
    <div className={`p-3 border-b border-border/50 ${comment.is_pinned ? 'bg-yellow-500/10' : ''}`}>
        <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden relative">
                    <Image src={comment.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="User" fill className="object-cover" />
                </div>
                <span className="text-xs font-bold text-foreground">{comment.author?.username}</span>
                {comment.is_pinned && <span className="text-[9px] bg-yellow-600 text-black font-bold px-1.5 rounded-sm uppercase">Pinned</span>}
            </div>
            {isAdmin && (
                <button onClick={() => onDelete(comment.id)} className="text-muted-foreground hover:text-red-500 text-[10px] uppercase">
                    Delete
                </button>
            )}
        </div>
        <p className="text-sm text-zinc-300 pl-8">{comment.content}</p>
    </div>
);

export default function AnnouncementModal({ item, isOpen, onClose }) {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Metrics
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (isOpen && item) {
        setIndex(0); // Reset index on open
        setHtmlContent(renderTipTapContent(item.content));
        fetchComments();
        checkAdmin();
        setLikeCount(item.likes_count || 0);
        
        const initData = async () => {
            if (user) {
                const { data } = await supabase
                    .from('announcement_likes')
                    .select('user_id')
                    .eq('announcement_id', item.id)
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (data) setIsLiked(true);
            }
            const viewedKey = `stark_view_ann_${item.id}`;
            if (!sessionStorage.getItem(viewedKey)) {
                 supabase.rpc('increment_announcement_view', { announcement_id: item.id }).then(() => {
                     sessionStorage.setItem(viewedKey, 'true');
                 });
            }
        };
        initData();
    }
  }, [isOpen, item, user]);

  const checkAdmin = async () => {
      if(!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') setIsAdmin(true);
  };

  const fetchComments = async () => {
      if (!item) return;
      setLoadingComments(true);
      const { data } = await supabase
          .from('announcement_comments')
          .select(`*, author:profiles!user_id(username, avatar_url)`)
          .eq('announcement_id', item.id)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
      
      setComments(data || []);
      setLoadingComments(false);
  };

  const handleLike = async () => {
    if (!user) { toast.error("Login Required"); return; }
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

    if (newLiked) {
        await supabase.from('announcement_likes').insert({ user_id: user.id, announcement_id: item.id });
    } else {
        await supabase.from('announcement_likes').delete().eq('user_id', user.id).eq('announcement_id', item.id);
    }
  };

  const handlePostComment = async () => {
      if (!user) { toast.error("Login Required"); return; }
      if (!commentText.trim()) return;
      
      setIsSubmitting(true);
      try {
          const { error } = await supabase.from('announcement_comments').insert({
              announcement_id: item.id,
              user_id: user.id,
              content: commentText
          });
          
          if (error) throw error;
          setCommentText("");
          fetchComments();
          toast.success("Posted");
      } catch (err) {
          toast.error("Failed to post");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteComment = async (id) => {
      if(!confirm("Delete this comment?")) return;
      await supabase.from('announcement_comments').delete().eq('id', id);
      fetchComments();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/announcements?id=${item.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link Copied");
  };

  if (!item) return null;
  const currentMedia = item.media?.[index];
  const isVideoItem = currentMedia && (currentMedia.includes("youtube") || currentMedia.includes("youtu.be"));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[100dvh] md:h-[90vh] p-0 gap-0 bg-black border-border overflow-hidden flex flex-col md:flex-row z-[9999]">
        
        {/* --- LEFT: MEDIA STAGE --- */}
        <div className="flex-1 bg-zinc-950 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-border min-h-[40vh] md:min-h-full group">
            
            {/* FORCE-OVERLAY CLOSE BUTTON (Mobile Essential) */}
            <button 
                onClick={onClose}
                className="md:hidden absolute top-4 right-4 z-[100] p-2 bg-black/60 text-white rounded-full border border-white/10 backdrop-blur-md"
            >
                <X size={20} />
            </button>

            {/* NAVIGATION OVERLAYS */}
            {item.media && item.media.length > 1 && (
                <>
                    <button 
                        onClick={() => setIndex((prev) => (prev - 1 + item.media.length) % item.media.length)} 
                        className="absolute left-4 z-[100] p-3 bg-black/50 text-white hover:bg-white/10 rounded-full backdrop-blur-sm shadow-xl"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={() => setIndex((prev) => (prev + 1) % item.media.length)} 
                        className="absolute right-4 z-[100] p-3 bg-black/50 text-white hover:bg-white/10 rounded-full backdrop-blur-sm shadow-xl"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            {currentMedia ? (
                <div className="relative w-full h-full flex items-center justify-center">
                    {isVideoItem ? (
                        <iframe 
                            src={getEmbedUrl(currentMedia)} 
                            className="w-full h-full relative z-10" 
                            allow="autoplay; encrypted-media" 
                            allowFullScreen 
                        />
                    ) : (
                        <Image src={currentMedia} alt="Content" fill className="object-contain" unoptimized />
                    )}
                </div>
            ) : (
                <div className="text-zinc-700 font-mono text-xs uppercase">No Visual Data</div>
            )}
        </div>

        {/* --- RIGHT: CONTEXT --- */}
        <div className="w-full md:w-[400px] flex flex-col bg-background h-full border-l border-border max-h-[60vh] md:max-h-full">
            
            {/* Header */}
            <div className="p-4 border-b border-border bg-secondary/5 flex items-center gap-3">
                <div className="w-10 h-10 bg-black border border-border relative rounded-sm overflow-hidden">
                    <Image src="/logo.jpg" alt="Stark" fill className="object-cover" />
                </div>
                <div>
                    <h3 className="font-bold text-red-600 uppercase tracking-widest text-sm">Stark Industries</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">OFFICIAL TRANSMISSION</p>
                </div>
            </div>

            {/* Content Body */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold leading-tight">{item.title}</h1>
                    
                    <div 
                        className="prose prose-sm prose-zinc dark:prose-invert max-w-none font-light text-zinc-300"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
                        <span className="px-2 py-1 bg-red-600/10 text-red-500 text-[10px] font-mono uppercase border border-red-900/20">
                            {item.category}
                        </span>
                        {item.tags?.map(t => (
                            <span key={t} className="px-2 py-1 bg-secondary/30 text-[10px] font-mono text-zinc-500 uppercase border border-border/50">
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h4 className="text-xs font-mono uppercase text-muted-foreground mb-4 border-b border-border pb-2 flex justify-between items-center">
                            <span>Logs ({comments.length})</span>
                            {!item.comments_allowed && <span className="text-red-500 flex items-center gap-1"><ShieldAlert size={10}/> LOCKED</span>}
                        </h4>
                        
                        {loadingComments ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-red-600" size={16}/></div>
                        ) : (
                            <div className="space-y-0">
                                {comments.map(c => (
                                    <Comment key={c.id} comment={c} isAdmin={isAdmin} onDelete={handleDeleteComment} />
                                ))}
                                {comments.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No transmissions yet.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Interactions Footer */}
            <div className="p-3 border-t border-border bg-secondary/5 flex items-center justify-between text-xs font-mono text-muted-foreground">
                <div className="flex items-center gap-4">
                    <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-foreground'}`}>
                        <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                        <span>{likeCount}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                        <MessageSquare size={16} />
                        <span>{comments.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Eye size={16} />
                        <span>{item.views || 0}</span>
                    </div>
                </div>
                <button onClick={handleShare} className="hover:text-foreground"><Share2 size={16}/></button>
            </div>

            {/* Input */}
            {item.comments_allowed ? (
                <div className="p-4 border-t border-border bg-background flex-shrink-0">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={commentText} 
                            onChange={(e) => setCommentText(e.target.value)} 
                            placeholder={user ? "Add to the log..." : "Login to transmit..."} 
                            disabled={!user || isSubmitting}
                            className="w-full bg-secondary/10 border border-border h-10 pl-3 pr-10 text-xs font-mono focus:border-red-600 outline-none transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        />
                        <button 
                            onClick={handlePostComment} 
                            disabled={isSubmitting || !user} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 disabled:opacity-50 hover:text-red-500"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-3 bg-red-900/10 border-t border-red-900/20 text-center text-xs text-red-500 font-mono uppercase">
                    Transmission Locked
                </div>
            )}

        </div>
      </DialogContent>
    </Dialog>
  );
}