"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import ExploreFilters from "./_components/ExploreFilters";
import TechMap from "./_components/TechMap";
import ActiveFilters from "./_components/ActiveFilters";
import ExploreSortBar from "./_components/ExploreSortBar"; // IMPORTED
import ProjectCard from "../_components/ProjectCard";
import FilterSheet from "./_components/FilterSheet";
import Pagination from "@/components/ui/Pagination";
import { COUNTRIES } from "@/constants/options";
import ExploreTrendingBanner from "./_components/ExploreTrendingBanner"; 

const ITEMS_PER_PAGE = 6;

// --- SMART REGION MAPPER (Kept same as before) ---
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

export default function ExplorePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // --- 1. Filter State ---
  const [filters, setFilters] = useState({
    region: null, stack: [], category: [], search: "", minQuality: 0, forHire: false
  });

  // --- 2. Sorting State (NEW) ---
  const [sortOrder, setSortOrder] = useState("latest"); // 'latest', 'oldest', 'popular'
  const [popularMetric, setPopularMetric] = useState("hype"); // 'views', 'likes', 'hype'

  // Reset page when filters OR sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder, popularMetric]);

  // --- 3. Fetch Data ---
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
            )
          `)
          .eq('status', 'published');
          // Note: We remove .order() here because we do complex sorting client-side

        if (error) throw error;

        const formatted = (data || []).map(p => {
            const rawLocation = p.author?.location;
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
                created_at: p.created_at, // Needed for sorting
                region: getRegionFromLocation(rawLocation), 
                forHire: p.author?.is_for_hire,
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

  // --- 4. Logic Engine (Filtering + Sorting) ---
  const processedProjects = useMemo(() => {
    
    // A. Filter Step
    let result = projects.filter(project => {
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

    // B. Sorting Step (NEW)
    return result.sort((a, b) => {
        if (sortOrder === 'latest') {
            return new Date(b.created_at) - new Date(a.created_at);
        }
        if (sortOrder === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        }
        if (sortOrder === 'popular') {
            if (popularMetric === 'views') return b.views - a.views;
            if (popularMetric === 'likes') return b.likes_count - a.likes_count;
            if (popularMetric === 'hype') {
                // Weighted Score: Views + (Likes * 5)
                const scoreA = a.views + (a.likes_count * 5);
                const scoreB = b.views + (b.likes_count * 5);
                return scoreB - scoreA;
            }
        }
        return 0;
    });

  }, [filters, projects, sortOrder, popularMetric]);

  // --- 5. Pagination ---
  const totalPages = Math.ceil(processedProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [processedProjects, currentPage]);

  const handleRegionSelect = (regionId) => {
    setFilters(prev => ({ ...prev, region: prev.region === regionId ? null : regionId }));
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4">
        
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Explore <span className="text-accent">Hub</span></h1>
            <p className="text-muted-foreground font-light max-w-2xl text-xs md:text-sm uppercase font-mono tracking-tighter">
                // System_Index: {processedProjects.length} Records_Found
            </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar */}
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

            {/* Mobile Filter Sheet */}
            <div className="lg:hidden mb-4">
                <FilterSheet filters={filters} setFilters={setFilters} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                
               
                <ActiveFilters filters={filters} setFilters={setFilters} />

                {/* NEW: Sorting Controls */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                            {paginatedProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border mt-8 bg-secondary/5">
                            <span className="text-muted-foreground font-mono text-sm mb-2 uppercase">NO_DATA_FOUND_IN_SECTOR</span>
                            <button 
                                onClick={() => setFilters({ region: null, stack: [], category: [], search: "", minQuality: 0, forHire: false })}
                                className="text-accent text-xs hover:underline font-mono"
                            >
                                RESET_ALL_FILTERS()
                            </button>
                        </div>
                    )}
                </div>

                {!loading && processedProjects.length > 0 && (
                    <div className="mt-12">
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(p) => {
                                setCurrentPage(p);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            isLoading={loading}
                        />
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}