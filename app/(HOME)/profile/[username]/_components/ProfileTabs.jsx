"use client";
import { Layers, Bookmark, Heart, Grid, List } from "lucide-react";

export default function ProfileTabs({ 
  activeTab, 
  setActiveTab, 
  viewMode, 
  setViewMode,
  workCount = 0,
  savedCount = 0,
  // likedCount removed for now
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border mb-8 gap-4">
        
        {/* Tab Selection */}
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            <TabButton 
                active={activeTab === "work"} 
                onClick={() => setActiveTab("work")} 
                icon={Layers} 
                label="Submissions" 
                count={workCount}
            />
            {/* Renamed label to "Starred" for clarity, since it pulls from Likes table */}
            <TabButton 
                active={activeTab === "saved"} 
                onClick={() => setActiveTab("saved")} 
                icon={Heart} 
                label="Starred" 
                count={savedCount}
            />
            
            {/* HIDDEN ENDORSED TAB UNTIL BOOKMARKS TABLE IS CREATED */}
            {/* 
            <TabButton 
                active={activeTab === "liked"} 
                onClick={() => setActiveTab("liked")} 
                icon={Heart} 
                label="Endorsed" 
                count={likedCount}
            /> 
            */}
        </div>

        {/* View Toggle */}
        <div className="hidden md:flex items-center gap-1 pb-2">
            <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-all duration-200 border border-transparent ${
                  viewMode === 'grid' 
                    ? 'text-foreground bg-secondary/30 border-border' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/10'
                }`}
            >
                <Grid size={16} />
            </button>
            <button 
                onClick={() => setViewMode("list")}
                className={`p-2 transition-all duration-200 border border-transparent ${
                  viewMode === 'list' 
                    ? 'text-foreground bg-secondary/30 border-border' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/10'
                }`}
            >
                <List size={16} />
            </button>
        </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
    return (
        <button 
            onClick={onClick}
            className={`
                flex items-center gap-2 pb-4 border-b-[3px] transition-all duration-200 group whitespace-nowrap
                ${active 
                    ? "border-accent text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"}
            `}
        >
            <Icon 
              size={16} 
              className={`transition-colors ${active ? "text-accent" : "group-hover:text-accent"}`} 
            />
            <span className="text-xs font-mono font-bold uppercase tracking-widest">
              {label}
            </span>
            <span className={`
                text-[10px] px-1.5 py-0.5 border font-mono transition-colors
                ${active 
                    ? "border-accent text-accent bg-accent/5" 
                    : "border-border text-muted-foreground group-hover:border-foreground group-hover:text-foreground"}
            `}>
                {count}
            </span>
        </button>
    )
}