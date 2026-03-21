// app/(ADMIN)/admin/users/_components/UserBlogsTab.jsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Search, FileText, Eye, Heart, MessageSquare, Star, EyeOff, Trash2, MoreHorizontal, ShieldAlert } from "lucide-react";
import Image from "next/image";
import AdminTable, { AdminRow, AdminCell } from "../../_components/AdminTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import BlogAuditorModal from "../../blogs/_components/BlogAuditorModal";

export default function UserBlogsTab({ user }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBlog, setSelectedBlog] = useState(null);

  const fetchUserBlogs = async () => {
      setLoading(true);
      try {
          const { data, error } = await supabase
              .from('blogs')
              .select('*')
              .eq('author_id', user.id)
              .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          // Attach author object manually so the Auditor Modal has the expected structure
          const formatted = (data || []).map(b => ({ ...b, author: user }));
          setBlogs(formatted);
      } catch (err) {
          toast.error("Failed to sync user blogs");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      if (user?.id) fetchUserBlogs();
  }, [user]);

  const filteredBlogs = blogs.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  // --- ACTIONS ---
  const togglePromoted = async (blog) => {
      const newStatus = !blog.is_promoted;
      const { error } = await supabase.from('blogs').update({ is_promoted: newStatus }).eq('id', blog.id);
      if (!error) {
          toast.success(newStatus ? "Promoted to Carousel" : "Promotion Revoked");
          fetchUserBlogs();
      }
  };

  const toggleShadowHide = async (blog) => {
      const newStatus = blog.status === 'shadow_hidden' ? 'published' : 'shadow_hidden';
      const { error } = await supabase.from('blogs').update({ status: newStatus }).eq('id', blog.id);
      if (!error) {
          toast.success(newStatus === 'shadow_hidden' ? "Shadow Protocol Engaged" : "Visibility Restored");
          fetchUserBlogs();
      }
  };

  const purgeReport = async (blog) => {
      if (!confirm(`Purge "${blog.title}" permanently?`)) return;
      const { error } = await supabase.from('blogs').delete().eq('id', blog.id);
      if (!error) { 
          toast.success("Report Purged");
          fetchUserBlogs();
      }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-end">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/20 border border-blue-900/50 text-blue-500"><FileText size={18} /></div>
                <div>
                    <h3 className="text-white font-bold text-sm uppercase tracking-tight">Intelligence Reports</h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{blogs.length} Deployed by @{user.username}</p>
                </div>
            </div>
            
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                    type="text" 
                    placeholder="Search Title..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-black border border-white/10 text-xs font-mono text-white h-9 pl-9 pr-3 focus:border-blue-500 outline-none transition-colors" 
                />
            </div>
        </div>

        <AdminTable headers={["Target Report", "Metrics", "Status", "Flags", "Actions"]}>
            {filteredBlogs.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center text-zinc-600 font-mono text-[10px] uppercase tracking-widest border border-dashed border-white/5 bg-zinc-900/20">No Records Found</td></tr>
            ) : (
                filteredBlogs.map((blog) => (
                    <AdminRow key={blog.id} className={`${blog.status === 'shadow_hidden' ? 'opacity-60 bg-red-950/10' : ''}`}>
                        
                        {/* Target Report */}
                        <AdminCell onClick={() => setSelectedBlog(blog)}>
                            <div className="flex items-center gap-3 w-64 md:w-80 cursor-pointer">
                                <div className="w-12 h-8 relative bg-zinc-900 border border-white/10 overflow-hidden shrink-0">
                                    {blog.cover_image ? <Image src={blog.cover_image} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-zinc-600">NO_IMG</div>}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-zinc-200 truncate">{blog.title}</div>
                                    <div className="text-[9px] text-zinc-500 font-mono uppercase">{new Date(blog.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </AdminCell>

                        {/* Metrics */}
                        <AdminCell mono onClick={() => setSelectedBlog(blog)} className="cursor-pointer">
                            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                                <span className="flex items-center gap-1" title="Views"><Eye size={12} /> {blog.views}</span>
                                <span className="flex items-center gap-1 text-red-500" title="Stars"><Heart size={12} /> {blog.likes_count}</span>
                                <span className="flex items-center gap-1 text-blue-400" title="Signals"><MessageSquare size={12} /> {blog.comments_count || 0}</span>
                            </div>
                        </AdminCell>

                        {/* Status */}
                        <AdminCell mono onClick={() => setSelectedBlog(blog)} className="cursor-pointer">
                            <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-widest
                                ${blog.status === 'published' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 
                                  blog.status === 'draft' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' : 
                                  'border-red-500/30 text-red-500 bg-red-500/10'}`}>
                                {blog.status.replace('_', ' ')}
                            </span>
                        </AdminCell>

                        {/* Flags */}
                        <AdminCell mono onClick={() => setSelectedBlog(blog)} className="cursor-pointer">
                            {blog.is_promoted ? (
                                <span className="px-2 py-0.5 border border-purple-500/30 text-purple-400 bg-purple-500/10 text-[9px] uppercase flex items-center gap-1 w-fit">
                                    <Star size={10} className="fill-purple-400" /> Promoted
                                </span>
                            ) : <span className="text-zinc-600 text-[10px]">-</span>}
                        </AdminCell>

                        {/* Actions */}
                        <AdminCell>
                            {/* REMOVED `modal={false}` so Radix naturally shifts pointer events to the dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button 
                                        onClick={(e) => e.stopPropagation()} 
                                        className="p-2 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                </DropdownMenuTrigger>
                                
                                <DropdownMenuContent align="end" className="bg-black border border-white/10 rounded-none text-zinc-300 w-56 z-[99999] shadow-2xl">
                                    <DropdownMenuLabel className="font-mono text-[10px] uppercase text-zinc-600 px-3 py-2">
                                        God_Directives
                                    </DropdownMenuLabel>
                                    
                                    <DropdownMenuItem 
                                        className="focus:bg-white/10 cursor-pointer text-xs font-mono py-2" 
                                        onClick={() => setSelectedBlog(blog)}
                                    >
                                        <ShieldAlert className="mr-2 h-3.5 w-3.5 text-blue-400" /> Open Auditor
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-white/10" />
                                    
                                    <DropdownMenuItem 
                                        className="focus:bg-white/10 cursor-pointer text-xs font-mono py-2" 
                                        onClick={() => togglePromoted(blog)}
                                    >
                                        <Star className={`mr-2 h-3.5 w-3.5 ${blog.is_promoted ? 'text-zinc-500' : 'text-purple-400'}`} /> 
                                        {blog.is_promoted ? "Revoke Promotion" : "Promote to Carousel"}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem 
                                        className="focus:bg-orange-950 text-orange-500 cursor-pointer text-xs font-mono py-2" 
                                        onClick={() => toggleShadowHide(blog)}
                                    >
                                        {blog.status === 'shadow_hidden' ? <Eye className="mr-2 h-3.5 w-3.5" /> : <EyeOff className="mr-2 h-3.5 w-3.5" />} 
                                        {blog.status === 'shadow_hidden' ? 'Restore Visibility' : 'Engage Shadow Protocol'}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-white/10" />

                                    <DropdownMenuItem 
                                        className="focus:bg-red-900 text-white cursor-pointer text-xs font-mono py-2" 
                                        onClick={() => purgeReport(blog)}
                                    >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Report
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </AdminCell>

                    </AdminRow>
                ))
            )}
        </AdminTable>

        <div className="relative z-[99999]">
            <BlogAuditorModal 
                blog={selectedBlog} 
                isOpen={!!selectedBlog} 
                onClose={() => setSelectedBlog(null)}
                onUpdate={fetchUserBlogs} 
            />
        </div>
    </div>
  );
}