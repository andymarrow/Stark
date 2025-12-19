"use client";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ message, isMe }) {
  return (
    <div className={cn("flex w-full mb-4", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] md:max-w-[60%] p-3 relative group transition-all",
          // SHARP EDGES - Industrial Look
          isMe 
            ? "bg-accent text-white border border-accent" 
            : "bg-background border border-border hover:border-foreground/20"
        )}
      >
        {/* Decor corner for "Them" messages */}
        {!isMe && (
            <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        {/* Message Text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {message.text}
        </p>

        {/* Metadata (Time + Status) */}
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