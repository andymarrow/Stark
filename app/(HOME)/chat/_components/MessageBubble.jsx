"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, MoreHorizontal, Pin, Trash2, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function MessageBubble({ message, isMe, role, chatId, onReply }) {
  const isAdmin = role === 'owner' || role === 'admin';
  const isPinned = message.metadata?.is_pinned;

  const handlePin = async () => {
    await supabase.rpc('toggle_message_pin', { 
        p_message_id: message.id, 
        p_is_pinned: !isPinned 
    });
    toast.success(isPinned ? "Message Unpinned" : "Message Pinned");
  };

  const handleDelete = async () => {
    await supabase.from('messages').delete().eq('id', message.id);
    toast.info("Message Deleted");
  };

  const handleBan = async () => {
    if (!confirm("Ban this user from the group?")) return;
    await supabase.rpc('ban_user_from_chat', {
        p_chat_id: chatId,
        p_user_id: message.sender_id,
        p_admin_id: (await supabase.auth.getUser()).data.user.id,
        p_reason: "Admin Action"
    });
    toast.success("User Banned");
  };

  return (
    <div id={`msg-${message.id}`} className={cn("flex w-full mb-4 group relative", isMe ? "justify-end" : "justify-start")}>
      
      {/* Admin Actions Dropdown (Visible on Hover or Touch) */}
      {(isAdmin || isMe) && (
        <div className={cn(
            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10",
            isMe ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"
        )}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-1 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal size={14} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isMe ? "end" : "start"} className="bg-black border-border rounded-none">
                    {isAdmin && (
                        <DropdownMenuItem onClick={handlePin} className="text-xs font-mono">
                            <Pin size={12} className="mr-2" /> {isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                    )}
                    {(isAdmin || isMe) && (
                        <DropdownMenuItem onClick={handleDelete} className="text-xs font-mono text-red-500 focus:text-red-500">
                            <Trash2 size={12} className="mr-2" /> Delete
                        </DropdownMenuItem>
                    )}
                    {isAdmin && !isMe && (
                        <DropdownMenuItem onClick={handleBan} className="text-xs font-mono text-red-500 focus:text-red-500">
                            <Ban size={12} className="mr-2" /> Ban User
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] md:max-w-[60%] p-3 relative transition-all",
          isMe 
            ? "bg-accent text-white border border-accent" 
            : "bg-background border border-border hover:border-foreground/20",
          isPinned && "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
        )}
      >
        {isPinned && (
            <div className="absolute -top-2 right-2 text-yellow-500 bg-background border border-yellow-500/20 p-0.5 rounded-full">
                <Pin size={10} fill="currentColor" />
            </div>
        )}

        {!isMe && (
            <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {message.text}
        </p>

        <div className={cn(
            "flex items-center gap-1 mt-1 text-[10px] font-mono select-none",
            isMe ? "justify-end text-white/70" : "justify-start text-muted-foreground"
        )}>
          <span>{message.time}</span>
          {isMe && (
            <span>
              {message.read ? <CheckCheck size={12} /> : <Check size={12} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}