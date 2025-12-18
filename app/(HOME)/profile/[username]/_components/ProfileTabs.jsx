"use client";
import { Layers, Bookmark, Heart, Grid, List } from "lucide-react";

export default function ProfileTabs({ activeTab, setActiveTab, viewMode, setViewMode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border mb-8 gap-4">
        
        {/* Tab Selection */}
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            <TabButton 
                active={activeTab === "work"} 
                onClick={() => setActiveTab("work")} 
                icon={Layers} 
                label="My Work" 
                count={14}
            />
            <TabButton 
                active={activeTab === "saved"} 
                onClick={() => setActiveTab("saved")} 
                icon={Bookmark} 
                label="Saved" 
                count={32}
            />
            <TabButton 
                active={activeTab === "liked"} 
                onClick={() => setActiveTab("liked")} 
                icon={Heart} 
                label="Liked" 
                count={128}
            />
        </div>

        {/* View Toggle (Now Functional) */}
        <div className="hidden md:flex items-center gap-1 pb-2">
            <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'text-foreground bg-secondary/20' : 'text-muted-foreground hover:text-foreground'}`}
                title="Grid View"
            >
                <Grid size={16} />
            </button>
            <button 
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'text-foreground bg-secondary/20' : 'text-muted-foreground hover:text-foreground'}`}
                title="List View"
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
            <Icon size={16} className={active ? "text-accent" : "group-hover:text-accent transition-colors"} />
            <span className="text-sm font-mono font-medium tracking-wide uppercase">{label}</span>
            <span className={`
                text-[10px] px-1.5 py-0.5 border
                ${active 
                    ? "border-accent text-accent bg-accent/5" 
                    : "border-border text-muted-foreground group-hover:border-foreground group-hover:text-foreground"}
            `}>
                {count}
            </span>
        </button>
    )
}