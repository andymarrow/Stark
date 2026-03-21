"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal, Eye, Star, Edit3, Trash2,
  ExternalLink, Search, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, Terminal, Heart, MessageSquare, Clock
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 5;

export default function MyBlogsManager({ user, profile }) {
  const [blogs, setBlogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("published"); // 'published' | 'draft' | 'shadow_hidden'

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Anti-freeze mechanism for dialogs
  useEffect(() => {
    if (!itemToDelete) {
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
        document.body.style.overflow = "auto";
      }, 100);
    }
  }, [itemToDelete]);

  const fetchBlogs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('blogs')
        .select('*', { count: 'exact' })
        .eq('author_id', user.id)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (activeTab === 'published') {
          query = query.in('status', ['published', 'shadow_hidden']);
      } else if (activeTab === 'draft') {
          query = query.eq('status', 'draft');
      }
      
      if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      setBlogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
        console.error(error);
        toast.error("Sync Failed", { description: "Failed to retrieve intelligence reports." });
    } finally {
        setLoading(false);
    }
  }, [user?.id, currentPage, searchQuery, activeTab]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // --- ACTIONS ---
  const toggleVisibility = async (blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
        const { error } = await supabase.from('blogs').update({ status: newStatus }).eq('id', blog.id);
        if (error) throw error;
        toast.success(newStatus === 'published' ? "Report Published" : "Reverted to Draft");
        fetchBlogs(); 
    } catch (err) {
        toast.error("Action Failed");
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('blogs').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      
      toast.success("Report Purged");
      setItemToDelete(null);
      fetchBlogs();
    } catch (error) {
      toast.error("Purge Failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-[100vw] overflow-hidden">
      
      <div className="flex flex-col gap-6 border-b border-border pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-foreground flex items-center gap-2">
                    <Terminal size={24} className="text-accent" /> My Blogs
                </h2>
                <div className="flex gap-4 mt-1 text-xs md:text-sm text-muted-foreground font-mono uppercase">
                    <span>Logged Blogs: {totalCount}</span>
                </div>
            </div>
            
            {/* RESPONSIVE BUTTON CONTAINER: Stacks on mobile, Side-by-side on tablet+ */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Link href="/blog" className="w-full sm:w-auto">
                    <Button 
                        variant="outline" 
                        className="w-full border-border hover:bg-secondary text-foreground rounded-none font-mono text-xs uppercase h-10 px-6 transition-all"
                    >
                        <ExternalLink size={14} className="mr-2" /> Blog Feed
                    </Button>
                </Link>

                <Link href="/blog/write" className="w-full sm:w-auto">
                    <Button 
                        className="w-full bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase h-10 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                        <Edit3 size={14} className="mr-2" /> New Blog
                    </Button>
                </Link>
            </div>
        </div>

        {/* TABS */}
        <div className="flex items-end justify-between mt-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                <button 
                    onClick={() => { setActiveTab("published"); setCurrentPage(1); }}
                    className={`px-4 py-2 text-xs font-mono uppercase border-b-2 transition-colors whitespace-nowrap ${activeTab === 'published' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Live Deployments
                </button>
                <button 
                    onClick={() => { setActiveTab("draft"); setCurrentPage(1); }}
                    className={`px-4 py-2 text-xs font-mono uppercase border-b-2 transition-colors whitespace-nowrap ${activeTab === 'draft' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Staging (Drafts)
                </button>
            </div>
            
            <div className="relative group w-64 hidden md:block mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search Reports..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-9 bg-secondary/5 border border-border text-xs font-mono outline-none focus:border-accent text-foreground"
                />
            </div>
        </div>
      </div>

      {/* TABLE HEADER & LIST */}
      <div className="border border-border bg-background min-h-[400px] flex flex-col relative shadow-sm">
        <div className="grid grid-cols-12 gap-2 p-3 border-b border-border bg-secondary/10 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <div className="col-span-8 md:col-span-5">Report Identifier</div>
            <div className="col-span-3 hidden md:block">Metrics</div>
            <div className="col-span-3 hidden md:block">Status</div>
            <div className="col-span-4 md:col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-border flex-1">
            {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-accent" /></div>
            ) : blogs.length > 0 ? (
                blogs.map((blog) => (
                    <BlogRow 
                        key={blog.id} 
                        blog={blog} 
                        profile={profile}
                        onDeleteRequest={setItemToDelete}
                        onToggleVisibility={toggleVisibility}
                    />
                ))
            ) : (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border m-4 bg-secondary/5">
                    <Terminal size={24} className="opacity-20 mb-2" />
                    <p className="text-xs font-mono uppercase">NO_REPORTS_FOUND</p>
                </div>
            )}
        </div>

        {totalCount > 0 && (
            <div className="p-3 border-t border-border bg-secondary/5 flex justify-between items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-border" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-border" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></Button>
                </div>
            </div>
        )}
      </div>

      {/* DELETE MODAL */}
      <Dialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
        <DialogContent className="border-accent/50 bg-background rounded-none sm:max-w-[400px]">
            <DialogHeader className="p-6 border-b border-border bg-accent/5">
                <div className="flex items-center gap-2 text-accent mb-2">
                    <AlertTriangle size={20} />
                    <DialogTitle className="text-sm font-mono font-bold uppercase text-foreground">Confirm Purge</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-foreground">
                    Permanently delete <strong>{itemToDelete?.title}</strong>? All versions and signals will be destroyed.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-4 bg-secondary/5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setItemToDelete(null)} className="h-9 rounded-none border-border text-xs uppercase text-foreground">Cancel</Button>
                <Button onClick={confirmDelete} disabled={isDeleting} className="h-9 bg-accent hover:bg-red-700 text-white rounded-none text-xs uppercase">
                    {isDeleting ? <Loader2 className="animate-spin size={14}" /> : "Purge"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- ROW COMPONENT ---
function BlogRow({ blog, profile, onDeleteRequest, onToggleVisibility }) {
    const router = useRouter();
    const isDraft = blog.status === 'draft';
    const isShadowed = blog.status === 'shadow_hidden';
    
    // Determine the proper URL. Drafts go to editor, Published go to viewer.
    const targetUrl = isDraft ? `/blog/write?id=${blog.id}` : `/${profile?.username}/blog/${blog.slug}`;

    return (
        <div onClick={() => router.push(targetUrl)} className={`grid grid-cols-12 gap-2 md:gap-4 p-4 items-center group hover:bg-secondary/10 transition-all cursor-pointer ${isShadowed ? 'opacity-60 bg-red-950/10 border-l-2 border-red-500' : ''}`}>
            
            {/* Identity */}
            <div className="col-span-8 md:col-span-5 flex items-center gap-3">
                <div className="relative w-16 h-10 bg-secondary border border-border flex-shrink-0 overflow-hidden block">
                    {blog.cover_image ? (
                        <Image src={blog.cover_image} alt={blog.title} fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-muted-foreground">NO_IMG</div>
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate text-foreground group-hover:text-accent transition-colors hover:underline">
                        {blog.title}
                    </h3>
                    <div className="text-[9px] font-mono text-muted-foreground uppercase mt-0.5">
                        Updated: {new Date(blog.updated_at).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="col-span-3 hidden md:flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                {!isDraft && (
                    <>
                        <span className="flex gap-1" title="Views"><Eye size={12} /> {blog.views || 0}</span>
                        <span className="flex gap-1 text-accent" title="Stars"><Star size={12} className="fill-accent" /> {blog.likes_count || 0}</span>
                        <span className="flex gap-1 text-blue-500" title="Signals"><MessageSquare size={12} /> {blog.comments_count || 0}</span>
                    </>
                )}
                {isDraft && <span className="opacity-50">NO_TELEMETRY</span>}
            </div>

            {/* Status */}
            <div className="col-span-3 hidden md:flex items-center">
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 border tracking-widest
                    ${isDraft ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : 
                      isShadowed ? 'border-red-500/50 text-red-500 bg-red-500/10' : 
                      'border-green-500/50 text-green-500 bg-green-500/10'}`}
                >
                    {blog.status.replace('_', ' ')}
                </span>
            </div>

            {/* Actions */}
            <div className="col-span-4 md:col-span-1 flex justify-end">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-background z-10 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border bg-background shadow-xl min-w-[150px] z-[50]">
                        
                        <DropdownMenuItem asChild className="text-[10px] font-mono uppercase h-8 cursor-pointer text-foreground focus:bg-secondary">
                            <Link href={`/blog/write?id=${blog.id}`} onClick={(e) => e.stopPropagation()}>
                                <Edit3 size={12} className="mr-2" /> Resume Edit
                            </Link>
                        </DropdownMenuItem>

                        {!isDraft && (
                            <DropdownMenuItem asChild className="text-[10px] font-mono uppercase h-8 cursor-pointer text-foreground focus:bg-secondary">
                                <Link href={`/${profile?.username}/blog/${blog.slug}`} target="_blank" onClick={(e) => e.stopPropagation()}>
                                    <ExternalLink size={12} className="mr-2" /> View Live
                                </Link>
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-border" />
                        
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleVisibility(blog); }} className="text-[10px] font-mono uppercase h-8 cursor-pointer text-foreground focus:bg-secondary">
                            <Clock size={12} className="mr-2" /> {isDraft ? 'Publish' : 'Revert to Draft'}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-border" />

                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteRequest(blog); }} className="text-[10px] font-mono uppercase h-8 cursor-pointer text-red-500 focus:text-white focus:bg-red-600 hover:bg-red-600">
                            <Trash2 size={12} className="mr-2" /> Purge Report
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}