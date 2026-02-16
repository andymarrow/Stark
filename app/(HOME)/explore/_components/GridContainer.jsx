"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Plus } from "lucide-react"; 
import ExploreFilters from "./ExploreFilters";
import TechMap from "./TechMap";
import ActiveFilters from "./ActiveFilters";
import ExploreSortBar from "./ExploreSortBar";
import ProjectCard from "@/app/(HOME)/_components/ProjectCard";
import FilterSheet from "./FilterSheet";
import Pagination from "@/components/ui/Pagination";
import { COUNTRIES } from "@/constants/options";
import ExploreTrendingBanner from "./ExploreTrendingBanner";

const ITEMS_PER_PAGE = 6;

const getRegionFromLocation = (location) => {
    if (!location) return "global";
    const input = location.toLowerCase().trim();
    const matchedCountry = COUNTRIES.find(c => input.includes(c.value.toLowerCase()));
    if (matchedCountry) return matchedCountry.region;
    if (input.includes("usa") || input.includes("america") || input.includes("states")) return "na";
    if (input.includes("europe") || input.includes("uk") || input.includes("germany") || input.includes("france")) return "eu";
    if (input.includes("asia") || input.includes("china") || input.includes("india") || input.includes("japan")) return "as";
    if (input.includes("south america") || input.includes("brazil")) return "sa";
    if (input.includes("africa") || input.includes("nigeria") || input.includes("kenya")) return "af";
    if (input.includes("australia")) return "au";
    return "global"; 
};

