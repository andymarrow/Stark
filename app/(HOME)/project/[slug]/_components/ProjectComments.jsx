"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CommentItem from "./CommentItem";
import { getAvatar } from "@/constants/assets";

export default function ProjectComments({ projectId, changelogId = null }) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Determine dynamic labels based on context
  const contextLabel = changelogId ? "Update Discussion" : "Discussion Log";
  
  useEffect(() => {
    if (!projectId) return;
    
    // Initial Fetch
    fetchComments();

    // Set up Realtime Listener for this specific scope
    const channelName = changelogId ? `comments-log-${changelogId}` : `comments-project-${projectId}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'comments',
          // Strict filter
          filter: changelogId ? `changelog_id=eq.${changelogId}` : `project_id=eq.${projectId}`
      }, (payload) => {
          if (payload.eventType === 'INSERT') {
              // Fetch the full comment with author details to append
              fetchNewComment(payload.new.id);
          }
          if (payload.eventType === 'DELETE') {
              setComments(prev => prev.filter(c => c.id !== payload.old.id));
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [projectId, changelogId]);

  useEffect(() => {
    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (data) setUserProfile(data);
    };
    fetchProfile();
  }, [user]);

  const fetchComments = async () => {
    try {
        let query = supabase
            .from('comments')
            .select(`
                id, content, created_at, user_id, 
                likes_count, dislikes_count, 
                author:profiles!user_id (username, avatar_url)
            `)
            .eq('project_id', projectId) // Always must belong to project
            .is('parent_id', null)
            .order('created_at', { ascending: false });

        // STRICT FILTERING
        if (changelogId) {
            query = query.eq('changelog_id', changelogId);
        } else {
            query = query.is('changelog_id', null);
        }

        const { data, error } = await query;

        if (error) throw error;
        setComments(data || []);
    } catch (error) {
        console.error("Comments Fetch Error:", error);
    } finally {
        setLoading(false);
    }
  };

  // Helper to fetch a single new comment (for realtime)
  const fetchNewComment = async (id) => {
    const { data } = await supabase
        .from('comments')
        .select(`
            id, content, created_at, user_id, 
            likes_count, dislikes_count, 
            author:profiles!user_id (username, avatar_url)
        `)
        .eq('id', id)
        .single();
    
    if (data) {
        setComments(prev => {
            // Prevent duplicates if optimistic update already added it
            if (prev.some(c => c.id === data.id)) return prev;
            return [data, ...prev];
        });
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
        const payload = {
            project_id: projectId,
            user_id: user.id,
            content: newComment,
            changelog_id: changelogId // Can be null
        };

        const { data, error } = await supabase
            .from('comments')
            .insert(payload)
            .select(`
                id, content, created_at, user_id, 
                likes_count, dislikes_count, 
                author:profiles!user_id (username, avatar_url)
            `)
            .single();

        if (error) throw error;
        
        setNewComment("");
        
        // Optimistic Update: Add to state immediately
        setComments(prev => [data, ...prev]);
        
        toast.success("Log Added");
    } catch (error) {
        toast.error("Failed", { description: error.message });
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    // Optimistic Delete
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
        toast.error("Delete Failed");
        fetchComments(); // Revert on fail
    } else {
        toast.success("Log Deleted");
    }
  };

  return (
    <div className={`border-t border-border mt-12 pt-8 ${changelogId ? 'mt-6 pt-6 border-dashed' : ''}`}>
      
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare size={16} className="text-accent" />
        <h3 className="font-bold text-lg font-mono uppercase tracking-widest">{contextLabel} ({comments.length})</h3>
      </div>

      <div className="flex gap-4 mb-12">
        <div className="w-10 h-10 bg-secondary border border-border flex-shrink-0 relative overflow-hidden hidden sm:block">
            {user ? (
                <Image 
                    src={userProfile ? getAvatar(userProfile) : getAvatar(null)} 
                    alt="me" 
                    fill 
                    className="object-cover" 
                />
            ) : (
                <div className="w-full h-full bg-zinc-900" />
            )}
        </div>
        
        <div className="flex-1 flex flex-col border border-border bg-secondary/5 focus-within:border-accent transition-colors overflow-hidden">
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "Input message stream..." : "Unauthorized. Login required."}
                className="w-full bg-transparent p-4 min-h-[120px] text-sm font-mono outline-none resize-none leading-relaxed"
                disabled={!user || submitting}
            />
            {/* Dedicated Action Bar */}
            <div className="flex justify-between items-center p-2 border-t border-border bg-background/50">
                <span className="text-[9px] font-mono text-muted-foreground pl-2 uppercase tracking-tighter">
                    Status: {user ? 'Active_Node' : 'Restricted'}
                </span>
                <Button 
                    size="sm" 
                    onClick={handlePost} 
                    disabled={!user || submitting || !newComment.trim()}
                    className="h-9 bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono text-[10px] uppercase tracking-widest px-6 transition-all"
                >
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : "Post"}
                </Button>
            </div>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
             <div className="text-center py-8 text-xs font-mono text-muted-foreground animate-pulse">SYNCHRONIZING_LOGS...</div>
        ) : comments.length === 0 ? (
             <div className="text-center py-12 text-xs font-mono text-muted-foreground border border-dashed border-border uppercase tracking-[0.2em]">Static_Noise_Only</div>
        ) : (
            comments.map((comment) => (
                <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    user={user} 
                    projectId={projectId}
                    onDelete={handleDelete}
                />
            ))
        )}
      </div>
    </div>
  );
}