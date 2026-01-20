"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Heart, MessageSquare, Share2, MoreHorizontal, Eye, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import FeedMediaGrid from "@/app/(HOME)/explore/_components/feed/FeedMediaGrid";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";

// Helper to extract text from TipTap JSON
const extractTextFromTipTap = (json) => {
    if (!json || typeof json !== 'object') return "";
    let text = "";
    if (json.text) text += json.text + " ";
    if (json.content && Array.isArray(json.content)) {
        json.content.forEach(child => {
            text += extractTextFromTipTap(child);
        });
    }
    return text.trim();
};

export default function AnnouncementItem({ item, onOpen }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Metrics State
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes_count || 0);
  const [commentCount, setCommentCount] = useState(0);

  // --- 1. PARSE CONTENT ---
  const displayText = useMemo(() => {
      const raw = typeof item.content === 'object' ? extractTextFromTipTap(item.content) : (item.description || "");
      return raw;
  }, [item]);

  const MAX_LENGTH = 180; 
  const shouldTruncate = displayText.length > MAX_LENGTH;
  const finalContent = (!isExpanded && shouldTruncate) ? displayText.slice(0, MAX_LENGTH) + "..." : displayText;

  // --- 2. FETCH REAL DATA ---
  useEffect(() => {
    const fetchData = async () => {
        // Check Like Status
        if (user) {
            const { data } = await supabase
                .from('announcement_likes')
                .select('user_id')
                .eq('announcement_id', item.id)
                .eq('user_id', user.id)
                .maybeSingle();
            if (data) setIsLiked(true);
        }

        // Get Comment Count
        const { count } = await supabase
            .from('announcement_comments')
            .select('*', { count: 'exact', head: true })
            .eq('announcement_id', item.id);
        
        if (count !== null) setCommentCount(count);
        
        // Sync likes count just in case
        if (item.likes_count !== undefined) setLikeCount(item.likes_count);
    };
    fetchData();
  }, [item.id, user, item.likes_count]);

  // --- 3. ACTIONS ---
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error("Login Required"); return; }

    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
        if (newLiked) {
            await supabase.from('announcement_likes').insert({ user_id: user.id, announcement_id: item.id });
        } else {
            await supabase.from('announcement_likes').delete().eq('user_id', user.id).eq('announcement_id', item.id);
        }
    } catch (err) {
        // Revert on error
        setIsLiked(!newLiked);
        setLikeCount(prev => !newLiked ? prev + 1 : prev - 1);
        toast.error("Failed to like");
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/announcements?id=${item.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link Copied");
  };

  return (
    // FIX: Removed 'hover:bg-secondary/5' and reduced padding to 'p-4'
    <article className="border-b border-border bg-background p-4 transition-colors group">
      
      {/* 1. Header (System Identity) */}
      <div className="flex items-start justify-between mb-3">
         <div className="flex gap-3">
            {/* STARK LOGO */}
            <div className="relative w-10 h-10 rounded-sm overflow-hidden border border-border flex-shrink-0 bg-black">
                <Image src="/logo.jpg" alt="Stark" fill className="object-cover" />
            </div>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-sm font-bold text-red-600 uppercase tracking-widest">
                        Stark Industries
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">• {formatDistanceToNow(new Date(item.created_at))} ago</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-xs flex items-center gap-1.5">
                    <Megaphone size={10} className="text-white" />
                    <span>{item.title}</span>
                </p>
            </div>
         </div>
         {/* Category Badge */}
         <div className="px-2 py-0.5 border border-border rounded-sm uppercase text-[9px] font-mono text-muted-foreground tracking-wider">
            {item.category}
         </div>
      </div>

      {/* 2. Text Content */}
      <div className="mb-4 text-sm leading-relaxed text-foreground/90 font-light relative break-words font-sans pl-1">
         {finalContent}
         {shouldTruncate && !isExpanded && (
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} className="text-muted-foreground hover:text-red-500 font-mono text-xs ml-1 hover:underline">
                [READ MORE]
            </button>
         )}
      </div>

      {/* 3. Media Grid */}
      <div className="mb-4">
         <FeedMediaGrid media={item.media} onOpen={(idx) => onOpen(item, idx)} />
      </div>

      {/* 4. Footer Actions (Metrics) */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
         <div className="flex items-center gap-6">
            
            {/* Likes */}
            <button 
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-foreground'}`}
            >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                <span>{likeCount}</span>
            </button>

            {/* Comments */}
            <button 
                onClick={() => onOpen(item, 0)} 
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
                <MessageSquare size={16} />
                <span>{commentCount}</span>
            </button>

            {/* Views */}
            <div className="flex items-center gap-1.5 cursor-default">
                <Eye size={16} />
                <span>{item.views || 0}</span>
            </div>

         </div>

         <button 
            onClick={handleShare} 
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
         >
            <Share2 size={16} />
         </button>
      </div>

    </article>
  );
}