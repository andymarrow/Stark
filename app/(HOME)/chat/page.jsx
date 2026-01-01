"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
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
  const [loading, setLoading] = useState(true);
  
  // Tabs: PRIMARY, GROUPS, CHANNELS, REQUESTS
  const [activeTab, setActiveTab] = useState("PRIMARY"); 

  useEffect(() => {
    if (chatIdFromUrl) setSelectedConvId(chatIdFromUrl);
  }, [chatIdFromUrl]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch conversations with the new Schema fields
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          status,
          role,
          unread_count,
          conversation:conversations (
            id, 
            type,
            title,
            is_public,
            last_message, 
            last_message_at,
            owner_id,
            participants:conversation_participants (
              profile:profiles (id, username, avatar_url, full_name)
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formatted = (data || []).map(item => {
        const conv = item.conversation;
        const otherParticipant = conv.participants.find(p => p.profile.id !== user.id);
        
        // Determine Display Name & Avatar
        let displayName = "Unknown";
        let displayAvatar = null;

        if (conv.type === 'direct') {
            displayName = otherParticipant?.profile.full_name || otherParticipant?.profile.username;
            displayAvatar = otherParticipant?.profile.avatar_url;
        } else {
            displayName = conv.title || "Untitled Group";
            // In a real app, groups have their own avatar column, fallback to initials
            displayAvatar = null; 
        }

        return {
          id: conv.id,
          type: conv.type, // 'direct', 'group', 'channel'
          myStatus: item.status, // 'active', 'pending', 'muted'
          unreadCount: item.unread_count || 0,
          lastMessage: conv.last_message,
          lastMessageTime: conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
          name: displayName,
          avatar: displayAvatar,
          isPublic: conv.is_public,
          ownerId: conv.owner_id
        };
      }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      setConversations(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Signal Sync Failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      // Subscribe to changes
      const channel = supabase
        .channel('sidebar-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` }, fetchConversations)
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchConversations]);

  // --- FILTER LOGIC (The Brain) ---
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === "REQUESTS") {
        // Incoming requests from strangers
        return conv.type === 'direct' && conv.myStatus === 'pending'; 
    }
    if (activeTab === "GROUPS") return conv.type === 'group';
    if (activeTab === "CHANNELS") return conv.type === 'channel';
    
    // PRIMARY: Direct chats that are ACTIVE (Accepted or Mutual)
    // Note: Outgoing pending chats (sent by me) usually stay in Primary or a separate "Sent" list. 
    // For now, we show them in Primary so the user can see their sent message status.
    return conv.type === 'direct' && conv.myStatus !== 'pending'; 
  });

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" /></div>;
  if (!user) return <LoginRequiredState />;

  return (
    <div className="fixed inset-0 md:top-16 bottom-16 md:bottom-0 bg-background flex overflow-hidden">
      {/* SIDEBAR */}
      <div className={`
        w-full md:w-[350px] lg:w-[400px] flex-shrink-0 h-full border-r border-border bg-background transition-transform duration-300 ease-in-out absolute md:relative z-10
        ${selectedConvId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        <ChatSidebar 
            chats={filteredConversations} 
            selectedChatId={selectedConvId} 
            onSelectChat={setSelectedConvId}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
        />
      </div>

      {/* CHAT WINDOW */}
      <div className={`
        flex-1 h-full bg-secondary/5 relative transition-transform duration-300 ease-in-out absolute md:relative inset-0 md:inset-auto z-20 md:z-0
        ${selectedConvId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        md:block
      `}>
        {selectedConvId ? (
           <ChatWindow 
              convId={selectedConvId} 
              onBack={() => setSelectedConvId(null)} 
              // Pass the full conversation object to Window for context
              initialData={conversations.find(c => c.id === selectedConvId)}
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