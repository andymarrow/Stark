"use client";
import { useState } from "react";
import { Check, X, ShieldBan, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function RequestBanner({ conversationId, userId, onActionComplete }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'accept') {
        // 1. Update status to 'active'
        await supabase
          .from('conversation_participants')
          .update({ status: 'active' })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);
        
        toast.success("Connection Established");
        onActionComplete('active');

      } else if (action === 'reject') {
        // 2. Delete the conversation (or mark rejected if we want history)
        // Per your spec: "Chat will be deleted"
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);
        
        toast.info("Request Rejected");
        onActionComplete('rejected'); // Will likely unmount component

      } else if (action === 'block') {
        // 3. Add to blocked_users table
        // We need to find the OTHER user ID first. This component assumes parent passed it or we fetch it.
        // Ideally, parent passes the senderId. Assuming this for now:
        // For Block, we usually need the sender's ID. 
        // NOTE: In a real implementation, you'd pass senderId prop to this component.
        toast.error("Blocking requires sender ID (Pending Implementation)");
      }
    } catch (error) {
      toast.error("Action Failed", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background border-b border-accent/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 text-accent rounded-full animate-pulse">
            <ShieldBan size={20} />
        </div>
        <div>
            <h4 className="text-sm font-bold font-mono uppercase tracking-wide">Message Request</h4>
            <p className="text-xs text-muted-foreground">
                This user is not in your network. Do you want to connect?
            </p>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <Button 
            onClick={() => handleAction('reject')}
            disabled={loading}
            variant="outline" 
            className="flex-1 sm:flex-none h-9 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-500 rounded-none text-xs font-mono uppercase"
        >
            <X size={14} className="mr-2" /> Reject
        </Button>
        <Button 
            onClick={() => handleAction('accept')}
            disabled={loading}
            className="flex-1 sm:flex-none h-9 bg-accent hover:bg-accent/90 text-white rounded-none text-xs font-mono uppercase"
        >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} className="mr-2" /> Accept</>}
        </Button>
      </div>
    </div>
  );
}