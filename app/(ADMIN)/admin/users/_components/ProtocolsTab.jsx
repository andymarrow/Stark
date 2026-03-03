"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Award } from "lucide-react";
import AchievementCardPreview from "@/app/(ADMIN)/admin/achievements/_components/AchievementCardPreview";
import { toast } from "sonner";

export default function ProtocolsTab({ user }) {
  const [allAchievements, setAllAchievements] = useState([]);
  const [userBadgeIds, setUserBadgeIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all possible achievement types
        const { data: types } = await supabase
          .from('achievement_types')
          .select('*')
          .order('category', { ascending: true });

        // 2. Fetch badges this specific user already has
        const { data: userBadges } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id);

        setAllAchievements(types || []);
        setUserBadgeIds(new Set(userBadges?.map(b => b.achievement_id) || []));
      } catch (err) {
        toast.error("Failed to sync protocol registry.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user.id]);

  const toggleBadge = async (badgeId, isEarned) => {
    setProcessingId(badgeId);
    try {
      if (isEarned) {
        // --- REVOKE (DELETE) ---
        const { error } = await supabase
          .from('user_achievements')
          .delete()
          .eq('user_id', user.id)
          .eq('achievement_id', badgeId);
        
        if (error) throw error;

        // UI Update
        setUserBadgeIds(prev => {
            const next = new Set(prev);
            next.delete(badgeId);
            return next;
        });
        toast.info("Protocol Revoked");

      } else {
        // --- BESTOW (INSERT) ---
        // We use upsert to be safe, but we force 'seen: false' to trigger the notification
        const { error } = await supabase
          .from('user_achievements')
          .upsert({ 
             user_id: user.id, 
             achievement_id: badgeId, 
             seen: false, 
             is_public: true 
          }, { onConflict: 'user_id, achievement_id' }); // Handle duplicates gracefully

        if (error) throw error;

        // UI Update
        setUserBadgeIds(prev => new Set(prev).add(badgeId));
        toast.success("Protocol Bestowed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Handshake Failed", { description: "Database sync error." });
      
      // Fallback: Refresh data to ensure UI matches DB state
      const { data } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id);
      setUserBadgeIds(new Set(data?.map(b => b.achievement_id) || []));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-accent" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Scanning_Achievement_Matrix...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Award className="text-accent" size={20} />
          <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Manual Protocol Override</h3>
              <p className="text-[10px] font-mono text-zinc-500">ADMIN_PRIVILEGE: DIRECT_DATABASE_INJECTION</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allAchievements.map((badge) => {
          const isEarned = userBadgeIds.has(badge.id);
          const isProcessing = processingId === badge.id;

          return (
            <div 
                key={badge.id}
                className={`flex items-center justify-between p-3 border transition-all
                    ${isEarned ? 'bg-accent/5 border-accent/30' : 'bg-zinc-900/20 border-white/5 opacity-60 hover:opacity-100'}
                `}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 scale-50 -ml-4 -mr-4">
                        <AchievementCardPreview badge={badge} size="sm" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate uppercase">{badge.name}</h4>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase">{badge.category}</p>
                    </div>
                </div>

                <button
                    disabled={isProcessing}
                    onClick={() => toggleBadge(badge.id, isEarned)}
                    className={`px-3 py-1 text-[9px] font-mono uppercase border transition-all
                        ${isEarned 
                            ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:border-white'}
                    `}
                >
                    {isProcessing ? "SYNCING..." : isEarned ? "REVOKE" : "BESTOW"}
                </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}