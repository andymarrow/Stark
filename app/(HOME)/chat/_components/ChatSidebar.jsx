"use client";
import { useState, useEffect } from "react";
import { Search, PenSquare, Plus, Settings, Users, Radio, MessageCircle, UserPlus } from "lucide-react";
import ChatListItem from "./ChatListItem";
import CreateCommunityDialog from "./CreateCommunityDialog";
import ChatSettingsDialog from "./ChatSettingsDialog";
import { useAuth } from "@/app/_context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const TABS = [
    { id: "PRIMARY", label: "Primary", icon: MessageCircle },
    { id: "GROUPS", label: "Groups", icon: Users },
    { id: "CHANNELS", label: "Channels", icon: Radio },
    { id: "REQUESTS", label: "Requests", icon: PenSquare } 
];

export default function ChatSidebar({ chats, selectedChatId, onSelectChat, activeTab, setActiveTab }) {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], channels: [] });
  const [isSearching, setIsSearching] = useState(false);

  // --- GLOBAL SEARCH LOGIC ---
  useEffect(() => {
    const performGlobalSearch = async () => {
        if (searchTerm.length < 3) {
            setSearchResults({ users: [], channels: [] });
            return;
        }

        setIsSearching(true);
        try {
            // 1. Search Users (excluding self and blocked users)
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
                .neq('id', user.id)
                .limit(5);

            // 2. Search Public Channels
            const { data: channels, error: channelError } = await supabase
                .from('conversations')
                .select('id, title, type')
                .eq('is_public', true)
                .eq('type', 'channel')
                .ilike('title', `%${searchTerm}%`)
                .limit(5);

            if (userError || channelError) throw new Error("Search failed");

            setSearchResults({ users: users || [], channels: channels || [] });

        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce manual implementation (Wait 500ms after typing stops)
    const timeoutId = setTimeout(performGlobalSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, user.id]);

  const handleStartChat = async (targetUserId) => {
    try {
        // Check if chat already exists using the RPC function we created in SQL
        const { data: existing } = await supabase.rpc('get_conversation_id_by_user', { target_user_id: targetUserId });
        
        if (existing) {
            onSelectChat(existing);
            setSearchTerm(""); // Clear search
        } else {
            // Create pending chat (The "Velvet Rope" start)
            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({ type: 'direct', owner_id: user.id }) // Owner is initiator
                .select()
                .single();
            
            if (error) throw error;

            // Add Participants
            await supabase.from('conversation_participants').insert([
                { conversation_id: newConv.id, user_id: user.id, status: 'active' }, // Me
                { conversation_id: newConv.id, user_id: targetUserId, status: 'pending' } // Them
            ]);

            onSelectChat(newConv.id);
            setSearchTerm("");
        }
    } catch (error) {
        console.error(error);
        toast.error("Failed to initiate link");
    }
  };

  const handleJoinChannel = async (channelId) => {
    try {
        // Check if already member
        const { data: existing } = await supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', channelId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            onSelectChat(channelId);
        } else {
            // Join
            await supabase.from('conversation_participants').insert({
                conversation_id: channelId,
                user_id: user.id,
                status: 'active',
                role: 'member'
            });
            toast.success("Channel Frequency Acquired");
            onSelectChat(channelId);
        }
        setSearchTerm("");
    } catch (error) {
        toast.error("Access Denied");
    }
  };

  // Determine what to show
  const showGlobalResults = searchTerm.length >= 3;
  const filteredLocalChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      
      {/* Header */}
      <div className="p-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight uppercase font-mono">Signals</h1>
            <div className="flex gap-1">
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="p-2 bg-secondary/10 hover:bg-accent hover:text-white transition-colors border border-transparent hover:border-accent"
                >
                    <Plus size={18} />
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 bg-secondary/10 hover:bg-foreground hover:text-background transition-colors border border-transparent hover:border-foreground"
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>
        
        <div className="relative group mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-accent transition-colors" />
            <input 
                type="text" 
                placeholder="Search frequencies..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-mono transition-all placeholder:text-zinc-600"
            />
        </div>
        
        {!showGlobalResults && (
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-muted-foreground border-b border-border">
                {TABS.map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center py-2 transition-all border-b-2
                            ${activeTab === tab.id 
                                ? "border-accent text-foreground font-bold bg-secondary/10" 
                                : "border-transparent hover:text-foreground hover:bg-secondary/5"}`}
                    >
                        <tab.icon size={16} className="mb-1" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* CASE A: GLOBAL SEARCH MODE */}
        {showGlobalResults ? (
            <div className="p-4 space-y-6">
                
                {/* Users Section */}
                <div>
                    <h3 className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Global Directory</h3>
                    {isSearching ? (
                        <div className="text-xs font-mono animate-pulse">Scanning...</div>
                    ) : searchResults.users.length > 0 ? (
                        searchResults.users.map(u => (
                            <button 
                                key={u.id}
                                onClick={() => handleStartChat(u.id)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-secondary/10 transition-colors text-left"
                            >
                                <div className="w-8 h-8 bg-secondary rounded-full overflow-hidden">
                                    <img src={u.avatar_url} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">{u.username}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">Initiate Handshake</div>
                                </div>
                                <UserPlus size={14} className="ml-auto text-muted-foreground" />
                            </button>
                        ))
                    ) : (
                        <div className="text-xs text-muted-foreground">No users found.</div>
                    )}
                </div>

                {/* Channels Section */}
                <div>
                    <h3 className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Public Channels</h3>
                    {searchResults.channels.length > 0 ? (
                        searchResults.channels.map(c => (
                            <button 
                                key={c.id}
                                onClick={() => handleJoinChannel(c.id)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-secondary/10 transition-colors text-left"
                            >
                                <div className="p-2 bg-secondary text-accent">
                                    <Radio size={14} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">{c.title}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">Public Broadcast</div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-xs text-muted-foreground">No channels found.</div>
                    )}
                </div>

            </div>
        ) : (
            // CASE B: NORMAL LIST MODE
            filteredLocalChats.length > 0 ? (
                filteredLocalChats.map((chat) => (
                    <ChatListItem 
                        key={chat.id} 
                        chat={chat} 
                        isActive={selectedChatId === chat.id}
                        onClick={() => onSelectChat(chat.id)}
                    />
                ))
            ) : (
                <div className="p-8 text-center flex flex-col items-center opacity-50 mt-10">
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">No_Signals</p>
                    <div className="w-12 h-1 bg-border" />
                </div>
            )
        )}
        
        <div className="h-20" />
      </div>

      <CreateCommunityDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ChatSettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} />

    </div>
  );
}