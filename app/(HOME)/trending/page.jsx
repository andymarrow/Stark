"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import TrendingHero from "./_components/TrendingHero";
import LeaderboardRow from "./_components/LeaderboardRow";
import TrendingToggle from "./_components/TrendingToggle";
import CreatorCard from "./_components/CreatorCard";
import ProjectCard from "../_components/ProjectCard";

export default function TrendingPage() {
  const [view, setView] = useState("projects");
  const [loading, setLoading] = useState(true);
  
  const [projects, setProjects] = useState([]);
  const [creators, setCreators] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Trending Projects (Top 10 by views)
        const { data: projectsData, error: projError } = await supabase
          .from('projects')
          .select(`
            *,
            author:profiles!projects_owner_id_fkey(*)
          `)
          .eq('status', 'published')
          .order('views', { ascending: false })
          .limit(10);

        if (projError) throw projError;

        // Transform Projects
        const formattedProjects = (projectsData || []).map(p => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            description: p.description,
            category: p.type,
            thumbnail: p.thumbnail_url,
            tags: p.tags || [],
            stats: { stars: p.likes_count, views: p.views },
            author: { 
                name: p.author?.full_name || p.author?.username, 
                username: p.author?.username, 
                avatar: p.author?.avatar_url 
            }
        }));
        setProjects(formattedProjects);

        // 2. Fetch Trending Creators (Top 10 by profile views / node reach)
        // Note: Ideally, we'd join with a follower count, but sorting by 'views' is a good proxy for "Trending"
        const { data: profilesData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .order('views', { ascending: false })
          .limit(10);

        if (profError) throw profError;

        // Transform Creators (We need to fetch their top project images separately or just use avatars for now)
        // For efficiency, we will skip fetching topProjects images per user here to avoid N+1 queries in this simple fetch.
        // We will mock the 'topProjects' array with placeholders or empty for now.
        const formattedCreators = (profilesData || []).map(p => ({
            id: p.id,
            name: p.full_name || p.username,
            username: p.username,
            role: p.bio ? p.bio.split('.')[0].substring(0, 30) : "Creator", // Simple bio snippet
            bio: p.bio,
            avatar: p.avatar_url,
            coverImage: p.avatar_url, // Fallback for Hero background
            isForHire: p.is_for_hire,
            stats: { followers: p.views, likes: p.likes_count }, // Using Views as "Followers" proxy for leaderboard visual if real follower count is expensive
            topProjects: [] // Placeholder
        }));
        setCreators(formattedCreators);

      } catch (err) {
        console.error("Trending Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const currentData = view === "projects" ? projects : creators;
  const topItem = currentData[0];
  const leaderBoard = currentData.slice(1, 5);
  const gridItems = currentData.slice(5); // Show rest in grid

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );
  }

  // Handle Empty State
  if (currentData.length === 0) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
            <h2 className="text-2xl font-bold font-mono uppercase">System Quiet</h2>
            <p className="text-muted-foreground text-sm">Not enough data to determine trends yet.</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2">
                    Global <span className="text-accent">Trending</span>
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    // REAL_TIME_METRICS: ACTIVE
                </p>
            </div>
        </div>

        {/* 1. The Switch */}
        <TrendingToggle view={view} setView={setView} />

        {/* Content Animation Wrapper */}
        <AnimatePresence mode="wait">
            <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                {/* 2. Top Section: Hero + Leaderboard */}
                {topItem && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                        {/* Hero (Rank 1) */}
                        <div className="lg:col-span-8">
                            <TrendingHero item={topItem} type={view} />
                        </div>
                        
                        {/* Leaderboard (Rank 2-5) */}
                        <div className="lg:col-span-4 flex flex-col gap-3">
                            <div className="flex justify-between items-end mb-2 border-b border-border pb-2">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Top Movers</span>
                                <span className="text-[10px] font-mono text-accent">Last 24h</span>
                            </div>
                            {leaderBoard.map((item, index) => (
                                <LeaderboardRow 
                                    key={item.id} 
                                    item={item} 
                                    rank={index + 2} 
                                    type={view} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. The Grid */}
                {gridItems.length > 0 && (
                    <>
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-[1px] bg-border flex-1" />
                            <span className="text-xs font-mono uppercase text-muted-foreground">Rising Stars</span>
                            <div className="h-[1px] bg-border flex-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {gridItems.map((item) => (
                                view === "projects" ? (
                                    <ProjectCard key={item.id} project={item} />
                                ) : (
                                    <CreatorCard key={item.id} creator={item} />
                                )
                            ))}
                        </div>
                    </>
                )}

            </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}