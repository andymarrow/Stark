"use client";
import { Search, PenSquare } from "lucide-react";
import ChatListItem from "./ChatListItem";

const TABS = [
    { id: "ALL_CHATS", label: "All" },
    { id: "UNREAD", label: "Unread" },
    { id: "GROUPS", label: "Groups" },
    { id: "ARCHIVED", label: "Archived" }
];

export default function ChatSidebar({ chats, selectedChatId, onSelectChat, activeTab, setActiveTab }) {
  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      
      {/* Header / Search */}
      <div className="p-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight uppercase font-mono">Signals</h1>
            <button className="p-2 bg-secondary/10 hover:bg-accent hover:text-white transition-colors border border-transparent hover:border-accent">
                <PenSquare size={18} />
            </button>
        </div>
        
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-accent transition-colors" />
            <input 
                type="text" 
                placeholder="Search frequencies..." 
                className="w-full h-10 pl-10 pr-4 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-mono transition-all placeholder:text-zinc-600"
            />
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 mt-4 text-[10px] font-mono text-muted-foreground overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-1 border-b-2 transition-all uppercase tracking-widest whitespace-nowrap
                        ${activeTab === tab.id 
                            ? "border-accent text-foreground font-bold" 
                            : "border-transparent hover:text-foreground"}`}
                >
                    {tab.id}
                </button>
            ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chats.length > 0 ? (
            chats.map((chat) => (
                <ChatListItem 
                    key={chat.id} 
                    chat={chat} 
                    isActive={selectedChatId === chat.id}
                    onClick={() => onSelectChat(chat.id)}
                />
            ))
        ) : (
            <div className="p-8 text-center">
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">No_Signals_In_Sector</p>
            </div>
        )}
        
        <div className="h-20" />
      </div>
    </div>
  );
}