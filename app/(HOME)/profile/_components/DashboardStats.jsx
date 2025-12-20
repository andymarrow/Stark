"use client";
import { TrendingUp, Users, Heart, Eye } from "lucide-react";

export default function DashboardStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border-y border-border">
        <StatBox label="Total Views" value={stats.totalViews} icon={Eye} trend="+12%" />
        <StatBox label="Followers" value={stats.followers} icon={Users} trend="+5" />
        <StatBox label="Appreciations" value={stats.likes} icon={Heart} />
        <StatBox label="Profile Visits" value={stats.profileVisits} icon={TrendingUp} trend="+24%" isLast />
    </div>
  );
}

function StatBox({ label, value, icon: Icon, trend, isLast }) {
    return (
        <div className={`bg-background p-6 flex flex-col justify-between h-28 group hover:bg-secondary/5 transition-colors`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{label}</span>
                <Icon size={14} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <div>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                {trend && (
                    <div className="text-[10px] font-mono text-green-500 mt-1">
                        {trend} <span className="text-muted-foreground">this week</span>
                    </div>
                )}
            </div>
        </div>
    )
}