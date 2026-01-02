"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { motion, AnimatePresence } from "framer-motion"; 
import { MessageSquare, Radio, ArrowRight, Lock, UserPlus, Info, ShieldAlert } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("main"); 
  const [linkedGroupId, setLinkedGroupId] = useState(null);
  
  // Roles & Permissions
  const [role, setRole] = useState('member'); 
  const [status, setStatus] = useState('active'); 
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  // Interactive State
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [messageToReply, setMessageToReply] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isChannelLive, setIsChannelLive] = useState(initialData?.is_live || false);

  const scrollRef = useRef(null);

  // --- 1. VIRTUAL VS REAL LOGIC ---
  const isVirtual = typeof convId === 'object' && convId?.isVirtual;
  const actualConvId = isVirtual ? null : convId;
  const currentViewId = activeTab === "discussion" && linkedGroupId ? linkedGroupId : actualConvId;

  // Sync Data
  useEffect(() => {
    if (isVirtual) {
        setConversation(convId);
        setMessages([]);
        setStatus('pending');
        setRole('member');
    } else {
        setConversation(initialData);
        if(initialData?.linked_group_id || initialData?.linkedGroupId) {
            setLinkedGroupId(initialData.linked_group_id || initialData.linkedGroupId);
        }
        if (initialData?.is_live !== undefined) {
            setIsChannelLive(initialData.is_live);
        }
    }
  }, [convId, initialData, isVirtual]);

  // Fetch Links
  useEffect(() => {
    if (conversation?.type === 'channel' && !linkedGroupId && actualConvId) {
        const fetchLink = async () => {
            const { data } = await supabase.from('conversations').select('linked_group_id').eq('id', actualConvId).single();
            if (data?.linked_group_id) setLinkedGroupId(data.linked_group_id);
        };
        fetchLink();
    }
  }, [actualConvId, conversation?.type, linkedGroupId]);

  // --- 2. DATA FETCHING & REALTIME ---
  useEffect(() => {
    if (!currentViewId || !user) return;

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentViewId)
            .order('created_at', { ascending: true })
            .limit(100);
        setMessages(data || []);
    };

    const fetchParticipantDetails = async () => {
        const { data } = await supabase
            .from('conversation_participants')
            .select('role, status')
            .eq('conversation_id', currentViewId)
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (data) {
            setRole(data.role || 'member');
            setStatus(data.status || 'active');
        }
    };

    const fetchLatestPin = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentViewId)
            .contains('metadata', { is_pinned: true })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        setPinnedMsg(data);
    };

    fetchMessages();
    fetchParticipantDetails();
    fetchLatestPin();

    const channel = supabase.channel(`chat-room-${currentViewId}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${currentViewId}` 
      }, (payload) => {
          setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
          });
          setIsOtherTyping(false);
      })
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${currentViewId}` 
      }, async (payload) => {
          setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
          if (payload.new.metadata?.is_pinned) setPinnedMsg(payload.new);
          else if (pinnedMsg?.id === payload.new.id) fetchLatestPin();
      })
      .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'messages'
          // Filter removed for DELETE to ensure it hits regardless of WAL identity
      }, (payload) => {
          // Manually check the ID in the payload
          setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
          if (pinnedMsg?.id === payload.old.id) fetchLatestPin();
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.userId !== user.id) setIsOtherTyping(payload.isTyping);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentViewId, user.id, pinnedMsg?.id]); 

  // Live status listener
  useEffect(() => {
    if (!actualConvId || conversation?.type !== 'channel') return;

    const channel = supabase.channel(`live-status-${actualConvId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${actualConvId}` }, (payload) => {
            setIsChannelLive(payload.new.is_live);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [actualConvId, conversation?.type]);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOtherTyping, activeTab]);

  // --- 3. HANDLERS ---
  const handleSend = async (content, type = 'text', metadata = {}) => {
    try {
      let targetConvId = actualConvId;

      // HANDSHAKE INITIALIZATION
      if (isVirtual) {
          const { data: newConv, error: convErr } = await supabase
            .from('conversations')
            .insert({ type: 'direct', owner_id: user.id })
            .select().single();
          
          if (convErr) throw convErr;

          await supabase.from('conversation_participants').insert([
            { conversation_id: newConv.id, user_id: user.id, status: 'active' },
            { conversation_id: newConv.id, user_id: conversation.targetId, status: 'pending' }
          ]);

          targetConvId = newConv.id;
      }

      const { error } = await supabase.from('messages').insert({
          conversation_id: targetConvId,
          sender_id: user.id,
          text: content || "",
          type: type,
          metadata: metadata
        });
      if (error) throw error;
      
      await supabase.from('conversations')
        .update({ last_message: type.includes('image') ? '📷 Image' : content, last_message_at: new Date().toISOString() })
        .eq('id', targetConvId);

      if (isVirtual) {
          window.location.href = `/chat?id=${targetConvId}`;
      }
        
    } catch (err) {
      toast.error("Transmission Failed");
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
        toast.success("Connection Established");
    } catch (error) {
        toast.error("Handshake Failed");
    }
  };

  // --- DERIVED CONSTANTS ---
  const isChannel = conversation?.type === 'channel';
  const isDiscussion = activeTab === 'discussion';
  const isOwner = (conversation?.owner_id === user?.id) || (conversation?.ownerId === user?.id);
  const isJoined = status === 'active';
  const canType = isDiscussion ? isJoined : (isChannel ? isOwner : isJoined);
  
  const hasSentOneShot = conversation?.type === 'direct' && status === 'pending' && messages.some(m => m.sender_id === user?.id);

  const displayedMessages = messages.filter(msg => {
    if (!searchFilter) return true;
    return msg.text?.toLowerCase().includes(searchFilter.toLowerCase());
  });


  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* 1. HEADER */}
      {conversation && <ChatHeader conversation={conversation} onBack={onBack} currentUser={user?.id} onSearch={setSearchFilter} />}

      {/* 2. RECEIVER REQUEST BANNER */}
      {!isVirtual && conversation?.type === 'direct' && status === 'pending' && !hasSentOneShot && (
          <RequestBanner 
            conversationId={actualConvId} 
            userId={user?.id} 
            senderId={conversation.ownerId || conversation.owner_id}
            onActionComplete={() => window.location.reload()} 
          />
      )}

      {/* 3. LIVE BANNER */}
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
                className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-sm font-mono uppercase transition-colors"
                onClick={() => document.querySelector('button[title="Join Live Stream"]')?.click()}
            >
                Join Stream ↗
            </button>
        </div>
      )}

      {/* 4. CHANNEL TOGGLE */}
      {isChannel && linkedGroupId && (
        <div className="flex items-center border-b border-border bg-secondary/5 shrink-0">
            <button onClick={() => setActiveTab("main")} className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === "main" ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted-foreground hover:bg-secondary/10"}`}><Radio size={14} /> Broadcast</button>
            <button onClick={() => setActiveTab("discussion")} className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === "discussion" ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted-foreground hover:bg-secondary/10"}`}><MessageSquare size={14} /> Discussion</button>
        </div>
      )}

      {pinnedMsg && <ChatPinnedMessage message={pinnedMsg} isAdmin={isOwner} onUnpin={() => setPinnedMsg(null)} />}

      {/* 5. MESSAGES AREA */}
      <div className="flex-1 min-h-0 w-full overflow-hidden bg-background relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div 
          ref={scrollRef} 
          className="h-full w-full overflow-y-auto overflow-x-hidden px-4 py-4 custom-scrollbar scroll-smooth relative z-10"
        >
            <div className="max-w-full">
                {hasSentOneShot ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6 animate-in fade-in zoom-in-95">
                        <div className="w-16 h-16 bg-secondary/20 border border-dashed border-border flex items-center justify-center mb-4">
                            <ShieldAlert className="text-accent opacity-50" size={32} />
                        </div>
                        <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground mb-2 text-wrap">Handshake_Pending</h3>
                        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed max-w-[240px]">
                            Signal transmitted. Uplink is restricted until the recipient acknowledges the handshake.
                        </p>
                    </div>
                ) : (
                    <>
                    {displayedMessages.map((msg) => (
                        <div key={msg.id} className="w-full mb-1">
                          <MessageBubble 
                            message={msg} 
                            isMe={msg.sender_id === user?.id} 
                            role={role} 
                            chatId={currentViewId} 
                            currentUserId={user?.id} 
                            onEdit={() => setMessageToEdit(msg)} 
                            onReply={setMessageToReply} 
                          />
                        </div>
                    ))}
                    {isOtherTyping && (
                        <div className="flex justify-start mb-4 animate-in fade-in">
                            <div className="bg-secondary/20 border border-border p-2 font-mono text-[9px] text-accent uppercase tracking-widest flex items-center gap-2 rounded-md">
                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" /> Transmitting...
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
      </div>

      {/* 6. FOOTER AREA */}
      <div className="shrink-0 relative z-20 bg-background border-t border-border w-full">
          {hasSentOneShot ? null : canType ? (
              <ChatInput 
                onSend={handleSend} 
                convId={currentViewId} 
                editMessage={messageToEdit} 
                onCancelEdit={() => setMessageToEdit(null)} 
                replyMessage={messageToReply} 
                onCancelReply={() => setMessageToReply(null)} 
              />
          ) : (
              <div className="p-4 bg-secondary/5 flex items-center justify-center w-full">
                  {!isJoined ? (
                      <Button onClick={handleJoin} className="bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest px-8 w-full sm:w-auto">Join Node</Button>
                  ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center text-center">
                          <span className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2"><Lock size={12} /> Read-Only Frequency</span>
                          {linkedGroupId && activeTab === 'main' && (
                              <Button onClick={() => setActiveTab("discussion")} variant="outline" className="h-8 rounded-none border-accent/50 text-accent hover:bg-accent hover:text-white font-mono text-[10px] uppercase w-full sm:w-auto">Go to Discussion ↗</Button>
                          )}
                      </div>
                  )}
              </div>
          )}
      </div>

    </div>
  );
}