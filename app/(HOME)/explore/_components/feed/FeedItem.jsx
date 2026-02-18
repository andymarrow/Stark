"use client";
import { useState, useEffect, useRef, useMemo } from "react";
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

// --- STYLED RENDERERS ---
const LinkRenderer = (props) => {
    // Check if it's a mention link (we construct these in useMemo below)
    const isMention = props.children?.[0]?.startsWith?.('@');
    
    return (
        <a 
            href={props.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => e.stopPropagation()} 
            className={`transition-colors ${
                isMention 
                ? "text-accent font-bold bg-accent/10 px-1 border-b border-accent/30 hover:bg-accent hover:text-white mx-0.5" 
                : "text-accent underline hover:text-foreground break-all"
            }`}
        >
            {props.children}
        </a>
    );
};

export default function FeedItem({ item, onOpen }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  
  const containerRef = useRef(null);
  const hasViewedRef = useRef(false);

  const viewCount = item.views || 0; 
  const isChangelog = item.type === 'changelog';
  const projectId = isChangelog ? item.project.slug : item.slug;

  // --- 1. CONTENT PROCESSING LOGIC (FIXED) ---
  const processedContent = useMemo(() => {
    let rawText = isChangelog ? (item.content?.text || item.title) : (item.description || "");
    if (!rawText) return "";

    // A. STRIP HTML SPANS & CONVERT TO MARKDOWN
    // This finds the TipTap/HTML mentions: <span ... data-id="user" ...>@user</span>
    // And converts them to: [@user](/profile/user)
    rawText = rawText.replace(
        /<span[^>]*data-type="mention"[^>]*data-id="([^"]+)"[^>]*>@([^<]+)<\/span>/g, 
        '[@$2](/profile/$1)'
    );

    // B. Fallback: Clean any other leftover HTML span tags if the regex above didn't catch them
    // (Optional, keeps UI clean)
    rawText = rawText.replace(/<[^>]+>/g, '');

    // C. Fallback: Auto-link plain text mentions that aren't already links
    // Finds @username and converts to link if not already inside []()
    rawText = rawText.replace(/(?<!\[)@([a-zA-Z0-9_]+)/g, '[@$1](/profile/$1)');

    return rawText;
  }, [item.description, item.content, item.title, isChangelog]);

  const MAX_LENGTH = 200;
  const shouldTruncate = processedContent.length > MAX_LENGTH;
  const displayContent = (!isExpanded && shouldTruncate) 
    ? processedContent.slice(0, MAX_LENGTH) + "..." 
    : processedContent;

  // --- VIEW TRACKING ---
  useEffect(() => {
    if (hasViewedRef.current) return; 
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            hasViewedRef.current = true;
            registerView('project', item.id); 
            observer.disconnect();
        }
    }, { threshold: 0.5 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [item.id]);

  // --- LIKE LOGIC ---
  useEffect(() => {
    const checkLike = async () => {
        if (!user) return;
        const table = isChangelog ? "project_log_likes" : "project_likes";
        const idColumn = isChangelog ? "log_id" : "project_id";
        const { data } = await supabase.from(table).select("user_id").eq("user_id", user.id).eq(idColumn, item.id).maybeSingle();
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
    }
  };

  return (
    <article ref={containerRef} className={`border-b border-border bg-background py-6 transition-colors hover:bg-secondary/5 ${isChangelog ? 'border-l-2 border-l-accent' : ''}`}>
      
      {/* Header */}
      <div className="flex items-start justify-between px-4 mb-3">
         <div className="flex gap-3">
            <Link href={`/profile/${item.author.username}`} className="relative w-10 h-10 rounded-none border border-border flex-shrink-0 group">
                <Image src={item.author.avatar_url || "/placeholder.jpg"} alt="avatar" fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />
            </Link>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2">
                    <Link href={`/profile/${item.author.username}`} className="text-sm font-bold hover:text-accent truncate uppercase tracking-tight">
                        {item.author.full_name || item.author.username}
                    </Link>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">
                        // {formatDistanceToNow(new Date(item.created_at))} ago
                    </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {isChangelog ? (
                        <span className="text-accent flex items-center gap-1"><GitCommit size={10} /> LOG_PUSH: v{item.version}</span>
                    ) : (
                        <span className="uppercase">Deployment: {item.title}</span>
                    )}
                </p>
            </div>
         </div>
         <button className="text-muted-foreground hover:text-foreground p-1">
            <MoreHorizontal size={16} />
         </button>
      </div>

      {/* 2. Text Content */}
      <div className="px-4 mb-3 text-sm leading-relaxed text-foreground/90 font-light relative break-words">
         <div className="prose prose-zinc dark:prose-invert max-w-none 
                         prose-p:my-0 prose-p:leading-relaxed 
                         prose-code:bg-secondary prose-code:px-1 prose-code:text-[11px] prose-code:font-mono
                         prose-pre:bg-black prose-pre:rounded-none prose-pre:border prose-pre:border-border">
             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: LinkRenderer }}>
                 {displayContent}
             </ReactMarkdown>
         </div>
         {shouldTruncate && !isExpanded && (
            <button onClick={() => setIsExpanded(true)} className="text-accent hover:underline font-mono text-[10px] mt-2 uppercase tracking-widest">
                [READ_EXPANDED_LOG]
            </button>
         )}
      </div>

      {/* 3. Media Grid */}
      <div className="mb-4">
         <FeedMediaGrid media={item.media} onOpen={(idx) => onOpen(item, idx)} />
      </div>

      {/* 4. Footer Actions */}
      <div className="px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-6 text-[11px] font-mono text-muted-foreground">
            <button 
                onClick={handleLike} 
                className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-accent' : 'hover:text-foreground'}`}
            >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                <span>{likeCount}</span>
            </button>
            <button 
                onClick={() => onOpen(item, 0)} 
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
                <MessageSquare size={16} />
                <span>COMMENTS</span>
            </button>
            <div className="flex items-center gap-1.5 cursor-default">
                <Eye size={16} />
                <span>{viewCount}</span>
            </div>
            <button 
                onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/project/${projectId}`);
                    toast.success("Link Copied");
                }} 
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
                <Share2 size={16} />
            </button>
         </div>

         <Link href={`/project/${projectId}`} className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-mono border border-border px-4 py-2 hover:bg-foreground hover:text-background transition-all uppercase tracking-widest">
                System_View <ArrowUpRight size={12} />
            </button>
         </Link>
      </div>
    </article>
  );
}