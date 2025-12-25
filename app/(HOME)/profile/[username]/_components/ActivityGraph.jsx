"use client";
import { Info } from "lucide-react";
import { useMemo } from "react";

export default function ActivityGraph({ projects = [] }) {
  // --- REAL DATA LOGIC ---
  const data = useMemo(() => {
    // Create an array of 48 "slots" (representing recent weeks/periods)
    const blocks = Array(48).fill(0);
    
    if (!projects.length) return blocks;

    const now = new Date();
    
    projects.forEach(project => {
      const createdDate = new Date(project.created_at);
      // Calculate how many weeks ago this project was created
      const diffInTime = now.getTime() - createdDate.getTime();
      const diffInWeeks = Math.floor(diffInTime / (1000 * 3600 * 24 * 7));
      
      // If the project is within our 48-week window, increment that block
      if (diffInWeeks >= 0 && diffInWeeks < 48) {
        // 47 is "this week", 0 is "47 weeks ago"
        blocks[47 - diffInWeeks] += 1;
      }
    });
    
    return blocks;
  }, [projects]);

  const totalContributions = projects.length;

  return (
    <div className="h-full min-h-[180px] border border-border p-5 bg-background flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Activity_Frequency</h3>
          <div className="text-xl font-bold text-foreground">
            {totalContributions} <span className="text-sm font-normal text-muted-foreground">deployments</span>
          </div>
        </div>
        <div title="This graph shows your project deployment frequency over the last year.">
            <Info size={14} className="text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>
      </div>
      
      {/* The Visual Bar Chart */}
      <div className="flex items-end gap-[3px] h-24 w-full">
        {data.map((count, i) => {
            // Determine "intensity" based on number of projects in that week
            const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;

            return (
                <div 
                    key={i} 
                    className="flex-1 hover:brightness-125 transition-all duration-200 rounded-sm"
                    title={count > 0 ? `${count} projects this week` : `No activity`}
                    style={{
                        height: level === 0 ? '4px' : `${20 + (level * 25)}%`, 
                        backgroundColor: level === 0 ? 'hsl(var(--secondary))' : 
                                        level === 1 ? 'hsl(var(--foreground) / 0.2)' :
                                        level === 2 ? 'hsl(var(--foreground) / 0.5)' :
                                        'hsl(var(--accent))',
                        opacity: level === 0 ? 0.3 : 1
                    }}
                />
            )
        })}
      </div>
    </div>
  );
}