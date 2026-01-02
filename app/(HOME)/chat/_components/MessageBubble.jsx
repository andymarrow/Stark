"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, MoreHorizontal, Pin, Trash2, Ban, Reply, Smile, Copy } from "lucide-react";
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

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "😮", "😢"];

export default function MessageBubble({ message, isMe, role, chatId, onReply, currentUserId }) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  const isAdmin = role === 'owner' || role === 'admin';
  const isPinned = message.metadata?.is_pinned;
  const reactions = message.metadata?.reactions || {};
  
  // --- TYPE CHECKING ---
  const isImageGroup = message.type === 'image_group' || message.type === 'image';
  const images = message.metadata?.images || (message.type === 'image' ? [message.text] : []);
  const hasCaption = isImageGroup && message.text && message.type !== 'image'; // If type is 'image', text IS the url usually, unless updated schema

  // Find my active reaction
  const myReaction = Object.entries(reactions).find(([emoji, users]) => users.includes(currentUserId))?.[0];

  const handlePin = async () => {
    await supabase.rpc('toggle_message_pin', { p_message_id: message.id, p_is_pinned: !isPinned });
    toast.success(isPinned ? "Unpinned" : "Pinned");
  };

  const handleDelete = async () => {
    await supabase.from('messages').delete().eq('id', message.id);
    toast.info("Deleted");
  };

  const handlePurgeUser = async () => {
    if (!confirm("Delete ALL messages from this user?")) return;
    await supabase.rpc('purge_user_messages', { p_chat_id: chatId, p_target_user_id: message.sender_id });
    toast.success("User Purged");
  };

  const handleReaction = async (emoji) => {
    await supabase.rpc('toggle_reaction', { p_message_id: message.id, p_user_id: currentUserId, p_emoji: emoji });
  };

  const copyText = () => {
    navigator.clipboard.writeText(message.text);
    toast.success("Copied");
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  return (
    <>
      <div id={`msg-${message.id}`} className={cn("flex w-full mb-4 group", isMe ? "justify-end" : "justify-start")}>
        
        <div className={cn(
            "flex items-end gap-2 max-w-[95%] md:max-w-[80%]",
            isMe ? "flex-row-reverse" : "flex-row"
        )}>

            {/* --- BUBBLE CONTENT --- */}
            <div className={cn(
                "relative transition-all flex flex-col min-w-[60px]",
                isMe ? "items-end" : "items-start"
            )}>
            
                {/* Reply Context */}
                {message.metadata?.reply_to && (
                    <div className={cn(
                        "mb-1 text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 border-l-2 border-accent truncate max-w-full opacity-80 cursor-pointer hover:opacity-100",
                        isMe ? "rounded-tl-md rounded-bl-md text-right" : "rounded-tr-md rounded-br-md text-left"
                    )} onClick={() => document.getElementById(`msg-${message.metadata.reply_to.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                        Replying to: {message.metadata.reply_to.text}
                    </div>
                )}

                {isImageGroup ? (
                    // --- MEDIA BUBBLE (GRID) ---
                    <div className="relative overflow-hidden border border-border bg-black rounded-sm shadow-sm transition-transform hover:scale-[1.005]">
                        
                        {/* Image Grid */}
                        <div className={cn(
                            "grid gap-0.5",
                            images.length === 1 ? "grid-cols-1" : 
                            images.length === 2 ? "grid-cols-2" : "grid-cols-2" // 3 images handled by spanning
                        )}>
                            {images.map((src, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => openLightbox(i)}
                                    className={cn(
                                        "relative cursor-zoom-in overflow-hidden bg-zinc-900",
                                        images.length === 3 && i === 0 ? "col-span-2 aspect-video" : "aspect-square",
                                        images.length === 1 ? "w-64 md:w-80 h-auto min-h-[150px]" : "w-32 md:w-40"
                                    )}
                                >
                                    <Image src={src} alt="Att" fill className="object-cover hover:opacity-90 transition-opacity" />
                                </div>
                            ))}
                        </div>

                        {/* Caption (if any) */}
                        {hasCaption && (
                            <div className="p-3 pb-6 bg-secondary/10">
                                <p className="text-sm text-white/90 whitespace-pre-wrap">{message.text}</p>
                            </div>
                        )}

                        {/* Overlay Timestamp */}
                        <div className="absolute bottom-0 right-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-end items-end gap-1 pointer-events-none">
                            <span className="text-[9px] font-mono text-white/90">
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <span className="text-white/90">{message.read ? <CheckCheck size={12} /> : <Check size={12} />}</span>}
                        </div>
                        
                        {isPinned && <div className="absolute top-2 right-2 text-white bg-black/50 p-1 rounded-full backdrop-blur-md z-10"><Pin size={10} /></div>}
                    </div>
                ) : (
                    // --- TEXT BUBBLE ---
                     <div className={cn(
                        "p-3 relative shadow-sm min-w-[100px]",
                        isMe 
                            ? "bg-secondary/10 border border-accent text-foreground rounded-tl-xl rounded-bl-xl rounded-br-xl" 
                            : "bg-background border border-border hover:border-foreground/20 rounded-tr-xl rounded-br-xl rounded-bl-xl",
                        isPinned && "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                    )}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onReply(message); }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-opacity md:hidden"
                        >
                            <Reply size={12} className="text-muted-foreground" />
                        </button>

                        {isPinned && <div className="absolute -top-2 right-2 text-yellow-500 bg-background border border-yellow-500/20 p-0.5 rounded-full z-10"><Pin size={10} fill="currentColor" /></div>}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">{message.text}</p>

                        <LinkPreviewCard text={message.text} />

                        <div className={cn("flex items-center gap-1 mt-1 text-[10px] font-mono select-none", isMe ? "justify-end text-muted-foreground/70" : "justify-start text-muted-foreground")}>
                            <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <span>{message.read ? <CheckCheck size={12} /> : <Check size={12} />}</span>}
                        </div>
                    </div>
                )}

                {/* REACTIONS */}
                {Object.keys(reactions).length > 0 && (
                    <div className={cn("flex gap-1 mt-1 flex-wrap max-w-full", isMe ? "justify-end" : "justify-start")}>
                        {Object.entries(reactions).map(([emoji, userIds]) => {
                            const isMyReaction = emoji === myReaction;
                            return (
                                <button 
                                    key={emoji} 
                                    onClick={() => handleReaction(emoji)}
                                    className={cn(
                                        "border px-1.5 py-0.5 text-[10px] rounded-full flex items-center gap-1 shadow-sm transition-all hover:scale-105",
                                        isMyReaction 
                                            ? "bg-accent/20 border-accent text-accent" 
                                            : "bg-secondary/50 border-border text-foreground hover:bg-secondary"
                                    )}
                                    title={`${userIds.length} people`}
                                >
                                    {emoji} <span className="font-bold">{userIds.length}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- ACTIONS TOOLBAR --- */}
            <div className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-2",
                isMe ? "pr-1" : "pl-1"
            )}>
                <button onClick={() => onReply(message)} className="p-1.5 bg-background border border-border text-muted-foreground hover:text-accent hover:border-accent rounded-full transition-colors shadow-sm" title="Reply">
                    <Reply size={14} />
                </button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 bg-background border border-border text-muted-foreground hover:text-yellow-500 hover:border-yellow-500 rounded-full transition-colors shadow-sm">
                            <Smile size={14} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" className="flex gap-1 p-2 bg-background border-border shadow-xl rounded-full">
                        {QUICK_REACTIONS.map(emoji => (
                            <button 
                                key={emoji} 
                                onClick={() => handleReaction(emoji)} 
                                className={cn(
                                    "text-xl hover:scale-125 transition-transform p-1 rounded-full",
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
                        <button className="p-1.5 bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground rounded-full transition-colors shadow-sm">
                            <MoreHorizontal size={14} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isMe ? "end" : "start"} className="bg-background border-border rounded-none w-40">
                        <DropdownMenuItem onClick={copyText} className="text-xs font-mono cursor-pointer"><Copy size={12} className="mr-2"/> Copy Text</DropdownMenuItem>
                        {isAdmin && (
                            <DropdownMenuItem onClick={handlePin} className="text-xs font-mono cursor-pointer"><Pin size={12} className="mr-2"/> {isPinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                        )}
                        {(isAdmin || isMe) && (
                            <DropdownMenuItem onClick={handleDelete} className="text-xs font-mono text-red-500 focus:text-red-500 cursor-pointer"><Trash2 size={12} className="mr-2"/> Delete</DropdownMenuItem>
                        )}
                        {isAdmin && !isMe && (
                            <>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem onClick={handlePurgeUser} className="text-xs font-mono text-red-500 focus:text-red-500 cursor-pointer"><Ban size={12} className="mr-2"/> Purge User</DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
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