export default function GridContainer({ activeMention, featuredUsernames = [] }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE); 

  const [filters, setFilters] = useState({
    region: null, stack: [], category: [], search: "", minQuality: 0, forHire: false
  });

  const [sortOrder, setSortOrder] = useState("latest");
  const [popularMetric, setPopularMetric] = useState("hype");

  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters, sortOrder, popularMetric, activeMention]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            author:profiles!projects_owner_id_fkey(
                full_name, username, avatar_url, location, is_for_hire
            ),
            contest_history:contest_submissions!project_id(
                contest:contests(title, slug)
            )
          `)
          .eq('status', 'published')
          // --- ISOLATION LOGIC ---
          // Only show projects that are NOT marked as contest-exclusive
          .eq('is_contest_entry', false);

        if (error) throw error;

        const formatted = (data || []).map(p => {
            const rawLocation = p.author?.location;
            const contestData = p.contest_history?.[0]?.contest;

            return {
                id: p.id,
                slug: p.slug,
                title: p.title,
                category: p.type, 
                description: p.description,
                thumbnail_url: p.thumbnail_url,
                tags: p.tags || [],
                qualityScore: p.quality_score,
                views: p.views || 0,
                likes_count: p.likes_count || 0,
                created_at: p.created_at, 
                region: getRegionFromLocation(rawLocation), 
                forHire: p.author?.is_for_hire,
                contestName: contestData?.title,
                contestSlug: contestData?.slug,
                author: {
                    name: p.author?.full_name || "Anonymous",
                    username: p.author?.username,
                    avatar: p.author?.avatar_url
                }
            };
        });
        setProjects(formatted);
      } catch (err) {
        console.error("Explore Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const processedProjects = useMemo(() => {
    const mentionPattern = /@\[?[a-zA-Z0-9_ -]+\]?\(?[a-zA-Z0-9_ -]+\)?/;

    let result = projects.filter(project => {
        const rawDesc = (project.description || "").toLowerCase();
        const rawTitle = (project.title || "").toLowerCase();
        
        const hasMentions = mentionPattern.test(project.description || "") || mentionPattern.test(project.title || "");

        if (activeMention === '__COMMUNITY__') {
            if (!hasMentions) return false;
            const mentionsCuratedUser = featuredUsernames.some(name => 
                rawDesc.includes(`(${name.toLowerCase()})`) || rawDesc.includes(`@${name.toLowerCase()}`)
            );
            if (mentionsCuratedUser) return false;
        } 
        else if (activeMention) {
            const target = activeMention.toLowerCase();
            const isMatch = rawDesc.includes(`(${target})`) || rawDesc.includes(`@${target}`) || rawTitle.includes(`@${target}`);
            if (!isMatch) return false;
        } 
        else {
            if (hasMentions) return false;
        }

        if (filters.region && project.region !== filters.region) return false;
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const match = project.title.toLowerCase().includes(q) || 
                          project.description?.toLowerCase().includes(q) ||
                          project.author.username.toLowerCase().includes(q);
            if (!match) return false;
        }
        if (project.qualityScore < filters.minQuality) return false;
        if (filters.forHire && !project.forHire) return false;
        if (filters.stack.length > 0) {
            if (!project.tags.some(tag => filters.stack.some(f => tag.toLowerCase().includes(f.toLowerCase())))) return false;
        }
        if (filters.category.length > 0) {
            if (!filters.category.some(cat => project.category.toLowerCase().includes(cat.toLowerCase()))) return false;
        }
        return true;
    });

    return result.sort((a, b) => {
        if (sortOrder === 'latest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortOrder === 'popular') {
            if (popularMetric === 'views') return b.views - a.views;
            if (popularMetric === 'likes') return b.likes_count - a.likes_count;
            if (popularMetric === 'hype') return (b.views + b.likes_count * 5) - (a.views + a.likes_count * 5);
        }
        return 0;
    });
  }, [filters, projects, sortOrder, popularMetric, activeMention, featuredUsernames]);

  const totalPages = Math.ceil(processedProjects.length / ITEMS_PER_PAGE);
  
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedProjects.slice(start, start + visibleCount);
  }, [processedProjects, currentPage, visibleCount]);

  const handleRegionSelect = (regionId) => {
    setFilters(prev => ({ ...prev, region: prev.region === regionId ? null : regionId }));
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
        
        <aside className="hidden lg:block w-80 flex-shrink-0 space-y-8 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto pr-2 scrollbar-hide">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase text-muted-foreground">Geographic_Filter</span>
                    {filters.region && (
                        <button onClick={() => handleRegionSelect(null)} className="text-[10px] text-accent hover:underline uppercase font-bold">
                            CLEAR_MAP
                        </button>
                    )}
                </div>
                <TechMap selectedRegion={filters.region} onSelect={handleRegionSelect} />
            </div>
            <ExploreFilters filters={filters} setFilters={setFilters} />
        </aside>

        <div className="lg:hidden">
            <ExploreTrendingBanner />
        </div>

        <div className="lg:hidden mb-4">
            <FilterSheet filters={filters} setFilters={setFilters} />
        </div>

        <div className="flex-1 flex flex-col">
            
            <ActiveFilters filters={filters} setFilters={setFilters} />

            <ExploreSortBar 
                sortOrder={sortOrder} 
                setSortOrder={setSortOrder}
                popularMetric={popularMetric}
                setPopularMetric={setPopularMetric}
            />

            <div className="flex-1 min-h-[600px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                ) : paginatedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border mt-8 bg-secondary/5 text-center px-6">
                        <span className="text-muted-foreground font-mono text-sm mb-2 uppercase">NO_DATA_FOUND_IN_SECTOR</span>
                        <p className="text-[10px] text-muted-foreground font-mono mb-4">
                           {activeMention === '__COMMUNITY__' 
                             ? "All current mentions are already in the curated spotlight." 
                             : activeMention 
                                ? `No projects found specifically mentioning @${activeMention}` 
                                : "The main feed is clear of directed mentions."}
                        </p>
                        <button 
                            onClick={() => setFilters({ region: null, stack: [], category: [], search: "", minQuality: 0, forHire: false })}
                            className="text-accent text-xs hover:underline font-mono"
                        >
                            RESET_ALL_FILTERS()
                        </button>
                    </div>
                )}
            </div>

            {!loading && (processedProjects.length > ( (currentPage - 1) * ITEMS_PER_PAGE + visibleCount )) && (
                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={handleLoadMore}
                        className="group flex items-center gap-2 px-8 py-3 bg-secondary/10 border border-border hover:border-accent hover:bg-secondary transition-all text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                    >
                        <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                        Load_More_Resources()
                    </button>
                </div>
            )}

            {!loading && processedProjects.length > 0 && (
                <div className="mt-12 border-t border-border border-dashed pt-8">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => {
                            setCurrentPage(p);
                            setVisibleCount(ITEMS_PER_PAGE); 
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        isLoading={loading}
                    />
                </div>
            )}
        </div>
    </div>
  );
}