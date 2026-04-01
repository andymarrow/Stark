// app/(HOME)/[username]/blog/_components/BlogReader.jsx
"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Clock, Calendar, ShieldCheck, Share2, Heart, Bookmark, Eye, 
  MessageSquare, Lock, Quote, Target, X, Loader2, Send, Check, CornerDownRight, Edit3, EyeOff, ChevronDown, History, ChevronUp, Plus, Copy, Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAvatar } from "@/constants/assets";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { registerView } from "@/app/actions/viewAnalytics"; 
import { useRouter } from "next/navigation";

// TIPTAP IMPORTS
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align"; 
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { Youtube } from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

// CUSTOM EXTENSIONS
import { StarkProjectEmbed } from "@/app/(HOME)/blog/_components/ProjectEmbedExtension";

// SYNTAX HIGHLIGHTING
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

import BlogComments from "./BlogComments";

import { MentionsInput, Mention } from 'react-mentions';
import mentionStyles from "@/app/(HOME)/project/[slug]/_components/mentionStyles"; 
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const lowlight = createLowlight(common);

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

// --- 1. STARK CODE BLOCK COMPONENT ---
const CodeBlockNode = ({ node }) => {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || 'text';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="relative my-8 border border-border bg-black group rounded-none overflow-hidden font-mono shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border select-none" contentEditable={false}>
        <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground tracking-widest font-bold">
          <Terminal size={14} className="text-accent" />
          {language === 'text' ? 'CODE_BLOCK' : language}
        </div>
        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors ${copied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 m-0 bg-transparent text-[13px] leading-relaxed overflow-x-auto custom-scrollbar text-zinc-300">
        <NodeViewContent as="code" className={`language-${language}`} />
      </pre>
    </NodeViewWrapper>
  );
};

