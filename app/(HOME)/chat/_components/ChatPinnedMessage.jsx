"use client";
import { Pin, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatPinnedMessage({ message, isAdmin, onUnpin }) {
  if (!message) return null;

  const handleUnpin = async () => {
    if (!isAdmin) return;
    try {
      await supabase.rpc('toggle_message_pin', { 
        p_message_id: message.id, 
        p_is_pinned: false 
      });
      if (onUnpin) onUnpin();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-secondary/10 border-b border-border p-2 px-4 flex items-center justify-between text-xs backdrop-blur-sm sticky top-[64px] z-20">
      <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => document.getElementById(`msg-${message.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
        <Pin size={12} className="text-accent shrink-0" />
        <div className="flex flex-col truncate">
            <span className="font-bold text-accent text-[10px] uppercase">Pinned Message</span>
            <span className="truncate opacity-80 font-mono">{message.text}</span>
        </div>
      </div>
      
      {isAdmin && (
        <button onClick={handleUnpin} className="p-1 hover:text-red-500 transition-colors">
            <X size={12} />
        </button>
      )}
    </div>
  );
}