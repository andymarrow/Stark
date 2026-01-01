"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import RequestBanner from "./RequestBanner";
import ChatPinnedMessage from "./ChatPinnedMessage"; 
import { toast } from "sonner";

export default function ChatWindow({ convId, onBack, initialData }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(initialData);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  // Phase 3 State: Roles & Pinning
  const [role, setRole] = useState('member'); // 'owner', 'admin', 'member'
  const [pinnedMsg, setPinnedMsg] = useState(null);

  // Interactive States (Edit & Reply)
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [messageToReply, setMessageToReply] = useState(null);

  const scrollRef = useRef(null);

  // Sync conversation data if prop changes (for title updates, etc.)
  useEffect(() => {
    setConversation(initialData);
  }, [initialData]);

  // --- MAIN DATA LOADING EFFECT ---
  useEffect(() => {
    if (!convId || !user) return;

    // 1. Fetch Messages
    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })
            .limit(100); // Increased limit for better context
        setMessages(data || []);
    };

    // 2. Fetch My Role (For Admin Powers)
    const fetchRole = async () => {
        const { data } = await supabase
            .from('conversation_participants')
            .select('role')
            .eq('conversation_id', convId)
            .eq('user_id', user.id)
            .single();
        if (data) setRole(data.role);
    };

    // 3. Fetch Active Pinned Message
    const fetchPinned = async () => {
        // We look for messages in this chat that have is_pinned: true in metadata
        // Note: Supabase JSONB filtering syntax
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .contains('metadata', { is_pinned: true })
            .order('created_at', { ascending: false }) // Get latest pin
            .limit(1)
            .maybeSingle();
        setPinnedMsg(data);
    };

    fetchMessages();
    fetchRole();
    fetchPinned();

    // --- REALTIME SUBSCRIPTION ---
    const channel = supabase.channel(`room-${convId}`)
      
      // A. Listen for New Messages
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${convId}` 
      }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setIsOtherTyping(false);
      })

      // B. Listen for Message Updates (Pins/Edits/Reactions)
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${convId}` 
      }, (payload) => {
          // Update the message in the list
          setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
          
          // Check if this update changed the pinned status
          if (payload.new.metadata?.is_pinned) {
             setPinnedMsg(payload.new);
          } else if (pinnedMsg?.id === payload.new.id && !payload.new.metadata?.is_pinned) {
             setPinnedMsg(null); // Unpinned
          }
      })

      // C. Listen for Deletions (Admin Moderation)
      .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${convId}` 
      }, (payload) => {
          setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
          if (pinnedMsg?.id === payload.old.id) setPinnedMsg(null);
      })

      // D. Listen for Typing Indicators
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.userId !== user.id) setIsOtherTyping(payload.isTyping);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [convId, user.id, pinnedMsg?.id]);

  // Auto-Scroll Logic
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOtherTyping]);

  const handleSend = async (content, type = 'text', metadata = {}) => {
    // If we are editing, ChatInput handles the update logic internally or via a separate handler.
    // This function is purely for NEW messages.
    if (!content) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          text: content,
          type: type,
          metadata: metadata // Pass reply metadata if exists
        });

      if (error) throw error;

      // Update Conversation Last Message for the list view
      await supabase
        .from('conversations')
        .update({ last_message: type === 'image' ? '📷 Image' : content, last_message_at: new Date().toISOString() })
        .eq('id', convId);

    } catch (err) {
      console.error(err);
      toast.error("Transmission Error");
    }
  };

  // Determine Logic State
  const isRequest = conversation?.myStatus === 'pending'; 
  const isAdmin = role === 'owner' || role === 'admin';

  return (
    <div className="flex flex-col h-full bg-background relative">
      
      {/* 1. Header */}
      {conversation && <ChatHeader conversation={conversation} onBack={onBack} currentUser={user.id} />}

      {/* 2. Pinned Message (Sticky under header) */}
      {pinnedMsg && (
        <ChatPinnedMessage 
            message={pinnedMsg} 
            isAdmin={isAdmin} 
            onUnpin={() => setPinnedMsg(null)}
        />
      )}

      {/* 3. Request Banner (Only if I am pending/receiving) */}
      {isRequest && (
        <RequestBanner 
            conversationId={convId} 
            userId={user.id} 
            onActionComplete={(newStatus) => {
                if (newStatus === 'rejected') onBack(); 
                // If accepted, realtime subscription usually handles the status update,
                // but we might want to manually refresh conversation context here in a real app.
            }} 
        />
      )}

      {/* 4. Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <div className="relative z-10">
            {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg}
                  isMe={msg.sender_id === user.id} 
                  role={role} // Pass role for context menu
                  chatId={convId}
                  currentUserId={user.id} // Pass for reactions
                  onEdit={() => setMessageToEdit(msg)} // Hook up edit trigger
                  onReply={(m) => setMessageToReply(m)} // Hook up reply trigger
                />
            ))}
            
            {/* Animated Typing Indicator */}
            {isOtherTyping && (
                <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-left-2">
                    <div className="bg-secondary/20 border border-border p-3 font-mono text-[10px] text-accent uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                        Incoming_Stream...
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* 5. Input - Hidden if I am a "Request" receiver and haven't accepted yet */}
      {!isRequest && (
          <ChatInput 
            onSend={handleSend} 
            convId={convId} 
            
            // Edit Props
            editMessage={messageToEdit}
            onCancelEdit={() => setMessageToEdit(null)}
            
            // Reply Props
            replyMessage={messageToReply}
            onCancelReply={() => setMessageToReply(null)}
          />
      )}
    </div>
  );
}