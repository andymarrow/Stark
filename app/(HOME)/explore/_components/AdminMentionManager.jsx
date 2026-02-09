"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UserPlus, X, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminMentionManager() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async (val) => {
    setQuery(val);
    if (val.length < 2) { setResults([]); return; }
    
    setIsSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, full_name')
      .ilike('username', `%${val}%`)
      .limit(5);
    setResults(data || []);
    setIsSearching(false);
  };

  const addToFeatured = async (user) => {
    const { error } = await supabase
      .from('featured_mentions')
      .insert({ user_id: user.id });

    if (error) {
        if (error.code === '23505') toast.error("User already featured");
        else toast.error("Error adding user");
    } else {
        toast.success(`@${user.username} added to registry`);
        setQuery("");
        setResults([]);
        // Notify other components to refresh
        window.dispatchEvent(new Event("featured_mentions_updated"));
    }
  };

  return (
    // REMOVED: overflow-hidden from this div
    <div className="bg-accent/5 border border-accent/20 p-4 mb-8 relative">
      
      {/* Decorative background element - moved to avoid overlap */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <UserPlus size={40} />
      </div>

      <div className="flex items-center gap-2 mb-4 text-accent font-mono text-[10px] uppercase tracking-[0.2em] relative z-10">
        <UserPlus size={14} /> // Admin_Registry_Management
      </div>

      <div className="relative max-w-md z-20">
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <input 
                type="text" 
                value={query}
                onChange={(e) => searchUsers(e.target.value)}
                placeholder="Type username to feature..." 
                className="w-full h-10 pl-10 bg-background border border-border focus:border-accent outline-none text-xs font-mono uppercase transition-colors"
            />
            {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={14} className="animate-spin text-accent" />
                </div>
            )}
        </div>

        {/* Dropdown Results - High Z-Index to overlap page content */}
        {results.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-black border border-border mt-1 z-[100] shadow-[0_20px_50px_rgba(0,0,0,1)]">
                {results.map(user => (
                    <button 
                        key={user.id}
                        onClick={() => addToFeatured(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/80 text-left border-b border-border/50 last:border-0 transition-colors group"
                    >
                        <div className="relative w-8 h-8 bg-secondary border border-border overflow-hidden">
                            <Image 
                                src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                                alt="av" 
                                fill 
                                className="object-cover grayscale group-hover:grayscale-0 transition-all" 
                            />
                        </div>
                        <div>
                            <p className="text-xs font-bold font-mono text-foreground group-hover:text-accent transition-colors">@{user.username}</p>
                            <p className="text-[10px] text-muted-foreground uppercase truncate max-w-[200px]">{user.full_name || 'No Name Set'}</p>
                        </div>
                    </button>
                ))}
            </div>
        )}

        {/* Backdrop to close list when clicking outside (Optional UI helper) */}
        {results.length > 0 && (
            <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setResults([])} 
            />
        )}
      </div>
    </div>
  );
}