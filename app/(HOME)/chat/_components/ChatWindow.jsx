"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { toast } from "sonner";

export default function ChatWindow({ convId, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const loadChatData = async () => {
      // 1. Fetch other participant info
      const { data: partData } = await supabase
        .from('conversation_participants')
        .select('profiles(*)')
        .eq('conversation_id', convId)
        .not('user_id', 'eq', user.id)
        .single();
      
      setOtherUser(partData?.profiles);

      // 2. Fetch last 50 messages
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(50);
      
      setMessages(msgData || []);
    };

    if (convId) loadChatData();

    // 3. REALTIME MESSAGE & TYPING LISTENER
    const channel = supabase.channel(`room-${convId}`)
      
      // Listen for messages
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${convId}` 
      }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setIsOtherTyping(false); // Stop typing visual when message arrives
      })

      // Listen for "Typing" Broadcasts
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.userId !== user.id) {
              setIsOtherTyping(payload.isTyping);
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [convId, user.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOtherTyping]);

  const handleSend = async (text) => {
    try {
      const { error: msgErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          text: text
        });
      if (msgErr) throw msgErr;

      await supabase
        .from('conversations')
        .update({ last_message: text, last_message_at: new Date().toISOString() })
        .eq('id', convId);

    } catch (err) {
      toast.error("Transmission Error");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {otherUser && <ChatHeader user={{
          name: otherUser.full_name || otherUser.username,
          avatar: otherUser.avatar_url,
          online: true,
          typing: isOtherTyping // Passing typing state to header
      }} onBack={onBack} />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <div className="relative z-10">
            {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={{
                      text: msg.text,
                      time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      read: msg.is_read
                  }} 
                  isMe={msg.sender_id === user.id} 
                />
            ))}
            
            {/* Animated Typing Indicator */}
            {isOtherTyping && (
                <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-left-2">
                    <div className="bg-secondary/20 border border-border p-3 font-mono text-[10px] text-accent uppercase tracking-widest">
                        Data_Stream_Incoming...
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Passing convId for broadcast logic */}
      <ChatInput onSend={handleSend} convId={convId} />
    </div>
  );
}