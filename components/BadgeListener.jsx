"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import CelebrationModal from "./CelebrationModal";
import { useAuth } from "@/app/_context/AuthContext";

export default function BadgeListener() {
  const { user } = useAuth();
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    if (!user) return;

    const checkBadges = async () => {
      // Fetch ALL unseen badges for this user
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement_types(*)')
        .eq('user_id', user.id)
        .eq('seen', false);

      if (data && data.length > 0) {
        // Extract the actual badge definitions
        const badgesToReveal = data.map(d => d.achievement_types);
        setNewBadges(badgesToReveal);
        
        // Immediately mark ALL as seen so they don't trigger again on reload
        const idsToUpdate = data.map(d => d.id);
        await supabase
            .from('user_achievements')
            .update({ seen: true })
            .in('id', idsToUpdate);
      }
    };

    // Check immediately on mount
    checkBadges();

    // Subscribe to realtime INSERTs (in case they earn one while actively browsing)
    const channel = supabase
      .channel('badge_awards')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_achievements',
        filter: `user_id=eq.${user.id}`
      }, () => {
         checkBadges();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel) };

  }, [user]);

  const handleClose = () => {
      setNewBadges([]);
  };

  return (
    <CelebrationModal 
        badges={newBadges} 
        isOpen={newBadges.length > 0} 
        onClose={handleClose}
        user={user} // Passed down to generate the exact Profile URL for sharing
    />
  );
}