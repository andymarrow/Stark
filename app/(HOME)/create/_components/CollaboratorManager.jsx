"use client";
import { useState, useEffect } from "react";
import { Search, X, User, Mail, Check, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Image from "next/image";

export default function CollaboratorManager({ collaborators, setCollaborators }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Search Logic (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query || query.includes('@')) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      // Search by username or full_name
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);
      
      // Filter out already added users
      const filtered = (data || []).filter(u => !collaborators.some(c => c.user_id === u.id));
      setSearchResults(filtered);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, collaborators]);

  const addExistingUser = (user) => {
    setCollaborators(prev => [...prev, {
      type: 'user',
      user_id: user.id,
      username: user.username,
      avatar: user.avatar_url,
      status: 'pending'
    }]);
    setQuery("");
    setSearchResults([]);
  };

  const addGhostUser = () => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(query)) {
      toast.error("Invalid Email Format");
      return;
    }

    if (collaborators.some(c => c.email === query)) {
        toast.error("Already Added");
        return;
    }

    setCollaborators(prev => [...prev, {
      type: 'ghost',
      email: query,
      status: 'invite_queued'
    }]);
    setQuery("");
  };

  const removeCollaborator = (index) => {
    setCollaborators(prev => prev.filter((_, i) => i !== index));
  };

  const isEmail = query.includes('@');

  return (
    <div className="space-y-4">
      <label className="text-xs font-mono uppercase text-muted-foreground">Collaborators / Credits</label>
      
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isSearching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
        </div>
        <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username or enter email to invite..."
            className="w-full h-12 pl-12 pr-24 bg-secondary/5 border border-border focus:border-accent outline-none font-mono text-sm transition-colors"
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isEmail) addGhostUser();
                }
            }}
        />
        {/* Email Add Button */}
        {isEmail && query.length > 5 && (
            <button 
                onClick={addGhostUser}
                className="absolute right-2 top-2 bottom-2 px-3 bg-accent text-white text-[10px] font-mono uppercase tracking-wider hover:bg-accent/90"
            >
                Invite
            </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="border border-border bg-background shadow-xl max-h-48 overflow-y-auto">
            {searchResults.map(user => (
                <button
                    key={user.id}
                    onClick={() => addExistingUser(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary/10 transition-colors text-left"
                >
                    <div className="relative w-8 h-8 bg-secondary border border-border overflow-hidden">
                        <Image src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt={user.username} fill className="object-cover" />
                    </div>
                    <div>
                        <div className="text-sm font-bold">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">@{user.username}</div>
                    </div>
                    <UserPlus size={14} className="ml-auto text-muted-foreground" />
                </button>
            ))}
        </div>
      )}

      {/* Selected List */}
      {collaborators.length > 0 && (
        <div className="flex flex-wrap gap-2">
            {collaborators.map((collab, idx) => (
                <div key={idx} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-secondary/10 border border-border group">
                    {collab.type === 'user' ? (
                        <>
                            <div className="relative w-5 h-5 bg-secondary border border-border overflow-hidden">
                                <Image src={collab.avatar} alt={collab.username} fill className="object-cover" />
                            </div>
                            <span className="text-xs font-bold">{collab.username}</span>
                        </>
                    ) : (
                        <>
                            <Mail size={14} className="text-muted-foreground ml-1" />
                            <span className="text-xs font-mono">{collab.email}</span>
                            <span className="text-[9px] bg-accent/10 text-accent px-1 border border-accent/20">INVITE</span>
                        </>
                    )}
                    
                    <button 
                        onClick={() => removeCollaborator(idx)}
                        className="ml-2 text-muted-foreground hover:text-red-500"
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}