"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare, Share2, MoreHorizontal, ArrowUpRight, GitCommit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import FeedMediaGrid from "./FeedMediaGrid";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { updateUserPreference } from "@/app/actions/updatePreference";

// Link Renderer for Markdown
const LinkRenderer = (props) => (
    <a 
      href={props.href} 
      target="_blank" 
      rel="noopener noreferrer" 
      onClick={(e) => e.stopPropagation()} 
      className="text-accent underline hover:text-foreground break-all"
    >
      {props.children}
    </a>
);

export default function FeedItem({ item, onOpen }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Interaction State
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);

  const isChangelog = item.type === 'changelog';
  const projectId = isChangelog ? item.project.slug : item.slug;

  // --- 1. Check Initial Like Status ---
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

  // --- 2. Handle Like Action ---
  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent opening modal
    if (!user) { toast.error("Login Required"); return; }

    const table = isChangelog ? "project_log_likes" : "project_likes";
    const idColumn = isChangelog ? "log_id" : "project_id";

    // Optimistic Update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
        if (newLikedState) {
            await supabase.from(table).insert({ user_id: user.id, [idColumn]: item.id });
            // Track preference on like
            if (item.tech) updateUserPreference(item.tech);
        } else {
            await supabase.from(table).delete().match({ user_id: user.id, [idColumn]: item.id });
        }
    } catch (err) {
        // Revert on error
        setIsLiked(!newLikedState);
        setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        toast.error("Action Failed");
    }
  };

  // --- 3. Handle Share ---
  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/project/${projectId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link Copied");
  };

  // --- 4. Handle Open (Track Preference) ---
  const handleOpenModal = (idx) => {
      onOpen(item, idx);
      // Track preference on deep dive
      if (item.tech) {
          updateUserPreference(item.tech);
      }
  };

  // --- Content Logic ---
  const MAX_LENGTH = 200;
  // Use title for changelog if no description, or project description
  const contentText = isChangelog ? (item.content?.text || item.title) : (item.description || "");
  const shouldTruncate = contentText.length > MAX_LENGTH;
  
  const displayContent = (!isExpanded && shouldTruncate) ? contentText.slice(0, MAX_LENGTH) + "..." : contentText;

  return (
    <article className={`border-b border-border bg-background py-6 ${isChangelog ? 'bg-secondary/5' : ''}`}>
      
      {/* 1. Header */}
      <div className="flex items-start justify-between px-4 mb-3">
         <div className="flex gap-3">
            <Link href={`/profile/${item.author.username}`} className="relative w-10 h-10 rounded-full overflow-hidden border border-border">
                <Image src={item.author.avatar_url || "/placeholder.jpg"} alt="avatar" fill className="object-cover" />
            </Link>
            <div>
                <div className="flex items-center gap-2">
                    <Link href={`/profile/${item.author.username}`} className="text-sm font-bold hover:underline">
                        {item.author.full_name || item.author.username}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">• {formatDistanceToNow(new Date(item.created_at))} ago</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
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

      {/* 2. Text Content (Rich Text) */}
      <div className="px-4 mb-3 text-sm leading-relaxed text-foreground/90 font-light relative">
         <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:my-0 prose-a:text-accent prose-code:bg-secondary/50 prose-code:px-1 prose-code:text-xs">
             <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{ a: LinkRenderer }}
             >
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

      {/* 4. Footer Actions */}
      <div className="px-4 flex items-center justify-between">
         <div className="flex gap-6">
            <button 
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
            >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                <span>{likeCount}</span>
            </button>

            <button 
                onClick={() => handleOpenModal(0)} // Open modal to comment
                className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
                <MessageSquare size={18} />
                <span>Comment</span>
            </button>

            <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
                <Share2 size={18} />
                <span>Share</span>
            </button>
         </div>

         {/* Detail Link */}
         <Link href={`/project/${projectId}`}>
            <button className="flex items-center gap-1 text-[10px] font-mono border border-border px-3 py-1.5 hover:bg-secondary transition-colors uppercase">
                View Detail <ArrowUpRight size={12} />
            </button>
         </Link>
      </div>

    </article>
  );
}