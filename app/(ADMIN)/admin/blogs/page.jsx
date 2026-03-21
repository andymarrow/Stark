// app/(ADMIN)/admin/blogs/page.jsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  FileText, Search, Loader2, RefreshCw, MoreHorizontal, 
  Eye, Heart, MessageSquare, ShieldAlert, Star, EyeOff, Trash2
} from "lucide-react";
import Image from "next/image";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/ui/Pagination";
import { getAvatar } from "@/constants/assets";
import BlogAuditorModal from "./_components/BlogAuditorModal";

const ITEMS_PER_PAGE = 10;

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("all"); // all | published | draft | promoted | shadow

  // Modal State (Placeholder for Phase 2)
  const [selectedBlog, setSelectedBlog] = useState(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
        let query = supabase
            .from('blogs')
            .select('*, author:profiles!author_id(username, full_name, avatar_url)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (searchTerm) {
            query = query.ilike('title', `%${searchTerm}%`);
        }

        if (filter === 'published') query = query.eq('status', 'published');
        if (filter === 'draft') query = query.eq('status', 'draft');
        if (filter === 'shadow') query = query.eq('status', 'shadow_hidden');
        if (filter === 'promoted') query = query.eq('is_promoted', true);

        const { data, count, error } = await query;
        if (error) throw error;

        setBlogs(data || []);
        setTotalCount(count || 0);
    } catch (err) {
        console.error(err);
        toast.error("Failed to load intelligence ledger");
    } finally {
        setLoading(false);
    }
  }, [page, searchTerm, filter]);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        setPage(1);
        fetchBlogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filter]);

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  // --- ACTIONS ---
  const togglePromoted = async (blog) => {
    const newStatus = !blog.is_promoted;
    const { error } = await supabase.from('blogs').update({ is_promoted: newStatus }).eq('id', blog.id);
    if (!error) {
        toast.success(newStatus ? "Report Promoted to Carousel" : "Report Demoted");
        fetchBlogs();
    } else toast.error("Action Failed");
  };

  const toggleShadowHide = async (blog) => {
    const newStatus = blog.status === 'shadow_hidden' ? 'published' : 'shadow_hidden';
    const confirmMsg = newStatus === 'shadow_hidden' 
        ? "Shadow Hide this report? (Author will still see it, but it drops from global feeds)" 
        : "Restore visibility to public?";
    
    if (!confirm(confirmMsg)) return;

    const { error } = await supabase.from('blogs').update({ status: newStatus }).eq('id', blog.id);
    if (!error) {
        toast.success(newStatus === 'shadow_hidden' ? "Shadow Protocol Engaged" : "Visibility Restored");
        fetchBlogs();
    } else toast.error("Action Failed");
  };

  const purgeReport = async (blog) => {
      const confirmText = prompt(`Type "PURGE" to permanently delete report: ${blog.title}`);
      if (confirmText !== 'PURGE') return;

      const { error } = await supabase.from('blogs').delete().eq('id', blog.id);
      if (!error) { 
          toast.success("Report Purged from Mainframe");
          fetchBlogs();
      } else toast.error("Purge Failed");
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <FileText className="text-red-500" /> Blog Intelligence
            </h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                Nodes_In_Ledger: <span className="text-white font-bold">{totalCount}</span>
            </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                    type="text" 
                    placeholder="Search Title..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black border border-white/10 text-xs font-mono text-white h-10 pl-10 pr-3 focus:border-red-600 focus:outline-none transition-colors" 
                />
            </div>
            <Button onClick={() => fetchBlogs()} className="h-10 w-10 p-0 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-400">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
        </div>
      </div>

      <div className="flex border-b border-white/10">
          {[
              { id: 'all', label: 'All Reports' },
              { id: 'published', label: 'Live' },
              { id: 'draft', label: 'Drafts' },
              { id: 'promoted', label: 'Promoted' },
              { id: 'shadow', label: 'Shadowed' }
          ].map((tab) => (
              <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`
                      px-6 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors
                      ${filter === tab.id 
                          ? "border-red-500 text-white bg-white/5" 
                          : "border-transparent text-zinc-500 hover:text-zinc-300"}
                  `}
              >
                  {tab.label}
              </button>
          ))}
      </div>

      <div className="bg-black border border-white/10"> 
            <AdminTable headers={["Target Report", "Author", "Metrics", "Status", "Flags", "Actions"]}>
                {loading && blogs.length === 0 ? (
                    <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin text-accent mx-auto" /></td></tr>
                ) : blogs.length > 0 ? (
                    blogs.map((blog) => (
                        <AdminRow key={blog.id} className={`cursor-pointer ${blog.status === 'shadow_hidden' ? 'opacity-60 bg-red-950/10' : ''}`}>
                            
                            {/* Target Report */}
                            <AdminCell onClick={() => setSelectedBlog(blog)}>
                                <div className="flex items-center gap-3 w-64">
                                    <div className="w-12 h-8 relative bg-zinc-900 border border-white/10 overflow-hidden shrink-0">
                                        {blog.cover_image ? (
                                            <Image src={blog.cover_image} alt="" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-zinc-600">NO_IMG</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-zinc-200 truncate">{blog.title}</div>
                                        <div className="text-[9px] text-zinc-500 font-mono uppercase">{new Date(blog.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </AdminCell>

                            {/* Author */}
                            <AdminCell onClick={() => setSelectedBlog(blog)}>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 relative rounded-full overflow-hidden border border-zinc-700">
                                        <Image src={getAvatar(blog.author)} alt="" fill className="object-cover" />
                                    </div>
                                    <span className="text-xs font-mono text-zinc-300 hover:text-white transition-colors">
                                        @{blog.author?.username || "Unknown"}
                                    </span>
                                </div>
                            </AdminCell>

                            {/* Metrics */}
                            <AdminCell mono onClick={() => setSelectedBlog(blog)}>
                                <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                                    <span className="flex items-center gap-1" title="Views"><Eye size={12} /> {blog.views}</span>
                                    <span className="flex items-center gap-1 text-accent" title="Stars"><Heart size={12} /> {blog.likes_count}</span>
                                    <span className="flex items-center gap-1" title="Signals"><MessageSquare size={12} /> {blog.comments_count || 0}</span>
                                </div>
                            </AdminCell>

                            {/* Status */}
                            <AdminCell mono onClick={() => setSelectedBlog(blog)}>
                                <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-widest
                                    ${blog.status === 'published' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 
                                      blog.status === 'draft' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' : 
                                      'border-red-500/30 text-red-500 bg-red-500/10'}`}>
                                    {blog.status.replace('_', ' ')}
                                </span>
                            </AdminCell>

                            {/* Flags (Promoted) */}
                            <AdminCell mono onClick={() => setSelectedBlog(blog)}>
                                {blog.is_promoted ? (
                                    <span className="px-2 py-0.5 border border-purple-500/30 text-purple-400 bg-purple-500/10 text-[9px] uppercase flex items-center gap-1 w-fit">
                                        <Star size={10} className="fill-purple-400" /> Promoted
                                    </span>
                                ) : (
                                    <span className="text-zinc-600 text-[10px]">-</span>
                                )}
                            </AdminCell>

                            {/* Actions */}
                            <AdminCell>
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-black border-white/10 rounded-none text-zinc-300 w-56 z-[100]">
                                        <DropdownMenuLabel className="font-mono text-[10px] uppercase text-zinc-600 px-3 py-2">God_Directives</DropdownMenuLabel>
                                        
                                        <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-xs font-mono py-2" onClick={() => setSelectedBlog(blog)}>
                                            <ShieldAlert className="mr-2 h-3.5 w-3.5 text-blue-400" /> Open Auditor Modal
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator className="bg-white/10" />
                                        
                                        <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-xs font-mono py-2" onClick={() => togglePromoted(blog)}>
                                            <Star className={`mr-2 h-3.5 w-3.5 ${blog.is_promoted ? 'text-zinc-500' : 'text-purple-400'}`} /> 
                                            {blog.is_promoted ? "Revoke Promotion" : "Promote to Carousel"}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="focus:bg-orange-950 text-orange-500 cursor-pointer text-xs font-mono py-2" onClick={() => toggleShadowHide(blog)}>
                                            {blog.status === 'shadow_hidden' ? <Eye className="mr-2 h-3.5 w-3.5" /> : <EyeOff className="mr-2 h-3.5 w-3.5" />} 
                                            {blog.status === 'shadow_hidden' ? 'Restore Visibility' : 'Engage Shadow Protocol'}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator className="bg-white/10" />

                                        <DropdownMenuItem className="focus:bg-red-900 text-white cursor-pointer text-xs font-mono py-2" onClick={() => purgeReport(blog)}>
                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Report
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </AdminCell>
                        </AdminRow>
                    ))
                ) : (
                    <tr><td colSpan={6} className="p-20 text-center text-zinc-600 font-mono text-xs italic">NO_INTELLIGENCE_FOUND</td></tr>
                )}
            </AdminTable>
            
            <div className="p-4 border-t border-white/5 bg-zinc-900/20">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} />
            </div>
      </div>

        <BlogAuditorModal 
            blog={selectedBlog} 
            isOpen={!!selectedBlog} 
            onClose={() => setSelectedBlog(null)}
            onUpdate={fetchBlogs} 
        />
    </div>
  );
}