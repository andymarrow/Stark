"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Send, Loader2, Lock, ShieldCheck, Terminal } from "lucide-react";
import { getTransmissions, sendTransmission } from "@/app/actions/eventChatActions";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectChatTerminal({ submissionId, role }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
        setLoading(true);
        const res = await getTransmissions(submissionId);
        if (res.success) setMessages(res.data);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
    };
    initChat();

    const channel = supabase
        .channel(`submission-chat-${submissionId}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'event_chat_messages',
            filter: `submission_id=eq.${submissionId}`
        }, (payload) => {
            fetchNewMessage(payload.new.id);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [submissionId]);

  const fetchNewMessage = async (id) => {
    const { data } = await supabase
        .from('event_chat_messages')
        .select('*, sender:profiles!sender_id(id, username, avatar_url)')
        .eq('id', id)
        .single();
    
    if (data) {
        setMessages(prev => {
            if (prev.some(m => m.id === data.id)) return prev;
            return [...prev, data];
        });
        setTimeout(scrollToBottom, 50);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText;
    setInputText(""); // Clear input immediately
    setSending(true);

    // OPTIMISTIC UPDATE: Add message to UI immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
        id: tempId,
        text: textToSend,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        sender: {
            username: user.user_metadata?.username || "You",
            avatar_url: user.user_metadata?.avatar_url
        }
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    const res = await sendTransmission(submissionId, textToSend);
    
    if (!res.success) {
        // Rollback if failed
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setInputText(textToSend); // Put text back in box
        toast.error("Transmission Failed", { description: res.error });
    } else {
        // Replace temp message with real one to sync IDs
        setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    }
    setSending(false);
  };

  return (
    <div className="border border-border bg-black/60 flex flex-col h-[550px] rounded-none overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-500 font-mono">
        
        {/* TERMINAL HEADER */}
        <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-accent/10 border border-accent/20 text-accent">
                    <ShieldCheck size={16} />
                </div>
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                        COMMS_CHANNEL // {role}
                    </h3>
                    <p className="text-[8px] text-muted-foreground uppercase">Link_ID: {submissionId.slice(0, 8)}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]" />
                <span className="text-[9px] text-green-500 font-bold uppercase">Live</span>
            </div>
        </div>

        {/* MESSAGE STREAM */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/grid.svg')] bg-repeat">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                    <Loader2 className="animate-spin text-accent" size={24} />
                    <span className="text-[9px] uppercase tracking-[0.5em]">Establishing_Link...</span>
                </div>
            ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 gap-4">
                    <Terminal size={40} />
                    <p className="text-[10px] uppercase tracking-widest">Encrypted frequency open.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === user?.id;
                        const isSystem = msg.id.toString().startsWith('temp');
                        
                        return (
                            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="w-8 h-8 relative border border-border bg-secondary flex-shrink-0">
                                    <Image src={msg.sender?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="av" fill className="object-cover" />
                                </div>
                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 text-sm leading-relaxed border transition-opacity ${isSystem ? 'opacity-50' : 'opacity-100'} ${isMe ? 'bg-accent/10 border-accent/20 text-foreground' : 'bg-zinc-900 border-border text-foreground'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[7px] text-muted-foreground mt-1 uppercase">
                                        @{msg.sender?.username} // {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* INPUT TERMINAL */}
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-background flex items-center gap-3">
            <div className="text-accent font-bold text-sm">{'>'}</div>
            <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type mission report..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-foreground placeholder:text-zinc-800"
                autoFocus
            />
            <button 
                type="submit" 
                disabled={!inputText.trim() || sending}
                className="bg-accent text-white px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-red-600 disabled:opacity-50 transition-all"
            >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
        </form>
    </div>
  );
}