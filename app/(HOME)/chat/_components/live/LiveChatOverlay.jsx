"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Send, Heart } from "lucide-react";
import { toast } from "sonner";

export default function LiveChatOverlay({ channelId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  // 1. Subscribe to Realtime Messages
  useEffect(() => {
    // Fetch last few messages for context
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profile:sender_id(username, avatar_url)')
        .eq('conversation_id', channelId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setMessages(data.reverse());
    };
    fetchRecent();

    const channel = supabase.channel(`live-chat-${channelId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${channelId}` 
      }, async (payload) => {
        // Fetch sender profile for the new message
        const { data: userData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.sender_id)
            .single();

        const newMsg = {
            ...payload.new,
            profile: userData
        };

        setMessages((prev) => [...prev.slice(-19), newMsg]); // Keep last 20
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText(""); // Optimistic clear

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: channelId,
          sender_id: user.id,
          text: textToSend,
          type: 'text' // We treat live comments as standard messages
        });

      if (error) throw error;
    } catch (err) {
      console.error(err);
      toast.error("Failed to send");
    }
  };

  return (
    <div className="flex flex-col h-full justify-end">
      
      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 p-4 mask-image-gradient scrollbar-hide mb-2"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%)' }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            <p className="text-sm text-white/90 drop-shadow-md leading-relaxed break-words">
              <span className={`font-bold mr-2 ${msg.sender_id === user.id ? 'text-accent' : 'text-blue-400'}`}>
                @{msg.profile?.username || "user"}:
              </span>
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      {/* Transparent Input */}
      <form onSubmit={handleSend} className="flex gap-2 items-center p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 mx-4 mb-4">
        <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50 px-2"
        />
        <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="p-1.5 bg-white/10 hover:bg-accent rounded-full transition-colors disabled:opacity-50"
        >
            <Send size={14} className="text-white" />
        </button>
      </form>
    </div>
  );
}