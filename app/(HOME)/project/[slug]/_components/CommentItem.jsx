"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ThumbsUp, ThumbsDown, CornerDownRight, Trash2, ChevronDown, 
  ChevronUp, Loader2, Send, Plus, Edit2, MoreHorizontal, Flag, AlertTriangle 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAvatar } from "@/constants/assets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function CommentItem({ comment, user, onDelete, projectId, depth = 0 }) {
  // --- STATE ---
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);
  
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesCount, setRepliesCount] = useState(0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Admin State (Fetched separately to ensure accuracy)
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Voting State
  const [myVote, setMyVote] = useState(null); 
  const [localLikes, setLocalLikes] = useState(comment.likes_count || 0);
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes_count || 0);
  const [localContent, setLocalContent] = useState(comment.content);

  // Reporting State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const hasFetchedVote = useRef(false);

  // --- 1. FORCE UNLOCK BODY (Aggressive Fix) ---
  useEffect(() => {
    if (!isReportOpen) {
        // Delay to allow Radix UI to finish its own cleanup
        const timer = setTimeout(() => {
            document.body.style.pointerEvents = "auto";
            document.body.style.overflow = "auto";
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [isReportOpen]);

  // --- 2. CHECK ADMIN ROLE (Database Source of Truth) ---
  useEffect(() => {
    const checkAdmin = async () => {
        if (!user) return;
        
        // 1. Check Metadata (Fastest)
        if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') {
            setIsAdminUser(true);
            return;
        }

        // 2. Check Database Profile (Safest)
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
        if (data?.role === 'admin') {
            setIsAdminUser(true);
        }
    };
    checkAdmin();
  }, [user]);

  // Permissions
  const isOwner = user?.id === comment.user_id;
  const canDelete = isOwner || isAdminUser; 
  const showDislikeCount = isOwner || isAdminUser;

  // Sync props
  useEffect(() => {
    setLocalLikes(comment.likes_count || 0);
    setLocalDislikes(comment.dislikes_count || 0);
  }, [comment.likes_count, comment.dislikes_count]);

  useEffect(() => {
    const fetchMeta = async () => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', comment.id);
      setRepliesCount(count || 0);

      if (user && !hasFetchedVote.current) {
        const { data } = await supabase
          .from('comment_votes')
          .select('vote_type')
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        const vote = data?.vote_type || null;
        setMyVote(vote);
        
        if (vote === 'like' && comment.likes_count === 0) setLocalLikes(1);
        if (vote === 'dislike' && comment.dislikes_count === 0) setLocalDislikes(1);

        hasFetchedVote.current = true;
      }
    };
    fetchMeta();
  }, [comment.id, user, comment.likes_count, comment.dislikes_count]);

  // --- LOGIC ---

  const loadReplies = async (limit = 10) => {
    setLoadingReplies(true);
    const { data } = await supabase
      .from('comments')
      .select(`id, content, created_at, user_id, likes_count, dislikes_count, author:profiles!user_id(username, avatar_url)`)
      .eq('parent_id', comment.id)
      .order('created_at', { ascending: true })
      .range(replies.length, replies.length + limit - 1);
    
    setReplies(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const newReplies = (data || []).filter(r => !existingIds.has(r.id));
        return [...prev, ...newReplies];
    });
    setLoadingReplies(false);
    setShowReplies(true);
  };

  const handleVote = async (type) => {
    if (!user) return toast.error("Login to vote");
    
    const previousVote = myVote;
    let newLikes = localLikes;
    let newDislikes = localDislikes;

    if (previousVote === type) {
        setMyVote(null);
        if (type === 'like') newLikes = Math.max(0, newLikes - 1);
        else newDislikes = Math.max(0, newDislikes - 1);
    } else {
        setMyVote(type);
        if (type === 'like') {
            newLikes += 1;
            if (previousVote === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
        } else {
            newDislikes += 1;
            if (previousVote === 'like') newLikes = Math.max(0, newLikes - 1);
        }
    }
    
    setLocalLikes(newLikes);
    setLocalDislikes(newDislikes);

    try {
      if (previousVote === type) {
        await supabase.from('comment_votes').delete().eq('comment_id', comment.id).eq('user_id', user.id);
      } else {
        await supabase.from('comment_votes').upsert({ 
          comment_id: comment.id, 
          user_id: user.id, 
          vote_type: type 
        }, { onConflict: 'user_id, comment_id' });
      }
    } catch (e) { 
      setMyVote(previousVote);
      setLocalLikes(comment.likes_count || 0);
      setLocalDislikes(comment.dislikes_count || 0);
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
      setReplies(prev => [data, ...prev]);
      setRepliesCount(prev => prev + 1);
      setReplyText("");
      setIsReplying(false);
      setShowReplies(true);
      toast.success("Signal Received");
    }
    setIsSubmittingReply(false);
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === localContent) {
        setIsEditing(false);
        return;
    }
    setIsSavingEdit(true);
    try {
        const { error } = await supabase
            .from('comments')
            .update({ content: editText })
            .eq('id', comment.id);

        if (error) throw error;
        setLocalContent(editText);
        setIsEditing(false);
        toast.success("Log Updated");
    } catch (err) {
        toast.error("Update Failed");
    } finally {
        setIsSavingEdit(false);
    }
  };

  const handleChildDelete = (childId) => {
    setReplies(prev => prev.filter(r => r.id !== childId));
    setRepliesCount(prev => Math.max(0, prev - 1));
    if (onDelete) onDelete(childId);
  };

  const handleDelete = async () => {
    try {
        const { error } = await supabase.from('comments').delete().eq('id', comment.id);
        if (error) throw error;
        toast.success(isAdminUser && !isOwner ? "Admin Purge Complete" : "Comment Deleted");
        if (onDelete) onDelete(comment.id);
    } catch (error) {
        toast.error("Delete Failed");
    }
  };

  const handleReport = async () => {
    setIsSubmittingReport(true);
    try {
        await supabase.from('reports').insert({
            reporter_id: user.id,
            comment_id: comment.id,
            reason: reportReason,
            status: 'pending'
        });
        toast.success("Report Filed", { description: "Moderators alerted." });
        setIsReportOpen(false); // Clean up happens in useEffect
    } catch (err) {
        toast.error("Report Failed");
    } finally {
        setIsSubmittingReport(false);
    }
  };

  return (
    <div className={`group animate-in fade-in slide-in-from-bottom-2 ${depth > 0 ? 'ml-6 md:ml-10 border-l border-border/50 pl-4 mt-4' : 'mb-6'}`}>
      <div className="flex gap-3">
        {/* AVATAR FIX: Use centralized helper with Navigation Link */}
        <Link 
            href={`/profile/${comment.author?.username}`}
            className="w-8 h-8 relative border border-border bg-secondary flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Image 
            src={getAvatar(comment.author)} 
            alt="av" 
            fill 
            className="object-cover" 
          />
        </Link>
        <div className="flex-1 min-w-0">
          
          {/* Header Row */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
                <Link 
                    href={`/profile/${comment.author?.username}`}
                    className="text-xs font-bold font-mono hover:text-accent hover:underline"
                >
                    {comment.author?.username || 'Unknown_Node'}
                </Link>
                <span className="text-[10px] font-mono text-muted-foreground opacity-50">
                    {new Date(comment.created_at).toLocaleDateString()}
                </span>
            </div>
            
            {/* Context Menu */}
            {user && (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1">
                            <MoreHorizontal size={14} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black border border-border rounded-none shadow-xl min-w-[140px] z-50">
                        {isOwner && (
                            <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-[10px] font-mono hover:bg-secondary cursor-pointer">
                                <Edit2 size={12} className="mr-2" /> Edit
                            </DropdownMenuItem>
                        )}
                        {canDelete && (
                            <DropdownMenuItem onClick={handleDelete} className="text-[10px] font-mono text-red-500 hover:bg-red-500/10 cursor-pointer">
                                <Trash2 size={12} className="mr-2" /> {isAdminUser && !isOwner ? "Admin Purge" : "Delete"}
                            </DropdownMenuItem>
                        )}
                        {!isOwner && (
                            <DropdownMenuItem onClick={() => setIsReportOpen(true)} className="text-[10px] font-mono text-yellow-500 hover:bg-yellow-500/10 cursor-pointer">
                                <Flag size={12} className="mr-2" /> Report
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>

          {/* Content Area */}
          {isEditing ? (
            <div className="mb-2">
                <textarea 
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-secondary/10 border border-border p-2 text-sm font-mono outline-none focus:border-accent min-h-[60px]"
                />
                <div className="flex gap-2 mt-2">
                    <Button onClick={handleEdit} disabled={isSavingEdit} size="sm" className="h-6 text-[10px] rounded-none bg-accent text-white">
                        {isSavingEdit ? <Loader2 className="animate-spin" size={10}/> : "Save"}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="h-6 text-[10px] rounded-none border-border">
                        Cancel
                    </Button>
                </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/90 leading-relaxed font-mono whitespace-pre-wrap">
                {depth > 0 && <CornerDownRight size={12} className="inline mr-1 text-accent" />}
                {localContent}
            </p>
          )}
          
          {/* Interaction Bar */}
          <div className="flex items-center gap-4 mt-2 select-none">
            <button onClick={() => handleVote('like')} className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${myVote === 'like' ? 'text-accent font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
              <ThumbsUp size={12} className={myVote === 'like' ? 'fill-accent' : ''} /> {localLikes}
            </button>
            <button onClick={() => handleVote('dislike')} className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${myVote === 'dislike' ? 'text-red-500 font-bold' : 'text-muted-foreground hover:text-foreground'}`} title={showDislikeCount ? `${localDislikes} Dislikes` : "Dislike"}>
              <ThumbsDown size={12} className={myVote === 'dislike' ? 'fill-red-500' : ''} /> {showDislikeCount && localDislikes}
            </button>
            <button onClick={() => setIsReplying(!isReplying)} className="text-[10px] font-mono hover:text-accent uppercase tracking-widest">Reply</button>
          </div>

          {/* Reply Input */}
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

          {/* Nested Replies */}
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
                      <CommentItem 
                        key={r.id} 
                        comment={r} 
                        user={user} 
                        // CRITICAL: We pass our own local handler to children
                        onDelete={handleChildDelete} 
                        projectId={projectId} 
                        depth={depth + 1} 
                      />
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

      {/* Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background border border-border p-0 rounded-none gap-0">
            <DialogHeader className="p-4 border-b border-border bg-secondary/5">
                <DialogTitle className="text-sm font-bold uppercase font-mono flex items-center gap-2 text-red-500">
                    <AlertTriangle size={16}/> Report Signal
                </DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-4">
                <RadioGroup value={reportReason} onValueChange={setReportReason}>
                    {['Spam', 'Harassment', 'Hate Speech', 'Misinformation'].map(r => (
                        <div key={r} className="flex items-center space-x-2">
                            <RadioGroupItem value={r.toLowerCase()} id={r} className="text-accent"/>
                            <Label htmlFor={r} className="text-xs font-mono uppercase cursor-pointer">{r}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
            <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex gap-2">
                <DialogClose asChild><Button variant="outline" size="sm" className="rounded-none h-8 text-xs">Cancel</Button></DialogClose>
                <Button onClick={handleReport} disabled={isSubmittingReport} size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-none h-8 text-xs">
                    {isSubmittingReport ? <Loader2 className="animate-spin" size={12}/> : "Submit"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}