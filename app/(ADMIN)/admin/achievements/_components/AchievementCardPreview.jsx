"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

/**
 * Generates a CSS clip-path polygon for N sides.
 */
const getPolygonPath = (sides) => {
  if (sides === 'circle') return 'circle(50% at 50% 50%)';
  if (sides === 'square') return 'inset(0% 0% 0% 0% round 12px)';
  if (sides === 'diamond') return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
  if (sides === 'none') return 'none'; 
  
  const numSides = parseInt(sides) || 6;
  const step = (2 * Math.PI) / numSides;
  const points = [];
  const startAngle = -Math.PI / 2;
  
  for (let i = 0; i < numSides; i++) {
    const angle = startAngle + i * step;
    const x = 50 + 50 * Math.cos(angle);
    const y = 50 + 50 * Math.sin(angle);
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  }
  
  return `polygon(${points.join(', ')})`;
};

export default function AchievementCardPreview({ 
  badge, 
  locked = false, 
  size = "md", 
  className 
}) {
  if (!badge) return null;

  const style = badge.visual_style || {};
  
  // Extract Raw Values
  const shapeType = style.shape || 'poly';
  const polySides = style.poly_sides || 6;
  
  const borderColor = style.border_color || 'transparent'; 
  const glowColor = style.glow_color || 'transparent'; 
  const glowIntensity = style.glow_intensity || 0;
  const bgStart = style.bg_start || 'transparent';
  const bgEnd = style.bg_end || 'transparent';
  
  // NEW: Get Rarity from Badge Object
  const rarity = badge.rarity || 'common';

  const isShapeNone = shapeType === 'none';

  // Enhanced Size Mapping
  const sizeClasses = {
    sm: "w-20 h-20", 
    md: "w-40 h-40",
    lg: "w-72 h-72", 
  };

  const clipPath = shapeType === 'poly' 
    ? getPolygonPath(polySides) 
    : getPolygonPath(shapeType);

  return (
    <div className={cn(
      "relative group flex flex-col items-center justify-center transition-all duration-700 ease-out",
      className
    )}>
      
      {/* 
         1. OUTER GLOW / ATMOSPHERE
      */}
      {!isShapeNone && glowIntensity > 0 && (
        <div 
            className={cn(
            "absolute transition-opacity duration-1000",
            size === 'sm' ? "w-12 h-12" : "w-32 h-32",
            // MYTHIC EFFECT: Pulse the outer atmosphere
            !locked && rarity === 'mythic' ? "animate-pulse-slow" : ""
            )}
            style={{
                background: glowColor,
                opacity: locked ? 0 : glowIntensity / 200, 
                filter: 'blur(40px)',
                transform: 'translateY(10%)'
            }}
        />
      )}

      {/* 
         2. MAIN BADGE CONTAINER
      */}
      <div 
        className={cn(
          "relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105 z-10",
          sizeClasses[size],
          locked && "grayscale opacity-40 brightness-50"
        )}
        style={{
          filter: !isShapeNone 
            ? `none`
            : 'none',
        }}
      >
        
        {/* A. BACKGROUND SHAPE */}
        {!isShapeNone && (
            <div 
                className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
                style={{ 
                    clipPath: clipPath, 
                    background: borderColor, 
                }} 
            >
                {/* THE FACE */}
                <div 
                    className="absolute inset-[3px] z-10 flex items-center justify-center overflow-hidden"
                    style={{ 
                        clipPath: clipPath, 
                        background: `linear-gradient(135deg, ${bgStart}, ${bgEnd})`,
                    }}
                >
                    {/* 
                       LEGENDARY EFFECT: Subtle Sheen Sweep 
                    */}
                    {!locked && rarity === 'legendary' && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent skew-x-12 w-[200%] translate-x-[-150%] animate-sheen pointer-events-none z-20" />
                    )}

                    {/* 
                       EASTER EGG EFFECT: Subtle Static Noise
                    */}
                    {!locked && rarity === 'easter_egg' && (
                        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.5%22/%3E%3C/svg%3E")' }}
                        />
                    )}

                    {/* Texture: Subtle Scanlines */}
                    <div 
                        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" 
                        style={{
                            backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                            backgroundSize: '100% 4px'
                        }}
                    />
                    
                    {/* Texture: Radial Highlight */}
                    <div 
                        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-soft-light"
                        style={{
                            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)'
                        }}
                    />
                </div>
            </div>
        )}

        {/* B. THE CHARACTER IMAGE */}
        {badge.image_url ? (
          <div className={cn(
              "relative z-20 transition-transform duration-500 group-hover:scale-110",
              isShapeNone ? "w-full h-full" : "w-[75%] h-[75%]"
          )}>
            <Image 
                src={badge.image_url} 
                alt={badge.name} 
                fill 
                className={cn(
                    "object-contain",
                    isShapeNone ? "drop-shadow-2xl" : "drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                )}
                priority={size !== 'sm'}
            />
          </div>
        ) : (
          <div className="text-[9px] font-mono text-zinc-500 uppercase z-10 text-center px-2 animate-pulse absolute">
            NO_DATA
          </div>
        )}

        {/* Locked Overlay */}
        {locked && (
          <div className={cn(
              "absolute inset-0 flex items-center justify-center z-30 backdrop-blur-[2px]",
              !isShapeNone ? "bg-black/60" : ""
          )}>
            <Lock className="w-1/3 h-1/3 text-white/50" />
          </div>
        )}
      </div>

      {/* 3. LABEL (Only for Medium/Large Views) */}
      {size !== 'sm' && (
        <div className="flex flex-col items-center mt-6 z-20 space-y-2 opacity-90 group-hover:opacity-100 transition-opacity">
          {!isShapeNone && (
             <div className="w-px h-4 bg-gradient-to-b from-border to-transparent opacity-50" />
          )}
          <div className="text-center">
            <h4 className="font-black text-foreground text-sm uppercase tracking-tighter leading-none" style={{ textShadow: '0px 2px 10px rgba(0,0,0,0.5)' }}>
              {badge.name || "UNIDENTIFIED"}
            </h4>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/10 border border-white/5 backdrop-blur-sm">
                {!isShapeNone && (
                    <div 
                        className="w-1.5 h-1.5 rounded-full animate-pulse" 
                        style={{ background: glowColor !== 'transparent' ? glowColor : '#555' }}
                    />
                )}
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                    {badge.category || "SYSTEM"}
                </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}