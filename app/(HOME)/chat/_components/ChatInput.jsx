"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Smile, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Button } from "@/components/ui/button";

// High-frequency creative emojis for our specific user base
const EMOJI_SET = ["💻", "🚀", "🔥", "✨", "🎨", "🛠️", "📦", "⚡", "💯", "✅", "❌", "❤️", "😂", "🤔", "🙌", "👋"];

export default function ChatInput({ onSend, convId }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);

  // --- TYPING BROADCAST LOGIC ---
  const broadcastTyping = (isTyping) => {
    if (!convId || !user) return;
    
    supabase.channel(`room-${convId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping },
    });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    // If start typing
    if (val.length > 0) {
      broadcastTyping(true);

      // Reset "Stop Typing" timer
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 2000); // 2 seconds of inactivity stops the status
    } else {
      broadcastTyping(false);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    
    // Stop typing status immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    broadcastTyping(false);

    onSend(text);
    setText("");
    setShowEmoji(false);
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
  };

  return (
    <div className="p-4 bg-background border-t border-border relative">
      
      {/* --- INDUSTRIAL EMOJI PICKER --- */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 z-50 bg-background border border-border p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-2 border-b border-border pb-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Select_Symbol</span>
                <button onClick={() => setShowEmoji(false)} className="text-muted-foreground hover:text-accent">
                    <X size={14} />
                </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {EMOJI_SET.map((emoji) => (
                    <button 
                        key={emoji} 
                        onClick={() => addEmoji(emoji)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary border border-transparent hover:border-border transition-all text-lg"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-background border-r border-b border-border rotate-45" />
        </div>
      )}

      {/* --- MAIN INPUT FIELD --- */}
      <div className="relative flex items-end gap-2 bg-secondary/5 border border-border focus-within:border-accent transition-colors p-2">
        
        {/* Attach Button */}
        <button className="p-2 text-zinc-500 hover:text-foreground transition-colors group">
            <Paperclip size={20} className="group-hover:rotate-12 transition-transform" />
        </button>

        {/* Text Area */}
        <textarea
            value={text}
            onChange={handleInputChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder="TYPE_MESSAGE_INPUT..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-mono placeholder:text-zinc-700 resize-none max-h-32 min-h-[40px] py-2 custom-scrollbar"
            rows={1}
        />

        {/* Emoji & Send Container */}
        <div className="flex items-center gap-1">
            <button 
                onClick={() => setShowEmoji(!showEmoji)}
                className={`p-2 transition-colors ${showEmoji ? 'text-accent' : 'text-zinc-500 hover:text-foreground'}`}
            >
                <Smile size={20} />
            </button>
            
            <button 
                onClick={handleSend}
                disabled={!text.trim()}
                className={`p-2 transition-all duration-300 
                    ${text.trim() 
                        ? 'text-accent translate-x-0 opacity-100' 
                        : 'text-zinc-800 translate-x-2 opacity-30 pointer-events-none'
                    }`}
            >
                <Send size={20} fill={text.trim() ? "currentColor" : "none"} />
            </button>
        </div>
      </div>
      
      {/* Footer Hints */}
      <div className="hidden md:flex justify-between items-center mt-2 px-1">
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            Handshake: <span className="text-green-600">Encrypted</span>
        </span>
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            [Shift + Enter] for New_Line
        </span>
      </div>
    </div>
  );
}