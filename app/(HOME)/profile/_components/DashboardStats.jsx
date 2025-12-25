"use client";
import { TrendingUp, Users, Heart, Eye } from "lucide-react";

export default function DashboardStats({ stats }) {
  
  /**
   * Converts numbers like 1500 to "1.5k" for clean industrial UI
   */
  const formatNum = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border-y border-border">
      
      {/* 1. Total views across all of the user's projects */}
      <StatBox 
        label="Project Traffic" 
        value={formatNum(stats.totalViews)} 
        icon={Eye} 
      />

      {/* 2. Real follower count from the follows table */}
      <StatBox 
        label="Followers" 
        value={formatNum(stats.followers)} 
        icon={Users} 
      />

      {/* 3. Total likes (stars) earned across all projects */}
      <StatBox 
        label="Stars Earned" 
        value={formatNum(stats.starsEarned)} 
        icon={Heart} 
        isHighlighted
      />

      {/* 4. Total views on the user's specific profile page */}
      <StatBox 
        label="Node Reach" 
        value={formatNum(stats.nodeReach)} 
        icon={TrendingUp} 
      />
      
    </div>
  );
}

function StatBox({ label, value, icon: Icon, isHighlighted }) {
  return (
    <div className="bg-background p-6 flex flex-col justify-between h-28 group hover:bg-secondary/5 transition-colors cursor-default">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{label}</span>
        <Icon 
            size={14} 
            className={`transition-colors ${isHighlighted ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}`} 
        />
      </div>
      <div>
        <div className={`text-2xl font-bold font-mono tracking-tighter ${isHighlighted ? 'text-accent' : 'text-foreground'}`}>
            {value}
        </div>
        
      </div>
    </div>
  );
}