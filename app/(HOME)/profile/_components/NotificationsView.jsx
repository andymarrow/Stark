"use client";
import { useState, useMemo } from "react";
import { Heart, GitFork, UserPlus, Info, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

// Generate 20 Notifications
const generateNotifs = () => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    type: ['like', 'fork', 'follow', 'system', 'mention'][i % 5],
    user: i % 4 === 3 ? null : `User_${i}`,
    text: i % 5 === 0 ? "liked your project" : i % 5 === 1 ? "forked your repo" : i % 5 === 2 ? "started following you" : i % 5 === 3 ? "System Alert: Maintenance scheduled" : "mentioned you in a comment",
    time: `${i * 10 + 2}m ago`,
    read: i > 5 // First 6 are unread
}));

const ALL_NOTIFS = generateNotifs();
const PAGE_SIZE = 6;

export default function NotificationsView() {
  const [filter, setFilter] = useState("all"); 
  const [page, setPage] = useState(1);

  // Filter Logic
  const filteredNotifs = useMemo(() => {
    return ALL_NOTIFS.filter(n => {
        if (filter === "unread") return !n.read;
        if (filter === "system") return n.type === "system";
        return true;
    });
  }, [filter]);

  // Pagination Slice
  const displayedNotifs = filteredNotifs.slice(0, page * PAGE_SIZE);
  const hasMore = displayedNotifs.length < filteredNotifs.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
            
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {['all', 'unread', 'system'].map((f) => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`
                            px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-all
                            ${filter === f 
                                ? "bg-accent text-white border-accent" 
                                : "bg-background border-border text-muted-foreground hover:text-foreground"}
                        `}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>

        {/* Notification List */}
        <div className="space-y-2">
            {displayedNotifs.length > 0 ? (
                displayedNotifs.map((notif) => (
                    <div key={notif.id} className={`flex items-start gap-4 p-4 border border-border bg-background transition-all hover:border-accent/50 ${!notif.read ? 'bg-secondary/5 border-l-2 border-l-accent' : ''}`}>
                        
                        {/* Icon Box */}
                        <div className={`w-8 h-8 flex flex-shrink-0 items-center justify-center border border-border ${!notif.read ? 'bg-background' : 'bg-secondary'}`}>
                            {notif.type === 'like' && <Heart size={14} className="text-red-500" />}
                            {notif.type === 'fork' && <GitFork size={14} className="text-blue-500" />}
                            {notif.type === 'follow' && <UserPlus size={14} className="text-green-500" />}
                            {notif.type === 'system' && <Info size={14} className="text-accent" />}
                            {notif.type === 'mention' && <MessageSquare size={14} className="text-yellow-500" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                                {notif.user && <span className="font-bold mr-1">{notif.user}</span>} 
                                {notif.text}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-1">{notif.time}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {!notif.read && (
                                <button className="text-xs text-accent hover:underline font-mono hidden sm:block">Mark Read</button>
                            )}
                            {!notif.read && <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />}
                        </div>
                    </div>
                ))
            ) : (
                <div className="h-32 border border-dashed border-border flex items-center justify-center text-muted-foreground font-mono text-xs">
                    NO_NOTIFICATIONS_FOUND
                </div>
            )}
        </div>

        {/* Load More Button */}
        {hasMore && (
            <div className="flex justify-center pt-4">
                <Button 
                    variant="outline" 
                    onClick={() => setPage(p => p + 1)}
                    className="rounded-none border-border hover:bg-secondary font-mono text-xs uppercase"
                >
                    Load Older Notifications
                </Button>
            </div>
        )}
    </div>
  )
}