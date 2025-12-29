"use client";
import { Clock, History, Flame, Eye, ThumbsUp, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExploreSortBar({ 
  sortOrder, 
  setSortOrder, 
  popularMetric, 
  setPopularMetric 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
      
      {/* Primary Sort Buttons */}
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

      {/* Secondary "Popular" Metrics (Animated Slide-in) */}
      <AnimatePresence mode="wait">
        {sortOrder === 'popular' && (
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 pl-2 sm:border-l-2 border-accent/50"
            >
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
                    Metric_Selector:
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
                        label="Hype (Mix)"
                        isSpecial
                    />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- SUB COMPONENTS ---

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