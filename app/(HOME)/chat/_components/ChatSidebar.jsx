"use client";
import { useState, useEffect } from "react";
import { Search, PenSquare, Plus, Settings, Users, Radio, MessageCircle, UserPlus, Loader2 } from "lucide-react";
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

export default function ChatSidebar({ chats = [], selectedChatId, onSelectChat, activeTab, setActiveTab, onlineUsers = new Set() }) {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], channels: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const performGlobalSearch = async () => {
        if (searchTerm.length < 3) {
            setSearchResults({ users: [], channels: [] });
            return;
        }

        setIsSearching(true);
        try {
            // 1. Fetch Blacklist to ensure strict invisibility
            const { data: blockedList } = await supabase
                .from('blocked_users')
                .select('blocker_id, blocked_id')
                .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

            const restrictedIds = new Set();
            blockedList?.forEach(row => {
                if (row.blocker_id !== user.id) restrictedIds.add(row.blocker_id);
                if (row.blocked_id !== user.id) restrictedIds.add(row.blocked_id);
            });

            // 2. Search Directory
            let userQuery = supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, settings')
                .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
                .neq('id', user.id)
                .not('settings->>global_search', 'eq', 'false')
                .limit(10);
            
            if (restrictedIds.size > 0) {
                const idList = Array.from(restrictedIds);
                userQuery = userQuery.filter('id', 'not.in', `(${idList.join(',')})`);
            }

            const { data: users } = await userQuery;

            // 3. Search Public Communities
            const { data: channels } = await supabase
                .from('conversations')
                .select('id, title, type, avatar_url')
                .eq('is_public', true)
                .in('type', ['channel', 'group'])
                .ilike('title', `%${searchTerm}%`)
                .limit(10);

            setSearchResults({ 
                users: users || [], 
                channels: channels || [] 
            });

        } catch (error) {
            console.error("Global Search Error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const timeoutId = setTimeout(performGlobalSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, user.id]);

  const handleStartChat = async (targetUser) => {
    try {
        const { data: existingId } = await supabase.rpc('get_conversation_id_by_user', { 
            target_user_id: targetUser.id 
        });
        
        if (existingId) {
            onSelectChat(existingId);
            setSearchTerm("");
        } else {
            // Initiate Virtual Handshake
            onSelectChat({
                id: 'virtual-' + targetUser.id,
                isVirtual: true,
                type: 'direct',
                name: targetUser.full_name || targetUser.username,
                avatar: targetUser.avatar_url,
                targetId: targetUser.id
            });
            setSearchTerm("");
        }
    } catch (error) {
        console.error(error);
        toast.error("Failed to initiate link");
    }
  };

  const handleOpenCommunity = (id) => {
    onSelectChat(id);
    setSearchTerm("");
  };

  const showGlobalResults = searchTerm.length >= 3;
  const filteredLocalChats = (chats || []).filter(chat => 
    chat?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      <div className="p-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight uppercase font-mono text-foreground">Signals</h1>
            <div className="flex gap-1">
                <button onClick={() => setIsCreateOpen(true)} className="p-2 bg-secondary/10 hover:bg-accent hover:text-white transition-colors border border-transparent hover:border-accent">
                    <Plus size={18} />
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-secondary/10 hover:bg-foreground hover:text-background transition-colors border border-transparent hover:border-foreground">
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
                className="w-full h-10 pl-10 pr-4 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-mono transition-all placeholder:text-zinc-600 text-foreground"
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

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {showGlobalResults ? (
            <div className="p-4 space-y-6">
                <div>
                    <h3 className="text-[10px] font-mono uppercase text-muted-foreground mb-2 px-2">Global Directory</h3>
                    {isSearching ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="animate-spin text-accent" size={20} />
                        </div>
                    ) : searchResults.users.length > 0 ? (
                        searchResults.users.map(u => (
                            <button 
                                key={u.id} 
                                onClick={() => handleStartChat(u)} 
                                className="w-full flex items-center gap-3 p-2 hover:bg-secondary/10 transition-colors text-left group"
                            >
                                <div className="w-8 h-8 relative rounded-full overflow-hidden bg-secondary border border-border">
                                    <img src={u.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} className="w-full h-full object-cover" />
                                    {/* Real-time Presence Indicator for Global Search */}
                                    {onlineUsers.has(u.id) && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-foreground">@{u.username}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">Initialize Handshake</div>
                                </div>
                                <UserPlus size={14} className="ml-auto text-muted-foreground group-hover:text-accent transition-colors" />
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground font-mono uppercase">Zero results found</div>
                    )}
                </div>

                <div>
                    <h3 className="text-[10px] font-mono uppercase text-muted-foreground mb-2 px-2">Public Communities</h3>
                    {searchResults.channels.length > 0 ? (
                        searchResults.channels.map(c => (
                            <button key={c.id} onClick={() => handleOpenCommunity(c.id)} className="w-full flex items-center gap-3 p-2 hover:bg-secondary/10 transition-colors text-left group">
                                <div className="p-2 bg-secondary text-accent border border-border rounded-none group-hover:border-accent transition-colors">
                                    {c.type === 'channel' ? <Radio size={14} /> : <Users size={14} />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-foreground">{c.title}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono uppercase">Browse Signal</div>
                                </div>
                            </button>
                        ))
                    ) : (
                         <div className="p-4 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">No matching nodes</div>
                    )}
                </div>
            </div>
        ) : (
            filteredLocalChats.length > 0 ? (
                filteredLocalChats.map((chat) => (
                    <ChatListItem 
                        key={chat.id} 
                        chat={chat} 
                        // Comparison handles both direct IDs and Virtual Objects
                        isActive={selectedChatId === chat.id || (selectedChatId && typeof selectedChatId === 'object' && selectedChatId.id === chat.id)} 
                        isOnline={chat.type === 'direct' ? onlineUsers.has(chat.otherUserId) : false}
                        onClick={() => onSelectChat(chat.id)} 
                    />
                ))
            ) : (
                <div className="p-8 text-center flex flex-col items-center opacity-50 mt-10">
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">No_Signals_Active</p>
                    <div className="w-12 h-0.5 bg-border" />
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