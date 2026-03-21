// app/(HOME)/blog/_components/BlogStudioClient.jsx
"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  FileText, Lock, Bookmark, PenTool, 
  Eye, Heart, MessageSquare, Clock, Trash2, 
  Edit3, ShieldAlert, Terminal, Inbox,
  UserPlus, MessageCircle, MoreHorizontal,
  ChevronDown, Layers, Search, X, 
  ShieldCheck, Loader2, Check, History,
  Filter, Grid, List, Download, RotateCcw, ArrowUpRight,
  AlertTriangle ,Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { getAvatar } from "@/constants/assets";

// TIPTAP IMPORTS FOR VISUAL PREVIEW
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Underline } from "@tiptap/extension-underline";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { Youtube } from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

const lowlight = createLowlight(common);

// --- 1. MINIMAL CODE BLOCK FOR PREVIEW ---
const CodeBlockNode = ({ node }) => {
  return (
    <NodeViewWrapper className="relative my-4 border border-border bg-black rounded-none overflow-hidden font-mono">
      <div className="flex items-center justify-between px-3 py-1 bg-secondary/20 border-b border-border select-none">
        <div className="text-[8px] uppercase text-muted-foreground tracking-widest font-bold flex items-center gap-1">
          <Terminal size={10} /> {node.attrs.language || 'code'}
        </div>
      </div>
      <pre className="p-3 m-0 text-[11px] leading-tight overflow-x-auto text-zinc-300">
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
};

// --- 2. THE VISUAL CONTENT COMPONENT ---
function VersionVisualPreview({ content }) {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown.configure({ html: true }),
      Underline,
      TiptapImage.configure({ inline: false, HTMLAttributes: { class: 'max-w-full h-auto border border-border my-4' } }),
      TiptapLink.configure({ HTMLAttributes: { class: 'text-accent underline' } }),
      Youtube.configure({ HTMLAttributes: { class: 'w-full aspect-video my-4' } }),
      CodeBlockLowlight.extend({ addNodeView() { return ReactNodeViewRenderer(CodeBlockNode) } }).configure({ lowlight }),
    ],
    content: content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-zinc dark:prose-invert max-w-none focus:outline-none font-sans text-xs leading-relaxed prose-headings:font-mono prose-headings:uppercase prose-headings:tracking-tighter prose-h1:text-lg prose-h2:text-md prose-p:text-foreground/80",
      },
    },
  });

  return <EditorContent editor={editor} />;
}

