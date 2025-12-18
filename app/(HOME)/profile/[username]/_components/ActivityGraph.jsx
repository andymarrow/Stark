"use client";
import { Info } from "lucide-react";

// Generating random data for the heatmap visual
const generateHeatmap = () => {
    return Array.from({ length: 48 }, () => 
        Math.floor(Math.random() * 5) // 0 to 4 intensity
    );
};

export default function ActivityGraph() {
    const data = generateHeatmap();

    return (
        <div className="h-full min-h-[180px] border border-border p-5 bg-background flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Activity_Frequency</h3>
                    <div className="text-xl font-bold text-foreground">1,204 <span className="text-sm font-normal text-muted-foreground">contributions</span></div>
                </div>
                <Info size={14} className="text-muted-foreground hover:text-foreground cursor-pointer" />
            </div>
            
            {/* The Visual Bar Chart */}
            <div className="flex items-end gap-[3px] h-24 w-full">
                {data.map((level, i) => (
                    <div 
                        key={i} 
                        className="flex-1 hover:brightness-125 transition-all duration-200 rounded-sm"
                        title={`${level * 3} contributions`}
                        style={{
                            height: level === 0 ? '4px' : `${15 + (level * 20)}%`, 
                            // FIX: Wrapped variables in hsl() 
                            backgroundColor: level === 0 ? 'hsl(var(--secondary))' : 
                                            level === 1 ? 'hsl(var(--foreground) / 0.2)' :
                                            level === 2 ? 'hsl(var(--foreground) / 0.5)' :
                                            'hsl(var(--accent))',
                            opacity: level === 0 ? 0.3 : 1
                        }}
                    />
                ))}
            </div>
        </div>
    );
}