// --- SUB-COMPONENT: MARGIN COMMENT THREAD ---
function MarginCommentThread({ rootComment, onReplyClick, replyingTo, replyText, setReplyText, submitAnnotation, isSubmitting, fetchUsers, cancelReply }) {
    const [replyLimit, setReplyLimit] = useState(0); 
    const totalReplies = rootComment.replies?.length || 0;
    const visibleReplies = rootComment.replies?.slice(0, replyLimit) || [];
    const hasMoreReplies = replyLimit > 0 && replyLimit < totalReplies;
    const isCollapsed = replyLimit === 0;

    useEffect(() => {
        if (replyingTo === rootComment.id && isCollapsed) {
            setReplyLimit(5);
        }
    }, [replyingTo, rootComment.id, isCollapsed]);

    return (
        <div className={`p-4 border bg-background relative group transition-colors ${rootComment.visibility !== 'public' ? 'border-dashed border-zinc-700' : 'border-border'}`}>
            {rootComment.visibility !== 'public' && (
                <div className="absolute -top-2.5 right-4 bg-background border border-border px-2 py-0.5 flex items-center gap-1 text-[8px] font-mono uppercase text-muted-foreground">
                    <Lock size={8} /> {rootComment.visibility.replace(/_/g, ' ')}
                </div>
            )}
            <div className="flex items-start gap-3">
                <Link href={`/profile/${rootComment.user.username}`} className="w-6 h-6 relative bg-secondary border border-border shrink-0 transition-all">
                    <Image src={getAvatar(rootComment.user)} alt={rootComment.user.username} fill className="object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <Link href={`/profile/${rootComment.user.username}`} className="text-[10px] font-bold font-mono uppercase truncate hover:text-accent transition-colors">@{rootComment.user.username}</Link>
                        <span className="text-[8px] font-mono text-muted-foreground">{new Date(rootComment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-foreground/90 font-mono leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: formatContent(rootComment.content) }} />
                    
                    <div className="flex items-center gap-4">
                        {rootComment.visibility === 'public' && (
                            <button onClick={() => onReplyClick(rootComment.id, null)} className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
                                <CornerDownRight size={10} /> Reply
                            </button>
                        )}
                        {totalReplies > 0 && (
                            <button onClick={() => setReplyLimit(isCollapsed ? 5 : 0)} className="text-[9px] font-mono text-accent uppercase tracking-widest flex items-center gap-1 transition-colors hover:underline">
                                {isCollapsed ? <><ChevronDown size={10} /> {totalReplies} Signals</> : <><ChevronUp size={10} /> Collapse</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {!isCollapsed && visibleReplies.length > 0 && (
                <div className="mt-4 pl-4 border-l border-border/50 space-y-4 animate-in fade-in duration-300">
                    {visibleReplies.map(reply => (
                        <div key={reply.id} className="flex gap-3 group">
                            <Link href={`/profile/${reply.user.username}`} className="w-6 h-6 relative bg-secondary border border-border shrink-0 grayscale group-hover:grayscale-0 transition-all">
                                <Image src={getAvatar(reply.user)} alt={reply.user.username} fill className="object-cover" />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <Link href={`/profile/${reply.user.username}`} className="text-[10px] font-bold font-mono text-foreground uppercase hover:text-accent transition-colors">@{reply.user.username}</Link>
                                    <span className="text-[8px] font-mono text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-foreground/80 font-mono leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: formatContent(reply.content) }} />
                                <button onClick={() => onReplyClick(rootComment.id, reply.user.username)} className="text-[9px] font-mono text-muted-foreground/50 hover:text-accent uppercase tracking-widest flex items-center gap-1 transition-colors">
                                    Reply
                                </button>
                            </div>
                        </div>
                    ))}
                    {hasMoreReplies && (
                        <button onClick={() => setReplyLimit(prev => prev + 5)} className="text-[9px] font-mono text-muted-foreground hover:text-foreground uppercase tracking-widest flex items-center gap-1 mt-2">
                            <Plus size={10} /> Load More
                        </button>
                    )}
                </div>
            )}

            {replyingTo === rootComment.id && (
                <div className="pl-6 ml-3 mt-4 animate-in slide-in-from-top-2">
                    <div className="border border-accent/50 bg-background flex flex-col relative z-0 shadow-lg">
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
                            <Button variant="ghost" size="sm" onClick={cancelReply} className="h-6 text-[9px] uppercase font-mono rounded-none text-muted-foreground hover:text-foreground">
                                Abort
                            </Button>
                            <Button onClick={submitAnnotation} disabled={isSubmitting || !replyText.trim()} size="sm" className="h-6 text-[9px] uppercase font-mono rounded-none bg-accent text-white">
                                {isSubmitting ? <Loader2 size={10} className="animate-spin" /> : "Deploy"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BlogReader({ blog, versions, author, currentUser }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); 
  
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
  const isLatestVersion = selectedVersion.id === versions[0].id;
  
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privateTarget, setPrivateTarget] = useState("private_to_author");
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeThreadText, setActiveThreadText] = useState(null);
  
  const [annotations, setAnnotations] = useState([]);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(blog.likes_count || 0);
  const [isCopied, setIsCopied] = useState(false);
  
  const hasViewedRef = useRef(false);
  const isProgrammaticRef = useRef(false);

  const isOwner = currentUser?.id === blog.author_id;
  const [showHighlights, setShowHighlights] = useState(true); 
  const [showPrivateIntel, setShowPrivateIntel] = useState(false); 

  const editor = useEditor({
    editable: false, 
    extensions: [
      StarterKit.configure({ codeBlock: false }), 
      Markdown.configure({ html: true, transformPastedText: true }), 
      Underline, 
      TextAlign.configure({ types: ['heading', 'paragraph'] }), 
      Highlight.configure({ HTMLAttributes: { class: 'bg-accent/15 border-b border-dashed border-accent/50 text-inherit cursor-pointer transition-colors hover:bg-accent/30' } }),
      TiptapImage.configure({ inline: true, HTMLAttributes: { class: 'border border-border shadow-md my-8 w-full h-auto rounded-none' } }),
      TiptapLink.configure({ openOnClick: true, HTMLAttributes: { class: 'text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent transition-colors cursor-pointer' } }),
      Youtube.configure({ inline: false, HTMLAttributes: { class: 'w-full aspect-video border border-border shadow-md my-8 rounded-none' } }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
      CodeBlockLowlight.extend({ addNodeView() { return ReactNodeViewRenderer(CodeBlockNode) } }).configure({ lowlight }),
      StarkProjectEmbed, // IMPORTANT: Allows projects to render in reader
    ],
    content: selectedVersion.content_json && Object.keys(selectedVersion.content_json).length > 0 ? selectedVersion.content_json : selectedVersion.content_markdown,
    immediatelyRender: false,
    editorProps: {
      attributes: { 
        class: "prose prose-zinc dark:prose-invert max-w-none focus:outline-none text-base md:text-lg leading-[1.8] font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:font-mono prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-foreground/90 prose-code:text-accent prose-code:bg-secondary/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-pre:bg-black prose-pre:border prose-pre:border-border prose-pre:rounded-none prose-hr:border-border selection:bg-accent/30 selection:text-foreground" 
      },
      handleClick: (view, pos, event) => {
         if (event.target.tagName === 'MARK') {
             setActiveThreadText(event.target.innerText);
             setSelectedSnippet(null); 
             return true;
         }
         return false;
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (isProgrammaticRef.current) return;
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      if (text.trim().length > 0) { setSelectedSnippet({ from, to, text }); setActiveThreadText(null); } 
      else { if (!activeAction) setSelectedSnippet(null); }
    }
  });

  useEffect(() => {
      if (editor && selectedVersion) {
          const content = selectedVersion.content_json && Object.keys(selectedVersion.content_json).length > 0 
              ? selectedVersion.content_json 
              : selectedVersion.content_markdown;
          editor.commands.setContent(content);
          setSelectedSnippet(null);
          setActiveAction(null);
          setActiveThreadText(null);
      }
  }, [selectedVersion, editor]);

  useEffect(() => {
    const fetchAnnotations = async () => {
      setIsLoadingAnnotations(true);
      const { data: annData } = await supabase.from('blog_comments').select('*, user:profiles!user_id(id, username, avatar_url)').eq('version_id', selectedVersion.id).order('created_at', { ascending: true });
      if (annData) setAnnotations(annData);
      setIsLoadingAnnotations(false);
    };
    fetchAnnotations();
  }, [selectedVersion.id]);

  useEffect(() => {
    const initEngagement = async () => {
      if (currentUser) {
        const [likeRes, saveRes] = await Promise.all([
          supabase.from('blog_likes').select('blog_id').eq('blog_id', blog.id).eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('blog_saves').select('blog_id').eq('blog_id', blog.id).eq('user_id', currentUser.id).maybeSingle()
        ]);
        if (likeRes.data) setIsLiked(true);
        if (saveRes.data) setIsSaved(true);
      }
    };
    initEngagement();
    setMounted(true);

    if (!hasViewedRef.current) {
        hasViewedRef.current = true;
        if (currentUser?.id !== blog.author_id) registerView('blog', blog.id).catch(console.error);
    }

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(`${totalScroll / windowHeight}`);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [blog.id, currentUser, blog.author_id]);

  const handleLike = async () => {
    if (!currentUser) return toast.error("Authentication Required");
    const previousState = isLiked;
    setIsLiked(!previousState);
    setLikesCount(prev => previousState ? prev - 1 : prev + 1);
    try {
      if (previousState) await supabase.from('blog_likes').delete().eq('blog_id', blog.id).eq('user_id', currentUser.id);
      else await supabase.from('blog_likes').insert({ blog_id: blog.id, user_id: currentUser.id });
    } catch (err) { setIsLiked(previousState); setLikesCount(prev => previousState ? prev + 1 : prev - 1); toast.error("Transmission Failed"); }
  };

  const handleSave = async () => {
    if (!currentUser) return toast.error("Authentication Required");
    const previousState = isSaved;
    setIsSaved(!previousState);
    try {
      if (previousState) { await supabase.from('blog_saves').delete().eq('blog_id', blog.id).eq('user_id', currentUser.id); toast.info("Removed from Library"); } 
      else { await supabase.from('blog_saves').insert({ blog_id: blog.id, user_id: currentUser.id }); toast.success("Saved to Library"); }
    } catch (err) { setIsSaved(previousState); toast.error("Transmission Failed"); }
  };

  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setIsCopied(true); toast.success("Link Copied"); setTimeout(() => setIsCopied(false), 2000); };

  const publicAnnotations = annotations.filter(a => a.visibility === 'public');
  const privateAnnotations = annotations.filter(a => a.visibility === 'private_to_author');

  const groupedAnnotations = useMemo(() => {
      const groups = {};
      const roots = publicAnnotations.filter(a => !a.parent_id && a.annotation_data);
      const replies = publicAnnotations.filter(a => a.parent_id);
      roots.forEach(root => {
          const txt = root.annotation_data.text;
          if (!groups[txt]) groups[txt] = { text: txt, from: root.annotation_data.from, to: root.annotation_data.to, rootComments: [] };
          groups[txt].rootComments.push({ ...root, replies: replies.filter(r => r.parent_id === root.id) });
      });
      return Object.values(groups).sort((a, b) => a.from - b.from);
  }, [publicAnnotations]);

  const highlightCoords = useMemo(() => {
      return groupedAnnotations.map(g => `${g.from}-${g.to}`).join(',');
  }, [groupedAnnotations]);

  useEffect(() => {
      if (editor && !isLoadingAnnotations) {
          isProgrammaticRef.current = true; 
          
          const { from, to } = editor.state.selection;
          
          editor.commands.selectAll(); 
          editor.commands.unsetHighlight(); 
          
          if (showHighlights) {
              groupedAnnotations.forEach(group => { 
                  editor.chain().setTextSelection({ from: group.from, to: group.to }).setHighlight().run(); 
              });
          }
          
          editor.commands.setTextSelection({ from, to });
          setTimeout(() => { isProgrammaticRef.current = false; }, 100);
      }
  }, [editor, highlightCoords, isLoadingAnnotations, showHighlights]); 

  const fetchUsers = async (query, callback) => {
    if (!query) return;
    const { data } = await supabase.from('profiles').select('id, username, avatar_url').ilike('username', `${query}%`).limit(5);
    const suggestions = data?.map(u => ({ id: u.username, display: u.username, avatar: getAvatar(u) })) || [];
    callback(suggestions);
  };

  const handleAction = (actionType) => {
    if (!currentUser) return toast.error("Clearance Denied");
    setActiveAction(actionType); setCommentText(""); setReplyingTo(null);
  };

  const cancelAction = () => {
    setActiveAction(null); setSelectedSnippet(null); setCommentText(""); setReplyText(""); setReplyingTo(null); editor?.commands.setTextSelection(0); 
  };

  const handleReplyClick = (rootId, targetUsername = null) => {
      setReplyingTo(rootId);
      if (targetUsername) setReplyText(`@[${targetUsername}](${targetUsername}) `);
      else setReplyText("");
  };

  const submitAnnotation = async () => {
    if (!currentUser) return toast.error("Authentication Required");
    const isReply = !!replyingTo;
    const textToSubmit = isReply ? replyText : commentText;
    
    if (!textToSubmit.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        blog_id: blog.id,
        version_id: selectedVersion.id, 
        user_id: currentUser.id,
        parent_id: replyingTo || null,
        content: textToSubmit,
        visibility: (activeAction === 'public' || isReply) ? 'public' : privateTarget,
      };
      if (!isReply && selectedSnippet) payload.annotation_data = { from: selectedSnippet.from, to: selectedSnippet.to, text: selectedSnippet.text };

      const { data, error } = await supabase.from('blog_comments').insert(payload).select('*, user:profiles!user_id(id, username, avatar_url)').single();
      if (error) throw error;

      toast.success(isReply ? "Reply Deployed" : "Signal Secured");
      setAnnotations(prev => [...prev, data]);
      
      const mentionedUsernames = extractMentions(payload.content);
      if (mentionedUsernames.length > 0) {
          const { data: usersData } = await supabase.from('profiles').select('id, username').in('username', mentionedUsernames);
          if (usersData?.length > 0) {
              const targetLink = `/${author.username}/blog/${blog.slug}`;
              const notifications = usersData
                  .filter(u => u.id !== currentUser.id)
                  .map(u => ({ receiver_id: u.id, sender_id: currentUser.id, type: 'comment_mention', message: `mentioned you in a blog annotation.`, link: targetLink }));
              if (notifications.length > 0) await supabase.from('notifications').insert(notifications);
          }
      }

      if (isReply) { 
          setReplyText(""); 
          setReplyingTo(null); 
      } else {
          setCommentText("");
          const currentSnippetText = selectedSnippet.text;
          cancelAction(); 
          if (payload.visibility === 'public') setActiveThreadText(currentSnippetText); 
          else toast.info("Encrypted Note Saved", { description: "Accessible in your Author Studio." });
      }
    } catch (err) { toast.error("Transmission Failed"); } finally { setIsSubmitting(false); }
  };

  if (!mounted) return null;
  const activeThreadData = groupedAnnotations.find(g => g.text === activeThreadText);

  return (
    <>
      <div className="fixed bottom-[56px] md:bottom-auto md:top-[71px] left-0 w-full h-[3px] z-[100] bg-secondary/30">
          <div className="h-full bg-accent transition-all duration-150 ease-out shadow-[0_0_10px_rgba(220,38,38,0.8)]" style={{ width: `${scrollProgress * 100}%` }} />
      </div>

      <main className="container mx-auto px-4 max-w-7xl animate-in fade-in duration-700">
        
        {!isLatestVersion && (
            <div className="max-w-3xl mx-auto mb-8 mt-4 md:mt-8 bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-start gap-3">
                <History className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-widest font-mono mb-1">Viewing Archived Record</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                        You are viewing revision {selectedVersion.version_number}.0 deployed on {new Date(selectedVersion.created_at).toLocaleString()}. The author has since published a newer version.
                    </p>
                    <Button onClick={() => setSelectedVersion(versions[0])} variant="link" className="px-0 h-auto text-[10px] uppercase text-yellow-500 hover:text-yellow-400 mt-2">
                        Return to Current Live Version →
                    </Button>
                </div>
            </div>
        )}

        {/* --- CINEMATIC HERO HEADER --- */}
        <header className="max-w-5xl mx-auto mb-12 md:mb-16 relative pt-4 md:pt-8">
          {/* Changed aspect-ratio to min-height for better mobile framing */}
          <div className="relative w-full min-h-[380px] md:min-h-[450px] border border-border bg-black overflow-hidden flex flex-col justify-end p-5 sm:p-8 md:p-12 z-0">
            {blog.cover_image ? (
                <Image 
                    src={blog.cover_image} 
                    alt={blog.title} 
                    fill 
                    className="object-cover opacity-50" 
                    priority 
                />
            ) : (
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
            )}
            {/* Smoother gradient for mobile */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            
            <div className="relative z-10 w-full max-w-3xl">
                {/* Tag & Date */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-accent uppercase tracking-widest mb-4">
                    <span className="bg-accent/10 px-2 py-1 border border-accent/20">
                        {blog.tags?.[0] || "STARK_INTEL"}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar size={12} /> {new Date(blog.published_at || blog.created_at).toLocaleDateString()}
                    </span>
                </div>

                {/* Adjusted text sizing for mobile */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-foreground leading-[1.05] mb-6 font-mono drop-shadow-lg">
                    {blog.title}
                </h1>

                {/* Author Block */}
                <div className="flex items-center gap-4">
                    <Link href={`/profile/${author.username}`} className="relative w-10 h-10 md:w-12 md:h-12 bg-secondary border border-border overflow-hidden hover:border-accent transition-colors shadow-xl">
                        <Image src={getAvatar(author)} alt={author.username} fill className="object-cover transition-all hover:scale-105" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={`/profile/${author.username}`} className="text-sm font-bold uppercase hover:text-accent transition-colors tracking-tight drop-shadow-md">
                                {author.full_name || author.username}
                            </Link>
                            {author.role === 'admin' && <ShieldCheck size={14} className="text-purple-500 drop-shadow-md" title="Admin Node" />}
                        </div>
                        <Link href={`/profile/${author.username}`} className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
                            @{author.username}
                        </Link>
                    </div>
                </div>
            </div>
          </div>

          {/* STICKY TOP ACTION BAR */}
          <div className="sticky top-[71px] z-40 flex items-center justify-between border-y border-border py-4 bg-background/80 backdrop-blur-md px-4 sm:px-6 shadow-sm mx-auto max-w-5xl">
            <div className="flex items-center gap-4 sm:gap-8">
              <button onClick={handleLike} className={`flex items-center gap-1.5 sm:gap-2 text-xs font-mono transition-all duration-300 group ${isLiked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                <Heart size={16} className={`transition-all duration-300 ${isLiked ? 'fill-accent scale-110' : 'group-hover:scale-110'}`} /> {likesCount}
              </button>
              <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors group">
                  <MessageSquare size={16} className="group-hover:scale-110 transition-transform" /> {blog.comments_count || 0}
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-muted-foreground cursor-default"><Eye size={16} /> {blog.views || 0}</div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-5">
              <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                      <button className={`hidden sm:flex items-center gap-1.5 text-[10px] font-mono uppercase border px-2 py-1 tracking-widest transition-colors ${!isLatestVersion ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-background text-muted-foreground border-border hover:bg-secondary/50 hover:text-foreground'}`}>
                          REV {selectedVersion.version_number}.0 <ChevronDown size={12} />
                      </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-none shadow-xl min-w-[160px]">
                      {versions.map((v, i) => (
                          <DropdownMenuItem key={v.id} onClick={() => setSelectedVersion(v)} className={`text-xs font-mono uppercase cursor-pointer rounded-none flex justify-between ${v.id === selectedVersion.id ? 'bg-accent/10 text-accent' : 'hover:bg-secondary'}`}>
                              <span>REV {v.version_number}.0</span>{i === 0 && <span className="text-[9px] opacity-50">LATEST</span>}
                          </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
              </DropdownMenu>

              <button onClick={handleSave} className={`transition-all duration-300 group ${isSaved ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`} title={isSaved ? "Saved to Library" : "Save to Library"}><Bookmark size={18} className={`transition-transform duration-300 ${isSaved ? 'fill-accent scale-110' : 'group-hover:scale-110'}`} /></button>
              <button onClick={handleShare} className={`transition-all duration-300 group ${isCopied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`} title="Share Report">{isCopied ? <Check size={18} className="scale-110" /> : <Share2 size={18} className="group-hover:scale-110" />}</button>
            </div>
          </div>
        </header>

        {isOwner && (
          <div className="max-w-3xl mx-auto mb-8 bg-secondary/5 border border-border p-3 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground tracking-widest px-3">
              <ShieldCheck size={14} className="text-accent" /> 
              <span className="hidden sm:inline">Author_Console</span>
              <span className="sm:hidden">Controls</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setShowHighlights(!showHighlights)} 
                variant="outline" 
                className={`h-8 rounded-none border-border bg-transparent font-mono text-[10px] uppercase transition-all
                  text-foreground hover:bg-foreground hover:text-background`}
              >
                {showHighlights ? (
                  <><EyeOff size={12} className="mr-2" /> Hide Signals</>
                ) : (
                  <><Eye size={12} className="mr-2 text-accent" /> Show Signals</>
                )}
              </Button>

              <Button 
                onClick={() => setShowPrivateIntel(!showPrivateIntel)} 
                variant="outline" 
                className={`h-8 rounded-none border-border font-mono text-[10px] uppercase transition-all
                  ${showPrivateIntel 
                    ? 'bg-accent text-white border-accent hover:bg-accent/90' 
                    : 'bg-transparent text-foreground hover:bg-foreground hover:text-background'}`}
              >
                <Lock size={12} className={`mr-2 ${showPrivateIntel ? 'text-white' : 'text-accent'}`} /> 
                Intel ({privateAnnotations.length})
              </Button>

              <Button 
                onClick={() => router.push(`/blog/write?id=${blog.id}`)} 
                className="h-8 rounded-none bg-foreground text-background hover:bg-accent hover:text-white border-transparent transition-all text-[10px] font-mono uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
              >
                <Edit3 size={12} className="mr-2" /> Edit Report
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 max-w-7xl mx-auto relative pt-4">
          
          <article className="lg:col-span-8 flex justify-end">
            <div className="w-full max-w-3xl relative">

              {isOwner && showPrivateIntel && privateAnnotations.length > 0 && (
                  <div className="mb-10 border border-dashed border-accent/50 bg-accent/5 p-6 animate-in slide-in-from-top-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-4 flex items-center gap-2"><Lock size={12} /> Encrypted Feedback Stream</h4>
                      <div className="space-y-4">
                          {privateAnnotations.map(note => (
                              <div key={note.id} className="p-4 border border-border bg-background shadow-lg">
                                  <div className="flex items-center justify-between mb-2">
                                      <Link href={`/profile/${note.user.username}`} className="text-xs font-bold font-mono hover:text-accent flex items-center gap-2">
                                          <Image src={getAvatar(note.user)} alt="av" width={16} height={16} className="object-cover" />
                                          @{note.user.username}
                                      </Link>
                                      <span className="text-[8px] font-mono text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</span>
                                  </div>
                                  {note.annotation_data && <p className="text-[10px] font-mono text-muted-foreground italic border-l-2 border-accent/50 pl-2 mb-2 line-clamp-2">"{note.annotation_data.text}"</p>}
                                  <p className="text-sm font-sans text-foreground/90">{note.content}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* EDITOR CONTENT */}
              <EditorContent editor={editor} />
            </div>
          </article>

          <aside className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-32 border-l border-dashed border-border/50 pl-8 min-h-[500px] pb-32">
              <div className={`absolute top-0 -left-[2px] w-[3px] h-12 transition-colors duration-500 ${selectedSnippet || activeThreadText ? 'bg-accent shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-muted-foreground/30'}`} />
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                <MessageSquare size={12} className={selectedSnippet ? "text-accent" : "text-muted-foreground"} /> Signal Margin
              </h3>
              
              {activeThreadText && activeThreadData ? (
                  <div className="animate-in slide-in-from-right-4 duration-300">
                      <button onClick={() => { setActiveThreadText(null); setReplyingTo(null); }} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent mb-6 flex items-center gap-2 transition-colors">
                          <X size={12} /> Index_Directory
                      </button>
                      <div className="border-l-2 border-accent/50 pl-4 mb-6">
                          <p className="text-xs font-mono text-foreground/80 italic leading-relaxed">"{activeThreadData.text}"</p>
                      </div>
                      <div className="space-y-6">
                          {activeThreadData.rootComments.map(rootComment => (
                              <MarginCommentThread 
                                  key={rootComment.id} 
                                  rootComment={rootComment} 
                                  onReplyClick={handleReplyClick} 
                                  replyingTo={replyingTo} 
                                  replyText={replyText} 
                                  setReplyText={setReplyText} 
                                  submitAnnotation={submitAnnotation} 
                                  isSubmitting={isSubmitting} 
                                  fetchUsers={fetchUsers} 
                                  cancelReply={() => { setReplyingTo(null); setReplyText(""); }} 
                              />
                          ))}
                      </div>
                  </div>
              ) : selectedSnippet ? (
                 <div className="animate-in slide-in-from-right-4 duration-300">
                     <h3 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-6 flex items-center gap-2"><Target size={12} className="animate-pulse" /> Target_Acquired</h3>
                     {!activeAction ? (
                         <div className="border border-accent/50 bg-accent/5 p-5 shadow-xl">
                            <div className="flex justify-end mb-2"><button onClick={cancelAction} className="text-muted-foreground hover:text-foreground"><X size={12}/></button></div>
                            <p className="text-xs font-mono text-foreground/80 italic border-l-2 border-accent/50 pl-3 line-clamp-4 mb-4 leading-relaxed">"{selectedSnippet.text}"</p>
                            <div className="flex flex-col gap-2">
                                <Button onClick={() => handleAction('public')} className="w-full bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-[10px] uppercase h-8 justify-start"><MessageSquare size={12} className="mr-2" /> Public Signal</Button>
                                <Button onClick={() => handleAction('private')} variant="outline" className="w-full bg-background border-border hover:bg-secondary rounded-none font-mono text-[10px] uppercase h-8 justify-start text-foreground"><Lock size={12} className="mr-2" /> Private Note</Button>
                            </div>
                         </div>
                     ) : (
                         <div className="border border-border bg-background p-5 shadow-2xl">
                            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                                <span className="text-[10px] text-foreground uppercase font-mono tracking-widest flex items-center gap-2">{activeAction === 'public' ? <MessageSquare size={12} className="text-accent" /> : <Lock size={12} className="text-accent" />} Deploying_{activeAction}</span>
                                <button onClick={cancelAction} className="text-muted-foreground hover:text-foreground"><X size={12}/></button>
                            </div>
                            {activeAction === 'private' && (
                              <div className="flex gap-2 mb-3 border border-border p-1 bg-secondary/5">
                                  <button onClick={() => setPrivateTarget('private_to_author')} className={`flex-1 text-[9px] font-mono uppercase px-2 py-1.5 transition-colors ${privateTarget === 'private_to_author' ? 'bg-foreground text-background font-bold' : 'text-muted-foreground hover:text-foreground'}`}>To Author</button>
                                  <button onClick={() => setPrivateTarget('private_to_self')} className={`flex-1 text-[9px] font-mono uppercase px-2 py-1.5 transition-colors ${privateTarget === 'private_to_self' ? 'bg-foreground text-background font-bold' : 'text-muted-foreground hover:text-foreground'}`}>To Self</button>
                              </div>
                            )}
                            <div className="w-full min-h-[100px] mb-4 bg-secondary/10 border border-border relative z-0">
                                <MentionsInput autoFocus value={commentText} onChange={(e) => setCommentText(e.target.value)} style={mentionStyles} placeholder={activeAction === 'public' ? "Broadcast your insight... (@ to tag)" : "Encrypt private note..."} className="mentions-input">
                                    <Mention trigger="@" data={fetchUsers} renderSuggestion={(s, _, __, ___, focused) => (
                                        <div className={`flex items-center gap-2 ${focused ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}><div className="w-5 h-5 relative rounded-full overflow-hidden border border-zinc-700"><img src={s.avatar} alt="" className="object-cover w-full h-full"/></div><span className="text-xs font-mono">@{s.display}</span></div>
                                    )} displayTransform={(id, display) => `@${display}`} markup="@[__display__](__id__)" />
                                </MentionsInput>
                            </div>
                            <div className="flex justify-end gap-2 relative z-10">
                                <Button variant="outline" onClick={cancelAction} className="h-8 rounded-none border-border text-[10px] uppercase font-mono text-muted-foreground hover:text-foreground hover:bg-secondary">Abort</Button>
                                <Button onClick={submitAnnotation} disabled={isSubmitting || !commentText.trim()} className="h-8 rounded-none bg-accent hover:bg-accent/90 text-white text-[10px] uppercase font-mono min-w-[120px]">{isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <><Send size={12} className="mr-1.5"/> Deploy</>}</Button>
                            </div>
                         </div>
                     )}
                 </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">Indexed_Signals ({groupedAnnotations.length})</h3>
                  {isLoadingAnnotations ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-accent" size={16} /></div>
                  ) : groupedAnnotations.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-widest border border-dashed border-border/50 p-6 text-center">Highlight text in the dossier to deploy a signal.</div>
                  ) : (
                    <div className="space-y-3">
                      {groupedAnnotations.map((group, idx) => {
                          const totalSignals = group.rootComments.reduce((acc, root) => acc + 1 + root.replies.length, 0);
                          return (
                              <button key={idx} onClick={() => setActiveThreadText(group.text)} className="w-full text-left p-4 border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all group/folder">
                                  <p className="text-xs font-mono text-foreground/70 italic line-clamp-2 leading-relaxed mb-3 group-hover/folder:text-foreground">"{group.text}"</p>
                                  <div className="flex items-center justify-between border-t border-border/50 pt-3">
                                      <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-muted-foreground"><MessageSquare size={10} className="text-accent" /> {totalSignals} Signals</div>
                                  </div>
                              </button>
                          );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* --- 4. SLEEK BOTTOM ACTION CONSOLE --- */}
        <div className="max-w-3xl mx-auto mt-16 mb-12 py-3 border-y border-border/50 flex flex-wrap items-center justify-between gap-4">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent/50 rounded-full" />
                End_Of_Report
            </span>
            
            <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs font-mono transition-all duration-300 group ${isLiked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Heart size={16} className={`transition-all duration-300 ${isLiked ? 'fill-accent scale-110' : 'group-hover:scale-110'}`} /> {likesCount}
                </button>

                <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-all duration-300 group">
                    <MessageSquare size={16} className="group-hover:scale-110 transition-transform" /> {blog.comments_count || 0}
                </button>

                <div className="w-px h-3 bg-border mx-1 hidden sm:block" />

                <button onClick={handleSave} className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest transition-all duration-300 group ${isSaved ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`} title={isSaved ? "Saved to Library" : "Save to Library"}>
                    <Bookmark size={14} className={`transition-transform duration-300 ${isSaved ? 'fill-accent scale-110' : 'group-hover:scale-110'}`} />
                    <span className="hidden sm:block">{isSaved ? "Saved" : "Save"}</span>
                </button>
                
                <button onClick={handleShare} className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest transition-all duration-300 group ${isCopied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`} title="Share Report">
                    {isCopied ? <Check size={14} className="scale-110" /> : <Share2 size={14} className="group-hover:scale-110" />}
                    <span className="hidden sm:block">{isCopied ? "Copied" : "Share"}</span>
                </button>
            </div>
        </div>

        {/* Global Comments */}
        <div className="max-w-3xl mx-auto">
          <BlogComments blogId={blog.id} currentUser={currentUser} />
        </div>

      </main>
    </>
  );
}