"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import ExploreFilters from "./_components/ExploreFilters";
import TechMap from "./_components/TechMap";
import ActiveFilters from "./_components/ActiveFilters";
import ProjectCard from "../_components/ProjectCard";
import FilterSheet from "./_components/FilterSheet";

// Helper to map country codes/names to our Map Regions
// In a real app, you'd use a library or a DB table for this.
const getRegionFromLocation = (location) => {
    if (!location) return "global";
    const loc = location.toLowerCase();
    if (loc.includes("usa") || loc.includes("canada") || loc.includes("america")) return "na";
    if (loc.includes("germany") || loc.includes("uk") || loc.includes("france") || loc.includes("europe")) return "eu";
    if (loc.includes("china") || loc.includes("japan") || loc.includes("india") || loc.includes("asia")) return "as";
    if (loc.includes("brazil") || loc.includes("argentina")) return "sa";
    if (loc.includes("nigeria") || loc.includes("kenya") || loc.includes("africa")) return "af";
    if (loc.includes("australia")) return "au";
    return "global"; 
};

export default function ExplorePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. Centralized Filter State ---
  const [filters, setFilters] = useState({
    region: null,
    stack: [],
    category: [],
    search: "",
    minQuality: 0,
    forHire: false
  });

  // --- 2. Fetch Data from Supabase ---
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        // Fetch Projects + Author Profile
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
          .order('quality_score', { ascending: false }); // Default: High Quality First

        if (error) throw error;

        // Transform data for the UI
        const formatted = (data || []).map(p => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            category: p.type, // 'code', 'design', etc.
            description: p.description,
            thumbnail_url: p.thumbnail_url,
            tags: p.tags || [],
            qualityScore: p.quality_score,
            views: p.views,
            likes_count: p.likes_count,
            // Computed fields
            region: getRegionFromLocation(p.author?.location),
            forHire: p.author?.is_for_hire,
            author: {
                name: p.author?.full_name || "Anonymous",
                username: p.author?.username,
                avatar: p.author?.avatar_url
            }
        }));

        setProjects(formatted);
      } catch (err) {
        console.error("Explore Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // --- 3. The Filter Logic Engine (Client-Side) ---
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
        // Region Filter
        if (filters.region && project.region !== filters.region) return false;
        
        // Search Filter (Title, Desc, or Author)
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

        // Stack Filter (OR logic: if project has ANY of selected stacks)
        if (filters.stack.length > 0) {
            // Case insensitive check
            const hasStack = project.tags.some(tag => 
                filters.stack.some(f => tag.toLowerCase().includes(f.toLowerCase()))
            );
            if (!hasStack) return false;
        }

        // Category Filter (Mapped from DB 'type')
        if (filters.category.length > 0) {
            // Map UI categories ("SaaS", "Mobile") to DB types or Tags logic if needed
            // For now, simple check against project.category (which is DB 'type') 
            // OR checks tags for loose matching (e.g. 'mobile' tag)
            const hasCategory = filters.category.some(cat => {
                const c = cat.toLowerCase();
                return project.category.toLowerCase().includes(c) || project.tags.some(t => t.toLowerCase().includes(c));
            });
            if (!hasCategory) return false;
        }

        return true;
    });
  }, [filters, projects]);

  // Handler specifically for the map interactions
  const handleRegionSelect = (regionId) => {
    setFilters(prev => ({ ...prev, region: prev.region === regionId ? null : regionId }));
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Page Header */}
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Explore <span className="text-accent">Hub</span></h1>
            <p className="text-muted-foreground font-light max-w-2xl">
                Filter through {filteredProjects.length} open source projects by region, stack, or quality.
            </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* --- LEFT SIDEBAR (Desktop) --- */}
            <aside className="hidden lg:block w-80 flex-shrink-0 space-y-8 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto pr-2 scrollbar-hide">
                
                {/* 1. The Amazing Map Filter */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold uppercase text-muted-foreground">Geographic_Filter</span>
                        {filters.region && (
                            <button onClick={() => handleRegionSelect(null)} className="text-[10px] text-accent hover:underline">
                                CLEAR_MAP
                            </button>
                        )}
                    </div>
                    <TechMap selectedRegion={filters.region} onSelect={handleRegionSelect} />
                </div>

                {/* 2. The Detailed Filters */}
                <ExploreFilters filters={filters} setFilters={setFilters} />
            </aside>

            {/* --- MOBILE FILTER TRIGGER (Mobile) --- */}
            <div className="lg:hidden mb-4">
                <FilterSheet filters={filters} setFilters={setFilters} />
            </div>

            {/* --- RIGHT CONTENT (Results) --- */}
            <div className="flex-1">
                
                {/* Active Filters Display */}
                <ActiveFilters filters={filters} setFilters={setFilters} />

                {/* Results Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                ) : filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                        {filteredProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    // Empty State
                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border mt-8 bg-secondary/5">
                        <span className="text-muted-foreground font-mono text-sm mb-2">NO_DATA_FOUND_IN_SECTOR</span>
                        <button 
                            onClick={() => setFilters({ region: null, stack: [], category: [], search: "", minQuality: 0, forHire: false })}
                            className="text-accent text-xs hover:underline"
                        >
                            RESET_ALL_FILTERS()
                        </button>
                    </div>
                )}

                {/* Load More Indicator (Visual Only for now since we fetch all) */}
                {filteredProjects.length > 12 && (
                    <div className="mt-12 flex justify-center">
                        <span className="text-[10px] font-mono text-muted-foreground">END_OF_RESULTS</span>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}