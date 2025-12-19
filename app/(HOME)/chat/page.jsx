"use client";
import { useState } from "react";
import ChatSidebar from "./_components/ChatSidebar";
import ChatWindow from "./_components/ChatWindow"; 
import { MessageSquareDashed } from "lucide-react";

// --- MOCK DATA WITH FRESH IMAGES ---
const MOCK_CHATS = [
  {
    id: 1,
    name: "Sarah Drasner",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop",
    lastMessage: "Perfect. Let me know when...",
    lastMessageTime: "10:42 AM",
    unreadCount: 2,
    online: true,
    isRead: false,
  },
  {
    id: 2,
    name: "Design Team",
    avatar: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=200&auto=format&fit=crop", // Group of people
    lastMessage: "Alex: We need the figma link.",
    lastMessageTime: "09:15 AM",
    unreadCount: 0,
    online: false,
    isRead: true,
  },
  {
    id: 3,
    name: "Lee Robinson",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop", // Cool developer vibe
    lastMessage: "typing...",
    lastMessageTime: "Yesterday",
    unreadCount: 5,
    online: true,
    typing: true,
    isRead: false,
  },
  { 
    id: 4, 
    name: "System Bot", 
    avatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&auto=format&fit=crop", // AI/Tech Abstract
    lastMessage: "Deployment successful.", 
    lastMessageTime: "Mon", 
    unreadCount: 0, 
    isRead: true 
  },
  { 
    id: 5, 
    name: "Josh Comeau", 
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop", // Sharp portrait
    lastMessage: "Sounds good!", 
    lastMessageTime: "Sun", 
    unreadCount: 0, 
    isRead: true 
  },
];

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState(null);

  return (
    <div className="fixed inset-0  md:top-16 bottom-16 md:bottom-0 bg-background flex overflow-hidden">
      
      {/* SIDEBAR PANE */}
      <div className={`
        w-full md:w-[350px] lg:w-[400px] flex-shrink-0 h-full border-r border-border bg-background transition-transform duration-300 ease-in-out absolute md:relative z-10
        ${selectedChatId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        <ChatSidebar 
            chats={MOCK_CHATS} 
            selectedChatId={selectedChatId} 
            onSelectChat={setSelectedChatId} 
        />
      </div>

      {/* CHAT WINDOW PANE */}
      <div className={`
        flex-1 h-full bg-secondary/5 relative transition-transform duration-300 ease-in-out absolute md:relative inset-0 md:inset-auto z-20 md:z-0
        ${selectedChatId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        md:block
      `}>
        
        {selectedChatId ? (
           // ACTIVE CHAT
           <ChatWindow 
              chatId={selectedChatId} 
              onBack={() => setSelectedChatId(null)} 
           />
        ) : (
           // EMPTY STATE
           <div className="hidden md:flex h-full flex-col items-center justify-center text-muted-foreground p-8 text-center bg-background/50">
              {/* Background Grid for Empty State */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-secondary/20 border border-border flex items-center justify-center mb-6">
                    <MessageSquareDashed size={40} className="text-accent opacity-50" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2 font-mono uppercase tracking-wide">Select a Channel</h2>
                <p className="max-w-xs font-light text-sm">
                    Choose a contact from the sidebar to initialize the secure connection.
                </p>
                <div className="mt-8 text-[10px] font-mono border border-border px-3 py-1 bg-background text-accent">
                    STATUS: AWAITING_INPUT
                </div>
              </div>
           </div>
        )}

      </div>

    </div>
  );
}