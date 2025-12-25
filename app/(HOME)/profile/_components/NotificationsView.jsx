"use client";
import { useState, useEffect, useCallback } from "react";
import { Heart, GitFork, UserPlus, Info, MessageSquare, Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

const PAGE_SIZE = 8;

export default function NotificationsView() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); 
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

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
          sender:profiles!sender_id(username, avatar_url)
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
      toast.error("COMM_LINK_ERROR", { description: "Failed to fetch logs." });
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllRead = async () => {
    const { error } = await supabase.rpc('mark_all_notifications_read', { target_user_id: user.id });
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("SYSTEM_CLEARED", { description: "All logs marked as read." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
                <h2 className="text-xl font-bold tracking-tight uppercase">Incoming Signals</h2>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">
                    Buffer_Status: {notifications.filter(n => !n.is_read).length} Unread
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
        {notifications.some(n => !n.is_read) && (
            <div className="flex justify-end">
                <button 
                    onClick={markAllRead}
                    className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-accent uppercase transition-colors"
                >
                    <CheckCheck size={12} /> Clear_All_Pending
                </button>
            </div>
        )}

        {/* List */}
        <div className="space-y-2">
            {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                    <Loader2 size={24} className="animate-spin text-accent" />
                    <span className="text-xs font-mono">SCANNING_FREQUENCIES...</span>
                </div>
            ) : notifications.length > 0 ? (
                notifications.map((notif) => (
                    <div 
                        key={notif.id} 
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                        className={`flex items-start gap-4 p-4 border border-border bg-background transition-all group ${!notif.is_read ? 'border-l-2 border-l-accent bg-accent/[0.02]' : 'opacity-70'}`}
                    >
                        {/* Sender Avatar */}
                        <div className="relative w-10 h-10 border border-border bg-secondary flex-shrink-0">
                            {notif.sender?.avatar_url ? (
                                <Image src={notif.sender.avatar_url} alt="sender" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                                    <Info size={16} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <TypeIcon type={notif.type} />
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">
                                    {notif.type} // {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm leading-tight">
                                {notif.sender?.username && (
                                    <Link href={`/profile/${notif.sender.username}`} className="font-bold hover:text-accent mr-1">
                                        @{notif.sender.username}
                                    </Link>
                                )}
                                <span className="text-muted-foreground">{notif.message}</span>
                            </p>
                        </div>

                        {notif.link && (
                            <Link href={notif.link}>
                                <Button variant="outline" size="sm" className="h-8 rounded-none border-border font-mono text-[10px] uppercase hidden sm:flex">
                                    View
                                </Button>
                            </Link>
                        )}
                    </div>
                ))
            ) : (
                <div className="h-40 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <span className="text-xs font-mono uppercase tracking-[0.3em]">No_New_Data</span>
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
                    Retrieve Older Packets
                </Button>
            </div>
        )}
    </div>
  );
}

function TypeIcon({ type }) {
    const props = { size: 12 };
    switch(type) {
        case 'like': return <Heart {...props} className="text-red-500 fill-red-500" />;
        case 'follow': return <UserPlus {...props} className="text-blue-500" />;
        case 'chat_request': return <MessageSquare {...props} className="text-accent" />;
        default: return <Info {...props} className="text-zinc-500" />;
    }
}