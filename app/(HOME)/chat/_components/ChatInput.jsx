"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, X, Edit3, Loader2, Reply } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";

const EMOJI_SET = ["💻", "🚀", "🔥", "✨", "🎨", "🛠️", "📦", "⚡", "💯", "✅", "❌", "❤️", "😂", "🤔", "🙌", "👋"];

export default function ChatInput({ onSend, convId, editMessage, onCancelEdit, replyMessage, onCancelReply }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Sync text if editing
  useEffect(() => {
    if (editMessage) setText(editMessage.text);
    else setText("");
  }, [editMessage]);

  const broadcastTyping = (isTyping) => {
    if (!convId || !user) return;
    supabase.channel(`room-${convId}`).send({
      type: 'broadcast', event: 'typing', payload: { userId: user.id, isTyping },
    });
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (!editMessage) {
        if (e.target.value.length > 0) {
            broadcastTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000);
        } else {
            broadcastTyping(false);
        }
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    if (editMessage) {
        // --- EDIT LOGIC ---
        try {
             if ((editMessage.edit_count || 0) >= 2) { 
                 toast.error("Edit limit reached (Max 2)"); 
                 onCancelEdit();
                 return; 
             }
             const { error } = await supabase
                .from('messages')
                .update({ 
                    text: text, 
                    edit_count: (editMessage.edit_count || 0) + 1 
                })
                .eq('id', editMessage.id);

             if (error) throw error;
             toast.success("Message patched");
             onCancelEdit();
        } catch(e) { 
            toast.error("Edit Failed"); 
        }
    } else {
        // --- NEW MESSAGE LOGIC ---
        broadcastTyping(false);
        // If replying, attach metadata
        const metadata = replyMessage ? { reply_to: { id: replyMessage.id, text: replyMessage.text.substring(0, 50) + "..." } } : {};
        onSend(text, 'text', metadata);
        onCancelReply?.();
    }
    setText("");
    setShowEmoji(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        toast.error("Only image transmissions supported.");
        return;
    }

    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${convId}/${Date.now()}.${fileExt}`;
        
        // Ensure bucket 'chat-media' exists in Supabase
        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(fileName);

        // Send as type 'image'
        onSend(publicUrl, 'image');

    } catch (error) {
        console.error(error);
        toast.error("Upload Failed");
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="p-4 bg-background border-t border-border relative">
      
      {/* EDIT MODE BANNER */}
      {editMessage && (
        <div className="absolute top-0 left-0 right-0 -translate-y-full bg-accent/10 border-t border-accent/20 p-2 flex justify-between items-center px-4 animate-in slide-in-from-bottom-2">
            <span className="text-[10px] font-mono text-accent uppercase flex items-center gap-2">
                <Edit3 size={12} /> Editing Payload ({editMessage.edit_count || 0}/2)
            </span>
            <button onClick={onCancelEdit} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
            </button>
        </div>
      )}

      {/* REPLY MODE BANNER */}
      {replyMessage && !editMessage && (
        <div className="absolute top-0 left-0 right-0 -translate-y-full bg-secondary/90 border-t border-border p-2 flex justify-between items-center px-4 backdrop-blur-md animate-in slide-in-from-bottom-2">
            <span className="text-[10px] font-mono text-foreground uppercase flex items-center gap-2 truncate max-w-[80%]">
                <Reply size={12} /> Replying to: "{replyMessage.text.substring(0, 30)}..."
            </span>
            <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
            </button>
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 z-50 bg-background border border-border p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
            <div className="grid grid-cols-4 gap-2">
                {EMOJI_SET.map((emoji) => (
                    <button 
                        key={emoji} 
                        onClick={() => setText(prev => prev + emoji)} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary text-lg transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* MAIN INPUT AREA */}
      <div className="relative flex items-end gap-2 bg-secondary/5 border border-border focus-within:border-accent transition-colors p-2">
        
        {/* File Upload */}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-zinc-500 hover:text-foreground transition-colors group"
        >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} className="group-hover:rotate-12 transition-transform" />}
        </button>

        <textarea
            value={text}
            onChange={handleInputChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder={editMessage ? "Refine message..." : "TYPE_MESSAGE_INPUT..."}
            className="flex-1 bg-transparent border-none outline-none text-sm font-mono placeholder:text-zinc-700 resize-none max-h-32 min-h-[40px] py-2 custom-scrollbar"
            rows={1}
        />

        <div className="flex items-center gap-1">
            <button onClick={() => setShowEmoji(!showEmoji)} className={`p-2 transition-colors ${showEmoji ? 'text-accent' : 'text-zinc-500 hover:text-foreground'}`}>
                <Smile size={20} />
            </button>
            <button 
                onClick={handleSend}
                disabled={!text.trim() && !editMessage}
                className={`p-2 transition-all duration-300 ${text.trim() ? 'text-accent' : 'text-zinc-800 pointer-events-none opacity-50'}`}
            >
                <Send size={20} fill={text.trim() ? "currentColor" : "none"} />
            </button>
        </div>
      </div>
    </div>
  );
}