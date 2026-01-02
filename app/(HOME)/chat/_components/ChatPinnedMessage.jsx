"use client";
import { Pin, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { toast } from "sonner";

export default function ChatPinnedMessage({ message, isAdmin, onUnpin }) {
  const [loading, setLoading] = useState(false);

  if (!message) return null;

  const handleUnpin = async (e) => {
    e.stopPropagation(); // Prevent scroll trigger
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('toggle_message_pin', { 
        p_message_id: message.id, 
        p_is_pinned: false 
      });
      
      if (error) throw error;
      
      // Notify parent to remove instantly
      if (onUnpin) onUnpin(); 
      toast.success("Message Unpinned");
    } catch (err) {
      console.error(err);
      toast.error("Failed to unpin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary/10 border-b border-border p-2 px-4 flex items-center justify-between text-xs backdrop-blur-sm sticky top-[64px] z-20 animate-in slide-in-from-top-2">
      <div 
        className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1" 
        onClick={() => document.getElementById(`msg-${message.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
      >
        <div className="w-0.5 h-8 bg-accent rounded-full shrink-0" /> {/* Telegram-style bar */}
        <div className="flex flex-col truncate">
            <span className="font-bold text-accent text-[10px] uppercase">Pinned Message</span>
            <span className="truncate opacity-80 font-mono text-foreground/80">
                {message.type === 'image' ? '📷 Image Attachment' : message.text}
            </span>
        </div>
      </div>
      
      {isAdmin && (
        <button 
            onClick={handleUnpin} 
            disabled={loading}
            className="p-2 hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-full"
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <X size={14} />}
        </button>
      )}
    </div>
  );
}