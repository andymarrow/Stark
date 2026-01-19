"use client";
import { TrendingUp, Users, Heart, Eye, UserPlus } from "lucide-react";

export default function DashboardStats({ stats, onStatClick }) {
  
  const formatNum = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border-y border-border">
      
      <StatBox 
        label="Project Traffic" 
        value={formatNum(stats.totalViews)} 
        icon={Eye} 
      />

      <StatBox 
        label="Followers" 
        value={formatNum(stats.followers)} 
        icon={Users} 
        isClickable
        onClick={() => onStatClick("followers")}
      />

      <StatBox 
        label="Following" 
        value={formatNum(stats.following)} 
        icon={UserPlus} 
        isClickable
        onClick={() => onStatClick("following")}
      />

      <StatBox 
        label="Stars Earned" 
        value={formatNum(stats.starsEarned)} 
        icon={Heart} 
        isHighlighted
      />

      <StatBox 
        label="Node Reach" 
        value={formatNum(stats.nodeReach)} 
        icon={TrendingUp} 
      />
      
    </div>
  );
}

function StatBox({ label, value, icon: Icon, isHighlighted, isClickable, onClick }) {
  return (
    <div 
        onClick={isClickable ? onClick : undefined}
        className={`bg-background p-6 flex flex-col justify-between h-28 group transition-all duration-200
            ${isClickable ? 'cursor-pointer hover:bg-secondary/20 active:bg-secondary/40' : 'cursor-default hover:bg-secondary/5'}
        `}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest leading-none">
            {label}
        </span>
        <Icon 
            size={14} 
            className={`transition-colors 
                ${isHighlighted ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}
                ${isClickable && 'group-hover:text-accent'}
            `} 
        />
      </div>
      <div>
        <div className={`text-2xl font-bold font-mono tracking-tighter 
            ${isHighlighted ? 'text-accent' : 'text-foreground'}
            ${isClickable && 'group-hover:scale-105 origin-left transition-transform'}
        `}>
            {value}
        </div>
        {isClickable && (
            <div className="text-[8px] font-mono text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-1 uppercase tracking-tighter">
                View_Registry →
            </div>
        )}
      </div>
    </div>
  );
}