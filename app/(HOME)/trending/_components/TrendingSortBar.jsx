"use client";
import { Eye, ThumbsUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function TrendingSortBar({ popularMetric, setPopularMetric }) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-1 bg-secondary/10 p-1 border border-border rounded-none">
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
              label="Hype (Weighted)"
              isSpecial
          />
      </div>
    </div>
  );
}

function MetricToggle({ active, onClick, icon: Icon, label, isSpecial }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-wider transition-all
                ${active 
                    ? isSpecial 
                        ? "bg-accent text-white shadow-lg shadow-accent/20 font-bold" 
                        : "bg-foreground text-background font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"}
            `}
        >
            <Icon size={14} fill={active && !isSpecial ? "currentColor" : "none"} />
            {label}
        </button>
    )
}