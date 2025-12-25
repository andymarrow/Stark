"use client";
import Image from "next/image";
import { Check, CheckCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatListItem({ chat, isActive, onClick }) {
  // Robust Fallback Logic for the Avatar
  const avatarUrl = chat?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left transition-all duration-200 group border-b border-border/50",
        isActive 
          ? "bg-secondary/20 border-l-2 border-l-accent" 
          : "hover:bg-secondary/10 border-l-2 border-l-transparent"
      )}
    >
      {/* Avatar with Status */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 relative bg-secondary border border-border overflow-hidden">
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt={chat?.name || "User"} 
              fill 
              className="object-cover" 
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                <User size={20} />
            </div>
          )}
        </div>
        
        {/* Realtime Status Indicator */}
        {chat?.online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full z-10" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={cn(
            "text-sm font-bold truncate tracking-tight uppercase font-mono",
            isActive ? "text-accent" : "text-foreground"
          )}>
            {chat?.name || "Unknown_Node"}
          </h3>
          <span className="text-[9px] font-mono text-muted-foreground">
            {chat?.lastMessageTime}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground truncate max-w-[140px] font-light">
            {chat?.typing ? (
              <span className="text-accent animate-pulse font-mono text-[10px]">SYNCING_INPUT...</span>
            ) : (
              chat?.lastMessage || "Handshake_Established"
            )}
          </p>
          
          {/* Status Icons / Badge */}
          <div className="flex items-center gap-1">
            {chat?.unreadCount > 0 ? (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-accent text-white text-[9px] font-bold rounded-none font-mono">
                {chat.unreadCount}
              </span>
            ) : (
              <span className="text-muted-foreground/30">
                {chat?.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}