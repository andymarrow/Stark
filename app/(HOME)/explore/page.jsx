"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import ExploreFilters from "./_components/ExploreFilters";
import TechMap from "./_components/TechMap";
import ActiveFilters from "./_components/ActiveFilters";
import ProjectCard from "../_components/ProjectCard";
import FilterSheet from "./_components/FilterSheet";
import Pagination from "@/components/ui/Pagination";
import { COUNTRIES } from "@/constants/options";

const ITEMS_PER_PAGE = 6;

// --- SMART REGION MAPPER ---
const getRegionFromLocation = (location) => {
    if (!location) return "global";
    
    // 1. Normalize the input (lowercase, trim whitespace)
    const input = location.toLowerCase().trim();

    // 2. Check against our Master Country List
    const matchedCountry = COUNTRIES.find(c => input.includes(c.value.toLowerCase()));
    
    if (matchedCountry) {
        return matchedCountry.region;
    }

    // 3. Fallback: Check for Continent Names or Common Abbreviations
    if (input.includes("usa") || input.includes("america") || input.includes("states") || input.includes("canada") || input.includes("mexico")) return "na";
    if (input.includes("europe") || input.includes("uk") || input.includes("england") || input.includes("germany") || input.includes("france")) return "eu";
    if (input.includes("asia") || input.includes("china") || input.includes("india") || input.includes("japan")) return "as";
    if (input.includes("south america") || input.includes("brazil") || input.includes("argentina")) return "sa";
    if (input.includes("africa") || input.includes("nigeria") || input.includes("kenya") || input.includes("ethiopia") || input.includes("egypt")) return "af";
    if (input.includes("australia") || input.includes("zealand") || input.includes("oceania")) return "au";
    
    return "global"; 
};

export default function ExplorePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // --- 1. Centralized Filter State ---
  const [filters, setFilters] = useState({
    region: null,
    stack: [],
    category: [],
    search: "",
    minQuality: 0,
    forHire: false
  });

  // --- Reset to Page 1 whenever filters change ---
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // --- 2. Fetch Data from Supabase ---
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            author:profiles!projects_owner_id_fkey(
                full_name, 
                username, 
                avatar_url, 
                location, 
                is_for_hire
            )
          `)
          .eq('status', 'published')
          .order('quality_score', { ascending: false });

        if (error) throw error;

        // Transform data
        const formatted = (data || []).map(p => {
            const rawLocation = p.author?.location;
            const regionCode = getRegionFromLocation(rawLocation);

            return {
                id: p.id,
                slug: p.slug,
                title: p.title,
                category: p.type, 
                description: p.description,
                thumbnail_url: p.thumbnail_url,
                tags: p.tags || [],
                qualityScore: p.quality_score,
                views: p.views,
                likes_count: p.likes_count,
                region: regionCode, 
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

  // --- 3. The Filter Logic Engine ---
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
        
        // --- REGION FILTER LOGIC ---
        if (filters.region) {
            if (project.region !== filters.region) return false;
        }
        
        // Search Filter
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const match = 
                project.title.toLowerCase().includes(q) || 
                project.description?.toLowerCase().includes(q) ||
                project.author.username.toLowerCase().includes(q);
            if (!match) return false;
        }

        // Quality Filter
        if (project.qualityScore < filters.minQuality) return false;

        // For Hire Filter
        if (filters.forHire && !project.forHire) return false;

        // Stack Filter
        if (filters.stack.length > 0) {
            const hasStack = project.tags.some(tag => 
                filters.stack.some(f => tag.toLowerCase().includes(f.toLowerCase()))
            );
            if (!hasStack) return false;
        }

        // Category Filter
        if (filters.category.length > 0) {
            const hasCategory = filters.category.some(cat => {
                const c = cat.toLowerCase();
                return project.category.toLowerCase().includes(c) || 
                       project.tags.some(t => t.toLowerCase().includes(c));
            });
            if (!hasCategory) return false;
        }

        return true;
    });
  }, [filters, projects]);

  // --- 4. Pagination Logic ---
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const handleRegionSelect = (regionId) => {
    setFilters(prev => ({ ...prev, region: prev.region === regionId ? null : regionId }));
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4">
        
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Explore <span className="text-accent">Hub</span></h1>
            <p className="text-muted-foreground font-light max-w-2xl text-xs md:text-sm uppercase font-mono tracking-tighter">
                // System_Index: {filteredProjects.length} Records_Found
            </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            
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

            <div className="lg:hidden mb-4">
                <FilterSheet filters={filters} setFilters={setFilters} />
            </div>

            <div className="flex-1 flex flex-col">
                <ActiveFilters filters={filters} setFilters={setFilters} />

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

                {!loading && filteredProjects.length > 0 && (
                    <div className="mt-12">
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
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