"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AchievementCardPreview from "./AchievementCardPreview";
import { cn } from "@/lib/utils";

// Rarity Text Colors for the Modal
const RARITY_TEXT_COLORS = {
  common: "text-zinc-500",
  rare: "text-blue-500",
  legendary: "text-yellow-500",
  mythic: "text-red-600",
  easter_egg: "text-purple-500"
};

export default function AchievementDetailModal({ badge, isOpen, onClose, unlockedAt }) {
  if (!badge) return null;

  // Visual Styles
  const glowColor = badge.visual_style?.glow_color || '#ef4444';
  const category = badge.category || "SYSTEM";
  const rarity = badge.rarity || "common";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border border-border p-0 gap-0 shadow-2xl overflow-hidden rounded-lg">
        
        {/* 
            NOTE: Shadcn UI <DialogContent> automatically renders a <DialogClose> (X button).
            We do not need to add another one manually.
        */}

        {/* 1. VISUAL HEADER (The Stage) */}
        {/* Increased height to h-80 to prevent cutting off the large badge */}
        <div className="relative h-80 bg-secondary/30 dark:bg-zinc-950/50 flex items-center justify-center border-b border-border overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div 
                className="absolute inset-0 opacity-20 dark:opacity-30 blur-3xl scale-150 transition-all duration-1000"
                style={{ background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)` }}
            />
            
            {/* Grid Pattern Overlay */}
            <div 
                className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ 
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    color: 'var(--border)' 
                }} 
            />

            {/* The Badge Itself - Centered */}
            <div className="relative z-10 flex items-center justify-center">
                {/* 
                    CSS TRICK: We hide the text label elements inside the Preview component 
                    so only the graphical badge shows in this modal header.
                */}
                <div className="[&_h4]:hidden [&_span]:hidden [&_.mt-6]:hidden"> 
                    <AchievementCardPreview badge={badge} size="lg" />
                </div>
            </div>
        </div>

        {/* 2. DATA BODY (The Info) */}
        <div className="p-8 text-center space-y-6 relative bg-background">
            
            {/* Title & Category */}
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">
                    {badge.name}
                </h2>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary border border-border rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: glowColor }} />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                        {category} Protocol
                    </span>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs mx-auto">
                "{badge.description}"
            </p>

            {/* Footer Stats */}
            <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Unlocked On</span>
                    <span className="text-sm font-bold text-foreground font-mono">
                        {unlockedAt ? new Date(unlockedAt).toLocaleDateString() : "LOCKED"}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Rarity Class</span>
                    <span className={cn(
                        "text-sm font-bold uppercase font-mono tracking-wider",
                        RARITY_TEXT_COLORS[rarity] || "text-muted-foreground"
                    )}>
                        {rarity.replace('_', ' ')}
                    </span>
                </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}