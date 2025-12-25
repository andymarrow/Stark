"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  Heart, 
  UserPlus, 
  Info, 
  MessageSquare, 
  Loader2, 
  CheckCheck,
  ArrowRightLeft,
  Eye,
  Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

const PAGE_SIZE = 8;

export default function NotificationsView({ onNotificationRead }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); 
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // --- 1. DATA FETCHING ---
  const fetchNotifications = useCallback(async (isLoadMore = false) => {
    if (!user) return;
    
    try {
      if (!isLoadMore) setLoading(true);
      
      const from = isLoadMore ? notifications.length : 0;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(id, username, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filter === "unread") query = query.eq('is_read', false);
      if (filter === "system") query = query.eq('type', 'system');

      const { data, error } = await query;

      if (error) throw error;

      setNotifications(prev => isLoadMore ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("COMM_LINK_FAILURE");
    } finally {
      setLoading(false);
    }
  }, [user, filter]); 

  useEffect(() => {
    fetchNotifications();
  }, [filter, fetchNotifications]);

  // --- 2. ACTIONS ---

  const handleMarkAsSeen = async (id) => {
    // 1. Optimistic UI Update
    if (filter === "unread") {
        // If unread tab, remove immediately
        setNotifications(prev => prev.filter(n => n.id !== id));
    } else {
        // If all tab, dim it
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }

    // 2. Database Sync
    // NOTE: This requires an RLS UPDATE policy on the 'notifications' table!
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      if (onNotificationRead) onNotificationRead();
    } else {
      console.error("Failed to update notification status", error);
      // Revert fetch on error to ensure consistency
      fetchNotifications();
    }
  };

  const handleConnectBack = async (notif) => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: notif.sender_id });
      
      if (error) throw error;

      toast.success(`Connected with @${notif.sender.username}`);
      handleMarkAsSeen(notif.id); // Mark as seen after connecting
    } catch (err) {
      toast.error("Handshake Failed", { description: "You might already be connected." });
      handleMarkAsSeen(notif.id); // Still mark as seen to clear the queue
    }
  };

  const markAllRead = async () => {
    const { error } = await supabase.rpc('mark_all_notifications_read', { target_user_id: user.id });
    if (!error) {
        if (filter === "unread") {
            setNotifications([]);
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
        toast.success("SYSTEM_CLEARED");
        if (onNotificationRead) onNotificationRead(); 
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
                <h2 className="text-xl font-bold tracking-tight uppercase tracking-widest">Signal_Inbox</h2>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase">
                    Buffer: {notifications.filter(n => !n.is_read).length} PENDING_ACK
                </p>
            </div>
            
            <div className="flex gap-2">
                {['all', 'unread', 'system'].map((f) => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setNotifications([]); }}
                        className={`
                            px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-all
                            ${filter === f 
                                ? "bg-accent text-white border-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                : "bg-background border-border text-muted-foreground hover:text-foreground"}
                        `}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end min-h-[20px]">
            {notifications.some(n => !n.is_read) && (
                <button 
                    onClick={markAllRead}
                    className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-accent uppercase transition-colors"
                >
                    <CheckCheck size={12} /> Acknowledge_All_Signals
                </button>
            )}
        </div>

        {/* List */}
        <div className="space-y-2">
            {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                    <Loader2 size={24} className="animate-spin text-accent" />
                    <span className="text-xs font-mono uppercase tracking-widest">Scanning_Packets...</span>
                </div>
            ) : notifications.length > 0 ? (
                notifications.map((notif) => (
                    <div 
                        key={notif.id} 
                        className={`flex items-start gap-4 p-4 border border-border bg-background transition-all group relative 
                          ${!notif.is_read 
                            ? 'border-l-2 border-l-accent bg-accent/[0.03] opacity-100 shadow-[inset_4px_0px_0px_0px_rgba(255,0,0,0.05)]' 
                            : 'opacity-50 grayscale-[0.5]' // DIMMED STATE FOR SEEN
                          }`}
                    >
                        {/* Sender Avatar */}
                        <Link href={`/profile/${notif.sender?.username}`} className="relative w-10 h-10 border border-border bg-secondary flex-shrink-0 overflow-hidden hover:border-accent transition-colors">
                            <Image 
                              src={notif.sender?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                              alt="sender" fill className="object-cover" 
                            />
                        </Link>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <TypeIcon type={notif.type} isRead={notif.is_read} />
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">
                                    {notif.type} // {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className={`text-sm leading-tight ${notif.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {notif.sender?.username && (
                                    <Link href={`/profile/${notif.sender.username}`} className="font-bold hover:text-accent mr-1">
                                        @{notif.sender.username}
                                    </Link>
                                )}
                                <span>{notif.message}</span>
                            </p>
                        </div>

                        {/* DYNAMIC ACTION BUTTONS */}
                        <div className="flex items-center gap-2">
                            {/* Connect Back Button for Follows (Only visible if Unread) */}
                            {notif.type === 'follow' && !notif.is_read && (
                                <Button 
                                    onClick={() => handleConnectBack(notif)}
                                    variant="outline" 
                                    className="h-8 rounded-none border-accent/50 text-accent hover:bg-accent hover:text-white font-mono text-[10px] uppercase hidden sm:flex"
                                >
                                    <ArrowRightLeft size={12} className="mr-2" /> Connect_Back
                                </Button>
                            )}

                            {/* View Button for Likes/Projects - CLICKING THIS NO LONGER MARKS AS READ */}
                            {notif.link && (
                                <Link href={notif.link}>
                                    <Button 
                                        variant="outline" 
                                        className={`h-8 rounded-none font-mono text-[10px] uppercase hidden sm:flex transition-all 
                                          ${notif.is_read ? 'border-border text-muted-foreground' : 'border-border hover:border-foreground'}`}
                                    >
                                        <Eye size={12} className="mr-2" /> View
                                    </Button>
                                </Link>
                            )}

                            {/* Mark as Read Button (The "Check") */}
                            {!notif.is_read ? (
                                <button 
                                    onClick={() => handleMarkAsSeen(notif.id)}
                                    className="p-1.5 border border-transparent hover:border-accent hover:text-accent transition-all text-muted-foreground"
                                    title="Acknowledge Signal"
                                >
                                    <Check size={16} />
                                </button>
                            ) : (
                                <div className="p-1.5 text-zinc-800">
                                    <CheckCheck size={16} />
                                </div>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="h-40 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <span className="text-xs font-mono uppercase tracking-[0.3em] opacity-30">Static_Noise_Only</span>
                </div>
            )}
        </div>

        {hasMore && (
            <div className="flex justify-center pt-4">
                <Button 
                    variant="outline" 
                    onClick={() => fetchNotifications(true)}
                    className="rounded-none border-border hover:bg-secondary font-mono text-[10px] uppercase tracking-widest px-8"
                >
                    Retrieve_Historical_Logs
                </Button>
            </div>
        )}
    </div>
  );
}

function TypeIcon({ type, isRead }) {
    const props = { size: 12 };
    if (isRead) {
        switch(type) {
            case 'like': return <Heart {...props} className="text-zinc-700" />;
            case 'follow': return <UserPlus {...props} className="text-zinc-700" />;
            case 'chat_request': return <MessageSquare {...props} className="text-zinc-700" />;
            default: return <Info {...props} className="text-zinc-700" />;
        }
    }
    switch(type) {
        case 'like': return <Heart {...props} className="text-red-500 fill-red-500" />;
        case 'follow': return <UserPlus {...props} className="text-blue-500" />;
        case 'chat_request': return <MessageSquare {...props} className="text-accent" />;
        default: return <Info {...props} className="text-zinc-500" />;
    }
}