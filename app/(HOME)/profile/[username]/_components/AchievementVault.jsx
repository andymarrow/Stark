"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, EyeOff, Eye, Pin, Check } from "lucide-react";
import AchievementCardPreview from "@/app/(ADMIN)/admin/achievements/_components/AchievementCardPreview";
import { supabase } from "@/lib/supabaseClient";
import AchievementDetailModal from "@/app/(ADMIN)/admin/achievements/_components/AchievementDetailModal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Rarity Color Map
const RARITY_COLORS = {
  common: "bg-zinc-500",
  rare: "bg-blue-500",
  legendary: "bg-yellow-500",
  mythic: "bg-red-600",
  easter_egg: "bg-purple-500"
};

export default function AchievementVault({ userId, isOwner }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // Pinning Mode State
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [pinnedCount, setPinnedCount] = useState(0);

  // Fetch Achievements
  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) return;
      
      let query = supabase
        .from('user_achievements')
        .select(`*, achievement_types(*)`) 
        .eq('user_id', userId)
        .order('is_pinned', { ascending: false }) // Pinned first
        .order('unlocked_at', { ascending: false });

      if (!isOwner) {
          query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (!error) {
          setAchievements(data || []);
          // Count initial pins
          setPinnedCount(data.filter(b => b.is_pinned).length);
      }
      setLoading(false);
    };

    fetchBadges();
  }, [userId, isOwner]);

  // Handle Pin Toggle
  const togglePin = async (achievementId, currentStatus) => {
      if (!isOwner) return;

      // Validation: Max 5 Pins
      if (!currentStatus && pinnedCount >= 5) {
          toast.error("Rack Full", { description: "Maximum 5 protocols can be pinned." });
          return;
      }

      const newStatus = !currentStatus;
      
      // Optimistic Update
      setAchievements(prev => 
          prev.map(a => a.id === achievementId ? { ...a, is_pinned: newStatus } : a)
      );
      setPinnedCount(prev => newStatus ? prev + 1 : prev - 1);

      // DB Update
      const { error } = await supabase
        .from('user_achievements')
        .update({ is_pinned: newStatus })
        .eq('id', achievementId);

      if (error) {
          toast.error("Sync Failed");
          // Revert
          setAchievements(prev => 
              prev.map(a => a.id === achievementId ? { ...a, is_pinned: currentStatus } : a)
          );
          setPinnedCount(prev => currentStatus ? prev + 1 : prev - 1);
      }
  };

  const toggleVisibility = async (achievementId, currentStatus) => {
    if (!isOwner) return;
    const newStatus = !currentStatus;
    setAchievements(prev => prev.map(a => a.id === achievementId ? { ...a, is_public: newStatus } : a));
    toast.success(newStatus ? "Visible" : "Hidden");
    
    await supabase.from('user_achievements').update({ is_public: newStatus }).eq('id', achievementId);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" size={32} /></div>;

  if (achievements.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-border bg-secondary/5 flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center opacity-50"><Lock className="w-8 h-8 text-muted-foreground" /></div>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Vault_Empty</p>
      </div>
    );
  }

  return (
    <>
      {/* HEADER CONTROLS (Owner Only) */}
      {isOwner && (
          <div className="flex justify-between items-center mb-6 animate-in fade-in slide-in-from-top-2">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                 {isPinningMode ? (
                     <span className={pinnedCount === 5 ? "text-red-500" : "text-accent"}>
                         SLOTS ACTIVE: {pinnedCount} / 5
                     </span>
                 ) : (
                     <span>Total Assets: {achievements.length}</span>
                 )}
              </div>
              
              <Button 
                onClick={() => setIsPinningMode(!isPinningMode)}
                variant="ghost" // Using ghost + custom classes for better control
                className={cn(
                    "h-8 text-[10px] font-mono uppercase tracking-widest rounded-none transition-all border",
                    // Active State (Pinning Mode): Red BG, White Text
                    isPinningMode 
                        ? "bg-accent text-white border-accent hover:bg-accent/90 hover:text-white" 
                    // Inactive State (Normal): High contrast hover state for Light/Dark
                        : "border-border text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground"
                )}
              >
                 {isPinningMode ? <><Check size={12} className="mr-2"/> Done Editing</> : <><Pin size={12} className="mr-2"/> Manage Rack</>}
              </Button>
          </div>
      )}

      {/* THE GRID - MOBILE RESPONSIVE (1 col mobile, 2 col sm, 3 col md, 4 col lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
        {achievements.map((item, idx) => {
          const isHidden = !item.is_public;
          const isPinned = item.is_pinned;
          const rarity = item.achievement_types?.rarity || 'common';

          return (
            <motion.div
                key={item.id}
                layout // Smooth sorting animation
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                    "group flex flex-col items-center relative p-4 rounded-xl transition-all duration-300",
                    isPinningMode && "cursor-pointer border border-dashed",
                    isPinningMode && isPinned ? "border-accent bg-accent/5" : "border-transparent",
                    isPinningMode && !isPinned ? "border-border hover:border-foreground/20" : ""
                )}
                onClick={() => {
                    if (isPinningMode) togglePin(item.id, item.is_pinned);
                    else setSelectedBadge(item);
                }}
            >
                {/* Pin Indicator Overlay */}
                {isPinningMode && (
                    <div className={cn(
                        "absolute top-2 right-2 z-30 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                        isPinned ? "bg-accent text-white" : "bg-secondary text-muted-foreground"
                    )}>
                        <Pin size={12} className={isPinned ? "fill-current" : ""} />
                    </div>
                )}

                {/* Badge Container */}
                <div className={`transform scale-90 group-hover:scale-100 transition-all duration-300 relative ${isHidden ? 'opacity-40 grayscale' : ''}`}>
                    <AchievementCardPreview badge={item.achievement_types} size="lg" />
                    
                    {/* Rarity Dot */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`w-1.5 h-1.5 rounded-full ${RARITY_COLORS[rarity] || 'bg-zinc-500'}`} />
                        <span className="text-[8px] font-mono text-white uppercase tracking-wider">{rarity.replace('_', ' ')}</span>
                    </div>

                    {/* Persistent Pin Icon (When not in edit mode) */}
                    {!isPinningMode && isPinned && (
                        <div className="absolute top-0 right-0 bg-accent text-white p-1 rounded-full shadow-lg z-20 scale-75">
                            <Pin size={12} fill="currentColor" />
                        </div>
                    )}
                </div>
                
                {/* Metadata & Controls */}
                {!isPinningMode && (
                    <div className="mt-8 text-center flex flex-col items-center gap-2">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">
                            {new Date(item.unlocked_at).toLocaleDateString()}
                        </p>
                        {isOwner && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); toggleVisibility(item.id, item.is_public); }}
                                className={`h-6 text-[9px] font-mono uppercase px-2 py-0 border rounded-none ${isHidden ? 'border-border text-muted-foreground' : 'border-green-500/30 text-green-500 hover:bg-green-500/10'}`}
                            >
                                {isHidden ? <><EyeOff size={10} className="mr-1"/> Private</> : <><Eye size={10} className="mr-1"/> Public</>}
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>
          );
        })}
      </div>

      <AchievementDetailModal 
          badge={selectedBadge?.achievement_types} 
          unlockedAt={selectedBadge?.unlocked_at}
          isOpen={!!selectedBadge} 
          onClose={() => setSelectedBadge(null)} 
      />
    </>
  );
}