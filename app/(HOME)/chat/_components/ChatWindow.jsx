"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { motion, AnimatePresence } from "framer-motion"; 
import { MessageSquare, Radio, ArrowRight, Lock, UserPlus, Info, ShieldAlert, Loader2 } from "lucide-react";
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
  const [myStatus, setMyStatus] = useState(null); // Null initially to detect "not joined"
  const [otherStatus, setOtherStatus] = useState('active'); 
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  // Interactive State
  const [loading, setLoading] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [messageToReply, setMessageToReply] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isChannelLive, setIsChannelLive] = useState(initialData?.is_live || false);

  const scrollRef = useRef(null);

  // --- 1. VIRTUAL VS REAL VS DEEP LINK LOGIC ---
  const isVirtual = typeof convId === 'object' && convId?.isVirtual;
  const actualConvId = isVirtual ? null : convId;
  const currentViewId = activeTab === "discussion" && linkedGroupId ? linkedGroupId : actualConvId;

  // Sync / Fetch Conversation Metadata
  useEffect(() => {
    if (isVirtual) {
        setConversation(convId);
        setMessages([]);
        setMyStatus('active');
        setOtherStatus('pending');
        setRole('member');
    } else if (initialData) {
        setConversation(initialData);
        if(initialData?.linked_group_id || initialData?.linkedGroupId) {
            setLinkedGroupId(initialData.linked_group_id || initialData.linkedGroupId);
        }
        if (initialData?.is_live !== undefined) {
            setIsChannelLive(initialData.is_live);
        }
    } else if (actualConvId) {
        // --- DEEP LINK HANDLER ---
        // If user joins via URL, we need to fetch what this node actually is
        const fetchDeepLinkMeta = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', actualConvId)
                .single();
            
            if (data) {
                setConversation(data);
                setIsChannelLive(data.is_live);
            } else {
                toast.error("Node not found", { description: "The uplink signal is invalid." });
            }
            setLoading(false);
        };
        fetchDeepLinkMeta();
    }
  }, [convId, initialData, isVirtual, actualConvId]);

  // Fetch Linked Group ID for Channels
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
            .select('user_id, role, status')
            .eq('conversation_id', currentViewId);
        
        if (data && data.length > 0) {
            const me = data.find(p => p.user_id === user.id);
            const them = data.find(p => p.user_id !== user.id);
            
            if (me) {
                setRole(me.role || 'member');
                setMyStatus(me.status || 'active');
            } else {
                setMyStatus(null); // User is viewing but hasn't joined
            }
            if (them) {
                setOtherStatus(them.status || 'active');
            }
        } else {
            setMyStatus(null);
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentViewId}` }, (payload) => {
          setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
          });
          setIsOtherTyping(false);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentViewId}` }, async (payload) => {
          setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
          if (payload.new.metadata?.is_pinned) setPinnedMsg(payload.new);
          else if (pinnedMsg?.id === payload.new.id) fetchLatestPin();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
          // REALTIME DELETE (Requires REPLICA IDENTITY FULL on DB)
          setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
          if (pinnedMsg?.id === payload.old.id) fetchLatestPin();
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.userId !== user.id) setIsOtherTyping(payload.isTyping);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentViewId, user.id, pinnedMsg?.id]); 

  // Live Status Listener
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

      // Virtual to Real Handshake Trigger
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
            conversation_id: actualConvId,
            user_id: user.id,
            status: 'active',
            role: 'member'
        });
        setMyStatus('active');
        toast.success("Community Frequency Acquired");
    } catch (error) {
        toast.error("Join Failed");
    }
  };

  // --- DERIVED CONSTANTS & LOGIC ---
  const isChannel = conversation?.type === 'channel';
  const isDiscussion = activeTab === 'discussion';
  const isOwner = (conversation?.owner_id === user?.id) || (conversation?.ownerId === user?.id);
  
  const isJoined = myStatus === 'active';
  const canType = isDiscussion ? isJoined : (isChannel ? isOwner : isJoined);
  
  // Handshake Logic
  const isSenderWaiting = conversation?.type === 'direct' && myStatus === 'active' && otherStatus === 'pending' && messages.some(m => m.sender_id === user?.id);
  const isReceiver = conversation?.type === 'direct' && myStatus === 'pending';

  const displayedMessages = messages.filter(msg => {
    if (!searchFilter) return true;
    return msg.text?.toLowerCase().includes(searchFilter.toLowerCase());
  });

  if (loading) return <div className="flex-1 flex items-center justify-center bg-background"><Loader2 size={32} className="animate-spin text-accent" /></div>;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* 1. HEADER */}
      {conversation && <ChatHeader conversation={conversation} onBack={onBack} currentUser={user?.id} onSearch={setSearchFilter} />}

      {/* 2. RECEIVER REQUEST BANNER */}
      {isReceiver && !isVirtual && (
          <RequestBanner 
            conversationId={actualConvId} 
            userId={user?.id} 
            senderId={conversation.ownerId || conversation.owner_id}
            onActionComplete={() => window.location.reload()} 
          />
      )}

      {/* 3. LIVE BANNER */}
      {isChannelLive && !isOwner && (
        <div className="bg-red-600/10 border-b border-red-500/30 p-2 px-4 flex items-center justify-between animate-in slide-in-from-top-2 backdrop-blur-sm sticky top-[64px] z-30 shrink-0">
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live Transmission in Progress</span>
            </div>
            <button 
                className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-sm font-mono uppercase transition-colors"
                onClick={() => document.querySelector('button[title="Join Live Stream"]')?.click() || document.querySelector('button[title="Live Stream"]')?.click()}
            >
                Join Stream ↗
            </button>
        </div>
      )}

      {/* 4. CHANNEL TOGGLE BAR */}
      {isChannel && linkedGroupId && (
        <div className="flex items-center border-b border-border bg-secondary/5 shrink-0">
            <button onClick={() => setActiveTab("main")} className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === "main" ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted-foreground hover:bg-secondary/10"}`}><Radio size={14} /> Broadcast</button>
            <button onClick={() => setActiveTab("discussion")} className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === "discussion" ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted-foreground hover:bg-secondary/10"}`}><MessageSquare size={14} /> Discussion</button>
        </div>
      )}

      {pinnedMsg && <div className="shrink-0"><ChatPinnedMessage message={pinnedMsg} isAdmin={isOwner} onUnpin={() => setPinnedMsg(null)} /></div>}

      {/* 5. MESSAGES AREA */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-background">
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 custom-scrollbar">
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            <div className="relative z-10 pb-4">
                {isSenderWaiting ? (
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
                        <MessageBubble key={msg.id} message={msg} isMe={msg.sender_id === user?.id} role={role} chatId={currentViewId} currentUserId={user?.id} onEdit={() => setMessageToEdit(msg)} onReply={setMessageToReply} />
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

      {/* 6. FOOTER / INPUT / JOIN */}
      <div className="shrink-0 relative z-20 bg-background border-t border-border">
          {isSenderWaiting ? null : canType ? (
              <ChatInput onSend={handleSend} convId={currentViewId} editMessage={messageToEdit} onCancelEdit={() => setMessageToEdit(null)} replyMessage={messageToReply} onCancelReply={() => setMessageToReply(null)} />
          ) : (
              <div className="p-4 bg-secondary/5 flex items-center justify-center">
                  {!isJoined && (conversation?.is_public || conversation?.isPublic) ? (
                      <Button onClick={handleJoin} className="bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest px-8"><UserPlus size={14} className="mr-2" /> Join community</Button>
                  ) : !isJoined ? (
                      <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs uppercase tracking-widest">
                         <Lock size={14} /> Private_Node_Restricted
                      </div>
                  ) : (
                      <div className="flex items-center gap-4 w-full justify-center">
                          <span className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2"><Lock size={12} /> Read-Only Frequency</span>
                          {linkedGroupId && activeTab === 'main' && (
                              <Button onClick={() => setActiveTab("discussion")} variant="outline" className="h-8 rounded-none border-accent/50 text-accent hover:bg-accent hover:text-white font-mono text-[10px] uppercase">Go to Discussion <ArrowRight size={12} className="ml-2" /></Button>
                          )}
                      </div>
                  )}
              </div>
          )}
      </div>

    </div>
  );
}