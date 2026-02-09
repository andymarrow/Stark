"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Trash2, Loader2, ChevronRight, Users } from "lucide-react";
import { useAuth } from "@/app/_context/AuthContext";

export default function MentionFilterBar({ activeMention, onMentionSelect }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatured = async () => {
    setLoading(true);
    const { data } = await supabase.from('featured_mentions_view').select('*').order('username');
    setFeatured(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeatured();
    const handleUpdate = () => fetchFeatured();
    window.addEventListener("featured_mentions_updated", handleUpdate);

    const checkAdmin = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data?.role === 'admin') setIsAdmin(true);
    };
    checkAdmin();

    return () => window.removeEventListener("featured_mentions_updated", handleUpdate);
  }, [user]);

  const removeFeatured = async (e, mentionId) => {
    e.stopPropagation();
    await supabase.from('featured_mentions').delete().eq('user_id', mentionId);
    fetchFeatured();
  };

  if (loading && featured.length === 0) return <div className="h-24 flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;

  return (
    <div className="mb-10 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">Spotlight_Mentions</h3>
        <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-600 uppercase md:hidden">
            Scroll <ChevronRight size={10} />
        </div>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 -mx-4 px-4">
            
            {/* --- COMMUNITY REGISTRY NODE (FIX) --- */}
            <div 
                onClick={() => onMentionSelect(activeMention === '__COMMUNITY__' ? null : '__COMMUNITY__')}
                className={`
                    flex-shrink-0 w-[280px] p-4 border transition-all duration-300 cursor-pointer relative group select-none
                    ${activeMention === '__COMMUNITY__' 
                        ? 'bg-zinc-100 border-zinc-100 text-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)]' 
                        : 'bg-secondary/5 border-dashed border-border hover:border-accent text-muted-foreground'}
                `}
            >
                <div className="flex gap-3 mb-3">
                    <div className={`w-10 h-10 border border-dashed flex items-center justify-center transition-colors ${activeMention === '__COMMUNITY__' ? 'border-black bg-black text-white' : 'border-border bg-background'}`}>
                        <Users size={20} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm uppercase tracking-tight">Community_Registry</h4>
                        <p className="text-[9px] font-mono uppercase opacity-70">Unlabeled_Mentions</p>
                    </div>
                </div>
                <p className={`text-[10px] line-clamp-2 leading-relaxed font-light ${activeMention === '__COMMUNITY__' ? 'text-black/80' : 'text-muted-foreground'}`}>
                    Browse projects mentioning creators not currently in the spotlight.
                </p>
            </div>

            {/* --- FEATURED NODES --- */}
            {featured.map((profile) => {
                const isActive = activeMention === profile.username;
                return (
                    <div 
                        key={profile.id}
                        onClick={() => onMentionSelect(isActive ? null : profile.username)}
                        className={`
                            flex-shrink-0 w-[280px] p-4 border transition-all duration-300 cursor-pointer relative group select-none
                            ${isActive 
                                ? 'bg-accent border-accent text-white shadow-[8px_8px_0px_0px_rgba(220,38,38,0.15)]' 
                                : 'bg-card border-border hover:border-accent/50 text-foreground'}
                        `}
                    >
                        <div className="flex gap-3 mb-3">
                            <div className="relative w-10 h-10 border border-border/50 bg-secondary overflow-hidden">
                                <Image src={profile.avatar_url || "/placeholder.jpg"} alt="av" fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-sm truncate uppercase tracking-tight">@{profile.username}</h4>
                                <p className={`text-[10px] font-mono truncate ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                                    {profile.full_name || 'Protocol_User'}
                                </p>
                            </div>
                        </div>

                        <p className={`text-[10px] line-clamp-2 leading-relaxed font-light ${isActive ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {profile.bio || "No system profile description available."}
                        </p>

                        {isAdmin && (
                            <button 
                                onClick={(e) => removeFeatured(e, profile.id)}
                                className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                )
            })}
            <div className="flex-shrink-0 w-4" />
        </div>
        <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 hidden md:block" />
      </div>
    </div>
  );
}