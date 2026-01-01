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

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "😮", "😢"];

export default function MessageBubble({ message, isMe, role, chatId, onReply, currentUserId }) {
  const [showLightbox, setShowLightbox] = useState(false);
  
  const isAdmin = role === 'owner' || role === 'admin';
  const isPinned = message.metadata?.is_pinned;
  const reactions = message.metadata?.reactions || {};
  const isImage = message.type === 'image';

  const handlePin = async () => {
    await supabase.rpc('toggle_message_pin', { p_message_id: message.id, p_is_pinned: !isPinned });
    toast.success(isPinned ? "Unpinned" : "Pinned");
  };

  const handleDelete = async () => {
    await supabase.from('messages').delete().eq('id', message.id);
    toast.info("Deleted");
  };

  const handlePurgeUser = async () => {
    if (!confirm("Delete ALL messages from this user? This cannot be undone.")) return;
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

  return (
    <>
      <div id={`msg-${message.id}`} className={cn("flex w-full mb-6 group relative", isMe ? "justify-end" : "justify-start")}>
        
        {/* --- MENU ACTIONS (HOVER) --- */}
        <div className={cn(
            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1",
            isMe ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"
        )}>
            <button onClick={() => onReply(message)} className="p-1.5 bg-secondary/80 hover:bg-accent hover:text-white rounded-full transition-colors" title="Reply">
              <Reply size={12} />
            </button>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-1.5 bg-secondary/80 hover:bg-foreground hover:text-background rounded-full transition-colors">
                        <Smile size={12} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="flex gap-1 p-2 bg-black border-border">
                    {QUICK_REACTIONS.map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(emoji)} className="text-lg hover:scale-125 transition-transform">{emoji}</button>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-1.5 bg-secondary/80 hover:bg-foreground hover:text-background rounded-full transition-colors">
                        <MoreHorizontal size={12} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isMe ? "end" : "start"} className="bg-black border-border rounded-none w-40">
                    {!isImage && <DropdownMenuItem onClick={copyText} className="text-xs font-mono"><Copy size={12} className="mr-2"/> Copy Text</DropdownMenuItem>}
                    {isAdmin && (
                        <DropdownMenuItem onClick={handlePin} className="text-xs font-mono"><Pin size={12} className="mr-2"/> {isPinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                    )}
                    {(isAdmin || isMe) && (
                        <DropdownMenuItem onClick={handleDelete} className="text-xs font-mono text-red-500 focus:text-red-500"><Trash2 size={12} className="mr-2"/> Delete</DropdownMenuItem>
                    )}
                    {isAdmin && !isMe && (
                        <>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem onClick={handlePurgeUser} className="text-xs font-mono text-red-500 focus:text-red-500"><Ban size={12} className="mr-2"/> Purge User</DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <div className={cn(
            "max-w-[85%] md:max-w-[70%] relative transition-all flex flex-col",
            isMe ? "items-end" : "items-start"
        )}>
          
          {/* --- REPLY CONTEXT --- */}
          {message.metadata?.reply_to && (
              <div className="mb-1 text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 border-l-2 border-accent truncate max-w-full opacity-70 rounded-tr-md rounded-br-md">
                  Replying to: {message.metadata.reply_to.text}
              </div>
          )}

          {/* --- MAIN BUBBLE CONTENT --- */}
          {isImage ? (
              // IMAGE MODE: Clickable to open Lightbox
              <div 
                onClick={() => setShowLightbox(true)}
                className="relative group/image overflow-hidden border border-border bg-black rounded-sm shadow-sm cursor-zoom-in transition-transform hover:scale-[1.01]"
              >
                  <div className="relative w-64 md:w-80 h-auto min-h-[150px]">
                      <Image 
                          src={message.text} 
                          alt="Attachment" 
                          width={500}
                          height={500}
                          className="w-full h-auto object-cover block" 
                          loading="lazy"
                      />
                  </div>
                  {/* Overlay Timestamp */}
                  <div className="absolute bottom-0 right-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-end items-end gap-1">
                      <span className="text-[9px] font-mono text-white/90">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && <span className="text-white/90">{message.read ? <CheckCheck size={12} /> : <Check size={12} />}</span>}
                  </div>
                  {/* Pinned Indicator on Image */}
                  {isPinned && <div className="absolute top-2 right-2 text-white bg-black/50 p-1 rounded-full backdrop-blur-md"><Pin size={10} /></div>}
              </div>
          ) : (
              // TEXT MODE: Standard Bubble
              <div className={cn(
                  "p-3 relative shadow-sm min-w-[80px]",
                  // Red Border, Dark BG for Me
                  isMe 
                      ? "bg-secondary/10 border border-accent text-foreground rounded-tl-xl rounded-bl-xl rounded-br-xl" 
                      : "bg-background border border-border hover:border-foreground/20 rounded-tr-xl rounded-br-xl rounded-bl-xl",
                  isPinned && "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
              )}>
                  {/* Pinned Icon */}
                  {isPinned && <div className="absolute -top-2 right-2 text-yellow-500 bg-background border border-yellow-500/20 p-0.5 rounded-full"><Pin size={10} fill="currentColor" /></div>}
                  
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{message.text}</p>

                  {/* Footer */}
                  <div className={cn("flex items-center gap-1 mt-1 text-[10px] font-mono select-none", isMe ? "justify-end text-muted-foreground/70" : "justify-start text-muted-foreground")}>
                      <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <span>{message.read ? <CheckCheck size={12} /> : <Check size={12} />}</span>}
                  </div>
              </div>
          )}

          {/* --- REACTIONS DISPLAY --- */}
          {Object.keys(reactions).length > 0 && (
              <div className={cn("flex gap-1 mt-1 flex-wrap", isMe ? "justify-end" : "justify-start")}>
                  {Object.entries(reactions).map(([emoji, userIds]) => (
                      <span key={emoji} className="bg-secondary/50 border border-border px-1.5 py-0.5 text-[10px] rounded-full text-foreground flex items-center gap-1 shadow-sm" title={userIds.length + " people"}>
                          {emoji} <span className="font-bold">{userIds.length}</span>
                      </span>
                  ))}
              </div>
          )}

        </div>
      </div>

      {/* --- LIGHTBOX OVERLAY --- */}
      <ImageLightbox 
        isOpen={showLightbox} 
        onClose={() => setShowLightbox(false)} 
        images={[message.text]} 
        initialIndex={0} 
      />
    </>
  );
}