"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, X, Edit3, Loader2, Reply, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_SET = ["💻", "🚀", "🔥", "✨", "🎨", "🛠️", "📦", "⚡", "💯", "✅", "❌", "❤️", "😂", "🤔", "🙌", "👋"];

export default function ChatInput({ onSend, convId, editMessage, onCancelEdit, replyMessage, onCancelReply }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  
  // Multi-Image State
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of File objects
  const [previews, setPreviews] = useState([]); // Array of string URLs
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Sync text if editing mode is triggered
  useEffect(() => {
    if (editMessage) {
      setText(editMessage.text);
    } else if (!selectedFiles.length) {
      setText(""); 
    }
  }, [editMessage, selectedFiles.length]);

  // Realtime Typing Logic
  const broadcastTyping = (isTyping) => {
    if (!convId || !user) return;
    supabase.channel(`room-${convId}`).send({
      type: 'broadcast', 
      event: 'typing', 
      payload: { userId: user.id, isTyping },
    });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Typing indicators only for new messages
    if (!editMessage) {
        if (val.length > 0) {
            broadcastTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000);
        } else {
            broadcastTyping(false);
        }
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 3) {
        toast.error("Security Protocol", { description: "Maximum 3 images allowed per transmission." });
        return;
    }

    const newFiles = [];
    const newPreviews = [];

    files.forEach(file => {
        if (file.type.startsWith("image/")) {
            newFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Reset input to allow re-selection of same files if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!text.trim() && selectedFiles.length === 0) return;

    setIsSending(true);

    // --- CASE 1: EDIT MODE ---
    if (editMessage) {
        try {
             const currentCount = editMessage.edit_count || 0;
             
             // Enforce the 2-edit limit (3 versions total)
             if (currentCount >= 2) { 
                 toast.error("Integrity Error", { description: "Signal refinement limit reached (Max 2 edits)." }); 
                 onCancelEdit();
                 setIsSending(false);
                 return; 
             }

             const { error } = await supabase
                .from('messages')
                .update({ 
                    text: text, 
                    edit_count: currentCount + 1 
                })
                .eq('id', editMessage.id);

             if (error) throw error;

             toast.success("Signal Updated", { description: "The encrypted payload has been refined." });
             onCancelEdit();
             setText("");
        } catch(e) { 
            console.error(e);
            toast.error("Update Failed", { description: "Check node connectivity." }); 
        } finally {
            setIsSending(false);
        }
        return;
    }

    // --- CASE 2: NEW MESSAGE MODE ---
    broadcastTyping(false);

    try {
        let messageType = 'text';
        let metadata = replyMessage ? { 
            reply_to: { id: replyMessage.id, text: replyMessage.text.substring(0, 50) + "..." } 
        } : {};

        // A. Process Image Uploads
        if (selectedFiles.length > 0) {
            messageType = 'image_group'; 
            const uploadPromises = selectedFiles.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${convId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('chat-media')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('chat-media').getPublicUrl(fileName);
                return data.publicUrl;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            metadata.images = uploadedUrls;
        }

        // B. Execute the callback to parent
        await onSend(text, messageType, metadata);
        
        // C. Local state cleanup
        setText("");
        setSelectedFiles([]);
        setPreviews([]);
        if(onCancelReply) onCancelReply();
        setShowEmoji(false);

    } catch (error) {
        console.error(error);
        toast.error("Transmission Error", { description: "The packet could not be dispatched." });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="p-4 bg-background border-t border-border relative shrink-0">
      
      {/* --- IMAGE PREVIEW TRAY --- */}
      {previews.length > 0 && (
        <div className="flex gap-4 mb-4 overflow-x-auto pb-2 custom-scrollbar">
            {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 bg-secondary border border-border rounded-none overflow-hidden shrink-0 group">
                    <Image src={src} alt="Preview" fill className="object-cover" />
                    <button 
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                        <X size={10} />
                    </button>
                </div>
            ))}
            {previews.length < 3 && (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent transition-colors shrink-0"
                >
                    <div className="flex flex-col items-center">
                        <ImageIcon size={16} />
                        <span className="text-[9px] font-mono mt-1 uppercase">Add</span>
                    </div>
                </button>
            )}
        </div>
      )}

      {/* --- UI BANNERS (FIXED POSITIONING TO PREVENT OVERLAP) --- */}
      <AnimatePresence>
        {editMessage && (
            <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                /* Using bottom-full instead of top-0 ensures it stays above the growing textarea */
                className="absolute bottom-full left-0 right-0 bg-accent border-t border-accent p-2 flex justify-between items-center px-4 z-50 mb-px"
            >
                <span className="text-[10px] font-mono text-white uppercase flex items-center gap-2">
                    <Edit3 size={12} /> Refining Payload ({editMessage.edit_count || 0}/2)
                </span>
                <button onClick={() => { onCancelEdit(); setText(""); }} className="text-white/80 hover:text-white transition-colors">
                    <X size={14} />
                </button>
            </motion.div>
        )}

        {replyMessage && !editMessage && (
            <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                /* Using bottom-full instead of top-0 ensures it stays above the growing textarea */
                className="absolute bottom-full left-0 right-0 bg-secondary/95 border-t border-border p-2 flex justify-between items-center px-4 backdrop-blur-md z-50 mb-px"
            >
                <span className="text-[10px] font-mono text-foreground uppercase flex items-center gap-2 truncate max-w-[80%]">
                    <Reply size={12} /> Replying to: "{replyMessage.text.substring(0, 40)}..."
                </span>
                <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={14} />
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- EMOJI PICKER MODAL --- */}
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
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-background border-r border-b border-border rotate-45" />
        </div>
      )}

      {/* --- MAIN INTERFACE BAR --- */}
      <div className="relative flex items-end gap-2 bg-secondary/5 border border-border focus-within:border-accent transition-colors p-2 min-w-0">
        
        {/* Hidden File System */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleFileSelect} 
        />
        
        <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || previews.length >= 3}
            className={`p-2 transition-colors group ${previews.length >= 3 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-foreground'}`}
        >
            <Paperclip size={20} className="group-hover:rotate-12 transition-transform" />
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
            placeholder={editMessage ? "Update signal..." : selectedFiles.length > 0 ? "Add a caption..." : "TYPE_MESSAGE_INPUT..."}
            className="flex-1 bg-transparent border-none outline-none text-sm font-mono placeholder:text-zinc-700 resize-none max-h-32 min-h-[40px] py-2 custom-scrollbar"
            rows={1}
        />

        <div className="flex items-center gap-1">
            <button 
                onClick={() => setShowEmoji(!showEmoji)} 
                className={`p-2 transition-colors ${showEmoji ? 'text-accent' : 'text-zinc-500 hover:text-foreground'}`}
            >
                <Smile size={20} />
            </button>
            
            <button 
                onClick={handleSend}
                disabled={(!text.trim() && selectedFiles.length === 0) || isSending}
                className={`p-2 transition-all duration-300 
                    ${(!text.trim() && selectedFiles.length === 0) 
                        ? 'text-zinc-800 pointer-events-none opacity-50' 
                        : 'text-accent scale-110'
                    }`}
            >
                {isSending ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Send size={20} fill="currentColor" />
                )}
            </button>
        </div>
      </div>

      {/* Industrial Footer Hint */}
      <div className="hidden md:flex justify-between mt-2 px-1">
          <span className="text-[8px] font-mono text-zinc-600 uppercase">Status: Online</span>
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">Enter to transmit • Shift+Enter for line</span>
      </div>
    </div>
  );
}