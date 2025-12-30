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
import TrendingSortBar from "./_components/TrendingSortBar"; // NEW IMPORT

export default function TrendingPage() {
  const [view, setView] = useState("projects");
  const [loading, setLoading] = useState(true);
  
  // Only Metric State Needed (Sort Order is implicitly 'popular')
  const [popularMetric, setPopularMetric] = useState("hype"); // 'views' | 'likes' | 'hype'

  const [projects, setProjects] = useState([]);
  const [creators, setCreators] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // --- 1. Determine Sort Column ---
        let sortColumn = 'views'; 
        if (popularMetric === 'likes') sortColumn = 'likes_count';
        // 'hype' defaults to views fetch, then client sort

        // --- 2. Fetch Trending Projects ---
        const { data: projectsData, error: projError } = await supabase
          .from('projects')
          .select(`*, author:profiles!projects_owner_id_fkey(*)`)
          .eq('status', 'published')
          .order(sortColumn, { ascending: false })
          .limit(30);

        if (projError) throw projError;

        let formattedProjects = (projectsData || []).map(p => ({
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

        // Client-side Hype Sort
        if (popularMetric === 'hype') {
            formattedProjects.sort((a, b) => {
                const scoreA = (a.stats.views) + (a.stats.stars * 5);
                const scoreB = (b.stats.views) + (b.stats.stars * 5);
                return scoreB - scoreA;
            });
        }
        
        setProjects(formattedProjects);

        // --- 3. Fetch Trending Creators ---
        let profileQuery = supabase.from('profiles').select('*').limit(40);

        if (popularMetric === 'likes') {
             profileQuery = profileQuery.order('likes_count', { ascending: false });
        } else {
             profileQuery = profileQuery.order('views', { ascending: false });
        }

        const { data: profilesData, error: profError } = await profileQuery;
        if (profError) throw profError;

        // Fetch Projects for activity check
        const userIds = profilesData.map(p => p.id);
        const { data: userProjectsData } = await supabase
            .from('projects')
            .select('owner_id, thumbnail_url')
            .in('owner_id', userIds)
            .eq('status', 'published')
            .limit(100);

        const projectsByOwner = {};
        (userProjectsData || []).forEach(p => {
            if (!projectsByOwner[p.owner_id]) projectsByOwner[p.owner_id] = [];
            if (projectsByOwner[p.owner_id].length < 3) projectsByOwner[p.owner_id].push(p.thumbnail_url);
        });

        let activeCreators = (profilesData || [])
            .map(p => {
                const userWork = projectsByOwner[p.id] || [];
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
            .filter(Boolean);

        // Client-side Hype Sort
        if (popularMetric === 'hype') {
            activeCreators.sort((a, b) => {
                const scoreA = (a.stats.followers) + (a.stats.likes * 10);
                const scoreB = (b.stats.followers) + (b.stats.likes * 10);
                return scoreB - scoreA;
            });
        }

        setCreators(activeCreators);

      } catch (err) {
        console.error("Trending Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [popularMetric]); // Re-fetch on metric change only
  
  const currentData = view === "projects" ? projects : creators;
  const topItem = currentData[0];
  const leaderBoard = currentData.slice(1, 5);
  const gridItems = currentData.slice(5); 

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-accent" size={32} />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Calculating_Velocity...
            </span>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2">
                    Global <span className="text-accent">Trending</span>
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    // REAL_TIME_METRICS: ACTIVE
                </p>
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 mb-12">
            <TrendingToggle view={view} setView={setView} />
            <TrendingSortBar popularMetric={popularMetric} setPopularMetric={setPopularMetric} />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
            <motion.div
                key={`${view}-${popularMetric}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                 {currentData.length === 0 ? (
                    <div className="h-64 border border-dashed border-border flex items-center justify-center text-muted-foreground font-mono text-sm uppercase">
                        No Data Found For Current Metrics
                    </div>
                ) : (
                    <>
                        {topItem && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                                <div className="lg:col-span-8">
                                    <TrendingHero item={topItem} type={view} />
                                </div>
                                <div className="lg:col-span-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-end mb-2 border-b border-border pb-2">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Top Movers</span>
                                        <span className="text-[10px] font-mono text-accent">
                                            {popularMetric === 'hype' ? 'Hype Score' : popularMetric.toUpperCase()}
                                        </span>
                                    </div>
                                    {leaderBoard.map((item, index) => (
                                        <LeaderboardRow key={item.id} item={item} rank={index + 2} type={view} />
                                    ))}
                                </div>
                            </div>
                        )}

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
                    </>
                )}
            </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}