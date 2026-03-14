"use client";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import ChatSidebar from "./_components/ChatSidebar";
import ChatWindow from "./_components/ChatWindow";
import { MessageSquareDashed, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import LoginRequiredState from "@/components/LoginRequiredState";

function ChatContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get('id');

  const [selectedConvId, setSelectedConvId] = useState(chatIdFromUrl);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PRIMARY"); 
  
  const currentChatRef = useRef(chatIdFromUrl);

  // --- 1. DATA FETCHING ---
  const fetchConversations = useCallback(async (silent = false) => {
    if (!user) return;
    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          status,
          role,
          unread_count,
          conversation:conversations (
            id, type, title, description, avatar_url, is_public,
            last_message, last_message_at, owner_id, linked_group_id, 
            participants:conversation_participants (
              user_id,
              profile:profiles (id, username, avatar_url, full_name, last_seen_at)
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formatted = (data || []).map(item => {
        const conv = item.conversation;
        if (!conv) return null; 

        const otherParticipant = conv.participants.find(p => p.user_id !== user.id);
        const profile = otherParticipant?.profile;
        
        let displayName = conv.type === 'direct' 
            ? (profile?.full_name || profile?.username || "Unknown Node")
            : conv.title;

        return {
          id: conv.id,
          type: conv.type, 
          title: conv.title, 
          description: conv.description, 
          myStatus: item.status, 
          unreadCount: currentChatRef.current === conv.id ? 0 : (item.unread_count || 0),
          lastMessage: conv.last_message,
          lastMessageAt: conv.last_message_at, 
          lastMessageTime: conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
          name: displayName,
          avatar: conv.type === 'direct' ? profile?.avatar_url : conv.avatar_url,
          lastSeen: profile?.last_seen_at, 
          otherUserId: profile?.id, 
          isPublic: conv.is_public,
          ownerId: conv.owner_id,
          linkedGroupId: conv.linked_group_id
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

      setConversations(formatted);
    } catch (err) {
      console.error("Signal Retrieval Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // --- 2. SELECTION & ACKNOWLEDGEMENT (FIXED) ---
  const handleSelectChat = (id) => {
    const targetId = typeof id === 'object' ? id.id : id;
    setSelectedConvId(id);
    currentChatRef.current = targetId;

    if (typeof id === 'string') {
        // 1. Optimistic UI clear to kill red bubble instantly
        setConversations(prev => prev.map(c => 
            c.id === targetId ? { ...c, unreadCount: 0 } : c
        ));
        
        // 2. DIRECT DATABASE UPDATE (Replaces failing RPC)
        // This forces the unread_count to 0 in the database reliably
        supabase.from('conversation_participants')
            .update({ unread_count: 0 })
            .eq('conversation_id', targetId)
            .eq('user_id', user.id)
            .then(({error}) => { if(error) console.error("Unread Reset Error:", error) });

        // 3. Mark messages as read so the sender gets double checkmarks
        supabase.from('messages')
            .update({ is_read: true })
            .eq('conversation_id', targetId)
            .neq('sender_id', user.id)
            .eq('is_read', false)
            .then();
    }
  };

  useEffect(() => {
    if (chatIdFromUrl && user) handleSelectChat(chatIdFromUrl);
  }, [chatIdFromUrl, user?.id]);

  // --- 3. REALTIME SYNC HUB ---
  useEffect(() => {
    if (user) {
      fetchConversations();
      
      const presenceChannel = supabase.channel('stark-global-presence');

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          setOnlineUsers(new Set(Object.keys(state)));
        })
        .subscribe();

      const dataChannel = supabase
        .channel('sidebar-sync-v13')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchConversations(true))
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'conversation_participants', 
            filter: `user_id=eq.${user.id}` 
        }, (payload) => {
            // If new unread arrives for the OPEN chat, auto-reset it directly
            if (payload.new.conversation_id === currentChatRef.current && payload.new.unread_count > 0) {
                 supabase.from('conversation_participants').update({ unread_count: 0 }).eq('conversation_id', currentChatRef.current).eq('user_id', user.id).then();
                 return;
            }
            fetchConversations(true);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            if (payload.new.conversation_id === currentChatRef.current) {
                supabase.from('conversation_participants').update({ unread_count: 0 }).eq('conversation_id', currentChatRef.current).eq('user_id', user.id).then();
                supabase.from('messages').update({ is_read: true }).eq('conversation_id', currentChatRef.current).neq('sender_id', user.id).eq('is_read', false).then();
            }
            fetchConversations(true); 
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
            fetchConversations(true);
        })
        .subscribe();

      return () => { 
          supabase.removeChannel(presenceChannel); 
          supabase.removeChannel(dataChannel); 
      };
    }
  }, [user, fetchConversations]);

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === "REQUESTS") return conv.type === 'direct' && conv.myStatus === 'pending'; 
    if (activeTab === "GROUPS") return conv.type === 'group';
    if (activeTab === "CHANNELS") return conv.type === 'channel';
    return conv.type === 'direct' && conv.myStatus !== 'pending'; 
  });

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" /></div>;
  if (!user) return <LoginRequiredState />;

  return (
    <div className="fixed inset-0 md:top-16 bottom-16 md:bottom-0 bg-background flex overflow-hidden">
      <div className={`
        w-full md:w-[350px] lg:w-[400px] flex-shrink-0 h-full border-r border-border bg-background transition-transform duration-300 ease-in-out absolute md:relative z-10
        ${selectedConvId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        <ChatSidebar 
            chats={filteredConversations} 
            selectedChatId={selectedConvId} 
            onSelectChat={handleSelectChat}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onlineUsers={onlineUsers} 
        />
      </div>

      <div className={`flex-1 h-full bg-secondary/5 relative transition-transform duration-300 ease-in-out absolute md:relative inset-0 md:inset-auto z-20 md:z-0 ${selectedConvId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} md:block`}>
        {selectedConvId ? (
           <ChatWindow 
              convId={selectedConvId} 
              onBack={() => { setSelectedConvId(null); currentChatRef.current = null; }} 
              initialData={conversations.find(c => c.id === (typeof selectedConvId === 'string' ? selectedConvId : selectedConvId.id))}
           />
        ) : (
           <div className="hidden md:flex h-full flex-col items-center justify-center text-muted-foreground p-8 text-center bg-background/50">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-secondary/20 border border-border flex items-center justify-center mb-6">
                    <MessageSquareDashed size={40} className="text-accent opacity-50" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2 font-mono uppercase tracking-widest">Select a Channel</h2>
                <p className="max-w-xs font-light text-sm text-muted-foreground font-mono uppercase">Status: Awaiting_Input</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" /></div>}>
            <ChatContent />
        </Suspense>
    );
}