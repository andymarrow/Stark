"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Phone, Video, User, Users, Radio, Lock, Globe } from "lucide-react";
import dynamic from 'next/dynamic';

const LiveRoomWrapper = dynamic(
  () => import("./live/LiveRoomWrapper"), 
  { ssr: false }
);

export default function ChatHeader({ conversation, onBack }) {
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  // Safety checks for data
  const isDirect = conversation?.type === 'direct';
  const name = isDirect ? conversation?.name : conversation?.title;
  
  // Robust Fallback Image Logic
  const image = conversation?.avatar || (isDirect 
    ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" 
    : "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100"
  );

  // Determine if current user is the "Host" (Owner) of this group/channel
  // Note: For Direct chats, both parties are effectively hosts/equals in Agora
  const isOwner = conversation?.ownerId === conversation?.currentUserId; // Ensure currentUserId is passed in props if needed, or derived

  const handleStartCall = (audioOnly = false) => {
    setIsAudioOnly(audioOnly);
    setIsLiveOpen(true);
  };

  return (
    <>
      <div className="h-16 border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
        
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <button 
              onClick={onBack}
              className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
              <ArrowLeft size={20} />
          </button>

          {/* Avatar */}
          <div className="relative w-10 h-10 border border-border bg-secondary flex-shrink-0">
              {image ? (
                  <Image 
                    src={image} 
                    alt={name || "Conversation Avatar"} 
                    fill 
                    className="object-cover" 
                    sizes="40px" 
                  />
              ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                      {isDirect ? <User size={20} /> : <Users size={20} />}
                  </div>
              )}
              
              {isDirect && (
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
              )}
          </div>

          {/* Text Details */}
          <div className="leading-tight">
              <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground truncate max-w-[150px] sm:max-w-md">
                      {name || "Loading..."}
                  </h3>
                  {!isDirect && (
                      conversation?.isPublic 
                      ? <Globe size={12} className="text-green-500" />
                      : <Lock size={12} className="text-yellow-500" />
                  )}
              </div>
              
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  {isDirect ? (
                      "Encrypted_Link_Active"
                  ) : (
                      <span className="flex items-center gap-1">
                          {conversation?.type === 'channel' ? <Radio size={10} /> : <Users size={10} />}
                          {conversation?.type || "Node"}
                      </span>
                  )}
              </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 text-muted-foreground">
          
          {/* VIDEO CALL BUTTON */}
          <button 
            onClick={() => handleStartCall(false)} // Video Mode
            className={`p-2 hover:bg-secondary/20 hover:text-accent transition-colors ${!isDirect ? "text-red-500 hover:text-red-600 animate-pulse" : ""}`}
            title={isDirect ? "Video Call" : "Join Live Stream"}
          >
              <Video size={18} />
          </button>

          {/* AUDIO CALL BUTTON (Only for Direct usually) */}
          {isDirect && (
            <button 
                onClick={() => handleStartCall(true)} // Audio Mode
                className="p-2 hover:bg-secondary/20 hover:text-accent transition-colors"
                title="Voice Call"
            >
                <Phone size={18} />
            </button>
          )}

          <button className="p-2 hover:bg-secondary/20 hover:text-foreground transition-colors">
              <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* --- LIVE STAGE OVERLAY --- */}
      {isLiveOpen && (
        <LiveRoomWrapper 
            channelId={conversation?.id} 
            // In Direct messages, everyone is a 'host' (publisher). In Groups, only owner is initially.
            isHost={isDirect || isOwner} 
            audioOnly={isAudioOnly}
            onClose={() => setIsLiveOpen(false)} 
        />
      )}
    </>
  );
}