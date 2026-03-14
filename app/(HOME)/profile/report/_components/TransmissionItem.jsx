"use client";
import { GitCommit, Rocket, Trophy, ArrowRight, Clock } from "lucide-react";

const TYPE_CONFIG = {
    deployment: { icon: Rocket, color: "text-blue-500", label: "New Project Launched" },
    patch: { icon: GitCommit, color: "text-accent", label: "Project Updated" },
    arena: { icon: Trophy, color: "text-yellow-500", label: "Contest Joined" },
};

export default function TransmissionItem({ event }) {
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.patch;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-4 py-5 border-b border-border/50 last:border-0 group">
      {/* Icon with a simpler background */}
      <div className={`mt-1 p-2 bg-secondary/20 border border-border ${config.color} flex-shrink-0 transition-all`}>
        <Icon size={16} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${config.color}`}>
                {config.label}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock size={10} /> {new Date(event.created_at).toLocaleDateString()}
            </span>
        </div>
        
        {/* Descriptive Text */}
        <h4 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
            {event.label}
        </h4>
      </div>

      <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
        <ArrowRight size={14} className="text-accent" />
      </div>
    </div>
  );
}