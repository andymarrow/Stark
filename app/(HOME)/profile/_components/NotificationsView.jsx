"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Loader2, 
  CheckCheck,
  Bell,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import NotificationItem from "./NotificationItem"; // New sub-component

const PAGE_SIZE = 10;

export default function NotificationsView({ onNotificationRead }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); 
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  
  // Ref to prevent double-fetching
  const isLoadingRef = useRef(false);

  // --- 1. DATA FETCHING ---
  const fetchNotifications = useCallback(async (isLoadMore = false) => {
    if (!user || isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      if (!isLoadMore) setLoading(true);
      
      const currentLength = isLoadMore ? notifications.length : 0;
      const from = currentLength;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(id, username, avatar_url, full_name)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filter === "unread") query = query.eq('is_read', false);
      if (filter === "system") query = query.in('type', ['system', 'weekly_digest', 'report_resolved', 'content_takedown']);

      const { data, error } = await query;

      if (error) throw error;

      // Filtering out duplicates to be safe
      setNotifications(prev => {
        if (isLoadMore) {
            const newItems = data.filter(newItem => !prev.some(existing => existing.id === newItem.id));
            return [...prev, ...newItems];
        }
        return data;
      });

      setHasMore(data.length === PAGE_SIZE);

    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("COMM_LINK_FAILURE");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [user, filter, notifications.length]); 

  // Realtime Subscription
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('notifs-live')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        // We trigger a refresh but pass false for loadMore to just get the top items
        // Or optimally, we could just fetch the single new item.
        // For simplicity, re-fetching initial batch ensures consistency.
        fetchNotifications(false); 
        toast.info("New Signal Received");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [user, fetchNotifications]);

  // Initial Fetch on Filter Change
  useEffect(() => {
    // Reset state before fetch to avoid mixing filter results
    setNotifications([]);
    setHasMore(false);
    fetchNotifications(false);
  }, [filter]); // Removed fetchNotifications from dependency to avoid loop, though useCallback handles it.

  // --- 2. ACTIONS ---

  const handleMarkAsSeen = async (id) => {
    // 1. Optimistic UI Update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

    // 2. Database Sync
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      if (onNotificationRead) onNotificationRead();
    }
  };

  const markAllRead = async () => {
    const { error } = await supabase.rpc('mark_all_notifications_read', { target_user_id: user.id });
    if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        toast.success("BUFFER_CLEARED");
        if (onNotificationRead) onNotificationRead(); 
    }
  };

  const updateNotificationState = (id, updates) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
                <h2 className="text-xl font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">
                    <Inbox size={20} /> Signal_Inbox
                </h2>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase pl-7">
                    Unread: {notifications.filter(n => !n.is_read).length} // Total: {notifications.length}
                </p>
            </div>
            
            <div className="flex gap-2">
                {['all', 'unread', 'system'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
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
                    <CheckCheck size={12} /> Mark_All_Read
                </button>
            )}
        </div>

        {/* List */}
        <div className="space-y-2">
            {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                    <Loader2 size={24} className="animate-spin text-accent" />
                    <span className="text-xs font-mono uppercase tracking-widest">Decrypting_Signals...</span>
                </div>
            ) : notifications.length > 0 ? (
                notifications.map((notif) => (
                    <NotificationItem 
                        key={notif.id} 
                        notification={notif} 
                        onRead={handleMarkAsSeen}
                        onUpdateState={updateNotificationState}
                        currentUserId={user.id}
                    />
                ))
            ) : (
                <div className="h-40 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Bell size={24} className="opacity-20" />
                    <span className="text-xs font-mono uppercase tracking-[0.3em] opacity-50">No_Signal_Detected</span>
                </div>
            )}
        </div>

        {hasMore && (
            <div className="flex justify-center pt-4">
                <Button 
                    variant="outline" 
                    onClick={() => fetchNotifications(true)}
                    className="rounded-none border-border hover:bg-secondary font-mono text-[10px] uppercase tracking-widest px-8"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin h-3 w-3" /> : "Retrieve_Archives"}
                </Button>
            </div>
        )}
    </div>
  );
}