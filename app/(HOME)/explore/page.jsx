"use client";
import { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";
import GridContainer from "./_components/GridContainer";
import FeedContainer from "./_components/FeedContainer";

export default function ExplorePage() {
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'feed'

  // Persist view mode
  useEffect(() => {
    const saved = localStorage.getItem("stark_explore_view");
    if (saved) setViewMode(saved);
  }, []);

  const toggleView = (mode) => {
    setViewMode(mode);
    localStorage.setItem("stark_explore_view", mode);
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Page Header & View Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Explore <span className="text-accent">Hub</span></h1>
                <p className="text-muted-foreground font-light max-w-xl text-xs md:text-sm font-mono tracking-tighter">
                    // Discover projects, resources, and changelogs.
                </p>
            </div>

            {/* View Switcher (Responsive) */}
            <div className="flex items-center bg-secondary/10 border border-border p-1 w-full md:w-auto">
                <button 
                    onClick={() => toggleView('grid')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider transition-all
                        ${viewMode === 'grid' ? 'bg-foreground text-background font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'}
                    `}
                >
                    <LayoutGrid size={14} /> Grid
                </button>
                <button 
                    onClick={() => toggleView('feed')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider transition-all
                        ${viewMode === 'feed' ? 'bg-foreground text-background font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'}
                    `}
                >
                    <List size={14} /> Feed
                </button>
            </div>
        </div>

        {/* Content Render */}
        <div className="min-h-[600px]">
            {viewMode === 'grid' ? <GridContainer /> : <FeedContainer />}
        </div>

      </div>
    </div>
  );
}