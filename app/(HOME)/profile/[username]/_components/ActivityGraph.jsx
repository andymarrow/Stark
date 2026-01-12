"use client";
import { Info, Activity } from "lucide-react";
import { useMemo } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export default function ActivityGraph({ projects = [] }) {
  // --- REAL DATA LOGIC ---
  const data = useMemo(() => {
    // Generate last 12 weeks for a cleaner, more detailed view
    // (48 weeks is too dense for a small widget, 12 weeks shows momentum better)
    const weeks = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (11 - i) * 7);
        return {
            name: `Week ${i + 1}`,
            date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            count: 0
        };
    });

    if (!projects.length) return weeks;

    const now = new Date();
    projects.forEach(project => {
      const createdDate = new Date(project.created_at);
      const diffInTime = now.getTime() - createdDate.getTime();
      const diffInWeeks = Math.floor(diffInTime / (1000 * 3600 * 24 * 7));
      
      // If within last 12 weeks
      if (diffInWeeks >= 0 && diffInWeeks < 12) {
         weeks[11 - diffInWeeks].count += 1;
      }
    });
    
    return weeks;
  }, [projects]);

  const totalContributions = projects.length;
  
  // Calculate "Velocity" (Avg per week)
  const velocity = (totalContributions / 12).toFixed(1);

  return (
    <div className="h-full min-h-[180px] border border-border p-0 bg-background flex flex-col justify-between relative overflow-hidden group">
      
      {/* 1. Header Info (Floating on top) */}
      <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Activity size={12} className="text-accent animate-pulse" />
             <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">System_Velocity</h3>
          </div>
          <div className="flex items-baseline gap-2">
             <div className="text-2xl font-black text-foreground tracking-tight">{totalContributions}</div>
             <div className="text-[10px] font-mono text-zinc-500">DEPLOYMENTS</div>
          </div>
        </div>
        
        <div className="text-right">
             <div className="text-lg font-bold text-foreground">{velocity}</div>
             <div className="text-[9px] font-mono text-muted-foreground uppercase">AVG / WEEK</div>
        </div>
      </div>
      
      {/* 2. Grid Background (The "Blueprint" look) */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ 
               backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
               backgroundSize: '20px 20px'
           }} 
      />

      {/* 3. The Waveform (Chart) */}
      <div className="w-full h-full pt-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

// Custom Tooltip to match the "Stark" aesthetic
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/90 border border-border p-2 text-xs shadow-xl backdrop-blur-sm">
        <p className="font-mono text-zinc-400 mb-1 uppercase tracking-widest text-[9px]">{data.date}</p>
        <p className="font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full" />
            {payload[0].value} <span className="font-normal text-zinc-500">deploys</span>
        </p>
      </div>
    );
  }
  return null;
};