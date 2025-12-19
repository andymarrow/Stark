"use client";
import { Search, PenSquare, Filter } from "lucide-react";
import ChatListItem from "./ChatListItem";

export default function ChatSidebar({ chats, selectedChatId, onSelectChat }) {
  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      
      {/* Header / Search */}
      <div className="p-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
            <button className="p-2 bg-secondary/10 hover:bg-accent hover:text-white transition-colors border border-transparent hover:border-accent">
                <PenSquare size={18} />
            </button>
        </div>
        
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <input 
                type="text" 
                placeholder="Search chats..." 
                className="w-full h-10 pl-10 pr-4 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-mono transition-all placeholder:text-muted-foreground/50"
            />
        </div>
        
        {/* Optional: Filter Tabs (All, Unread, Groups) */}
        <div className="flex gap-4 mt-4 text-[10px] font-mono text-muted-foreground overflow-x-auto scrollbar-hide">
            <button className="pb-1 border-b-2 border-accent text-foreground font-bold">ALL_CHATS</button>
            <button className="pb-1 border-b-2 border-transparent hover:text-foreground">UNREAD</button>
            <button className="pb-1 border-b-2 border-transparent hover:text-foreground">GROUPS</button>
            <button className="pb-1 border-b-2 border-transparent hover:text-foreground">ARCHIVED</button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chats.map((chat) => (
            <ChatListItem 
                key={chat.id} 
                chat={chat} 
                isActive={selectedChatId === chat.id}
                onClick={() => onSelectChat(chat.id)}
            />
        ))}
        
        {/* Empty Space for scrolling */}
        <div className="h-20" />
      </div>
    </div>
  );
}