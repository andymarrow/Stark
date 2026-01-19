"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Check, 
  CheckCheck, 
  MoreHorizontal, 
  Pin, 
  Trash2, 
  Ban, 
  Reply, 
  Smile, 
  Copy, 
  Edit3, 
  Phone, 
  PhoneMissed, 
  PhoneIncoming, 
  Video, 
  Clock 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Image from "next/image";
import ImageLightbox from "../../project/[slug]/_components/ImageLightbox";
import LinkPreviewCard from "./LinkPreviewCard";
import dynamic from 'next/dynamic';

// Lazy load to prevent hydration issues and Agora SSR conflicts
const LiveRoomWrapper = dynamic(() => import("./live/LiveRoomWrapper"), { ssr: false });

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "😮", "😢"];

export default function MessageBubble({ message, isMe, role, chatId, onReply, onEdit, currentUserId }) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Call Session State
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  
  const isAdmin = role === 'owner' || role === 'admin';
  const isPinned = message.metadata?.is_pinned;
  const reactions = message.metadata?.reactions || {};
  
  // --- SIGNAL TYPE ANALYSIS ---
  const isImageGroup = message.type === 'image_group' || message.type === 'image';
  const isCall = message.type === 'call';
  const images = message.metadata?.images || (message.type === 'image' ? [message.text] : []);
  const hasCaption = isImageGroup && message.text && message.type !== 'image';

  // --- CALL METADATA PARSING ---
  const callStatus = message.metadata?.status; // 'ongoing', 'ended', 'missed'
  const isAudioCall = message.metadata?.audioOnly;
  const startedAt = message.metadata?.startedAt ? new Date(message.metadata.startedAt) : null;
  const endedAt = message.metadata?.endedAt ? new Date(message.metadata.endedAt) : null;

  // Connection Duration Logic
  let durationText = "";
  if (startedAt && endedAt) {
      const diffMs = endedAt - startedAt;
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      durationText = `${minutes}m ${seconds}s`;
  }

  // Reaction Context
  const myReaction = Object.entries(reactions).find(([emoji, users]) => users.includes(currentUserId))?.[0];

  const handlePin = async () => {
    await supabase.rpc('toggle_message_pin', { p_message_id: message.id, p_is_pinned: !isPinned });
    toast.success(isPinned ? "Signal Unpinned" : "Signal Pinned");
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id);

      if (error) {
        toast.error("Access Denied", { description: "Insufficient clearance level." });
        return;
      }
      toast.info("Signal Purged", { description: "Data removed from node." });
    } catch (err) {
      toast.error("Protocol Error");
    }
  };

  const handlePurgeUser = async () => {
    if (!confirm("PURGE INITIATED: Delete ALL messages from this agent?")) return;
    await supabase.rpc('purge_user_messages', { p_chat_id: chatId, p_target_user_id: message.sender_id });
    toast.success("User Data Purged");
  };

  const handleReaction = async (emoji) => {
    await supabase.rpc('toggle_reaction', { p_message_id: message.id, p_user_id: currentUserId, p_emoji: emoji });
  };

  const copyText = () => {
    navigator.clipboard.writeText(message.text);
    toast.success("Payload Copied");
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  // --- RENDER COMPONENT: CALL INTERFACE ---
  if (isCall) {
    let CallIcon = isAudioCall ? Phone : Video;
    let bgColor = "bg-secondary/20 border-border";
    let textColor = "text-muted-foreground";
    let label = "Call Ended";
    let subLabel = durationText || "Terminated";
    let showJoin = false;

    if (callStatus === 'ongoing') {
        bgColor = "bg-green-500/10 border-green-500/30";
        textColor = "text-green-500";
        CallIcon = PhoneIncoming;
        label = isMe ? "Outgoing..." : "Incoming...";
        subLabel = "Tap to Join Link";
        showJoin = true; 
    } else if (callStatus === 'missed') {
        bgColor = "bg-red-500/10 border-red-500/30";
        textColor = "text-red-500";
        CallIcon = PhoneMissed;
        label = "Missed Call";
        subLabel = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div id={`msg-${message.id}`} className={cn("flex w-full mb-4 mt-4 px-4", isMe ? "justify-end" : "justify-start")}>
            <div className={cn(
                "p-4 rounded-none border w-64 flex flex-col gap-3 backdrop-blur-sm shadow-sm",
                bgColor
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 bg-background border border-border shadow-sm", textColor)}>
                        <CallIcon size={20} />
                    </div>
                    <div>
                        <h4 className={cn("font-bold text-xs uppercase tracking-widest", textColor)}>{label}</h4>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1 uppercase">
                            {callStatus === 'ended' && <Clock size={10} />}
                            {subLabel}
                        </p>
                    </div>
                </div>

                {showJoin && (
                    <button 
                        onClick={() => setIsJoiningCall(true)}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-none font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg animate-pulse flex items-center justify-center gap-2"
                    >
                        {isMe ? "Return to Uplink" : "Establish Link"}
                    </button>
                )}
                
                {callStatus === 'missed' && !isMe && (
                     <button 
                        className="w-full border border-red-500/30 text-red-500 hover:bg-red-500/10 py-2 rounded-none font-bold text-[10px] uppercase tracking-widest transition-colors"
                        onClick={() => {
                            toast.info("Initialize call via header controls.");
                        }}
                     >
                        Callback Node
                    </button>
                )}
            </div>

            {isJoiningCall && (
                <LiveRoomWrapper 
                    channelId={chatId} 
                    isHost={isMe} 
                    audioOnly={isAudioOnly}
                    callMessageId={message.id} 
                    onClose={() => setIsJoiningCall(false)} 
                />
            )}
        </div>
    );
  }

  // --- RENDER COMPONENT: STANDARD MESSAGE ---
  return (
    <>
      <div id={`msg-${message.id}`} className={cn("flex w-full mb-4 mt-10 px-4 group", isMe ? "justify-end" : "justify-start")}>
        
        <div className={cn(
            "relative flex flex-col max-w-[85%] md:max-w-[80%]",
            isMe ? "items-end" : "items-start"
        )}>

            {/* --- ACTIONS TOOLBAR (STARK FLOATING) --- */}
            <div className={cn(
                "absolute -top-11 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-background/95 border border-border p-1 rounded-none shadow-xl z-30 backdrop-blur-sm",
                isMe ? "right-0" : "left-0"
            )}>
                <button onClick={() => onReply(message)} className="p-1.5 text-muted-foreground hover:text-accent rounded-none transition-colors" title="Reply">
                    <Reply size={14} />
                </button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 text-muted-foreground hover:text-yellow-500 rounded-none transition-colors">
                            <Smile size={14} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" className="flex gap-1 p-2 bg-background border-border shadow-2xl rounded-none">
                        {QUICK_REACTIONS.map(emoji => (
                            <button 
                                key={emoji} 
                                onClick={() => handleReaction(emoji)} 
                                className={cn(
                                    "text-xl hover:scale-125 transition-transform p-1",
                                    myReaction === emoji ? "bg-accent/20" : "hover:bg-secondary"
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-none transition-colors">
                            <MoreHorizontal size={14} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isMe ? "end" : "start"} className="bg-background border-border rounded-none w-44">
                        <DropdownMenuItem onClick={copyText} className="text-[10px] font-mono uppercase tracking-widest cursor-pointer">
                            <Copy size={12} className="mr-2"/> Copy Payload
                        </DropdownMenuItem>
                        
                        {isMe && (
                            <DropdownMenuItem onClick={() => onEdit(message)} className="text-[10px] font-mono uppercase tracking-widest cursor-pointer">
                                <Edit3 size={12} className="mr-2"/> Refine Signal
                            </DropdownMenuItem>
                        )}

                        {isAdmin && (
                            <DropdownMenuItem onClick={handlePin} className="text-[10px] font-mono uppercase tracking-widest cursor-pointer">
                                <Pin size={12} className="mr-2"/> {isPinned ? "Release Pin" : "Pin Signal"}
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-border" />

                        {(isAdmin || isMe) && (
                            <DropdownMenuItem onClick={handleDelete} className="text-[10px] font-mono uppercase tracking-widest text-red-500 focus:text-red-500 cursor-pointer">
                                <Trash2 size={12} className="mr-2"/> Purge Message
                            </DropdownMenuItem>
                        )}
                        {isAdmin && !isMe && (
                            <DropdownMenuItem onClick={handlePurgeUser} className="text-[10px] font-mono uppercase tracking-widest text-red-500 focus:text-red-500 cursor-pointer">
                                <Ban size={12} className="mr-2"/> Eject Agent
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* --- BUBBLE CONTENT --- */}
            <div className={cn(
                "relative flex flex-col min-w-[60px]",
                isMe ? "items-end" : "items-start"
            )}>
            
                {/* Reply Context Bar */}
                {message.metadata?.reply_to && (
                    <div className={cn(
                        "mb-1 text-[9px] font-mono text-muted-foreground bg-secondary/30 px-2 py-1 border-l-2 border-accent truncate max-w-full opacity-80 cursor-pointer uppercase tracking-tighter",
                        isMe ? "text-right" : "text-left"
                    )} onClick={() => document.getElementById(`msg-${message.metadata.reply_to.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                        Reference: {message.metadata.reply_to.text}
                    </div>
                )}

                {isImageGroup ? (
                    <div className="relative overflow-hidden border border-border bg-black rounded-none shadow-sm transition-all hover:border-accent/40">
                        <div className={cn(
                            "grid gap-0.5",
                            images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        )}>
                            {images.map((src, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => openLightbox(i)}
                                    className={cn(
                                        "relative cursor-zoom-in overflow-hidden bg-zinc-900",
                                        images.length === 3 && i === 0 ? "col-span-2 aspect-video" : "aspect-square",
                                        images.length === 1 ? "w-[70vw] md:w-80 h-auto min-h-[150px]" : "w-[35vw] md:w-40"
                                    )}
                                >
                                    <Image src={src} alt="Signal Asset" fill className="object-cover hover:opacity-90 transition-opacity" />
                                </div>
                            ))}
                        </div>

                        {hasCaption && (
                            <div className="p-3 pb-6 bg-secondary/10 border-t border-border">
                                <p className="text-sm text-white/90 whitespace-pre-wrap font-sans">{message.text}</p>
                            </div>
                        )}

                        <div className="absolute bottom-0 right-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-end items-end gap-1 pointer-events-none">
                            {message.edit_count > 0 && <span className="text-[8px] font-mono text-accent/80 mr-1 uppercase font-black">Edited</span>}
                            <span className="text-[9px] font-mono text-white/90">
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <span className="text-white/90">{message.is_read ? <CheckCheck size={12} /> : <Check size={12} />}</span>}
                        </div>
                        {isPinned && <div className="absolute top-2 right-2 text-white bg-accent p-1 shadow-lg z-10"><Pin size={10} /></div>}
                    </div>
                ) : (
                     <div className={cn(
                        "p-3 relative shadow-md min-w-[100px] rounded-none",
                        isMe 
                            ? "bg-secondary/10 border border-accent text-foreground" 
                            : "bg-background border border-border hover:border-foreground/20",
                        isPinned && "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                    )}>
                        {isPinned && <div className="absolute -top-2 right-2 text-yellow-500 bg-background border border-yellow-500/20 p-0.5 z-10"><Pin size={10} fill="currentColor" /></div>}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">{message.text}</p>

                        <LinkPreviewCard message={message} />

                        <div className={cn("flex items-center gap-1 mt-1 text-[9px] font-mono select-none uppercase tracking-tighter", isMe ? "justify-end text-muted-foreground/70" : "justify-start text-muted-foreground")}>
                            {message.edit_count > 0 && <span className="text-accent/80 mr-1 font-black">Edited</span>}
                            <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <span>{message.is_read ? <CheckCheck size={12} /> : <Check size={12} />}</span>}
                        </div>
                    </div>
                )}

                {/* --- REALTIME REACTION COUNTER --- */}
                {Object.keys(reactions).length > 0 && (
                    <div className={cn("flex gap-1 mt-1.5 flex-wrap max-w-full", isMe ? "justify-end" : "justify-start")}>
                        {Object.entries(reactions).map(([emoji, userIds]) => (
                            <button 
                                key={emoji} 
                                onClick={() => handleReaction(emoji)}
                                className={cn(
                                    "border px-2 py-0.5 text-[10px] rounded-full flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95",
                                    emoji === myReaction 
                                        ? "bg-accent/20 border-accent text-accent" 
                                        : "bg-secondary/50 border-border text-foreground"
                                )}
                            >
                                {emoji} <span className="font-bold font-mono">{userIds.length}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      <ImageLightbox 
        isOpen={showLightbox} 
        onClose={() => setShowLightbox(false)} 
        images={images} 
        initialIndex={lightboxIndex} 
      />
    </>
  );
}