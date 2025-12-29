"use client";
import { 
  Layers, 
  Heart, 
  Users, 
  UserPlus, 
  BarChart3, 
  Radio, 
  Activity 
} from "lucide-react";

export default function ProfileStats({ stats }) {
  
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
      highlight: true, // Accent color
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
      desc: "Network Size"
    },
    { 
      label: "Following", 
      value: stats.following, 
      icon: UserPlus,
      desc: "Network Connections"
    },
    { 
      label: "Node Reach", 
      value: stats.nodeReach, 
      icon: Radio,
      desc: "Profile Visits" 
    },
  ];

  return (
    <div className="border border-border bg-background">
      <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-border">
        {statItems.map((item, index) => (
          <StatItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, highlight, desc }) {
  return (
    <div className="p-5 flex flex-col justify-between h-32 hover:bg-secondary/5 transition-colors group cursor-default relative overflow-hidden">
      
      {/* Top Row: Label & Icon */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono group-hover:text-foreground transition-colors">
          {label}
        </span>
        <Icon 
          size={16} 
          className={`transition-colors duration-300 ${
            highlight ? "text-accent" : "text-muted-foreground group-hover:text-accent"
          }`} 
        />
      </div>

      {/* Value */}
      <div>
        <span className={`text-3xl font-bold font-mono tracking-tighter ${
            highlight ? "text-accent" : "text-foreground"
        }`}>
          {formatNumber(value)}
        </span>
      </div>

      {/* Decorative / Context (Optional UX touch) */}
      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[9px] text-muted-foreground font-mono truncate">
            // {desc}
        </span>
      </div>
      
      {/* Subtle corner accent on hover */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function formatNumber(num) {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}