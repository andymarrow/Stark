"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, FileCode, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";

export default function AdminSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const search = async () => {
      if (!query || query.length < 2) {
        setResults({ users: [], projects: [] });
        return;
      }

      setLoading(true);
      
      // Parallel Search
      const [usersRes, projectsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, full_name, role').or(`username.ilike.%${query}%,email.ilike.%${query}%`).limit(3),
        supabase.from('projects').select('id, title, slug, status').ilike('title', `%${query}%`).limit(3)
      ]);

      setResults({
        users: usersRes.data || [],
        projects: projectsRes.data || []
      });
      setLoading(false);
    };

    const timer = setTimeout(search, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path) => {
    router.push(path);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 border-white/10 bg-black text-white overflow-hidden">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-white/10">
            <Search className="w-5 h-5 text-zinc-500 mr-3" />
            <input 
                autoFocus
                placeholder="Search database..." 
                className="flex-1 bg-transparent border-none outline-none text-sm font-mono placeholder:text-zinc-600"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
            
            {/* Users Section */}
            {results.users.length > 0 && (
                <div className="mb-2">
                    <span className="text-[10px] font-mono text-zinc-500 px-2 uppercase">Users</span>
                    {results.users.map(u => (
                        <button key={u.id} onClick={() => handleSelect(`/admin/users?q=${u.username}`)} className="flex items-center w-full px-2 py-2 hover:bg-white/5 group text-left">
                            <User size={14} className="mr-3 text-zinc-600 group-hover:text-blue-400" />
                            <div>
                                <div className="text-sm font-bold text-zinc-300 group-hover:text-white">{u.username}</div>
                                <div className="text-[10px] text-zinc-600">{u.role}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Projects Section */}
            {results.projects.length > 0 && (
                <div>
                    <span className="text-[10px] font-mono text-zinc-500 px-2 uppercase">Projects</span>
                    {results.projects.map(p => (
                        <button key={p.id} onClick={() => handleSelect(`/project/${p.slug}`)} className="flex items-center w-full px-2 py-2 hover:bg-white/5 group text-left">
                            <FileCode size={14} className="mr-3 text-zinc-600 group-hover:text-purple-400" />
                            <div>
                                <div className="text-sm font-bold text-zinc-300 group-hover:text-white">{p.title}</div>
                                <div className="text-[10px] text-zinc-600">{p.status}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && query.length > 1 && results.users.length === 0 && results.projects.length === 0 && (
                <div className="p-8 text-center text-xs font-mono text-zinc-600">NO_RECORDS_FOUND</div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}