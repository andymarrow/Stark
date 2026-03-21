// app/(HOME)/[username]/blog/_components/BlogComments.jsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MessageSquare, Loader2, Send, CornerDownRight, X, ChevronDown, ChevronUp, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAvatar } from "@/constants/assets";

// MENTIONS IMPORTS
import { MentionsInput, Mention } from 'react-mentions';
import mentionStyles from "@/app/(HOME)/project/[slug]/_components/mentionStyles"; 

const extractMentions = (text) => {
    const regex = /@\[[^\]]+\]\(([^)]+)\)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) matches.push(match[1]);
    return [...new Set(matches)]; 
};

const formatContent = (text) => {
    if (!text) return "";
    return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<a href="/profile/$2" class="text-accent font-bold hover:underline decoration-dotted underline-offset-2 transition-colors">@$1</a>');
};

// --- SUB-COMPONENT: INDIVIDUAL COMMENT THREAD ---
// This isolates the expand/collapse and reply state for every single root comment
function CommentThread({ comment, currentUser, blogId, blogMeta, fetchUsers, onReplyAdded }) {
    const [replyLimit, setReplyLimit] = useState(0); // 0 = Collapsed
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalReplies = comment.replies?.length || 0;
    const visibleReplies = comment.replies?.slice(0, replyLimit) || [];
    const hasMoreReplies = replyLimit > 0 && replyLimit < totalReplies;
    const isCollapsed = replyLimit === 0;

    const handleReplyClick = (targetUsername = null) => {
        setIsReplying(!isReplying);
        if (targetUsername) setReplyText(`@[${targetUsername}](${targetUsername}) `);
        else setReplyText("");
    };

    const submitReply = async () => {
        if (!currentUser) return toast.error("Authentication Required");
        if (!replyText.trim()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                blog_id: blogId,
                user_id: currentUser.id,
                content: replyText,
                visibility: 'public',
                parent_id: comment.id // Always the root
            };

            const { data, error } = await supabase
                .from('blog_comments')
                .insert(payload)
                .select('*, user:profiles!user_id(id, username, avatar_url)')
                .single();

            if (error) throw error;

            toast.success("Reply Deployed");
            
            // Auto-expand to show the new reply
            if (replyLimit === 0) setReplyLimit(5);
            else if (replyLimit < totalReplies + 1) setReplyLimit(prev => prev + 1);

            setReplyText("");
            setIsReplying(false);

            // Pass data up to parent to update global state
            onReplyAdded(comment.id, data);

            // Process Mentions
            const mentionedUsernames = extractMentions(payload.content);
            if (mentionedUsernames.length > 0 && blogMeta) {
                const { data: usersData } = await supabase.from('profiles').select('id, username').in('username', mentionedUsernames);
                if (usersData?.length > 0) {
                    const targetLink = `/${blogMeta.author.username}/blog/${blogMeta.slug}`;
                    const notifications = usersData
                        .filter(u => u.id !== currentUser.id)
                        .map(u => ({ receiver_id: u.id, sender_id: currentUser.id, type: 'comment_mention', message: `mentioned you in a blog discussion.`, link: targetLink }));
                    if (notifications.length > 0) await supabase.from('notifications').insert(notifications);
                }
            }
        } catch (error) {
            toast.error("Transmission Failed", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex gap-4">
                <Link href={`/profile/${comment.user.username}`} className="w-8 h-8 relative border border-border bg-secondary shrink-0 grayscale hover:grayscale-0 transition-all">
                    <Image src={getAvatar(comment.user)} alt={comment.user.username} fill className="object-cover" />
                </Link>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <Link href={`/profile/${comment.user.username}`} className="text-xs font-bold font-mono hover:text-accent transition-colors">
                            @{comment.user.username}
                        </Link>
                        <span className="text-[9px] font-mono text-muted-foreground opacity-50">
                            {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    
                    <p className="text-sm text-foreground/90 font-mono leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: formatContent(comment.content) }} />
                    
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleReplyClick(null)} className="text-[9px] font-mono text-muted-foreground hover:text-accent uppercase tracking-widest flex items-center gap-1 transition-colors">
                            <CornerDownRight size={10} /> Reply
                        </button>
                        
                        {/* Expand/Collapse Replies Toggle */}
                        {totalReplies > 0 && (
                            <button 
                                onClick={() => setReplyLimit(isCollapsed ? 5 : 0)} 
                                className="text-[9px] font-mono text-accent uppercase tracking-widest flex items-center gap-1 transition-colors hover:underline"
                            >
                                {isCollapsed ? <><ChevronDown size={10} /> {totalReplies} Signals</> : <><ChevronUp size={10} /> Collapse</>}
                            </button>
                        )}
                    </div>

                    {/* REPLY INPUT BOX */}
                    {isReplying && (
                        <div className="mt-3 border border-accent/50 bg-background flex flex-col relative z-0 animate-in slide-in-from-top-2">
                            <div className="w-full min-h-[60px]">
                                <MentionsInput autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} style={mentionStyles} placeholder="Transmit reply... (@ to tag)" className="mentions-input">
                                    <Mention trigger="@" data={fetchUsers} renderSuggestion={(s, _, __, ___, focused) => (
                                        <div className={`flex items-center gap-2 ${focused ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}>
                                            <div className="w-5 h-5 relative rounded-full overflow-hidden border border-zinc-700"><img src={s.avatar} alt="" className="object-cover w-full h-full"/></div>
                                            <span className="text-xs font-mono">@{s.display}</span>
                                        </div>
                                    )} displayTransform={(id, display) => `@${display}`} markup="@[__display__](__id__)" />
                                </MentionsInput>
                            </div>
                            <div className="flex justify-end gap-1 p-1 border-t border-border bg-secondary/5 relative z-10">
                                <Button variant="ghost" size="sm" onClick={() => { setIsReplying(false); setReplyText(""); }} className="h-6 text-[9px] uppercase font-mono rounded-none text-muted-foreground hover:text-foreground">
                                    Abort
                                </Button>
                                <Button onClick={submitReply} disabled={isSubmitting || !replyText.trim()} size="sm" className="h-6 text-[9px] uppercase font-mono rounded-none bg-accent text-white">
                                    {isSubmitting ? <Loader2 size={10} className="animate-spin" /> : "Deploy"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* RENDER VISIBLE REPLIES */}
                    {!isCollapsed && visibleReplies.length > 0 && (
                        <div className="mt-4 pl-4 border-l border-border/50 space-y-4 animate-in fade-in duration-300">
                            {visibleReplies.map(reply => (
                                <div key={reply.id} className="flex gap-3 group">
                                    <Link href={`/profile/${reply.user.username}`} className="w-6 h-6 relative bg-secondary border border-border shrink-0 grayscale group-hover:grayscale-0 transition-all">
                                        <Image src={getAvatar(reply.user)} alt={reply.user.username} fill className="object-cover" />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/profile/${reply.user.username}`} className="text-[10px] font-bold font-mono text-foreground uppercase hover:text-accent transition-colors">@{reply.user.username}</Link>
                                            </div>
                                            <span className="text-[8px] font-mono text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-foreground/80 font-mono leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: formatContent(reply.content) }} />
                                        
                                        <button onClick={() => handleReplyClick(reply.user.username)} className="text-[9px] font-mono text-muted-foreground/50 hover:text-accent uppercase tracking-widest flex items-center gap-1 transition-colors">
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* LOAD MORE REPLIES BUTTON */}
                            {hasMoreReplies && (
                                <button 
                                    onClick={() => setReplyLimit(prev => prev + 5)}
                                    className="text-[9px] font-mono text-muted-foreground hover:text-foreground uppercase tracking-widest flex items-center gap-1 mt-2"
                                >
                                    <Plus size={10} /> Load More Signals
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function BlogComments({ blogId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ROOT COMMENT PAGINATION
  const [rootLimit, setRootLimit] = useState(5);
  
  const [commentText, setCommentText] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [userProfile, setUserProfile] = useState(null);
  const [blogMeta, setBlogMeta] = useState(null);

  useEffect(() => {
    if (!blogId) return;
    fetchComments();

    const fetchMeta = async () => {
        const { data } = await supabase.from('blogs').select('slug, author:profiles!author_id(username)').eq('id', blogId).single();
        if (data) setBlogMeta(data);
    };
    fetchMeta();

    const channel = supabase.channel(`blog-global-comments-${blogId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_comments', filter: `blog_id=eq.${blogId}` }, (payload) => {
          if (payload.eventType === 'INSERT' && !payload.new.version_id) fetchNewComment(payload.new.id);
          if (payload.eventType === 'DELETE') fetchComments(); 
      }).subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [blogId]);

  useEffect(() => {
    const fetchProfile = async () => {
        if (!currentUser) return;
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', currentUser.id).single();
        if (data) setUserProfile(data);
    };
    fetchProfile();
  }, [currentUser]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*, user:profiles!user_id(id, username, avatar_url)')
      .eq('blog_id', blogId)
      .is('version_id', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const roots = data.filter(c => !c.parent_id);
      const replies = data.filter(c => c.parent_id);
      
      const structured = roots.map(root => ({
          ...root,
          replies: replies.filter(r => r.parent_id === root.id).sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
      }));
      setComments(structured);
    }
    setLoading(false);
  };

  const fetchNewComment = async (id) => {
    const { data } = await supabase.from('blog_comments').select('*, user:profiles!user_id(id, username, avatar_url)').eq('id', id).single();
    if (data) {
        if (data.parent_id) {
            setComments(prev => prev.map(c => c.id === data.parent_id ? { ...c, replies: [...c.replies, data] } : c));
        } else {
            setComments(prev => {
                if (prev.some(c => c.id === data.id)) return prev;
                return [{ ...data, replies: [] }, ...prev];
            });
        }
    }
  };

  const fetchUsers = async (query, callback) => {
    if (!query) return;
    const { data } = await supabase.from('profiles').select('id, username, avatar_url').ilike('username', `${query}%`).limit(5);
    const suggestions = data?.map(u => ({ id: u.username, display: u.username, avatar: getAvatar(u) })) || [];
    callback(suggestions);
  };

  const handlePostMain = async () => {
    if (!currentUser) return toast.error("Authentication Required");
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = { blog_id: blogId, user_id: currentUser.id, content: commentText, visibility: 'public' };

      const { data, error } = await supabase.from('blog_comments').insert(payload).select('*, user:profiles!user_id(id, username, avatar_url)').single();
      if (error) throw error;

      toast.success("Signal Deployed");
      setCommentText("");

      const mentionedUsernames = extractMentions(payload.content);
      if (mentionedUsernames.length > 0 && blogMeta) {
          const { data: usersData } = await supabase.from('profiles').select('id, username').in('username', mentionedUsernames);
          if (usersData?.length > 0) {
              const targetLink = `/${blogMeta.author.username}/blog/${blogMeta.slug}`;
              const notifications = usersData
                  .filter(u => u.id !== currentUser.id)
                  .map(u => ({ receiver_id: u.id, sender_id: currentUser.id, type: 'comment_mention', message: `mentioned you in a blog discussion.`, link: targetLink }));
              if (notifications.length > 0) await supabase.from('notifications').insert(notifications);
          }
      }
    } catch (error) {
      toast.error("Transmission Failed", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback to update parent state when a child thread posts a reply
  const handleReplyAdded = (rootId, newReplyData) => {
      setComments(prev => prev.map(c => 
          c.id === rootId ? { ...c, replies: [...c.replies, newReplyData] } : c
      ));
  };

  const visibleRoots = comments.slice(0, rootLimit);
  const hasMoreRoots = rootLimit < comments.length;

  return (
    <div className="border-t border-border mt-20 pt-12 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MessageSquare size={18} className="text-accent" />
            <h3 className="font-bold text-xl font-mono uppercase tracking-widest">Global Discussion</h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase border border-border px-2 py-1">{comments.length} Signals</span>
      </div>

      {/* Main Input */}
      <div className="flex gap-4 mb-12">
        <div className="w-10 h-10 bg-secondary border border-border flex-shrink-0 relative overflow-hidden hidden sm:block">
            {currentUser ? <Image src={userProfile ? getAvatar(userProfile) : getAvatar(null)} alt="me" fill className="object-cover" /> : <div className="w-full h-full bg-zinc-900" />}
        </div>
        <div className="flex-1 flex flex-col border border-border bg-secondary/5 focus-within:border-accent transition-colors relative z-0">
            <div className="w-full min-h-[100px] bg-transparent">
                <MentionsInput value={commentText} onChange={(e) => setCommentText(e.target.value)} style={mentionStyles} placeholder={currentUser ? "Add to the global discussion... (Type @ to tag)" : "Login required to transmit signals."} className="mentions-input" disabled={!currentUser || isSubmitting}>
                    <Mention trigger="@" data={fetchUsers} renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
                        <div className={`flex items-center gap-2 ${focused ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}>
                            <div className="w-5 h-5 relative rounded-full overflow-hidden border border-zinc-700"><img src={suggestion.avatar} alt="" className="object-cover w-full h-full"/></div>
                            <span className="text-xs font-mono">@{suggestion.display}</span>
                        </div>
                    )} displayTransform={(id, display) => `@${display}`} markup="@[__display__](__id__)" />
                </MentionsInput>
            </div>
            
            <div className="flex justify-between items-center p-2 border-t border-border bg-background/50 relative z-10">
                <span className="text-[9px] font-mono text-muted-foreground pl-2 uppercase tracking-tighter">Status: {currentUser ? 'Active_Node' : 'Restricted'}</span>
                <Button onClick={handlePostMain} disabled={!currentUser || isSubmitting || !commentText.trim()} className="h-8 bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono text-[10px] uppercase px-6">
                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Post"}
                </Button>
            </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-8">
        {loading ? (
             <div className="text-center py-8"><Loader2 className="animate-spin text-accent mx-auto" size={24} /></div>
        ) : comments.length === 0 ? (
             <div className="text-center py-12 text-xs font-mono text-muted-foreground border border-dashed border-border uppercase tracking-[0.2em]">Static_Noise_Only</div>
        ) : (
            <>
                {visibleRoots.map((comment) => (
                    <CommentThread 
                        key={comment.id} 
                        comment={comment} 
                        currentUser={currentUser} 
                        blogId={blogId} 
                        blogMeta={blogMeta} 
                        fetchUsers={fetchUsers} 
                        onReplyAdded={handleReplyAdded} 
                    />
                ))}

                {/* LOAD MORE ROOT COMMENTS */}
                {hasMoreRoots && (
                    <div className="flex justify-center pt-4 pb-10 border-t border-border/50">
                        <Button 
                            variant="outline" 
                            onClick={() => setRootLimit(prev => prev + 5)}
                            className="rounded-none border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                            <ChevronDown size={14} className="mr-2 text-accent" /> Load More Roots
                        </Button>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}