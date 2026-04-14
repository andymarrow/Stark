// app/(HOME)/profile/[username]/_components/ProfileStats.jsx
"use client";
import { 
  Layers, 
  Heart, 
  Users, 
  UserPlus, 
  BarChart3, 
  Radio,
  Zap // NEW IMPORT FOR RUP
} from "lucide-react";

export default function ProfileStats({ stats, onStatClick }) {
  
  const statItems = [
    { 
      label: "Projects", 
      value: stats.projects, 
      icon: Layers,
      desc: "Total Shipments"
    },
    { 
      label: "Total Likes", 
      value: stats.likes, 
      icon: Heart, 
      highlight: true, 
      desc: "Community Endorsements"
    },
    { 
      label: "Project Traffic", 
      value: stats.projectTraffic, 
      icon: BarChart3,
      desc: "Accumulated Views" 
    },
    { 
      label: "Followers", 
      value: stats.followers, 
      icon: Users,
      desc: "Network Size",
      isClickable: true,
      onClick: () => onStatClick('followers')
    },
    { 
      label: "Following", 
      value: stats.following, 
      icon: UserPlus,
      desc: "Network Connections",
      isClickable: true,
      onClick: () => onStatClick('following')
    },
    { 
      label: "Node Reach", 
      value: stats.nodeReach, 
      icon: Radio,
      desc: "Profile Visits" 
    },
  ];

  // --- NEW: INJECT FUEL STATS IF PUBLIC ---
  if (stats.financialStats) {
      statItems.push({
          label: "Network Fuel",
          value: stats.financialStats.volume,
          icon: Zap,
          highlight: true,
          isEnergy: true, // Custom flag to trigger the glowing Stark effect
          desc: `${stats.financialStats.injections} Injections`
      });
  }

  return (
    <div className="border border-border bg-background">
      {/* Dynamic Grid: Adjusts beautifully if there are 6 or 7 items */}
      <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-border">
        {statItems.map((item, index) => (
          <StatItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, highlight, desc, isClickable, onClick, isEnergy }) {
  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={`p-5 flex flex-col justify-between h-32 transition-all group relative overflow-hidden
        ${isClickable ? "cursor-pointer hover:bg-secondary/20 active:bg-secondary/40" : "cursor-default hover:bg-secondary/5"}
        ${isEnergy ? "bg-accent/[0.02]" : ""} 
      `}
    >
      
      {/* Top Row: Label & Icon */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <span className={`text-[10px] uppercase tracking-widest font-mono transition-colors
            ${isEnergy ? "text-accent font-bold" : isClickable ? "text-accent font-bold" : "text-muted-foreground group-hover:text-foreground"}
        `}>
          {label}
        </span>
        <Icon 
          size={16} 
          className={`transition-colors duration-300 ${
            highlight || isClickable ? "text-accent" : "text-muted-foreground group-hover:text-accent"
          } ${isEnergy ? "animate-pulse" : ""}`} 
        />
      </div>

      {/* Value */}
      <div className="relative z-10">
        <span className={`text-3xl font-bold font-mono tracking-tighter transition-transform duration-300 inline-block
            ${highlight ? "text-accent" : "text-foreground"}
            ${isClickable ? "group-hover:scale-110 origin-left" : ""}
            ${isEnergy ? "drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" : ""}
        `}>
          {formatNumber(value)} {isEnergy && <span className="text-xs text-accent/50 ml-1">CRD</span>}
        </span>
        {isClickable && (
            <div className="text-[7px] font-mono text-accent opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                Access_Node_Registry →
            </div>
        )}
      </div>

      {/* Decorative / Context */}
      <div className="mt-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
        <span className={`text-[9px] font-mono truncate ${isEnergy ? "text-accent" : "text-muted-foreground"}`}>
            // {desc}
        </span>
      </div>
      
      {/* Subtle corner accent for interactive elements */}
      {isClickable && !isEnergy && (
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent opacity-20 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Background glow for the energy stat */}
      {isEnergy && (
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-accent/10 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/20 transition-colors" />
      )}
    </div>
  );
}

function formatNumber(num) {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}