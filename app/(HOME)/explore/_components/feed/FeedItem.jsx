"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare, Share2, MoreHorizontal, ArrowUpRight, GitCommit, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import FeedMediaGrid from "./FeedMediaGrid";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { updateUserPreference } from "@/app/actions/updatePreference";
import { registerView } from "@/app/actions/viewAnalytics"; 

// Link Renderer for Markdown
const LinkRenderer = (props) => (
    <a href={props.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent underline hover:text-foreground break-all">
      {props.children}
    </a>
);

export default function FeedItem({ item, onOpen }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  
  // View Tracking State
  const containerRef = useRef(null);
  const hasViewedRef = useRef(false);

  const viewCount = item.views || 0; 
  const isChangelog = item.type === 'changelog';
  const projectId = isChangelog ? item.project.slug : item.slug;

  // --- VIEW TRACKING LOGIC ---
  useEffect(() => {
    if (hasViewedRef.current) return; 

    const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
            hasViewedRef.current = true;
            registerView(isChangelog ? 'project' : 'project', item.id); 
            observer.disconnect();
        }
    }, { threshold: 0.5 });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [item.id, isChangelog]);


  // --- INITIALIZATION ---
  useEffect(() => {
    const checkLike = async () => {
        if (!user) return;
        const table = isChangelog ? "project_log_likes" : "project_likes";
        const idColumn = isChangelog ? "log_id" : "project_id";
        
        const { data } = await supabase
            .from(table)
            .select("user_id")
            .eq("user_id", user.id)
            .eq(idColumn, item.id)
            .maybeSingle();
        
        if (data) setIsLiked(true);
    };
    checkLike();
  }, [user, item.id, isChangelog]);

  const handleLike = async (e) => {
    e.stopPropagation(); 
    if (!user) { toast.error("Login Required"); return; }

    const table = isChangelog ? "project_log_likes" : "project_likes";
    const idColumn = isChangelog ? "log_id" : "project_id";

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
        if (newLikedState) {
            await supabase.from(table).insert({ user_id: user.id, [idColumn]: item.id });
            if (item.tech) updateUserPreference(item.tech);
        } else {
            await supabase.from(table).delete().match({ user_id: user.id, [idColumn]: item.id });
        }
    } catch (err) {
        setIsLiked(!newLikedState);
        setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        toast.error("Action Failed");
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/project/${projectId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link Copied");
  };

  const handleOpenModal = (idx) => {
      onOpen(item, idx);
      if (item.tech) updateUserPreference(item.tech);
  };

  const MAX_LENGTH = 200;
  const contentText = isChangelog ? (item.content?.text || item.title) : (item.description || "");
  const shouldTruncate = contentText.length > MAX_LENGTH;
  const displayContent = (!isExpanded && shouldTruncate) ? contentText.slice(0, MAX_LENGTH) + "..." : contentText;

  return (
    <article ref={containerRef} className={`border-b border-border bg-background py-6 ${isChangelog ? 'bg-secondary/5' : ''}`}>
      
      {/* 1. Header */}
      <div className="flex items-start justify-between px-4 mb-3">
         <div className="flex gap-3">
            <Link href={`/profile/${item.author.username}`} className="relative w-10 h-10 rounded-full overflow-hidden border border-border flex-shrink-0">
                <Image src={item.author.avatar_url || "/placeholder.jpg"} alt="avatar" fill className="object-cover" />
            </Link>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2">
                    <Link href={`/profile/${item.author.username}`} className="text-sm font-bold hover:underline truncate max-w-[150px]">
                        {item.author.full_name || item.author.username}
                    </Link>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">• {formatDistanceToNow(new Date(item.created_at))} ago</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-xs">
                    {isChangelog ? (
                        <span className="text-accent flex items-center gap-1"><GitCommit size={10} /> Pushed v{item.version}</span>
                    ) : (
                        `Deployed ${item.title}`
                    )}
                </p>
            </div>
         </div>
         <button className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal size={16} />
         </button>
      </div>

      {/* 2. Text Content */}
      <div className="px-4 mb-3 text-sm leading-relaxed text-foreground/90 font-light relative break-words">
         <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:my-0 prose-a:text-accent prose-code:bg-secondary/50 prose-code:px-1 prose-code:text-xs prose-pre:bg-black prose-pre:p-2 prose-pre:text-xs">
             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: LinkRenderer }}>
                 {displayContent}
             </ReactMarkdown>
         </div>
         {shouldTruncate && !isExpanded && (
            <button onClick={() => setIsExpanded(true)} className="text-muted-foreground hover:text-accent font-mono text-xs mt-1">
                ...read more
            </button>
         )}
      </div>

      {/* 3. Media Grid */}
      <div className="mb-4">
         <FeedMediaGrid media={item.media} onOpen={handleOpenModal} />
      </div>

      {/* 4. Footer Actions (Responsive) */}
      <div className="px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         {/* Interaction Group */}
         <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4 sm:gap-6 text-xs font-mono text-muted-foreground">
            <button 
                onClick={handleLike} 
                className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-foreground'}`}
            >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                <span>{likeCount}</span>
            </button>
            <button 
                onClick={() => handleOpenModal(0)} 
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
                <MessageSquare size={18} />
                <span className="hidden xs:inline">Comment</span>
            </button>
            <div className="flex items-center gap-1.5 cursor-default">
                <Eye size={18} />
                <span>{viewCount}</span>
            </div>
            <button 
                onClick={handleShare} 
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
                <Share2 size={18} />
            </button>
         </div>

         {/* View Detail Button - Full width on mobile, auto on desktop */}
         <Link href={`/project/${projectId}`} className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-mono border border-border px-4 py-2 hover:bg-secondary transition-colors uppercase">
                View Detail <ArrowUpRight size={12} />
            </button>
         </Link>
      </div>

    </article>
  );
}