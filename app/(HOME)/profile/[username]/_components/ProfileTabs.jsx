"use client";
import { 
  Layers, Heart, Grid, List, 
  Clock, History, Flame, 
  Eye, ThumbsUp, Zap 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileTabs({ 
  activeTab, 
  setActiveTab, 
  viewMode, 
  setViewMode,
  workCount = 0,
  savedCount = 0,
  sortOrder,
  setSortOrder,
  popularMetric,
  setPopularMetric
}) {
  return (
    <div className="flex flex-col gap-6 mb-8">
        
        {/* TOP ROW: Main Sections & View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-0 gap-4">
            <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                <TabButton 
                    active={activeTab === "work"} 
                    onClick={() => setActiveTab("work")} 
                    icon={Layers} 
                    label="Submissions" 
                    count={workCount}
                />
                <TabButton 
                    active={activeTab === "saved"} 
                    onClick={() => setActiveTab("saved")} 
                    icon={Heart} 
                    label="Starred" 
                    count={savedCount}
                />
            </div>

            <div className="hidden md:flex items-center gap-1 pb-2">
                <ViewToggleButton active={viewMode === 'grid'} onClick={() => setViewMode("grid")} icon={Grid} />
                <ViewToggleButton active={viewMode === 'list'} onClick={() => setViewMode("list")} icon={List} />
            </div>
        </div>

        {/* BOTTOM ROW: The Filter Engine */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 bg-secondary/10 p-1 border border-border w-fit">
                <FilterButton 
                    active={sortOrder === 'latest'} 
                    onClick={() => setSortOrder('latest')} 
                    label="LATEST" 
                    icon={Clock} 
                />
                <FilterButton 
                    active={sortOrder === 'oldest'} 
                    onClick={() => setSortOrder('oldest')} 
                    label="OLDEST" 
                    icon={History} 
                />
                <FilterButton 
                    active={sortOrder === 'popular'} 
                    onClick={() => setSortOrder('popular')} 
                    label="POPULAR" 
                    icon={Flame} 
                />
            </div>

            {/* THE UNIQUE POPULAR UI: Only shows when 'Popular' is active */}
            <AnimatePresence mode="wait">
                {sortOrder === 'popular' && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-3 pl-2 border-l-2 border-accent/50"
                    >
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
                            Metric:
                        </span>
                        
                        <div className="flex gap-1">
                            <MetricToggle 
                                active={popularMetric === 'views'} 
                                onClick={() => setPopularMetric('views')} 
                                icon={Eye} 
                                label="Traffic"
                            />
                            <MetricToggle 
                                active={popularMetric === 'likes'} 
                                onClick={() => setPopularMetric('likes')} 
                                icon={ThumbsUp} 
                                label="Stars"
                            />
                            <MetricToggle 
                                active={popularMetric === 'hype'} 
                                onClick={() => setPopularMetric('hype')} 
                                icon={Zap} 
                                label="Hype (Both)"
                                isSpecial
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

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
            <Icon size={16} className={`transition-colors ${active ? "text-accent" : "group-hover:text-accent"}`} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest">{label}</span>
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

function FilterButton({ active, onClick, label, icon: Icon }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all
                ${active 
                    ? "bg-foreground text-background font-bold shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"}
            `}
        >
            <Icon size={12} />
            {label}
        </button>
    )
}

function MetricToggle({ active, onClick, icon: Icon, label, isSpecial }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`
                flex items-center gap-1.5 px-3 py-1.5 border transition-all text-[10px] font-mono uppercase
                ${active 
                    ? isSpecial 
                        ? "border-accent bg-accent text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]" 
                        : "border-foreground bg-secondary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}
            `}
        >
            <Icon size={12} fill={active && !isSpecial ? "currentColor" : "none"} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    )
}

function ViewToggleButton({ active, onClick, icon: Icon }) {
    return (
        <button 
            onClick={onClick}
            className={`p-2 transition-all duration-200 border ${
              active 
                ? 'text-foreground bg-secondary/30 border-border' 
                : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/10'
            }`}
        >
            <Icon size={16} />
        </button>
    )
}