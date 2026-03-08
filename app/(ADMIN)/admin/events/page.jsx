"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, Eye, Trash2, ShieldAlert, 
  Loader2, Swords, ExternalLink, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminEventInspector from "./_components/AdminEventInspector"; // IMPORT NEW COMPONENT

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // --- INSPECTOR STATE ---
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const HEADERS = ["Event Identity", "Host Node", "Metrics", "Status Control", "Terminal"];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          host:profiles!host_id(username, email, avatar_url),
          submissions:event_submissions(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
      toast.error("Protocol Breach: Could not retrieve event ledger.");
    } finally {
      setLoading(false);
    }
  };

  // --- INSPECTOR HANDLER ---
  const openInspector = (id) => {
    setSelectedEventId(id);
    setIsInspectorOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("CRITICAL: This will permanently delete the event and all its folders. Projects will be detached but not deleted. Proceed?");
    if (!confirmed) return;
    
    try {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
        toast.success("Event purged from system");
        setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
        toast.error("Purge Failed: Insufficient privileges.");
    }
  };

  const toggleStatus = async (event, field) => {
    const newVal = !event[field];
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, [field]: newVal } : e));
    
    try {
        const { error } = await supabase.from('events').update({ [field]: newVal }).eq('id', event.id);
        if (error) throw error;
        toast.success(`Event ${field === 'is_public' ? 'visibility' : 'status'} updated`);
    } catch (err) {
        toast.error("Update failed. Reverting.");
        fetchEvents();
    }
  };

  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events.filter(e => {
        const s = search.toLowerCase();
        return (
            e.title?.toLowerCase().includes(s) || 
            e.host?.username?.toLowerCase().includes(s) ||
            e.id?.includes(s)
        );
    });
  }, [events, search]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                <Swords className="text-red-600" /> Event Oversight
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
                // System_Controller: Monitoring {events.length} protocols
            </p>
        </div>
        
        <div className="relative group w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
            <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Locate protocol..." 
                className="w-full h-12 bg-black border border-white/10 pl-10 text-xs font-mono text-white focus:border-red-600 outline-none transition-colors uppercase"
            />
        </div>
      </div>

      {/* Main Table Terminal */}
      <div className="bg-zinc-950/50">
        {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-red-600" size={32} />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.5em]">Establishing_Datalink...</span>
            </div>
        ) : filteredEvents.length > 0 ? (
            <AdminTable headers={HEADERS}>
                {filteredEvents.map((e) => (
                    <AdminRow key={e.id}>
                        {/* 1. Identity Cell */}
                        <AdminCell>
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 border border-white/10 bg-zinc-900 overflow-hidden shrink-0">
                                    {e.cover_image ? (
                                        <Image src={e.cover_image} alt="" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-800 font-bold text-[10px]">EMPTY</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-white text-xs uppercase tracking-wide truncate max-w-[180px]">
                                        {e.title || "UNTITLED"}
                                    </div>
                                    <div className="text-[9px] font-mono text-zinc-500">ID: {e.id?.slice(0,8)}</div>
                                </div>
                            </div>
                        </AdminCell>

                        {/* 2. Host Cell */}
                        <AdminCell>
                            {e.host ? (
                                <Link href={`/admin/users?search=${e.host.username}`} className="flex items-center gap-2 group">
                                    <Avatar className="w-6 h-6 border border-white/10 rounded-none">
                                        <AvatarImage src={e.host.avatar_url} />
                                        <AvatarFallback className="rounded-none text-[8px]">U</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">@{e.host.username}</span>
                                </Link>
                            ) : <span className="text-[9px] font-mono text-red-500">ORPHANED</span>}
                        </AdminCell>

                        {/* 3. Metrics Cell */}
                        <AdminCell mono>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-white">Subs: {(e.submissions && e.submissions[0]?.count) || 0}</span>
                                <span className="text-[10px] text-zinc-600">Since: {new Date(e.created_at).toLocaleDateString()}</span>
                            </div>
                        </AdminCell>

                        {/* 4. Status Cell */}
                        <AdminCell>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => toggleStatus(e, 'is_public')}
                                    className={`px-2 py-1 text-[9px] font-mono uppercase border transition-colors ${e.is_public ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-zinc-500 border-zinc-800 bg-zinc-900'}`}
                                >
                                    {e.is_public ? 'Public' : 'Private'}
                                </button>
                                <button 
                                    onClick={() => toggleStatus(e, 'is_closed')}
                                    className={`px-2 py-1 text-[9px] font-mono uppercase border transition-colors ${e.is_closed ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-blue-500 border-blue-500/30 bg-blue-500/10'}`}
                                >
                                    {e.is_closed ? 'Closed' : 'Open'}
                                </button>
                            </div>
                        </AdminCell>

                        {/* 5. Terminal Cell (Actions) */}
                        <AdminCell>
                            <div className="flex items-center gap-1">
                                {/* TRIGGER INSPECTOR MODAL */}
                                <Button 
                                    onClick={() => openInspector(e.id)} 
                                    size="icon" variant="ghost" 
                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-none"
                                >
                                    <Eye size={14} />
                                </Button>
                                <Link href={`/events/${e.id}/dashboard`} target="_blank">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 rounded-none">
                                        <ExternalLink size={14} />
                                    </Button>
                                </Link>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => handleDelete(e.id)}
                                    className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-none"
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </AdminCell>
                    </AdminRow>
                ))}
            </AdminTable>
        ) : (
            <div className="h-96 flex flex-col items-center justify-center text-zinc-700">
                <ShieldAlert size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-mono uppercase tracking-widest">Sector Clear: No records found.</p>
            </div>
        )}
      </div>

      {/* --- ADMIN OVERSIGHT MODAL --- */}
      <AdminEventInspector 
          eventId={selectedEventId} 
          isOpen={isInspectorOpen} 
          onClose={() => {
              setIsInspectorOpen(false);
              fetchEvents(); // Refresh counts after closing
          }} 
      />

    </div>
  );
}