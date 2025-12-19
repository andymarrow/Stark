"use client";
import Image from "next/image";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a class merger, if not, standard template literals work

export default function ChatListItem({ chat, isActive, onClick }) {
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
        <div className="w-12 h-12 relative bg-secondary border border-border">
          <Image 
            src={chat.avatar} 
            alt={chat.name} 
            fill 
            className="object-cover" 
          />
        </div>
        {chat.online && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={cn(
            "text-sm font-bold truncate",
            isActive ? "text-accent" : "text-foreground"
          )}>
            {chat.name}
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">
            {chat.lastMessageTime}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground truncate max-w-[140px] font-light">
            {chat.typing ? (
              <span className="text-accent animate-pulse">typing...</span>
            ) : (
              chat.lastMessage
            )}
          </p>
          
          {/* Status Icons / Badge */}
          <div className="flex items-center gap-1">
            {chat.unreadCount > 0 ? (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full">
                {chat.unreadCount}
              </span>
            ) : (
              // Read Receipts
              <span className="text-muted-foreground/50">
                {chat.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}