"use client";
import { useState, useMemo } from "react";
import ExploreFilters from "./_components/ExploreFilters";
import TechMap from "./_components/TechMap";
import ActiveFilters from "./_components/ActiveFilters";
import ProjectCard from "../_components/ProjectCard";
import FilterSheet from "./_components/FilterSheet";

// --- EXPANDED MOCK DATA FOR FUNCTIONALITY ---
const PROJECTS_DATA = [
    {
        id: 1,
        slug: "neural-dashboard",
        title: "Neural Dashboard",
        category: "Code",
        description: "A real-time analytics dashboard.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
        tags: ["Next.js", "Python", "React"],
        region: "na", // North America
        qualityScore: 95,
        forHire: true,
        stats: { stars: 1240, views: 8500 },
        author: { name: "Alex Chen", username: "alexc", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100" }
    },
    {
        id: 2,
        slug: "crypto-ui",
        title: "DeFi Protocol",
        category: "Design",
        description: "Modern crypto interface design.",
        thumbnail: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=2574&auto=format&fit=crop",
        tags: ["Figma", "UI", "Crypto"],
        region: "eu", // Europe
        qualityScore: 88,
        forHire: false,
        stats: { stars: 540, views: 2500 },
        author: { name: "Sarah", username: "sarah", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100" }
    },
    {
        id: 3,
        slug: "terminal-portfolio",
        title: "Terminal.me",
        category: "Code",
        description: "An interactive CLI-based portfolio website.",
        thumbnail: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=2574&auto=format&fit=crop",
        tags: ["Vue", "Node.js"],
        region: "as", // Asia
        qualityScore: 92,
        forHire: true,
        stats: { stars: 567, views: 3200 },
        author: { name: "David Kim", username: "dkim_dev", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100" }
    },
    {
        id: 4,
        slug: "africa-fintech",
        title: "PayFlow Africa",
        category: "Code",
        description: "SMS based payment gateway for rural areas.",
        thumbnail: "https://plus.unsplash.com/premium_photo-1661936361131-c421746dcd0d?w=500&auto=format&fit=crop",
        tags: ["Go", "Mobile"],
        region: "af", // Africa
        qualityScore: 85,
        forHire: true,
        stats: { stars: 210, views: 1200 },
        author: { name: "Kwame", username: "kwame_dev", avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=100&h=100" }
    },
];

export default function ExplorePage() {
  // --- 1. Centralized Filter State ---
  const [filters, setFilters] = useState({
    region: null,
    stack: [],
    category: [],
    search: "",
    minQuality: 0,
    forHire: false
  });

  // --- 2. The Filter Logic Engine ---
  const filteredProjects = useMemo(() => {
    return PROJECTS_DATA.filter(project => {
        // Region Filter
        if (filters.region && project.region !== filters.region) return false;
        
        // Search Filter (Title or Desc)
        if (filters.search && !project.title.toLowerCase().includes(filters.search.toLowerCase())) return false;

        // Quality Filter
        if (project.qualityScore < filters.minQuality) return false;

        // For Hire Filter
        if (filters.forHire && !project.forHire) return false;

        // Stack Filter (OR logic: if project has ANY of selected stacks)
        if (filters.stack.length > 0) {
            const hasStack = project.tags.some(tag => filters.stack.includes(tag));
            if (!hasStack) return false;
        }

        // Category Filter
        if (filters.category.length > 0) {
            // Mapping categories loosely for demo (e.g., "Crypto" tag matches "Crypto" category)
            const hasCategory = filters.category.some(cat => 
                project.category.includes(cat) || project.tags.some(t => t.includes(cat))
            );
            if (!hasCategory) return false;
        }

        return true;
    });
  }, [filters]);

  // Handler specifically for the map interactions
  const handleRegionSelect = (regionId) => {
    setFilters(prev => ({ ...prev, region: regionId }));
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
                {/* Ensure both filters and setFilters are passed correctly */}
                <FilterSheet filters={filters} setFilters={setFilters} />
            </div>

            {/* --- RIGHT CONTENT (Results) --- */}
            <div className="flex-1">
                
                {/* Active Filters Display */}
                <ActiveFilters filters={filters} setFilters={setFilters} />

                {/* Results Grid - Using Functional Data */}
                {filteredProjects.length > 0 ? (
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

                {/* Load More Button (Only show if we have results) */}
                {filteredProjects.length > 0 && (
                    <div className="mt-12 flex justify-center">
                        <button className="px-8 py-3 border border-border bg-secondary/10 hover:bg-accent hover:text-white transition-all text-sm font-mono tracking-wide">
                            LOAD_MORE_RESULTS()
                        </button>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}