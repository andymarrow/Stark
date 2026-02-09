"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Trash2, UserCircle2, Loader2 } from "lucide-react";
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

    // Check if current user is admin
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
  if (featured.length === 0) return null;

  return (
    <div className="mb-10">
      <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] mb-4">Spotlight_Mentions</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
        {featured.map((profile) => {
          const isActive = activeMention === profile.username;
          return (
            <div 
                key={profile.id}
                onClick={() => onMentionSelect(isActive ? null : profile.username)}
                className={`
                    flex-shrink-0 w-64 p-4 border transition-all cursor-pointer relative group
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

                {/* Admin Delete Button */}
                {isAdmin && (
                    <button 
                        onClick={(e) => removeFeatured(e, profile.id)}
                        className="absolute top-2 right-2 p-1 text-white/20 hover:text-white transition-colors"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
          )
        })}
      </div>
    </div>
  );
}