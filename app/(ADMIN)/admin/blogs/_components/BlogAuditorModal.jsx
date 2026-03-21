// app/(ADMIN)/admin/blogs/_components/BlogAuditorModal.jsx
"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldAlert, X, Eye, EyeOff, Star, Trash2, 
  History, MessageSquare, Terminal, AlertTriangle, Loader2,
  Lock, RotateCcw, Check, Search ,FileText ,ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { getAvatar } from "@/constants/assets";

export default function BlogAuditorModal({ blog, isOpen, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  // --- NEW: MODAL SEARCH STATES ---
  const [signalSearch, setSignalSearch] = useState("");
  const [versionSearch, setVersionSearch] = useState("");

  // --- FETCH DEEP DATA ---
  useEffect(() => {
    if (!isOpen || !blog) return;

    const fetchAuditData = async () => {
      setLoading(true);
      try {
        const { data: commentsData, error: cErr } = await supabase
          .from('blog_comments')
          .select('*, user:profiles!user_id(id, username, avatar_url, role)')
          .eq('blog_id', blog.id)
          .neq('visibility', 'private_to_self')
          .order('created_at', { ascending: false });

        const { data: versionsData, error: vErr } = await supabase
          .from('blog_versions')
          .select('*')
          .eq('blog_id', blog.id)
          .order('version_number', { ascending: false });

        if (cErr || vErr) throw new Error("Database Sync Failed");

        setComments(commentsData || []);
        setVersions(versionsData || []);
      } catch (err) {
        toast.error("Audit Data Failed to Load", { description: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
    // Reset searches on open
    setSignalSearch("");
    setVersionSearch("");
  }, [isOpen, blog]);

  // Anti-Freeze for body scrolling
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      }, 50);
    }
  }, [isOpen]);

  // --- SEARCH FILTERING LOGIC ---
  const filteredComments = useMemo(() => {
      if (!signalSearch) return comments;
      const q = signalSearch.toLowerCase();
      return comments.filter(c => 
          c.content.toLowerCase().includes(q) || 
          c.user?.username.toLowerCase().includes(q) || 
          c.annotation_data?.text?.toLowerCase().includes(q)
      );
  }, [comments, signalSearch]);

  const filteredVersions = useMemo(() => {
      if (!versionSearch) return versions;
      const q = versionSearch.toLowerCase();
      return versions.filter(v => 
          v.version_number.toString().includes(q) || 
          v.content_markdown?.toLowerCase().includes(q)
      );
  }, [versions, versionSearch]);

  if (!blog) return null;

  // --- ACTIONS ---
  const toggleShadowHide = async () => {
    const newStatus = blog.status === 'shadow_hidden' ? 'published' : 'shadow_hidden';
    const { error } = await supabase.from('blogs').update({ status: newStatus }).eq('id', blog.id);
    if (!error) {
        toast.success(newStatus === 'shadow_hidden' ? "Shadow Protocol Engaged" : "Visibility Restored");
        if (onUpdate) onUpdate();
    }
  };

  const togglePromoted = async () => {
    const newStatus = !blog.is_promoted;
    const { error } = await supabase.from('blogs').update({ is_promoted: newStatus }).eq('id', blog.id);
    if (!error) {
        toast.success(newStatus ? "Promoted to Carousel" : "Promotion Revoked");
        if (onUpdate) onUpdate();
    }
  };

  const purgeSignal = async (commentId) => {
      if (!confirm("Permanently purge this signal from the network?")) return;
      const { error } = await supabase.from('blog_comments').delete().eq('id', commentId);
      if (!error) {
          toast.success("Signal Purged");
          setComments(prev => prev.filter(c => c.id !== commentId));
      } else toast.error("Purge Failed");
  };

  const forceRollback = async (version) => {
      if (!confirm(`FORCE ROLLBACK to REV_${version.version_number}.0? This overrides the live deployment.`)) return;
      setIsRestoring(true);
      try {
          const { error: updateErr } = await supabase.from('blogs')
            .update({ content: version.content_markdown, updated_at: new Date().toISOString() })
            .eq('id', blog.id);
          if (updateErr) throw updateErr;

          const nextVersionNumber = (versions[0]?.version_number || 0) + 1;
          const { error: vErr } = await supabase.from('blog_versions')
            .insert({ blog_id: blog.id, version_number: nextVersionNumber, content_json: version.content_json, content_markdown: version.content_markdown });
          if (vErr) throw vErr;

          toast.success("Force Rollback Successful", { description: `Deployed as REV_${nextVersionNumber}.0` });
          if (onUpdate) onUpdate();
          onClose();
      } catch (err) {
          toast.error("Rollback Failed", { description: err.message });
      } finally {
          setIsRestoring(false);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] bg-black border border-white/10 p-0 gap-0 rounded-none overflow-hidden max-h-[90vh] flex flex-col z-[100]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 bg-zinc-900/50 flex justify-between items-start shrink-0">
            <div className="flex gap-5">
                <div className="relative w-20 h-14 border border-white/10 bg-black shrink-0 overflow-hidden">
                    {blog.cover_image ? (
                        <Image src={blog.cover_image} alt="Cover" fill className="object-cover opacity-80" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-zinc-600">NO_IMG</div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-black ${blog.status === 'shadow_hidden' ? 'bg-red-500' : 'bg-green-500'}`} />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono bg-blue-900/30 text-blue-500 px-2 py-0.5 border border-blue-900/50 uppercase flex items-center gap-1">
                            <Terminal size={10} /> AUDIT_MODE
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            ID: {blog.id.substring(0,8)}...
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 truncate max-w-xl">
                        {blog.title}
                    </h2>
                </div>
            </div>
            <DialogClose asChild>
                <button className="text-zinc-500 hover:text-white transition-colors shrink-0"><X size={24} /></button>
            </DialogClose>
        </div>

        {/* TABS */}
        <div className="flex border-b border-white/10 bg-zinc-900/20 shrink-0 overflow-x-auto no-scrollbar">
            <TabButton label="Dossier Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={FileText} />
            <TabButton label={`Signal Audit (${comments.length})`} active={activeTab === 'signals'} onClick={() => setActiveTab('signals')} icon={MessageSquare} />
            <TabButton label={`Version Control (${versions.length})`} active={activeTab === 'versions'} onClick={() => setActiveTab('versions')} icon={History} />
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-black relative custom-scrollbar">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-4 opacity-50">
                    <Loader2 className="animate-spin text-red-500" size={32} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Extracting Intel...</span>
                </div>
            ) : (
                <>
                    {/* --- OVERVIEW TAB --- */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-6">
                                    <div className="bg-zinc-900/20 border border-white/10 p-5">
                                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4">Metadata</h4>
                                        <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-300">
                                            <div><span className="text-zinc-600 block mb-1">Author Identity:</span> @{blog.author?.username}</div>
                                            <div><span className="text-zinc-600 block mb-1">Created At:</span> {new Date(blog.created_at).toLocaleString()}</div>
                                            <div><span className="text-zinc-600 block mb-1">Status:</span> <span className={blog.status === 'shadow_hidden' ? 'text-red-500' : 'text-green-500'}>{blog.status.toUpperCase()}</span></div>
                                            <div><span className="text-zinc-600 block mb-1">Total Tags:</span> {blog.tags?.length || 0} Sectors</div>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/20 border border-white/10 p-5">
                                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4">Raw Excerpt</h4>
                                        <p className="text-sm font-sans text-zinc-300 leading-relaxed border-l-2 border-white/10 pl-3">
                                            {blog.excerpt || "No excerpt generated. Content is encrypted or missing."}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-zinc-900/50 border border-white/10 p-5">
                                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4">Admin Directives</h4>
                                        <div className="space-y-3">
                                            <Button onClick={toggleShadowHide} className={`w-full justify-start h-10 rounded-none font-mono text-[10px] uppercase border transition-all ${blog.status === 'shadow_hidden' ? 'bg-red-900/20 border-red-500/50 text-red-500 hover:bg-red-900/40' : 'bg-transparent border-white/10 text-zinc-400 hover:text-white hover:border-white/30'}`}>
                                                {blog.status === 'shadow_hidden' ? <><Eye className="mr-2" size={14}/> Restore Visibility</> : <><EyeOff className="mr-2" size={14}/> Shadow Hide Report</>}
                                            </Button>
                                            <Button onClick={togglePromoted} className={`w-full justify-start h-10 rounded-none font-mono text-[10px] uppercase border transition-all ${blog.is_promoted ? 'bg-purple-900/20 border-purple-500/50 text-purple-400 hover:bg-purple-900/40' : 'bg-transparent border-white/10 text-zinc-400 hover:text-white hover:border-white/30'}`}>
                                                <Star className="mr-2" size={14} fill={blog.is_promoted ? "currentColor" : "none"} /> 
                                                {blog.is_promoted ? "Revoke Promotion" : "Promote to Carousel"}
                                            </Button>
                                            <Link href={`/profile/${blog.author?.username}`} target="_blank">
                                                <Button className="w-full justify-start h-10 rounded-none bg-transparent border-white/10 border text-zinc-400 hover:text-white mt-3 font-mono text-[10px] uppercase">
                                                    <ExternalLink className="mr-2" size={14}/> Inspect Author
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SIGNALS TAB (WITH SEARCH) --- */}
                    {activeTab === 'signals' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-blue-900/10 border border-blue-900/30">
                                <div className="text-blue-400 text-[10px] md:text-xs font-mono uppercase">
                                    <span className="flex items-center gap-2 font-bold mb-1"><Lock size={14}/> Cryptographic Trust Active</span>
                                    <span className="opacity-80">'Private-to-Self' annotations are filtered from Admin view.</span>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
                                    <input 
                                        type="text" 
                                        placeholder="Search User, Snippet, or Content..."
                                        value={signalSearch}
                                        onChange={(e) => setSignalSearch(e.target.value)}
                                        className="w-full bg-black border border-blue-900/50 text-xs font-mono text-white h-9 pl-9 pr-3 focus:border-blue-500 outline-none transition-colors placeholder:text-blue-900/50"
                                    />
                                </div>
                            </div>
                            
                            {filteredComments.length === 0 ? (
                                <div className="py-20 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600 border border-dashed border-white/10">No Signals Match Query</div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredComments.map(c => (
                                        <div key={c.id} className="p-5 bg-zinc-900/20 border border-white/10 hover:border-white/30 transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-zinc-800 border border-white/10 relative"><Image src={getAvatar(c.user)} alt="" fill className="object-cover" /></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
                                                            @{c.user?.username}
                                                            {c.user?.role === 'banned' && <span className="text-[8px] bg-red-600 text-white px-1">BANNED</span>}
                                                        </p>
                                                        <p className="text-[9px] font-mono text-zinc-500 uppercase">{new Date(c.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-[8px] font-mono px-2 py-0.5 border uppercase ${c.visibility === 'public' ? 'border-green-500/30 text-green-500' : 'border-purple-500/30 text-purple-400'}`}>
                                                        {c.visibility.replace(/_/g, ' ')}
                                                    </span>
                                                    <button onClick={() => purgeSignal(c.id)} className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Purge Signal">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {c.annotation_data && (
                                                <div className="mb-3 p-3 bg-black border-l-2 border-red-500/50 text-[10px] font-mono text-zinc-400 italic">
                                                    "{c.annotation_data.text}"
                                                </div>
                                            )}
                                            <p className="text-sm font-sans text-zinc-300 leading-relaxed">{c.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- VERSIONS TAB (WITH SEARCH) --- */}
                    {activeTab === 'versions' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-red-900/10 border border-red-900/30 mb-6">
                                <div className="text-red-400 text-[10px] md:text-xs font-mono uppercase">
                                    <span className="flex items-center gap-2 font-bold mb-1"><AlertTriangle size={14}/> Force Rollback Protocol</span>
                                    <span className="opacity-80">Overwrites live deployment.</span>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/50" />
                                    <input 
                                        type="text" 
                                        placeholder="Search Content or REV#..."
                                        value={versionSearch}
                                        onChange={(e) => setVersionSearch(e.target.value)}
                                        className="w-full bg-black border border-red-900/50 text-xs font-mono text-white h-9 pl-9 pr-3 focus:border-red-500 outline-none transition-colors placeholder:text-red-900/50"
                                    />
                                </div>
                            </div>

                            {filteredVersions.length === 0 ? (
                                 <div className="py-20 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600 border border-dashed border-white/10">No Revisions Match Query</div>
                            ) : (
                                <div className="relative border-l border-white/10 pl-6 space-y-6 ml-2">
                                    {filteredVersions.map((v, idx) => {
                                        const isLatest = v.version_number === versions[0]?.version_number;
                                        return (
                                            <div key={v.id} className="relative">
                                                <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 ${isLatest ? 'bg-red-600 border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-black border-white/20'}`} />
                                                <div className="bg-zinc-900/30 border border-white/10 p-5 hover:border-white/30 transition-colors">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className={`text-sm font-bold font-mono uppercase tracking-tight ${isLatest ? 'text-white' : 'text-zinc-400'}`}>
                                                            REV_{v.version_number}.0
                                                        </h4>
                                                        <span className="text-[10px] font-mono text-zinc-500">{new Date(v.created_at).toLocaleString()}</span>
                                                    </div>
                                                    
                                                    <div className="bg-black border border-white/5 p-3 mb-4 max-h-24 overflow-hidden relative">
                                                        <p className="text-[9px] font-mono text-zinc-500 whitespace-pre-wrap">{v.content_markdown?.substring(0, 300)}...</p>
                                                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent" />
                                                    </div>

                                                    <div className="flex justify-end">
                                                        {isLatest ? (
                                                            <span className="text-[9px] font-mono uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-1 flex items-center gap-1 border border-green-500/20">
                                                                <Check size={10} /> Live Deployment
                                                            </span>
                                                        ) : (
                                                            <Button 
                                                                onClick={() => forceRollback(v)}
                                                                disabled={isRestoring}
                                                                variant="outline" 
                                                                className="h-8 text-[9px] font-mono uppercase rounded-none border-white/10 bg-black hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/50 transition-all text-zinc-400"
                                                            >
                                                                {isRestoring ? <Loader2 className="animate-spin size={12}" /> : <><RotateCcw size={10} className="mr-1.5" /> Force Restore</>}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({ label, active, onClick, icon: Icon }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0
                ${active ? "border-red-500 text-white bg-white/5" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"}`}
        >
            {Icon && <Icon size={14} className={active ? "text-red-500" : ""} />} {label}
        </button>
    )
}