export default function BlogStudioClient({ currentUser, myBlogs, savedBlogs, privateNotes }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("published"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [savedFilterSector, setSavedFilterSector] = useState(null);
  const [viewMode, setViewMode] = useState("list"); 
  
  const [expandedBlogId, setExpandedBlogId] = useState(null);
  
  const [inspectingBlog, setInspectingBlog] = useState(null);
  const [inspectingComments, setInspectingComments] = useState([]);
  const [blogVersions, setBlogVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState("all");
  const [isInspectorLoading, setIsInspectorLoading] = useState(false);

  const [managingVersionsBlog, setManagingVersionsBlog] = useState(null);
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [isRevisionLoading, setIsRevisionLoading] = useState(false);
  
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [versionToRestore, setVersionToRestore] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const [mutualFollowers, setMutualFollowers] = useState([]);

  useEffect(() => {
    const fetchHandshakes = async () => {
        if (!currentUser) return;
        const { data: iFollow } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.id);
        const { data: followMe } = await supabase.from('follows').select('follower_id').eq('following_id', currentUser.id);
        if (iFollow && followMe) {
            const iFollowIds = iFollow.map(f => f.following_id);
            const followMeIds = followMe.map(f => f.follower_id);
            setMutualFollowers(iFollowIds.filter(id => followMeIds.includes(id)));
        }
    };
    fetchHandshakes();
  }, [currentUser]);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return {
        published: myBlogs.filter(b => b.status === 'published' && b.title.toLowerCase().includes(q)),
        drafts: myBlogs.filter(b => b.status === 'draft' && b.title.toLowerCase().includes(q)),
        saved: savedBlogs.filter(b => {
            const matchesSearch = b.title.toLowerCase().includes(q) || b.author.username.toLowerCase().includes(q);
            const matchesSector = !savedFilterSector || b.tags?.includes(savedFilterSector);
            return matchesSearch && matchesSector;
        })
    };
  }, [myBlogs, savedBlogs, searchQuery, savedFilterSector]);

  const savedTags = useMemo(() => {
      const tags = new Set();
      savedBlogs.forEach(b => b.tags?.forEach(t => tags.add(t)));
      return Array.from(tags);
  }, [savedBlogs]);

  const stats = useMemo(() => {
    const totalViews = myBlogs.reduce((acc, b) => acc + (b.views || 0), 0);
    const totalLikes = myBlogs.reduce((acc, b) => acc + (b.likes_count || 0), 0);
    const draftCount = myBlogs.filter(b => b.status === 'draft').length;
    const signalCount = privateNotes.length;
    return { totalViews, totalLikes, draftCount, signalCount };
  }, [myBlogs, privateNotes]);

  const groupedPrivateIntel = useMemo(() => {
    const groups = {};
    privateNotes.forEach(note => {
      const blogId = note.blog_id;
      if (!groups[blogId]) {
        groups[blogId] = { blogTitle: note.blog.title, blogSlug: note.blog.slug, notes: [] };
      }
      groups[blogId].notes.push(note);
    });
    return groups;
  }, [privateNotes]);

  const openInspector = async (blog) => {
      setInspectingBlog(blog);
      setIsInspectorLoading(true);
      setSelectedVersionId("all");
      try {
          const { data: comments } = await supabase.from('blog_comments').select('*, user:profiles!user_id(id, username, avatar_url)').eq('blog_id', blog.id).neq('visibility', 'private_to_self').order('created_at', { ascending: false });
          const { data: versions } = await supabase.from('blog_versions').select('id, version_number, created_at').eq('blog_id', blog.id).order('version_number', { ascending: false });
          setInspectingComments(comments || []);
          setBlogVersions(versions || []);
      } catch (err) { toast.error("Sync Failure"); } finally { setIsInspectorLoading(false); }
  };

  const handleExportMarkdown = (blog) => {
      if (!blog.content) return toast.error("No content to export.");
      const blob = new Blob([blog.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${blog.slug}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Intel Exported", { description: "Markdown file saved locally." });
  };

  const openRevisionManager = async (blog) => {
      setManagingVersionsBlog(blog);
      setIsRevisionLoading(true);
      try {
          const { data, error } = await supabase.from('blog_versions').select('*').eq('blog_id', blog.id).order('version_number', { ascending: false });
          if (error) throw error;
          setRevisionHistory(data || []);
      } catch (err) { toast.error("Failed to load revisions"); } finally { setIsRevisionLoading(false); }
  };

  const executeDelete = async () => {
    if (!blogToDelete) return;
    setIsDeleting(true);
    try {
        const { error } = await supabase.from('blogs').delete().eq('id', blogToDelete.id);
        if (error) throw error;
        toast.success("Report Purged Successfully");
        router.refresh();
    } catch (err) {
        toast.error("Purge Failed", { description: err.message });
    } finally {
        setIsDeleting(false);
        setBlogToDelete(null);
    }
  };

  const executeRestore = async () => {
      if (!versionToRestore || !managingVersionsBlog) return;
      setIsRestoring(true);
      try {
          const { error: updateErr } = await supabase.from('blogs').update({ content: versionToRestore.content_markdown, updated_at: new Date().toISOString() }).eq('id', managingVersionsBlog.id);
          if (updateErr) throw updateErr;

          const nextVersionNumber = revisionHistory[0].version_number + 1;
          const { error: vErr } = await supabase.from('blog_versions').insert({ blog_id: managingVersionsBlog.id, version_number: nextVersionNumber, content_json: versionToRestore.content_json, content_markdown: versionToRestore.content_markdown });
          if (vErr) throw vErr;

          toast.success("Rollback Successful", { description: `REV_${nextVersionNumber}.0 deployed.` });
          setVersionToRestore(null);
          setManagingVersionsBlog(null);
          router.refresh();
      } catch (err) { 
          toast.error("Rollback Failed", { description: err.message }); 
      } finally { 
          setIsRestoring(false); 
      }
  };

  const handleHandshake = async (senderId) => {
    if (mutualFollowers.includes(senderId)) {
        router.push(`/chat?target=${senderId}`);
    } else {
        toast.promise(supabase.from('follows').insert({ follower_id: currentUser.id, following_id: senderId }), {
            loading: 'Transmitting Handshake...',
            success: 'Handshake Sent.',
            error: 'Transmission Failed'
        });
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl animate-in fade-in duration-700 pb-20">
      
      {/* STUDIO HUD */}
      <div className="mb-8 border border-border bg-secondary/5 overflow-hidden shadow-sm">
          <div className="bg-secondary/10 px-4 md:px-6 py-2 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
                  <Activity size={12} className="text-accent animate-pulse" /> System_Status: Online
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">Author_ID: {currentUser.user_metadata?.username || 'STARK_NODE'}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
              <StatBlock label="Network_Reach" value={stats.totalViews} icon={Eye} unit="Nodes" />
              <StatBlock label="Velocity" value={stats.totalLikes} icon={Heart} iconColor="text-accent" unit="Stars" />
              <StatBlock label="Drafts" value={stats.draftCount} icon={Edit3} unit="Units" />
              <StatBlock label="Signals" value={stats.signalCount} icon={Inbox} iconColor="text-blue-500" unit="Packets" />
          </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-accent uppercase tracking-widest mb-1">
                STARK // STUDIO // <span className="text-foreground font-bold">{activeTab}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground">Author_Console</h1>
        </div>
        <Button onClick={() => router.push('/blog/write')} className="w-full md:w-auto bg-accent hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase h-12 md:px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
            <PenTool size={16} className="mr-2" /> New Deployment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <aside className="lg:col-span-3 lg:sticky lg:top-24 z-30">
            <div className="flex overflow-x-auto lg:flex-col gap-2 lg:gap-1 pb-2 lg:pb-0 no-scrollbar">
                <TabButton active={activeTab === 'published'} onClick={() => setActiveTab('published')} icon={Layers} label="Published" count={filteredData.published.length} />
                <TabButton active={activeTab === 'drafts'} onClick={() => setActiveTab('drafts')} icon={Edit3} label="Drafts" count={filteredData.drafts.length} />
                <TabButton active={activeTab === 'private'} onClick={() => setActiveTab('private')} icon={Lock} label="Buffer" count={stats.signalCount} isSpecial />
                <TabButton active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} icon={Bookmark} label="Library" count={filteredData.saved.length} />
            </div>
            
            <div className="hidden lg:block mt-6 p-4 border border-border bg-secondary/5">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={14} />
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Index..." 
                        className="w-full h-10 pl-10 bg-background border border-border outline-none text-[10px] font-mono uppercase focus:border-accent transition-all text-foreground" 
                    />
                </div>
            </div>
        </aside>

        <main className="lg:col-span-9 min-h-[500px] border border-border bg-background relative overflow-hidden">
            
            <div className="block lg:hidden p-4 border-b border-border bg-secondary/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full h-10 pl-10 bg-background border border-border outline-none text-[10px] font-mono uppercase text-foreground focus:border-accent" />
                </div>
            </div>

            {activeTab === 'published' && (
                <div className="p-4 md:p-6 space-y-4 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-4">Live Deployments</h3>
                    {filteredData.published.length === 0 ? <EmptyState msg="No records matching criteria." /> : filteredData.published.map(blog => (
                        <BlogDataRow key={blog.id} blog={blog} currentUser={currentUser} onInspect={() => openInspector(blog)} onManageVersions={() => openRevisionManager(blog)} onExport={() => handleExportMarkdown(blog)} onDelete={() => setBlogToDelete(blog)} />
                    ))}
                </div>
            )}

            {activeTab === 'drafts' && (
                <div className="p-4 md:p-6 space-y-4 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-4">Pending Publication</h3>
                    {filteredData.drafts.length === 0 ? <EmptyState msg="No pending drafts found." /> : filteredData.drafts.map(blog => (
                        <BlogDataRow key={blog.id} blog={blog} isDraft={true} currentUser={currentUser} onExport={() => handleExportMarkdown(blog)} onDelete={() => setBlogToDelete(blog)} />
                    ))}
                </div>
            )}

            {activeTab === 'private' && (
                <div className="p-0 animate-in fade-in slide-in-from-right-4">
                    <div className="p-4 md:p-6 border-b border-border bg-accent/5 flex justify-between items-center">
                        <h3 className="text-xs font-mono uppercase tracking-widest text-accent flex items-center gap-2"><ShieldAlert size={14} /> Grouped_Signal_Buffer</h3>
                    </div>
                    <div className="divide-y divide-border">
                        {Object.keys(groupedPrivateIntel).length === 0 ? <EmptyState msg="No encrypted signals." /> : Object.entries(groupedPrivateIntel).map(([blogId, group]) => (
                            <div key={blogId} className="group/folder bg-background">
                                <button onClick={() => setExpandedBlogId(expandedBlogId === blogId ? null : blogId)} className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-secondary/10 transition-colors text-left">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 border border-border transition-colors ${expandedBlogId === blogId ? 'bg-accent text-white border-accent' : 'bg-secondary/20 text-muted-foreground'}`}><FileText size={18} /></div>
                                        <div>
                                            <h4 className="text-sm font-bold uppercase tracking-tight text-foreground group-hover/folder:text-accent transition-colors line-clamp-1">{group.blogTitle}</h4>
                                            <p className="text-[9px] font-mono text-muted-foreground uppercase">{group.notes.length} SECURE_MESSAGES</p>
                                        </div>
                                    </div>
                                    <ChevronDown size={18} className={`text-muted-foreground transition-transform duration-300 shrink-0 ${expandedBlogId === blogId ? 'rotate-180 text-accent' : ''}`} />
                                </button>
                                {expandedBlogId === blogId && (
                                    <div className="bg-secondary/5 px-4 md:px-6 pb-6 md:pb-8 space-y-4 animate-in slide-in-from-top-2">
                                        {group.notes.map(note => (
                                            <div key={note.id} className="p-4 md:p-5 border border-border bg-background shadow-sm relative">
                                                <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 relative border border-border bg-secondary"><Image src={getAvatar(note.user)} alt="" fill className="object-cover" /></div>
                                                        <div>
                                                            <p className="text-xs font-bold uppercase text-foreground">@{note.user.username}</p>
                                                            <p className="text-[8px] font-mono text-muted-foreground uppercase">{new Date(note.created_at).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => handleHandshake(note.user_id)} className={`h-7 text-[9px] font-mono uppercase rounded-none border transition-all ${mutualFollowers.includes(note.user_id) ? 'border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white' : 'border-accent/30 text-accent hover:bg-accent hover:text-white'}`}>
                                                        {mutualFollowers.includes(note.user_id) ? <><MessageCircle size={12} className="mr-1" /> Comms</> : <><UserPlus size={12} className="mr-1" /> Connect</>}
                                                    </Button>
                                                </div>
                                                {note.annotation_data && <div className="mb-4 p-3 bg-secondary/10 border-l-2 border-accent font-mono text-[10px] md:text-[11px] text-foreground/70 italic leading-relaxed break-words">"{note.annotation_data.text}"</div>}
                                                <p className="text-sm font-sans leading-relaxed text-foreground/90 bg-secondary/5 p-3 border border-border/50 break-words">{note.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'saved' && (
                <div className="p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4 md:pb-6">
                        <div>
                            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Archive_Intelligence</h3>
                            <div className="flex items-center gap-2">
                                <Bookmark size={18} className="text-accent" />
                                <span className="text-lg font-black uppercase font-mono text-foreground">{filteredData.saved.length} Records</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-secondary/10 border border-border p-1 self-start md:self-auto">
                            <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><List size={16}/></button>
                            <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Grid size={16}/></button>
                        </div>
                    </div>

                    {savedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button onClick={()=>setSavedFilterSector(null)} className={`px-3 py-1.5 text-[9px] font-mono uppercase border transition-all ${!savedFilterSector ? 'bg-accent text-white border-accent shadow-sm' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 bg-background'}`}>All_Sectors</button>
                            {savedTags.map(tag => (
                                <button key={tag} onClick={()=>setSavedFilterSector(tag)} className={`px-3 py-1.5 text-[9px] font-mono uppercase border transition-all ${savedFilterSector === tag ? 'bg-accent text-white border-accent shadow-sm' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 bg-background'}`}>#{tag}</button>
                            ))}
                        </div>
                    )}

                    {filteredData.saved.length === 0 ? <EmptyState msg="No archived research found." /> : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6" : "space-y-4"}>
                            {filteredData.saved.map(blog => <SavedCard key={blog.id} blog={blog} mode={viewMode} />)}
                        </div>
                    )}
                </div>
            )}
        </main>
      </div>

      {/* --- SIGNAL INSPECTOR MODAL --- */}
      <Dialog open={!!inspectingBlog} onOpenChange={() => setInspectingBlog(null)}>
          <DialogContent className="max-w-6xl w-full h-[90vh] md:h-[85vh] bg-background border border-border p-0 rounded-none overflow-hidden gap-0 shadow-2xl flex flex-col z-[80]">
              <div className="p-4 md:p-6 bg-secondary/10 border-b border-border flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4 md:gap-6 min-w-0">
                      <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-mono text-accent uppercase tracking-widest mb-1"><Terminal size={12} /> Audit_V3</div>
                          <DialogTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-foreground truncate">{inspectingBlog?.title}</DialogTitle>
                      </div>
                      <div className="hidden md:flex items-center bg-background border border-border p-1 shrink-0">
                          <button onClick={()=>setSelectedVersionId('all')} className={`px-3 py-1.5 text-[9px] font-mono uppercase transition-all ${selectedVersionId === 'all' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>All_Flows</button>
                          {blogVersions.map(v => (
                              <button key={v.id} onClick={()=>setSelectedVersionId(v.id)} className={`px-3 py-1.5 text-[9px] font-mono uppercase transition-all border-l border-border/50 ${selectedVersionId === v.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>REV_{v.version_number}.0</button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                      {isInspectorLoading ? (
                          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>
                      ) : (inspectingComments.length === 0 || (selectedVersionId !== 'all' && !inspectingComments.some(c=>c.version_id===selectedVersionId))) ? (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-40 p-6 text-center">
                              <ShieldCheck size={40} /><p className="font-mono text-xs uppercase tracking-widest">No Signals Captured</p>
                          </div>
                      ) : (
                          <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                              {inspectingComments.filter(c => selectedVersionId === 'all' || c.version_id === selectedVersionId).map(comment => (
                                  <div key={comment.id} className="group border border-border bg-secondary/5 p-4 md:p-6 hover:border-accent transition-all relative">
                                      <div className="absolute top-0 right-4 md:right-10 -translate-y-1/2 bg-background border border-border px-2 py-0.5 text-[8px] font-mono text-muted-foreground uppercase">
                                          REV_{blogVersions.find(v=>v.id===comment.version_id)?.version_number || '1'}.0
                                      </div>
                                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                          <div className="flex items-center gap-3 md:gap-4">
                                              <div className="w-10 h-10 md:w-12 md:h-12 relative border border-border bg-secondary shrink-0"><Image src={getAvatar(comment.user)} alt="" fill className="object-cover" /></div>
                                              <div className="min-w-0">
                                                  <p className="text-xs md:text-sm font-black uppercase text-foreground tracking-tight truncate">@{comment.user.username}</p>
                                                  <p className="text-[9px] md:text-[10px] font-mono text-muted-foreground uppercase truncate">{new Date(comment.created_at).toLocaleString()}</p>
                                              </div>
                                          </div>
                                          <div className={`px-2 py-1 border text-[8px] md:text-[9px] font-mono uppercase shrink-0 ${comment.visibility === 'public' ? 'border-green-500/30 text-green-600 bg-green-500/5' : 'border-blue-500/30 text-blue-600 bg-blue-500/5'}`}>{comment.visibility.replace(/_/g, ' ')}</div>
                                      </div>
                                      {comment.annotation_data && <div className="mb-4 p-3 md:p-4 bg-secondary/10 border-l-2 border-accent text-[10px] md:text-[11px] font-mono text-foreground/70 italic leading-relaxed break-words">
                                          <span className="text-accent opacity-60 block mb-1 uppercase text-[8px]">Highlighted Snippet:</span>"{comment.annotation_data.text}"
                                      </div>}
                                      <p className="text-sm md:text-base font-sans text-foreground/90 leading-relaxed mb-6 break-words">{comment.content}</p>
                                      
                                      <div className="flex flex-wrap justify-between items-center pt-4 border-t border-border/50 gap-2">
                                          <span className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1"><History size={10}/> Integrity Pass</span>
                                          <Button variant="outline" onClick={() => handleHandshake(comment.user_id)} className="h-8 md:h-9 text-[9px] font-mono uppercase rounded-none border-border bg-background hover:bg-accent hover:text-white hover:border-accent transition-all px-4">
                                              {mutualFollowers.includes(comment.user_id) ? "Open Encrypted Channel" : "Initialize Link Request"}
                                          </Button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </DialogContent>
      </Dialog>

      {/* --- REVISION MANAGER MODAL --- */}
      <Dialog open={!!managingVersionsBlog} onOpenChange={(open) => !open && setManagingVersionsBlog(null)}>
          <DialogContent className="max-w-4xl w-full bg-background border border-border p-0 rounded-none overflow-hidden shadow-2xl z-[80]">
              <DialogHeader className="p-4 md:p-6 border-b border-border bg-secondary/10">
                  <DialogTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 font-mono text-foreground">
                      <History size={18} className="text-accent" /> Revision_Timeline
                  </DialogTitle>
                  <p className="text-xs font-mono text-muted-foreground mt-1 uppercase truncate">Target: {managingVersionsBlog?.title}</p>
              </DialogHeader>
              
              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-4 md:p-6 bg-secondary/5">
                  {isRevisionLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" /></div>
                  ) : revisionHistory.length === 0 ? (
                      <div className="text-center py-10 font-mono text-xs text-muted-foreground uppercase tracking-widest border border-dashed border-border/50 bg-secondary/5">No Revisions Found</div>
                  ) : (
                      <div className="relative border-l border-border/50 pl-4 md:pl-6 space-y-8 ml-2">
                          {revisionHistory.map((version, idx) => {
                              const isLatest = idx === 0;
                              return (
                                  <div key={version.id} className="relative group">
                                      {/* Timeline Node */}
                                      <div className={`absolute -left-[21px] md:-left-[29px] top-4 w-3 h-3 rounded-full border-2 ${isLatest ? 'bg-accent border-accent shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-background border-border group-hover:border-foreground transition-colors'}`} />
                                      
                                      <div className="bg-background border border-border p-0 hover:border-foreground/30 transition-colors shadow-sm overflow-hidden flex flex-col">
                                          {/* Card Header */}
                                          <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/5">
                                              <div className="flex items-center gap-4">
                                                  <h4 className={`text-sm font-black font-mono uppercase tracking-tight ${isLatest ? 'text-accent' : 'text-foreground'}`}>
                                                      REV {version.version_number}.0
                                                  </h4>
                                                  {isLatest && (
                                                      <span className="text-[8px] font-mono uppercase tracking-widest text-green-600 bg-green-500/10 px-2 py-0.5 border border-green-500/20">Active</span>
                                                  )}
                                              </div>
                                              <span className="text-[9px] font-mono text-muted-foreground uppercase">{new Date(version.created_at).toLocaleString()}</span>
                                          </div>
                                          
                                          {/* --- VISUAL PREVIEW WINDOW --- */}
                                          <div className="h-64 overflow-y-auto custom-scrollbar bg-background p-6 border-b border-border">
                                              <VersionVisualPreview content={version.content_markdown} />
                                          </div>

                                          {/* Card Footer */}
                                          <div className="p-3 flex justify-end bg-secondary/5">
                                              {!isLatest && (
                                                  <Button 
                                                    onClick={() => setVersionToRestore(version)}
                                                    className="h-8 text-[9px] font-mono uppercase rounded-none border border-border hover:bg-accent hover:text-white hover:border-accent transition-all bg-background text-foreground px-6"
                                                  >
                                                      <RotateCcw size={10} className="mr-1.5" /> Restore Release
                                                  </Button>
                                              )}
                                              {isLatest && (
                                                  <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-2">
                                                      <ShieldCheck size={12} className="text-green-500" /> System Integrity Valid
                                                  </span>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </DialogContent>
      </Dialog>

      <Dialog open={!!blogToDelete} onOpenChange={(open) => !open && setBlogToDelete(null)}>
          <DialogContent className="sm:max-w-[400px] border-destructive/50 bg-background p-0 rounded-none gap-0 shadow-2xl z-[100]">
              <DialogHeader className="p-6 border-b border-destructive/20 bg-red-950/10">
                  <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2 uppercase font-mono tracking-tighter">
                      <AlertTriangle size={20} /> Confirm Purge
                  </DialogTitle>
                  <DialogDescription className="sr-only">Confirm deletion</DialogDescription>
              </DialogHeader>
              <div className="p-6">
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                      Permanently delete <span className="text-foreground font-bold">"{blogToDelete?.title}"</span>? This action is irreversible.
                  </p>
              </div>
              <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setBlogToDelete(null)} disabled={isDeleting} className="rounded-none border-border h-10 px-4 font-mono text-xs uppercase">Abort</Button>
                  <Button onClick={executeDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-white rounded-none h-10 px-4 min-w-[120px] font-mono text-xs uppercase">
                      {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "Purge Deployment"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={!!versionToRestore} onOpenChange={(open) => !open && setVersionToRestore(null)}>
          <DialogContent className="sm:max-w-[400px] border-yellow-500/50 bg-background p-0 rounded-none gap-0 shadow-2xl z-[100]">
              <DialogHeader className="p-6 border-b border-yellow-500/20 bg-yellow-950/10">
                  <DialogTitle className="text-lg font-bold text-yellow-500 flex items-center gap-2 uppercase font-mono tracking-tighter">
                      <History size={20} /> Confirm Rollback
                  </DialogTitle>
              </DialogHeader>
              <div className="p-6">
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                      Restore <span className="text-foreground font-bold">REV_{versionToRestore?.version_number}.0</span>? This will overwrite live data.
                  </p>
              </div>
              <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setVersionToRestore(null)} disabled={isRestoring} className="rounded-none border-border h-10 px-4 font-mono text-xs uppercase">Abort</Button>
                  <Button onClick={executeRestore} disabled={isRestoring} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-none h-10 px-4 min-w-[120px] font-mono text-xs uppercase">
                      {isRestoring ? <Loader2 className="animate-spin" size={16} /> : "Execute Rollback"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
}

// --- HELPERS ---
function StatBlock({ label, value, icon: Icon, iconColor = "text-muted-foreground", unit }) {
    return (
        <div className="p-4 md:p-6 bg-background group hover:bg-secondary/10 transition-colors flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2"><Icon size={14} className={`${iconColor} group-hover:scale-110 transition-transform`} /><span className="text-[9px] md:text-[10px] font-mono uppercase text-muted-foreground tracking-widest truncate">{label}</span></div>
            <div className="flex items-baseline gap-2"><span className="text-xl md:text-2xl font-black text-foreground font-mono">{value.toLocaleString()}</span><span className="text-[8px] md:text-[9px] font-mono text-muted-foreground uppercase">{unit}</span></div>
        </div>
    )
}

function TabButton({ active, onClick, icon: Icon, label, count, isSpecial }) {
    return (
        <button onClick={onClick} className={`w-full shrink-0 lg:w-auto flex items-center justify-between p-3 md:p-4 text-sm font-medium transition-all group border lg:border-0 lg:border-l-2 ${active ? "border-accent text-foreground bg-accent/5 lg:shadow-[inset_4px_0_0_0_#ef4444]" : "border-border lg:border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10 lg:hover:border-border"} ${isSpecial && active ? "border-red-500 bg-red-500/10 text-red-500 lg:shadow-[inset_4px_0_0_0_#ef4444]" : ""}`}>
            <div className="flex items-center gap-2 md:gap-3"><Icon size={16} className={`${active ? (isSpecial ? "text-red-500" : "text-accent") : "group-hover:text-accent transition-colors"}`} /><span className="font-mono uppercase text-[10px] md:text-[11px] tracking-[0.1em] font-bold whitespace-nowrap">{label}</span></div>
            {count !== undefined && <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 font-mono font-bold border transition-colors ml-4 ${active ? 'bg-background border-border text-foreground' : 'border-transparent text-muted-foreground'}`}>{count.toString().padStart(2, '0')}</span>}
        </button>
    )
}

function BlogDataRow({ blog, isDraft, onDelete, currentUser, onInspect, onManageVersions, onExport }) {
    return (
        <div className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-5 border border-border bg-background hover:bg-secondary/5 hover:border-foreground/30 transition-all gap-4 md:gap-6 shadow-sm">
            <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 border uppercase font-bold ${isDraft ? 'border-yellow-500/50 text-yellow-600 bg-yellow-500/10' : 'border-green-500/50 text-green-600 bg-green-500/10'}`}>{isDraft ? 'STAGING' : 'LIVE'}</span>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">INDEX_0{blog.id.substring(0,1)}</span>
                </div>
                <h4 className="text-base md:text-lg font-black uppercase tracking-tight truncate text-foreground group-hover:text-accent transition-colors">{blog.title || "Untitled_Report"}</h4>
                <div className="flex flex-wrap items-center gap-3 md:gap-5 text-[9px] md:text-[10px] font-mono text-muted-foreground uppercase mt-2 md:mt-4">
                    <div className="flex items-center gap-1.5"><Clock size={12} /> {new Date(blog.updated_at).toLocaleDateString()}</div>
                    {!isDraft && (
                        <>
                            <div className="flex items-center gap-1.5"><Eye size={12} /> {blog.views}</div>
                            <div className="flex items-center gap-1.5"><Heart size={12} className="text-accent" /> {blog.likes_count}</div>
                            <div className="flex items-center gap-1.5 pl-3 border-l border-border">
                                <MatrixBadge label="PUB" count={blog.comments_count} color="text-green-600" onClick={onInspect} />
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0 border-t border-border md:border-0 pt-3 md:pt-0">
                <Link href={isDraft ? `/blog/write?id=${blog.id}` : `/${currentUser?.user_metadata?.username || 'user'}/blog/${blog.slug}`} className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full h-9 md:h-10 rounded-none border-border bg-transparent text-foreground hover:bg-foreground hover:text-background text-[10px] md:text-xs uppercase tracking-widest px-4 md:px-6">{isDraft ? "Resume Edit" : "View Live"}</Button>
                </Link>
                
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-none border-border bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors shrink-0">
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border-border rounded-none shadow-xl min-w-[180px] p-1 z-[60]">
                        {!isDraft && (
                            <>
                                <DropdownMenuItem onClick={onInspect} className="text-xs font-mono uppercase cursor-pointer rounded-none text-foreground focus:bg-secondary focus:text-foreground h-8">
                                    <MessageSquare size={12} className="mr-2 text-accent"/> Manage Signals
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onManageVersions} className="text-xs font-mono uppercase cursor-pointer rounded-none text-foreground focus:bg-secondary focus:text-foreground h-8">
                                    <History size={12} className="mr-2 text-blue-500"/> Version History
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuItem onClick={onExport} className="text-xs font-mono uppercase cursor-pointer rounded-none text-foreground focus:bg-secondary focus:text-foreground h-8">
                            <Download size={12} className="mr-2 text-green-500"/> Export .MD
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border my-1" />
                        <DropdownMenuItem onClick={onDelete} className="text-xs font-mono uppercase cursor-pointer rounded-none text-red-500 focus:bg-red-500/10 focus:text-red-500 h-8">
                            <Trash2 size={12} className="mr-2"/> Purge Report
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

function SavedCard({ blog, mode }) {
    if (mode === 'grid') {
        return (
            <div className="border border-border bg-background hover:border-accent transition-all group p-4 flex flex-col justify-between shadow-sm">
                <div>
                    <div className="aspect-video relative overflow-hidden bg-secondary mb-4 border border-border">
                        {blog.cover_image && <Image src={blog.cover_image} alt="" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />}
                    </div>
                    <Link href={`/${blog.author.username}/blog/${blog.slug}`} className="text-sm font-bold uppercase tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-2">{blog.title}</Link>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 relative rounded-full overflow-hidden border border-border bg-secondary shrink-0"><Image src={getAvatar(blog.author)} alt="" fill className="object-cover" /></div>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase truncate">@{blog.author.username}</span>
                    </div>
                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-accent shrink-0" />
                </div>
            </div>
        )
    }
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border bg-background hover:border-foreground/30 transition-all group shadow-sm gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-20 h-14 bg-secondary relative shrink-0 border border-border overflow-hidden hidden sm:block">
                    {blog.cover_image && <Image src={blog.cover_image} alt="" fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />}
                </div>
                <div className="min-w-0">
                    <Link href={`/${blog.author.username}/blog/${blog.slug}`} className="text-sm font-bold uppercase tracking-tight text-foreground group-hover:text-accent transition-colors truncate block">{blog.title}</Link>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mt-1">@{blog.author.username}</p>
                </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-6 sm:ml-4 shrink-0 w-full sm:w-auto">
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase">
                    <span className="flex items-center gap-1"><Heart size={10} className="text-accent" /> {blog.likes_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={10}/> {blog.comments_count}</span>
                </div>
                <Link href={`/${blog.author.username}/blog/${blog.slug}`}>
                    <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-accent transition-all" />
                </Link>
            </div>
        </div>
    );
}

function MatrixBadge({ label, count, color, onClick, disabled }) {
    return (
        <button disabled={disabled} onClick={onClick} className={`flex items-center gap-1 px-1.5 py-0.5 border border-border bg-background text-[9px] font-mono uppercase transition-all ${disabled ? 'opacity-40' : 'hover:border-accent hover:bg-accent/5 cursor-pointer'}`}>
            <span className="text-muted-foreground">{label}:</span>
            <span className={`${color} font-bold`}>{count || 0}</span>
        </button>
    );
}

function MetaStat({ label, value }) {
    return <div className="flex justify-between items-center text-[10px] font-mono uppercase"><span className="text-muted-foreground">{label}</span><span className="text-foreground font-bold">{value}</span></div>
}

function EmptyState({ msg }) {
    return <div className="py-20 text-center border border-dashed border-border bg-secondary/5 mx-4 my-4 flex flex-col items-center gap-3 text-muted-foreground text-[10px] font-mono uppercase tracking-widest">{msg}</div>
}