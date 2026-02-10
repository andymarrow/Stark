"use client";
import { useState, useEffect } from "react";
import { Search, UserPlus, X, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { toast } from "sonner";
import { getAvatar } from "@/constants/assets";

export default function CollaboratorManager({ collaborators, onAdd, onRemove }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search Users logic
  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, email')
        .ilike('username', `%${query}%`)
        .limit(5);
        
      setResults(data || []);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchUsers, 500);
    return () => clearTimeout(debounce);
  }, [query]);

  const addExistingUser = (user) => {
    if (collaborators.some(c => c.id === user.id || c.username === user.username)) {
        toast.error("User already added");
        return;
    }

    onAdd({
      type: 'user',
      user_id: user.id, // Explicitly naming for the database insert logic
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      status: 'pending'
    });
    
    setQuery("");
    setResults([]);
  };

  const addGhostUser = () => {
    if (!query.includes('@')) {
        toast.error("Invalid Email Format");
        return;
    }
    
    if (collaborators.some(c => c.email === query)) {
        toast.error("Email already invited");
        return;
    }

    onAdd({
      type: 'ghost',
      id: query, // Email acts as unique ID for ghost
      email: query,
      status: 'pending'
    });
    
    setQuery("");
    setResults([]);
  };

  return (
    <div className="space-y-4">
      
      {/* Search Bar */}
      <div className="relative z-50">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search username or enter email..."
                className="w-full h-10 pl-9 pr-4 bg-secondary/5 border border-border text-sm font-mono outline-none focus:border-accent transition-colors"
            />
            {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-accent" size={14} />
                </div>
            )}
        </div>

        {/* Search Results Dropdown */}
        {query.length >= 3 && (
            <div className="absolute top-full left-0 w-full mt-1 border border-border bg-background shadow-2xl max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1">
                {results.length > 0 ? (
                    results.map(user => (
                        <button 
                            key={user.id}
                            onClick={() => addExistingUser(user)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-secondary/20 text-left transition-colors border-b border-border/50 last:border-0"
                        >
                            <div className="w-8 h-8 relative bg-secondary border border-border">
                                <Image 
                                    src={getAvatar(user)} 
                                    alt={user.username} 
                                    fill 
                                    className="object-cover" 
                                />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground leading-none">{user.full_name || user.username}</p>
                                <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
                            </div>
                            <UserPlus size={14} className="ml-auto text-muted-foreground" />
                        </button>
                    ))
                ) : query.includes('@') ? (
                    <button 
                        onClick={addGhostUser}
                        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/20 text-left transition-colors group"
                    >
                        <div className="w-8 h-8 bg-secondary border border-border flex items-center justify-center">
                            <Mail size={14} className="text-muted-foreground group-hover:text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Invite via Email</p>
                            <p className="text-xs text-muted-foreground font-mono">{query}</p>
                        </div>
                        <UserPlus size={14} className="ml-auto text-muted-foreground" />
                    </button>
                ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground font-mono">
                        No users found. Enter email to invite externally.
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Selected List */}
      {collaborators.length > 0 && (
        <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.2em] block mb-2">
                Active_Squad_Registry
            </span>
            <div className="grid gap-2">
                {collaborators.map((c, i) => (
                    <div key={c.id || i} className="flex items-center justify-between p-2 bg-secondary/5 border border-border group animate-in slide-in-from-left-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 relative bg-secondary border border-border">
                                {c.type === 'user' ? (
                                    <Image src={getAvatar(c)} alt={c.username} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Mail size={14} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground">
                                    {c.type === 'user' ? `@${c.username}` : c.email}
                                </p>
                                <span className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                                    {c.type === 'ghost' ? "Pending_Invite" : "System_Verified"}
                                    {c.isNew && <span className="text-accent">• Unsaved</span>}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onRemove(c)} 
                            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

    </div>
  );
}