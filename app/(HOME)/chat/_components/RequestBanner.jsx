"use client";
import { useState } from "react";
import { Check, X, ShieldBan, Loader2, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function RequestBanner({ conversationId, userId, senderId, onActionComplete }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'accept') {
        // --- 1. ACCEPT LOGIC ---
        const { error } = await supabase
          .from('conversation_participants')
          .update({ status: 'active' })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);
        
        if (error) throw error;
        
        toast.success("Handshake Accepted", { description: "Frequency secured. Full duplex enabled." });
        onActionComplete('active');

      } else if (action === 'reject') {
        // --- 2. REJECT LOGIC (The 3-Strikes System) ---
        
        // A. Fetch current strike count
        const { data: strikeData, error: fetchError } = await supabase
            .from('request_strikes')
            .select('strike_count')
            .eq('sender_id', senderId)
            .eq('receiver_id', userId)
            .maybeSingle();
        
        if (fetchError) console.error("Strike Fetch Error:", fetchError);

        const currentStrikes = strikeData?.strike_count || 0;
        const newCount = currentStrikes + 1;

        if (newCount >= 3) {
            // AUTO-BLOCK on 3rd rejection
            await supabase.rpc('block_user', { 
                p_blocker_id: userId, 
                p_blocked_id: senderId 
            });
            toast.error("Spam Protocol: User Blacklisted", { description: "Threshold reached. Connection purged." });
        } else {
            // Record the strike
            await supabase.from('request_strikes').upsert({
                sender_id: senderId,
                receiver_id: userId,
                strike_count: newCount
            });
            toast.info(`Signal Rejected`, { description: `Strike ${newCount}/3 recorded for this sender.` });
        }

        // B. Delete the specific conversation regardless of strike status
        // This removes it from the request tab instantly
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);
        
        onActionComplete('rejected');

      } else if (action === 'block') {
        // --- 3. EXPLICIT BLOCK LOGIC ---
        const { error } = await supabase.rpc('block_user', {
          p_blocker_id: userId,
          p_blocked_id: senderId
        });

        if (error) throw error;

        toast.success("User Blacklisted", { description: "Handshake terminated. Node hidden from search." });
        onActionComplete('blocked');
      }
    } catch (error) {
      console.error(error);
      toast.error("Protocol Error", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary/10 border-b border-accent/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 sticky top-[64px] z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 text-accent rounded-full animate-pulse border border-accent/20">
            <UserPlus size={20} />
        </div>
        <div>
            <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground">Incoming_Handshake</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-tight mt-0.5">
                Stranger attempting to establish connection. Acknowledge?
            </p>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <Button 
            onClick={() => handleAction('block')}
            disabled={loading}
            variant="ghost" 
            className="flex-1 sm:flex-none h-9 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-none text-[10px] font-mono uppercase tracking-widest transition-all"
        >
            <ShieldBan size={14} className="mr-1.5" /> Blacklist
        </Button>
        
        <Button 
            onClick={() => handleAction('reject')}
            disabled={loading}
            variant="outline" 
            className="flex-1 sm:flex-none h-9 border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-none text-[10px] font-mono uppercase tracking-widest transition-all"
        >
            <X size={14} className="mr-1.5" /> Reject
        </Button>

        <Button 
            onClick={() => handleAction('accept')}
            disabled={loading}
            className="flex-1 sm:flex-none h-9 bg-accent hover:bg-accent/90 text-white rounded-none text-[10px] font-mono uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} className="mr-1.5" /> Accept</>}
        </Button>
      </div>
    </div>
  );
}