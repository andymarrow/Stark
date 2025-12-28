"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, CornerDownRight, Trash2, ChevronDown, ChevronUp, Loader2, Send, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CommentItem({ comment, user, onDelete, projectId, depth = 0 }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesCount, setRepliesCount] = useState(0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  // --- NEW: Local state for live count updates ---
  const [myVote, setMyVote] = useState(null); 
  const [localLikes, setLocalLikes] = useState(comment.likes_count || 0);
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes_count || 0);

  useEffect(() => {
    const fetchMeta = async () => {
      // 1. Fetch total nested replies count
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', comment.id);
      setRepliesCount(count || 0);

      // 2. Fetch current user's specific vote
      if (user) {
        const { data } = await supabase
          .from('comment_votes')
          .select('vote_type')
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setMyVote(data?.vote_type || null);
      }
    };
    fetchMeta();
  }, [comment.id, user]);

  const loadReplies = async (limit = 10) => {
    setLoadingReplies(true);
    const { data } = await supabase
      .from('comments')
      .select(`id, content, created_at, user_id, likes_count, dislikes_count, author:profiles!user_id(username, avatar_url)`)
      .eq('parent_id', comment.id)
      .order('created_at', { ascending: true })
      .range(replies.length, replies.length + limit - 1);
    
    setReplies([...replies, ...(data || [])]);
    setLoadingReplies(false);
    setShowReplies(true);
  };

  const handleVote = async (type) => {
    if (!user) return toast.error("Login to vote");
    
    const previousVote = myVote;
    const isRemoving = previousVote === type;

    // --- OPTIMISTIC UI LOGIC ---
    if (isRemoving) {
      setMyVote(null);
      if (type === 'like') setLocalLikes(prev => prev - 1);
      else setLocalDislikes(prev => prev - 1);
    } else {
      // If swapping (e.g. from dislike to like)
      if (previousVote === 'dislike' && type === 'like') {
        setLocalDislikes(prev => prev - 1);
        setLocalLikes(prev => prev + 1);
      } else if (previousVote === 'like' && type === 'dislike') {
        setLocalLikes(prev => prev - 1);
        setLocalDislikes(prev => prev + 1);
      } else {
        // Simple first-time vote
        if (type === 'like') setLocalLikes(prev => prev + 1);
        else setLocalDislikes(prev => prev + 1);
      }
      setMyVote(type);
    }

    // --- DATABASE SYNC ---
    try {
      if (isRemoving) {
        await supabase.from('comment_votes').delete().eq('comment_id', comment.id).eq('user_id', user.id);
      } else {
        await supabase.from('comment_votes').upsert({ comment_id: comment.id, user_id: user.id, vote_type: type });
      }
    } catch (e) { 
      // Revert UI on failure
      setMyVote(previousVote);
      setLocalLikes(comment.likes_count);
      setLocalDislikes(comment.dislikes_count);
      toast.error("Transmission Error"); 
    }
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    const { data, error } = await supabase.from('comments').insert({
      project_id: projectId,
      user_id: user.id,
      content: replyText,
      parent_id: comment.id
    }).select(`*, author:profiles!user_id(username, avatar_url)`).single();

    if (!error) {
      setReplies([data, ...replies]);
      setRepliesCount(prev => prev + 1);
      setReplyText("");
      setIsReplying(false);
      setShowReplies(true);
      toast.success("Signal Received");
    }
    setIsSubmittingReply(false);
  };

  return (
    <div className={`group animate-in fade-in slide-in-from-bottom-2 ${depth > 0 ? 'ml-6 md:ml-10 border-l border-border/50 pl-4 mt-4' : 'mb-6'}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 relative border border-border bg-secondary flex-shrink-0">
          <Image src={comment.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="av" fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold font-mono">{comment.author?.username}</span>
            <span className="text-[10px] font-mono text-muted-foreground opacity-50">
                {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground/90 leading-relaxed font-mono whitespace-pre-wrap">
            {depth > 0 && <CornerDownRight size={12} className="inline mr-1 text-accent" />}
            {comment.content}
          </p>
          
          <div className="flex items-center gap-4 mt-2 select-none">
            {/* LIKES */}
            <button 
                onClick={() => handleVote('like')} 
                className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${myVote === 'like' ? 'text-accent font-bold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ThumbsUp size={12} className={myVote === 'like' ? 'fill-accent' : ''} /> 
              {localLikes}
            </button>

            {/* DISLIKES */}
            <button 
                onClick={() => handleVote('dislike')} 
                className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${myVote === 'dislike' ? 'text-red-500 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ThumbsDown size={12} className={myVote === 'dislike' ? 'fill-red-500' : ''} /> 
              {localDislikes}
            </button>

            <button onClick={() => setIsReplying(!isReplying)} className="text-[10px] font-mono hover:text-accent uppercase tracking-widest">Reply</button>
            
            {user?.id === comment.user_id && (
              <button onClick={() => onDelete(comment.id)} className="text-[10px] font-mono text-red-500/30 hover:text-red-500 uppercase tracking-widest ml-auto opacity-0 group-hover:opacity-100 transition-opacity">Purge</button>
            )}
          </div>

          {isReplying && (
            <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-1">
              <input 
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Transmission reply..."
                className="flex-1 bg-secondary/10 border border-border p-2 text-xs font-mono outline-none focus:border-accent"
              />
              <Button onClick={submitReply} disabled={isSubmittingReply} size="sm" className="h-8 rounded-none bg-accent text-white">
                {isSubmittingReply ? <Loader2 className="animate-spin" size={12}/> : <Send size={12}/>}
              </Button>
            </div>
          )}

          {repliesCount > 0 && (
            <div className="mt-4">
              {!showReplies ? (
                <button onClick={() => loadReplies(2)} className="text-[10px] font-mono text-accent flex items-center gap-1 uppercase hover:underline">
                  <ChevronDown size={12}/> View {repliesCount} Signals
                </button>
              ) : (
                <>
                  <div className="space-y-1">
                    {replies.map(r => (
                      <CommentItem key={r.id} comment={r} user={user} onDelete={onDelete} projectId={projectId} depth={depth + 1} />
                    ))}
                  </div>
                  <div className="flex gap-4 mt-4">
                    {replies.length < repliesCount && (
                        <button onClick={() => loadReplies(10)} className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 hover:text-accent uppercase">
                        {loadingReplies ? <Loader2 className="animate-spin" size={12}/> : <><Plus size={12}/> Get 10 More</>}
                        </button>
                    )}
                    <button onClick={() => { setReplies([]); setShowReplies(false); }} className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 hover:text-foreground uppercase">
                        <ChevronUp size={12}/> Collapse
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}