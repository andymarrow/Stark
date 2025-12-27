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
        // --- 1. Fetch Trending Projects ---
        // (Logic remains the same: Most viewed published projects)
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

        // --- 2. Fetch Trending Creators (With Activity Check) ---
        
        // A. Fetch a buffer (20) of users sorted by STARS first (Quality), then Views (Reach)
        const { data: profilesData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .order('likes_count', { ascending: false }) // Prioritize Stars
          .order('views', { ascending: false })       // Then Views
          .limit(20);                                 // Fetch extra to allow filtering

        if (profError) throw profError;

        const userIds = profilesData.map(p => p.id);

        // B. Bulk Fetch Projects for these 20 users
        const { data: userProjectsData, error: userProjError } = await supabase
            .from('projects')
            .select('owner_id, thumbnail_url, created_at')
            .in('owner_id', userIds)
            .eq('status', 'published') // Only count published work
            .order('created_at', { ascending: false });

        if (userProjError) throw userProjError;

        // C. Group projects
        const projectsByOwner = {};
        (userProjectsData || []).forEach(p => {
            if (!projectsByOwner[p.owner_id]) {
                projectsByOwner[p.owner_id] = [];
            }
            if (projectsByOwner[p.owner_id].length < 3 && p.thumbnail_url) {
                projectsByOwner[p.owner_id].push(p.thumbnail_url);
            }
        });

        // D. Map & FILTER Empty Creators
        const activeCreators = (profilesData || [])
            .map(p => {
                // Check if they actually have published projects
                const userWork = projectsByOwner[p.id] || [];
                
                // If NO work, return null (we will filter this out)
                if (userWork.length === 0) return null;

                return {
                    id: p.id,
                    name: p.full_name || p.username,
                    username: p.username,
                    role: p.bio ? p.bio.split('.')[0].substring(0, 30) : "Creator",
                    bio: p.bio,
                    avatar: p.avatar_url,
                    coverImage: p.avatar_url, 
                    isForHire: p.is_for_hire,
                    stats: { followers: p.views, likes: p.likes_count },
                    topProjects: userWork
                };
            })
            .filter(Boolean) // Remove the nulls (Empty profiles)
            .slice(0, 10);   // Take top 10 of the survivors

        setCreators(activeCreators);

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
  const gridItems = currentData.slice(5); 

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );
  }

  // Handle Empty State (If NO active creators exist)
  if (currentData.length === 0) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
            <h2 className="text-2xl font-bold font-mono uppercase">System Quiet</h2>
            <p className="text-muted-foreground text-sm">
                {view === 'projects' ? "No projects deployed yet." : "No active creators found."}
            </p>
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