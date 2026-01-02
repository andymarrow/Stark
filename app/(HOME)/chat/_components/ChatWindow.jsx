"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { motion, AnimatePresence } from "framer-motion"; 
import { MessageSquare, Radio, ArrowRight, Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Components
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import RequestBanner from "./RequestBanner";
import ChatPinnedMessage from "./ChatPinnedMessage"; 

export default function ChatWindow({ convId, onBack, initialData }) {
  const { user } = useAuth();
  
  // --- STATE ---
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(initialData);
  const [activeTab, setActiveTab] = useState("main"); // 'main' (Channel) | 'discussion' (Group)
  const [linkedGroupId, setLinkedGroupId] = useState(null);
  
  // Roles & Permissions
  const [role, setRole] = useState('member'); 
  const [status, setStatus] = useState('active'); // 'active', 'pending' (invited), or null (not joined)
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  // Interactive State
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [messageToReply, setMessageToReply] = useState(null);

  const [searchFilter, setSearchFilter] = useState("");

  // Live Status State
  const [isChannelLive, setIsChannelLive] = useState(initialData?.is_live || false);

  const scrollRef = useRef(null);

  // --- 1. INITIAL SETUP & MODE SWITCHING ---
  
  // Determine which ID we are currently looking at
  const currentViewId = activeTab === "discussion" && linkedGroupId ? linkedGroupId : convId;

  // Sync initial data
  useEffect(() => {
    setConversation(initialData);
    if(initialData?.linked_group_id || initialData?.linkedGroupId) {
        setLinkedGroupId(initialData.linked_group_id || initialData.linkedGroupId);
    }
    // Sync live status
    if (initialData?.is_live !== undefined) {
        setIsChannelLive(initialData.is_live);
    }
  }, [initialData]);

  // Fetch Linked Group ID if not present (in case initialData is shallow)
  useEffect(() => {
    if (conversation?.type === 'channel' && !linkedGroupId) {
        const fetchLink = async () => {
            const { data } = await supabase.from('conversations').select('linked_group_id').eq('id', convId).single();
            if (data?.linked_group_id) setLinkedGroupId(data.linked_group_id);
        };
        fetchLink();
    }
  }, [convId, conversation?.type]);

  // --- 2. DATA FETCHING (Triggered when ID changes) ---
  useEffect(() => {
    if (!currentViewId || !user) return;

    // A. Fetch Messages for Current View
    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentViewId)
            .order('created_at', { ascending: true })
            .limit(100);
        setMessages(data || []);
    };

    // B. Fetch My Role & Status in Current View
    const fetchParticipantDetails = async () => {
        const { data } = await supabase
            .from('conversation_participants')
            .select('role, status')
            .eq('conversation_id', currentViewId)
            .eq('user_id', user.id)
            .maybeSingle();
        
        setRole(data?.role || 'member');
        setStatus(data?.status || null); // null means not joined
    };

    // C. Fetch Latest Pinned Message Helper
    const fetchLatestPin = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentViewId)
            .contains('metadata', { is_pinned: true })
            .order('created_at', { ascending: false }) // Get latest pin
            .limit(1)
            .maybeSingle();
        setPinnedMsg(data);
    };

    fetchMessages();
    fetchParticipantDetails();
    fetchLatestPin();

    // --- REALTIME SUBSCRIPTION (FIXED) ---
    // Use a unique channel name per view ID to avoid collisions
    const channel = supabase.channel(`chat-room-${currentViewId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentViewId}` }, (payload) => {
          // Check if message already exists to be extra safe
          setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
          });
          setIsOtherTyping(false);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentViewId}` }, async (payload) => {
          setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
          
          // PINNING LOGIC FIX
          const isNowPinned = payload.new.metadata?.is_pinned;
          const wasPinnedVisible = pinnedMsg?.id === payload.new.id;

          if (isNowPinned) {
             setPinnedMsg(payload.new); // If pinned, show immediately
          } else if (wasPinnedVisible && !isNowPinned) {
             await fetchLatestPin(); // If unpinned, fetch the NEXT one in stack
          }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentViewId}` }, async (payload) => {
          setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
          // If the pinned message was deleted, fetch next pin
          if (pinnedMsg?.id === payload.old.id) await fetchLatestPin();
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.userId !== user.id) setIsOtherTyping(payload.isTyping);
      })
      .subscribe();

    // CLEANUP FUNCTION: Very important to remove channel when unmounting or switching tabs
    return () => { 
        supabase.removeChannel(channel); 
    };
  }, [currentViewId, user.id]); 

  // --- LIVE STATUS LISTENER ---
  useEffect(() => {
    if (!convId || conversation?.type !== 'channel') return;

    const channel = supabase.channel(`live-status-${convId}`)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'conversations', 
            filter: `id=eq.${convId}` 
        }, (payload) => {
            setIsChannelLive(payload.new.is_live);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [convId, conversation?.type]);

  // Auto-Scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOtherTyping, activeTab]);

  // --- HANDLERS ---

  const handleSend = async (content, type = 'text', metadata = {}) => {
    if (!content && type === 'text') return; // Allow empty content if it's an image
    
    try {
      const { error } = await supabase.from('messages').insert({
          conversation_id: currentViewId,
          sender_id: user.id,
          text: content || "", // Handle empty text for image-only messages
          type: type,
          metadata: metadata
        });
      if (error) throw error;
      
      // Update Main Conversation Last Message
      const lastMsgText = type.includes('image') ? '📷 Image' : content;
      
      await supabase.from('conversations')
        .update({ last_message: lastMsgText, last_message_at: new Date().toISOString() })
        .eq('id', convId); 
        
    } catch (err) {
      toast.error("Transmission Error");
    }
  };

  const handleJoin = async () => {
    try {
        await supabase.from('conversation_participants').insert({
            conversation_id: currentViewId,
            user_id: user.id,
            status: 'active',
            role: 'member'
        });
        setStatus('active');
        toast.success("Joined Successfully");
    } catch (error) {
        toast.error("Join Failed");
    }
  };

  // --- LOGIC CORRECTION ---
  const isChannel = conversation?.type === 'channel';
  const isDiscussion = activeTab === 'discussion';
  
  const isOwner = (conversation?.owner_id === user.id) || (conversation?.ownerId === user.id);
  const isJoined = status === 'active';
  
  // Logic: 
  // 1. Discussion? Anyone joined can type.
  // 2. Main Channel? ONLY Owner can type.
  const canType = isDiscussion ? isJoined : (isChannel ? isOwner : isJoined);

  // Filter messages logic
  const displayedMessages = messages.filter(msg => {
    if (!searchFilter) return true;
    return msg.text?.toLowerCase().includes(searchFilter.toLowerCase());
  });


  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* 1. HEADER */}
      {conversation && <ChatHeader conversation={conversation} onBack={onBack} currentUser={user.id}  onSearch={setSearchFilter} />}

      {/* 2. LIVE BANNER (New Addition) */}
      {isChannelLive && !isOwner && (
        <div className="bg-red-600/10 border-b border-red-500/30 p-2 px-4 flex items-center justify-between animate-in slide-in-from-top-2 backdrop-blur-sm sticky top-[64px] z-30">
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live Transmission in Progress</span>
            </div>
            <button 
                // In a real implementation, you might want to call a method in ChatHeader to open the modal directly,
                // but since ChatHeader controls the state, telling the user to click the header icon is a safe fallback without prop drilling.
                className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-sm font-mono uppercase transition-colors"
                onClick={() => document.querySelector('button[title="Join Live Stream"]')?.click()}
            >
                Join Stream ↗
            </button>
        </div>
      )}

      {/* 3. CHANNEL TOGGLE BAR */}
      {isChannel && linkedGroupId && (
        <div className="flex items-center border-b border-border bg-secondary/5">
            <button 
                onClick={() => setActiveTab("main")}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
                    ${activeTab === "main" ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted-foreground hover:bg-secondary/10"}
                `}
            >
                <Radio size={14} /> Broadcast
            </button>
            <button 
                onClick={() => setActiveTab("discussion")}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
                    ${activeTab === "discussion" ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted-foreground hover:bg-secondary/10"}
                `}
            >
                <MessageSquare size={14} /> Discussion
            </button>
        </div>
      )}

      {/* 4. PINNED MESSAGE */}
      {pinnedMsg && (
        <ChatPinnedMessage 
            message={pinnedMsg} 
            isAdmin={isOwner} 
            onUnpin={() => {
                // Optimistic clear to make UI snappy, Realtime effect will handle data integrity
                setPinnedMsg(null); 
            }} 
        />
      )}

      {/* 5. MESSAGES AREA */}
      <div className="flex-1 relative overflow-hidden bg-background">
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={activeTab}
                initial={{ x: activeTab === 'discussion' ? 300 : -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: activeTab === 'discussion' ? -300 : 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col"
            >
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    
                    <div className="relative z-10 pb-4">
                        {displayedMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground mt-20 opacity-50">
                                <span className="text-xs font-mono uppercase tracking-widest">
                                    {searchFilter ? "No matches found" : (isChannel && !isDiscussion ? "Start Broadcasting..." : "Start the discussion...")}
                                </span>
                            </div>
                        ) : (
                            displayedMessages.map((msg) => (
                                <MessageBubble 
                                    key={msg.id} 
                                    message={msg}
                                    isMe={msg.sender_id === user.id} 
                                    role={role} 
                                    chatId={currentViewId}
                                    currentUserId={user.id}
                                    onEdit={() => setMessageToEdit(msg)} 
                                    onReply={(m) => setMessageToReply(m)} 
                                />
                            ))
                        )}
                        
                        {isOtherTyping && (
                            <div className="flex justify-start mb-4 animate-in fade-in">
                                <div className="bg-secondary/20 border border-border p-2 font-mono text-[9px] text-accent uppercase tracking-widest flex items-center gap-2 rounded-md">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                                    Transmitting...
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
      </div>

      {/* 6. FOOTER AREA */}
      <div className="relative z-20 bg-background">
          {canType ? (
              <ChatInput 
                onSend={handleSend} 
                convId={currentViewId} 
                editMessage={messageToEdit}
                onCancelEdit={() => setMessageToEdit(null)}
                replyMessage={messageToReply}
                onCancelReply={() => setMessageToReply(null)}
              />
          ) : (
              <div className="p-4 border-t border-border bg-secondary/5 flex items-center justify-center">
                  {!isJoined ? (
                      <Button 
                        onClick={handleJoin}
                        className="bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest px-8"
                      >
                        <UserPlus size={14} className="mr-2" /> 
                        Join {isDiscussion ? "Discussion" : "Channel"}
                      </Button>
                  ) : (
                      // Only show Read-Only if it's main channel and I'm not owner
                      <div className="flex items-center gap-4 w-full justify-center">
                          <span className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2">
                              <Lock size={12} /> Read-Only Frequency
                          </span>
                          {linkedGroupId && activeTab === 'main' && (
                              <Button 
                                onClick={() => setActiveTab("discussion")}
                                variant="outline"
                                className="h-8 rounded-none border-accent/50 text-accent hover:bg-accent hover:text-white font-mono text-[10px] uppercase"
                              >
                                Go to Discussion <ArrowRight size={12} className="ml-2" />
                              </Button>
                          )}
                      </div>
                  )}
              </div>
          )}
      </div>

    </div>
  );
}