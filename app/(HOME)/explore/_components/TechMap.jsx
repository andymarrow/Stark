"use client";
import { motion } from "framer-motion";

// Actual simplified SVG paths for continents
const CONTINENTS = [
  { 
    id: "na", 
    name: "North America", 
    path: "M 50 10 L 120 10 L 110 50 L 130 90 L 90 120 L 60 100 L 40 40 Z", // Simplified shape
    realPath: "M55.3,64.2c-2.8-1.7-8.8-7.7-6-12.8c1.6-2.9,7.6-3.8,10.6-5.1c8.1-3.6,15.7-9,24.3-11.5c4.6-1.3,9.7-1.1,14.4,0.1c6,1.5,10.9,6,15,10.6c3.1,3.5,5.1,8.1,5.1,12.8c0,4.6-2.9,8.6-6.4,11.5c-4.4,3.7-9.5,6.5-15.1,8.1c-6.1,1.7-12.7,1.8-18.7-0.7C71.6,74.5,61.8,68.2,55.3,64.2z", // Placeholder for visual reference in thought, using simple paths for code clarity below to ensure it renders without huge strings.
    // For this code block, I will use "Low Poly" versions of continents to keep the file size small but recognizable.
    d: "M 20,20 L 90,15 L 120,50 L 100,80 L 70,110 L 40,80 Z", // Abstract NA
    cx: 70, cy: 60
  },
  { 
    id: "sa", 
    name: "South America", 
    d: "M 80,120 L 130,120 L 140,160 L 110,210 L 90,190 Z", 
    cx: 110, cy: 160 
  },
  { 
    id: "eu", 
    name: "Europe", 
    d: "M 135,25 L 180,20 L 190,50 L 160,60 L 140,55 Z", 
    cx: 160, cy: 40 
  },
  { 
    id: "af", 
    name: "Africa", 
    d: "M 130,70 L 180,70 L 200,120 L 170,180 L 140,140 Z", 
    cx: 160, cy: 120 
  },
  { 
    id: "as", 
    name: "Asia", 
    d: "M 190,20 L 280,20 L 320,60 L 290,110 L 240,100 L 200,60 Z", 
    cx: 250, cy: 60 
  },
  { 
    id: "au", 
    name: "Oceania", 
    d: "M 260,140 L 310,140 L 320,170 L 270,180 Z", 
    cx: 290, cy: 160 
  }
];

// Better "Real World" Polygon Data (Simplified for performance & aesthetics)
const WORLD_PATHS = [
    { id: "na", name: "North America", d: "M 10,10 L 80,5 L 110,30 L 90,80 L 50,110 L 20,60 Z", cx: 60, cy: 50 },
    { id: "sa", name: "South America", d: "M 100,115 L 150,120 L 130,190 L 110,210 L 90,160 Z", cx: 120, cy: 160 },
    { id: "eu", name: "Europe", d: "M 120,10 L 180,10 L 170,50 L 140,60 L 115,40 Z", cx: 150, cy: 35 },
    { id: "af", name: "Africa", d: "M 130,70 L 190,70 L 210,130 L 170,180 L 140,130 Z", cx: 165, cy: 120 },
    { id: "as", name: "Asia", d: "M 185,15 L 290,15 L 320,80 L 270,110 L 220,100 L 190,60 Z", cx: 250, cy: 60 },
    { id: "au", name: "Oceania", d: "M 260,150 L 330,150 L 320,190 L 270,190 Z", cx: 295, cy: 170 },
];


export default function TechMap({ selectedRegion, onSelect }) {
  return (
    <div className="w-full aspect-[16/9] bg-secondary/5 border border-border relative overflow-hidden group">
      
      {/* 1. Grid Background (Radar look) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />

      {/* 2. Map SVG */}
      <svg viewBox="0 0 350 220" className="w-full h-full p-2 drop-shadow-2xl">
        {WORLD_PATHS.map((region) => {
          const isActive = selectedRegion === region.id;
          return (
            <g 
              key={region.id} 
              onClick={() => onSelect(isActive ? null : region.id)}
              className="cursor-pointer"
            >
              {/* The Landmass */}
              <motion.path
                d={region.d}
                initial={{ fill: "rgba(128,128,128,0.1)", stroke: "rgba(128,128,128,0.2)" }}
                animate={{ 
                  fill: isActive ? "rgba(220, 38, 38, 0.15)" : "rgba(128,128,128,0.1)",
                  stroke: isActive ? "#DC2626" : "rgba(128,128,128,0.3)",
                  scale: isActive ? 1.02 : 1,
                  filter: isActive ? "drop-shadow(0 0 8px rgba(220,38,38,0.3))" : "none"
                }}
                transition={{ duration: 0.3 }}
                strokeWidth="0.5"
                className="hover:fill-foreground/20 transition-colors"
                style={{ transformOrigin: `${region.cx}px ${region.cy}px` }}
              />
              
              {/* The "Active" Dot indicator */}
              {isActive && (
                <motion.circle 
                    cx={region.cx} 
                    cy={region.cy} 
                    r="2" 
                    fill="#DC2626"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* 3. Overlay Text */}
      <div className="absolute bottom-2 left-2 text-[9px] font-mono text-muted-foreground bg-background/90 px-2 py-1 border border-border backdrop-blur-sm">
        REGION: <span className="text-foreground font-bold">{WORLD_PATHS.find(r => r.id === selectedRegion)?.name || "GLOBAL"}</span>
      </div>
    </div>
  );
}