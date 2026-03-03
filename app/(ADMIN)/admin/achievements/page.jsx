"use client";
import { useState, useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import AchievementCardPreview from "./_components/AchievementCardPreview";
import AchievementEditorModal from "./_components/AchievementEditorModal"; // We will build this next

export default function AchievementsPage() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);

  // Fetch Existing Badges
  const fetchBadges = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("achievement_types")
      .select("*")
      .order("created_at", { ascending: false });
    setBadges(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleEdit = (badge) => {
    setEditingBadge(badge);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingBadge(null);
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Achievement Forge</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase">
            SYSTEM_GAMIFICATION_LAYER // TOTAL_ASSETS: {badges.length}
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-red-600 hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase h-10 px-6"
        >
          <Plus size={14} className="mr-2" /> Design New Badge
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-red-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              onClick={() => handleEdit(badge)}
              className="cursor-pointer hover:bg-white/5 p-4 rounded-xl transition-colors border border-transparent hover:border-white/5"
            >
              <AchievementCardPreview badge={badge} />
            </div>
          ))}
          
          {/* Empty State / Add New Placeholder */}
          <div 
            onClick={handleCreate}
            className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-xl hover:border-red-600/50 hover:bg-red-600/5 transition-all cursor-pointer group"
          >
            <Plus size={32} className="text-white/20 group-hover:text-red-500 transition-colors" />
            <span className="mt-2 text-xs font-mono text-white/30 group-hover:text-red-400 uppercase tracking-widest">
              Add_Entry
            </span>
          </div>
        </div>
      )}

      {/* The Editor Modal */}
      <AchievementEditorModal 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        badge={editingBadge}
        onSuccess={fetchBadges}
      />

    </div>
  );
}