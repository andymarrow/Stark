"use client";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";

export default function ChatHeader({ user, onBack }) {
  return (
    <div className="h-16 border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
      
      {/* Left: Back (Mobile) & User Info */}
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
            <ArrowLeft size={20} />
        </button>

        {/* Avatar */}
        <div className="relative w-10 h-10 bg-secondary border border-border">
            <Image 
                src={user.avatar} 
                alt={user.name} 
                fill 
                className="object-cover" 
            />
            {user.online && (
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 border border-background rounded-full" />
            )}
        </div>

        {/* Name & Status */}
        <div className="leading-tight">
            <h3 className="font-bold text-sm text-foreground">{user.name}</h3>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                {user.online ? <span className="text-green-500">Online_Active</span> : "Last seen recently"}
            </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <button className="p-2 hover:bg-secondary/20 hover:text-accent transition-colors">
            <Phone size={18} />
        </button>
        <button className="p-2 hover:bg-secondary/20 hover:text-accent transition-colors">
            <Video size={18} />
        </button>
        <button className="p-2 hover:bg-secondary/20 hover:text-foreground transition-colors">
            <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}