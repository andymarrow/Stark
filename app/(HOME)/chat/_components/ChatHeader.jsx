"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Phone, Video, User, Users, Radio, Lock, Globe, Share2, ShieldBan, Info, Search, X } from "lucide-react";
import dynamic from 'next/dynamic';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import GroupInfoDialog from "./GroupInfoDialog"; 
import { supabase } from "@/lib/supabaseClient";

// Lazy load Agora wrapper to prevent SSR issues
const LiveRoomWrapper = dynamic(() => import("./live/LiveRoomWrapper"), { ssr: false });

export default function ChatHeader({ conversation, onBack, currentUser, onSearch }) {
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // Track the message ID associated with the current call
  const [activeCallMessageId, setActiveCallMessageId] = useState(null);

  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Safety checks
  const isDirect = conversation?.type === 'direct';
  
  // Handle both potential title locations (mapped vs raw DB)
  const name = isDirect 
    ? (conversation?.name || "User") 
    : (conversation?.title || "Channel");
  
  // Robust Image Fallback
  const image = conversation?.avatar || conversation?.avatar_url || (isDirect 
    ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" 
    : "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100"
  );

  const ownerId = conversation?.ownerId || conversation?.owner_id;
  const isOwner = ownerId === currentUser;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    onSearch("");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/chat?id=${conversation?.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link Copied", { description: "Invite link copied to clipboard." });
  };

  const handleBlockUser = async () => {
    if (isDirect) {
      let targetId = conversation.participants?.find(p => 
        (p.profile?.id || p.user_id) !== currentUser
      )?.profile?.id;

      // FIX: If participants list is missing from props, fetch the ID manually
      if (!targetId) {
        const { data, error: fetchError } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation.id)
          .neq('user_id', currentUser)
          .maybeSingle();
        
        if (data) targetId = data.user_id;
      }

      if (!targetId) {
        toast.error("Could not identify user to block.");
        return;
      }

      const { error } = await supabase.rpc('block_user', {
        p_blocker_id: currentUser,
        p_blocked_id: targetId
      });

      if (error) {
        toast.error("Block Protocol Failed", { description: error.message });
      } else {
        toast.success("User Blocked", { description: "Connection terminated and node hidden." });
        onBack(); 
      }
    } else {
      toast.info("Node Reported", { description: "Administration has been notified of this frequency." });
    }
  };

  const startCall = async (audioOnly) => {
    console.log(`🎥 Starting Call | Me: ${currentUser} | Owner: ${ownerId} | IsHost: ${isOwner}`);
    
    // Prevent calls in Virtual (un-handshaked) chats
    if (conversation?.isVirtual) {
        toast.error("Handshake Required", { description: "Send a text message first to establish connection." });
        return;
    }

    try {
        // 1. Create a "Call Invite" message in the chat
        // This notifies the other user via the standard message stream
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversation.id,
                sender_id: currentUser,
                text: audioOnly ? "Started a voice call" : "Started a video call",
                type: 'call',
                metadata: {
                    status: 'ongoing', // 'ongoing', 'ended', 'missed'
                    audioOnly: audioOnly,
                    startedAt: new Date().toISOString()
                }
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Set state to open the window
        setActiveCallMessageId(data.id);
        setIsAudioOnly(audioOnly);
        setIsLiveOpen(true);
        
    } catch (err) {
        console.error(err);
        toast.error("Failed to initialize frequency");
    }
  };

  return (
    <>
      <div className="h-16 border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
        
        {showSearch ? (
            <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <Search size={18} className="text-muted-foreground" />
                <input 
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search in conversation..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono h-full text-foreground"
                />
                <button onClick={closeSearch} className="p-2 hover:bg-secondary rounded-full">
                    <X size={18} />
                </button>
            </div>
        ) : (
          <>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => !isDirect && setIsInfoOpen(true)}>
          <button 
              onClick={onBack}
              className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
              <ArrowLeft size={20} />
          </button>

          <div className="relative w-10 h-10 border border-border bg-secondary flex-shrink-0">
              {image ? (
                  <Image 
                    src={image} 
                    alt={name} 
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

          <div className="leading-tight min-w-0 flex-1">
              <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground truncate max-w-[150px] sm:max-w-md">
                      {name}
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

        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          
            <button 
                onClick={() => setShowSearch(true)} 
                className="p-2 hover:bg-secondary/20 hover:text-foreground transition-colors"
            >
                <Search size={18} />
            </button>

          <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

          {/* VIDEO CALL / LIVE */}
          <button 
            onClick={() => startCall(false)} 
            className={`p-2 hover:bg-secondary/20 hover:text-accent transition-colors ${!isDirect && conversation?.is_live ? "text-red-500 hover:text-red-600 animate-pulse" : ""}`}
            title={isDirect ? "Video Call" : "Join Live Stream"}
          >
              <Video size={18} />
          </button>

          {/* AUDIO CALL (Direct Only) */}
          {isDirect && (
            <button 
                onClick={() => startCall(true)} 
                className="p-2 hover:bg-secondary/20 hover:text-accent transition-colors"
                title="Voice Call"
            >
                <Phone size={18} />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-secondary/20 hover:text-foreground transition-colors">
                    <MoreVertical size={18} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-black border-border rounded-none">
                {!isDirect && (
                    <DropdownMenuItem onClick={handleCopyLink} className="text-xs font-mono cursor-pointer">
                        <Share2 size={14} className="mr-2"/> Share Link
                    </DropdownMenuItem>
                )}
                
                {!isDirect && (
                    <DropdownMenuItem onClick={() => setIsInfoOpen(true)} className="text-xs font-mono cursor-pointer">
                        <Info size={14} className="mr-2"/> Node Info
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-border" />
                
                <DropdownMenuItem onClick={handleBlockUser} className="text-xs font-mono text-red-500 focus:text-red-500 cursor-pointer">
                    <ShieldBan size={14} className="mr-2"/> {isDirect ? "Block User" : "Report Node"}
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
         </>
        )}
      </div>

      {isLiveOpen && (
        <LiveRoomWrapper 
            channelId={conversation?.id} 
            isHost={true} // Initiator is Host
            audioOnly={isAudioOnly}
            callMessageId={activeCallMessageId} // Pass Message ID for status updates
            onClose={() => {
                setIsLiveOpen(false);
                setActiveCallMessageId(null);
            }} 
        />
      )}
      
      {!isDirect && (
        <GroupInfoDialog 
            isOpen={isInfoOpen} 
            onClose={() => setIsInfoOpen(false)} 
            conversation={conversation} 
        />
      )}
    </>
  );
}