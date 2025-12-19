"use client";
import { Send, Paperclip, Smile } from "lucide-react";
import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="p-4 bg-background border-t border-border">
      <div className="relative flex items-end gap-2 bg-secondary/5 border border-border focus-within:border-accent/50 transition-colors p-2">
        
        {/* Attach Button */}
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip size={20} />
        </button>

        {/* Text Area (Auto-growing style) */}
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-sans placeholder:text-muted-foreground/50 resize-none max-h-32 min-h-[40px] py-2"
            rows={1}
        />

        {/* Emoji & Send */}
        <div className="flex items-center gap-1">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                <Smile size={20} />
            </button>
            <button 
                onClick={handleSend}
                className={`p-2 transition-all duration-200 ${text.trim() ? 'text-accent rotate-0 scale-100' : 'text-muted-foreground/50 -rotate-45 scale-90'}`}
            >
                <Send size={20} fill={text.trim() ? "currentColor" : "none"} />
            </button>
        </div>
      </div>
      
      {/* Footer Hint */}
      <div className="hidden md:flex justify-between items-center mt-2 px-1">
        <span className="text-[10px] font-mono text-muted-foreground">Markdown supported</span>
        <span className="text-[10px] font-mono text-muted-foreground">Press Enter to send</span>
      </div>
    </div>
  );
}