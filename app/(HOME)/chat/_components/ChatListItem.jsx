"use client";
import Image from "next/image";
import { Check, CheckCheck, User, Clock, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatListItem({ chat, isActive, isOnline, onClick }) {
  // Robust Fallback Logic for the Avatar
  const avatarUrl = chat?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";

  /**
   * Formats the unique last_seen_at timestamp into a Telegram-style status string.
   * This handles the individual timing for every user in the database.
   */
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Status_Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSecs = Math.floor((now - date) / 1000);

    // Dynamic Time Formatting
    if (diffInSecs < 60) return "Seen just now";
    if (diffInSecs < 3600) return `Seen ${Math.floor(diffInSecs / 60)}m ago`;
    if (diffInSecs < 86400) return `Seen ${Math.floor(diffInSecs / 3600)}h ago`;
    if (diffInSecs < 604800) return `Seen ${Math.floor(diffInSecs / 86400)}d ago`;
    
    return `Seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left transition-all duration-200 group border-b border-border/50",
        isActive 
          ? "bg-secondary/20 border-l-2 border-l-accent shadow-[inset_4px_0px_0px_0px_rgba(255,0,0,0.05)]" 
          : "hover:bg-secondary/10 border-l-2 border-l-transparent"
      )}
    >
      {/* --- AVATAR WITH LIVE STATUS INDICATOR --- */}
      <div className="relative flex-shrink-0">
        <div className={cn(
            "w-12 h-12 relative bg-secondary border transition-all duration-500",
            isOnline ? "border-green-500/50 scale-[1.02]" : "border-border"
        )}>
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt={chat?.name || "User"} 
              fill 
              className={cn(
                "object-cover transition-all duration-500",
                !isOnline && "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
              )}
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                {chat?.type === 'direct' ? <User size={20} /> : <Radio size={20} />}
            </div>
          )}
        </div>
        
        {/* Realtime Status Dot: Only for Direct Chats */}
        {chat?.type === 'direct' && (
          <span className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-background rounded-full z-10 transition-all duration-500",
              isOnline ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-zinc-700"
          )}>
              {isOnline && (
                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
              )}
          </span>
        )}
      </div>

      {/* --- INFO SECTION --- */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className={cn(
            "text-sm font-bold truncate tracking-tight uppercase font-mono transition-colors duration-300",
            isActive ? "text-accent" : "text-foreground"
          )}>
            {chat?.name || "Unknown_Node"}
          </h3>
          <span className="text-[9px] font-mono text-muted-foreground uppercase">
            {chat?.lastMessageTime}
          </span>
        </div>
        
        {/* Status Line: Priority Logic -> Typing > Online > Last Seen > Last Message */}
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            {chat?.typing ? (
              <span className="text-accent animate-pulse font-mono text-[10px] uppercase font-black tracking-tighter">
                Syncing_Input...
              </span>
            ) : isOnline && chat?.type === 'direct' ? (
              <span className="text-green-500 font-mono text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 animate-in fade-in duration-500">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Online_Sync
              </span>
            ) : (
              <p className="text-[10px] text-muted-foreground truncate max-w-[170px] font-mono uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
                {chat?.lastMessage || (chat?.type === 'direct' ? formatLastSeen(chat?.lastSeen) : "Uplink_Established")}
              </p>
            )}
          </div>
          
          {/* Badge / Status Indicator */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {chat?.unreadCount > 0 ? (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-accent text-white text-[9px] font-bold rounded-none font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-300">
                {chat.unreadCount}
              </span>
            ) : (
              <span className="text-muted-foreground/20">
                {chat?.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
          </div>
        </div>

        {/* Individual Last Seen Sub-Footer (Only for offline direct chats with no active signals) */}
        {!isOnline && chat?.type === 'direct' && !chat?.typing && !chat?.unreadCount && (
            <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-700 uppercase mt-1 tracking-tighter group-hover:text-zinc-500 transition-colors">
                <Clock size={8} /> {formatLastSeen(chat?.lastSeen)}
            </div>
        )}
      </div>
    </button>
  );
}