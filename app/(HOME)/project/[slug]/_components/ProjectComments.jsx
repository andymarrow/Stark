"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Send, MessageSquare, Trash2, CornerDownRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProjectComments({ projectId }) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Helper to get safe avatar
  const getUserAvatar = (u) => {
    if (!u) return null;
    // Check metadata (OAuth) or direct column (DB fetch) or fallback
    return u.user_metadata?.avatar_url || u.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
  };

  const myAvatar = getUserAvatar(user);

  // Fetch Comments on Load
  useEffect(() => {
    if (projectId) {
        fetchComments();
        
        // Unique channel name per project to prevent collisions
        const channel = supabase
        .channel(`comments-${projectId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `project_id=eq.${projectId}` }, 
            (payload) => {
                fetchComments(); 
            }
        )
        .subscribe();

        return () => { supabase.removeChannel(channel) };
    }
  }, [projectId]);

  const fetchComments = async () => {
    try {
        // FIX: We rely on Supabase to detect the relationship. 
        // If 'profiles' fails, we might need '!comments_user_id_fkey', 
        // but usually standard foreign keys are auto-detected better than recursive ones.
        // We select specific fields to avoid massive payloads.
        const { data, error } = await supabase
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            user_id,
            author:profiles (
                username,
                avatar_url
            )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

        if (error) {
            console.error("Comments Fetch Error:", error);
            // Fallback for empty state on error
            setComments([]);
        } else {
            setComments(data || []);
        }
    } catch (error) {
        console.error("Comments Critical Error:", error);
    } finally {
        setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!user) {
        toast.error("Access Denied", { description: "You must be logged in to comment." });
        router.push("/login");
        return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
        const { error } = await supabase
            .from('comments')
            .insert({
                project_id: projectId,
                user_id: user.id,
                content: newComment
            });

        if (error) throw error;
        setNewComment("");
        toast.success("Log Added", { description: "Your comment has been recorded." });
        fetchComments(); 
    } catch (error) {
        toast.error("Failed", { description: error.message });
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success("Log Deleted");
    } else {
        toast.error("Delete Failed");
    }
  };

  return (
    <div className="border-t border-border mt-12 pt-8">
      
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={16} className="text-accent" />
        <h3 className="font-bold text-lg">Discussion Log ({comments.length})</h3>
      </div>

      {/* Input Area */}
      <div className="flex gap-4 mb-10">
        <div className="w-10 h-10 bg-secondary/20 border border-border flex-shrink-0 relative overflow-hidden">
            {user ? (
                <Image 
                    src={myAvatar} 
                    alt="me" 
                    fill 
                    className="object-cover" 
                />
            ) : (
                <div className="w-full h-full bg-zinc-800" />
            )}
        </div>
        <div className="flex-1 relative">
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "Input message stream..." : "Login to join the frequency..."}
                className="w-full bg-secondary/5 border border-border p-3 min-h-[100px] text-sm font-mono focus:border-accent outline-none resize-y transition-colors"
                disabled={!user || submitting}
            />
            <div className="absolute bottom-3 right-3">
                <Button 
                    size="sm" 
                    onClick={handlePost} 
                    disabled={!user || submitting || !newComment.trim()}
                    className="h-8 bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono text-xs uppercase tracking-wider"
                >
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <><Send size={12} className="mr-2" /> Post</>}
                </Button>
            </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
             <div className="text-center py-8 text-xs font-mono text-muted-foreground animate-pulse">LOADING_LOGS...</div>
        ) : comments.length === 0 ? (
             <div className="text-center py-8 text-xs font-mono text-muted-foreground border border-dashed border-border">NO_ACTIVITY_DETECTED</div>
        ) : (
            comments.map((comment) => (
                <div key={comment.id} className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex-col items-center hidden sm:flex">
                         <div className="w-8 h-8 relative border border-border bg-secondary">
                             <Image 
                                src={comment.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                                alt={comment.author?.username || "User"} 
                                fill 
                                className="object-cover" 
                             />
                         </div>
                         <div className="w-[1px] h-full bg-border mt-2 group-last:hidden" />
                    </div>
                    
                    <div className="flex-1 pb-6">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">{comment.author?.username || "Anonymous"}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            
                            {user?.id === comment.user_id && (
                                <button onClick={() => handleDelete(comment.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
                            <CornerDownRight size={12} className="inline mr-2 text-accent" />
                            {comment.content}
                        </p>
                    </div>
                </div>
            ))
        )}
      </div>

    </div>
  );
}