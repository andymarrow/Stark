"use client";
import { useState, useEffect } from "react";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import GridContainer from "./_components/GridContainer";
import FeedContainer from "./_components/FeedContainer";
import AdminMentionManager from "./_components/AdminMentionManager";
import MentionFilterBar from "./_components/MentionFilterBar";
import { useAuth } from "@/app/_context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); 
  const [activeMention, setActiveMention] = useState(null); 
  const [featuredUsernames, setFeaturedUsernames] = useState([]);

  // 1. Persist view mode, Check Admin Status, and Fetch Usernames
  useEffect(() => {
    const saved = localStorage.getItem("stark_explore_view");
    if (saved) setViewMode(saved);

    const init = async () => {
        // Fetch Admin Status
        if (user) {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (data?.role === 'admin') setIsAdmin(true);
        }

        // Fetch Featured Usernames for filtering logic
        const { data: featuredData } = await supabase.from('featured_mentions_view').select('username');
        setFeaturedUsernames(featuredData?.map(u => u.username.toLowerCase()) || []);
    };
    
    init();

    // Listen for admin updates to refresh list
    const handleUpdate = () => init();
    window.addEventListener("featured_mentions_updated", handleUpdate);
    return () => window.removeEventListener("featured_mentions_updated", handleUpdate);
  }, [user]);

  const toggleView = (mode) => {
    setViewMode(mode);
    localStorage.setItem("stark_explore_view", mode);
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {isAdmin && <AdminMentionManager />}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Explore <span className="text-accent">Hub</span>
                </h1>
                <p className="text-muted-foreground font-light max-w-xl text-xs md:text-sm font-mono tracking-tighter">
                    // Discover projects, resources, and changelogs.
                </p>
            </div>

            <div className="flex items-center bg-secondary/10 border border-border p-1 w-full md:w-auto">
                <button 
                    onClick={() => toggleView('grid')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider transition-all
                        ${viewMode === 'grid' ? 'bg-foreground text-background font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'}
                    `}
                >
                    <LayoutGrid size={14} /> Grid
                </button>
                <button 
                    onClick={() => toggleView('feed')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider transition-all
                        ${viewMode === 'feed' ? 'bg-foreground text-background font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'}
                    `}
                >
                    <List size={14} /> Feed
                </button>
            </div>
        </div>

        <MentionFilterBar 
            activeMention={activeMention} 
            onMentionSelect={setActiveMention} 
        />

        <div className="min-h-[600px]">
            {viewMode === 'grid' ? (
                <GridContainer activeMention={activeMention} featuredUsernames={featuredUsernames} />
            ) : (
                <FeedContainer activeMention={activeMention} />
            )}
        </div>

      </div>
    </div>
  );
}