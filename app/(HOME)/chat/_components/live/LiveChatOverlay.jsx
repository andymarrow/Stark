"use client";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

export default function LiveChatOverlay({ messages, onSendMessage }) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full justify-end">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 p-4 mask-image-gradient scrollbar-hide mb-2"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%)' }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            <p className="text-sm text-white/90 drop-shadow-md leading-relaxed break-words shadow-black">
              <span className="font-bold mr-2 text-accent text-xs uppercase">
                {msg.username}:
              </span>
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-center p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 mx-4 mb-4">
        <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50 px-2"
        />
        <button type="submit" disabled={!inputText.trim()} className="p-1.5 bg-white/10 hover:bg-accent rounded-full transition-colors disabled:opacity-50">
            <Send size={14} className="text-white" />
        </button>
      </form>
    </div>
  );
}