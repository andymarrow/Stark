"use client";
import { useState, useRef, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

// --- MOCK MESSAGES ---
const INITIAL_MESSAGES = [
    { id: 1, text: "Hey! I saw the pull request you submitted.", time: "10:30 AM", isMe: false, read: true },
    { id: 2, text: "Yeah, I optimized the database queries. Should be 20% faster now.", time: "10:32 AM", isMe: true, read: true },
    { id: 3, text: "That's awesome. Did you run the migration tests?", time: "10:33 AM", isMe: false, read: true },
    { id: 4, text: "Running them locally now. Will update the ticket in 5 mins.", time: "10:35 AM", isMe: true, read: true },
    { id: 5, text: "Perfect. Let me know when it's deployed.", time: "10:42 AM", isMe: false, read: true },
];

export default function ChatWindow({ chatId, onBack }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const scrollRef = useRef(null);

  // Mock User Data based on ID (In real app, fetch this)
  const user = {
    name: "Sarah Drasner",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    online: true
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text) => {
    const newMessage = {
        id: Date.now(),
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        read: false
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      
      {/* 1. Header */}
      <ChatHeader user={user} onBack={onBack} />

      {/* 2. Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth relative"
      >
        {/* Background Grid Pattern for the Chat Area */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Date Divider (Demo) */}
        <div className="flex justify-center mb-6">
            <span className="bg-secondary/30 text-muted-foreground text-[10px] font-mono px-3 py-1 rounded-full border border-border">
                Today, {new Date().toLocaleDateString()}
            </span>
        </div>

        {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isMe={msg.isMe} />
        ))}
      </div>

      {/* 3. Input Area */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}