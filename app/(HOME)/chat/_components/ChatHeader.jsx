"use client";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Phone, Video, User } from "lucide-react";

export default function ChatHeader({ user, onBack }) {
  // Fallback if avatar is null or broken
  const avatarSrc = user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";

  return (
    <div className="h-16 border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
      
      {/* Left: Back (Mobile) & User Info */}
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
            <ArrowLeft size={20} />
        </button>

        {/* Avatar Container */}
        <div className="relative w-10 h-10 border border-border bg-secondary flex-shrink-0">
            {avatarSrc ? (
                <Image 
                    src={avatarSrc} 
                    alt={user?.name || "User"} 
                    fill 
                    className="object-cover" 
                    sizes="40px"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                    <User size={20} />
                </div>
            )}
            
            {user?.online && (
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
            )}
        </div>

        {/* Name & Status */}
        <div className="leading-tight">
            <h3 className="font-bold text-sm text-foreground truncate max-w-[150px]">
                {user?.name || "Secure_Node"}
            </h3>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                {user?.online ? (
                    <><span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Online_Sync</>
                ) : (
                    "Last_Seen_Recently"
                )}
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