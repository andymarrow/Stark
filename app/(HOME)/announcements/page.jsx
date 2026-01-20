"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Search, Calendar as CalIcon, Clock, X } from "lucide-react";
import AnnouncementItem from "./_components/AnnouncementItem"; 
import AnnouncementModal from "./_components/AnnouncementModal"; 
import AnnouncementTimeline from "./_components/AnnouncementTimeline"; 
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const CATEGORIES = ["all", "update", "event", "hiring", "alert", "exciting"];

// --- EXACT DATE PICKER FROM CREATION PAGE ---
const DateTimePicker = ({ label, value, onChange, onClear }) => {
  const inputRef = useRef(null);

  return (
    <div className="relative group cursor-pointer flex-1 md:flex-none" onClick={() => inputRef.current?.showPicker()}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-red-600 transition-colors pointer-events-none">
          <CalIcon size={14} />
        </div>
        <input 
          ref={inputRef}
          type="datetime-local" 
          value={value}
          onChange={onChange}
          className="w-full md:w-[200px] pl-9 pr-8 rounded-none bg-secondary/10 border border-border text-[10px] uppercase cursor-pointer font-mono h-10 outline-none focus:border-red-600 transition-colors" 
        />
        {value && (
            <button 
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-600 transition-colors"
            >
                <X size={14} />
            </button>
        )}
    </div>
  );
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateStr, setDateStr] = useState(""); // Native input uses string
  const [category, setCategory] = useState("all");

  const [modalItem, setModalItem] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [dateStr, search, category]); 

  const fetchAnnouncements = async () => {
    setLoading(true);
    let query = supabase
        .from('announcements')
        .select('*')
        .eq('status', 'published')
        .order('scheduled_for', { ascending: false });

    if (search) query = query.ilike('title', `%${search}%`);
    if (dateStr) query = query.gte('created_at', new Date(dateStr).toISOString());
    if (category !== "all") query = query.eq('category', category);

    const { data, error } = await query;
    if (error) console.error(error);
    
    setItems(data || []);
    setLoading(false);
  };

  const handleTimelineSelect = (item) => {
      setModalItem(item);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-8">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header - Hidden or minimized on mobile if desired, keeping for context */}
        <div className="hidden md:block mb-8">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
                System <span className="text-red-600">Broadcasts</span>
            </h1>
            <p className="font-mono text-sm text-muted-foreground max-w-lg">
                Official changelog and transmission logs from the Core Team.
            </p>
        </div>

        {/* --- CONDENSED TOOLBAR --- */}
        <div className="flex flex-col gap-2 mb-6 sticky top-0 md:top-16 z-40 bg-background/95 p-2 md:p-4 border-b md:border border-border backdrop-blur-md shadow-sm -mx-4 md:mx-0">
            
            <div className="flex flex-col md:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="SEARCH_LOGS..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 rounded-none bg-secondary/5 border-border focus:border-red-600 font-mono text-[10px] uppercase"
                    />
                </div>

                {/* Date Picker (Custom Stark Version) */}
                <DateTimePicker 
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    onClear={() => setDateStr("")}
                />
            </div>
            
            {/* Categories - Horizontal Scroll on Mobile */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide border-t border-border/30 pt-2 md:border-none md:pt-0">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`
                            px-3 h-8 rounded-none text-[9px] font-mono uppercase border transition-all whitespace-nowrap
                            ${category === cat 
                                ? 'bg-red-600 text-white border-red-600' 
                                : 'bg-background border-border text-muted-foreground hover:text-foreground'}
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex flex-col lg:flex-row gap-12 items-start">
            
            {/* Feed (Left) */}
            <div className="flex-1 w-full space-y-px bg-border border border-border shadow-2xl">
                {loading ? (
                    <div className="p-20 flex justify-center bg-background">
                        <Loader2 className="animate-spin text-red-600" />
                    </div>
                ) : items.length > 0 ? (
                    items.map(item => (
                        <AnnouncementItem 
                            key={item.id} 
                            item={item} 
                            onOpen={() => setModalItem(item)} 
                        />
                    ))
                ) : (
                    <div className="p-20 text-center bg-background">
                        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                            No transmissions found in current sector.
                        </p>
                    </div>
                )}
            </div>

            {/* Timeline (Right - Desktop Only) */}
            <div className="hidden lg:block">
                <AnnouncementTimeline 
                    items={items} 
                    onSelect={handleTimelineSelect}
                    activeId={modalItem?.id}
                />
            </div>

        </div>

      </div>

      {/* Modal */}
      <AnnouncementModal 
        isOpen={!!modalItem} 
        onClose={() => setModalItem(null)} 
        item={modalItem} 
      />
    </div>
  );
}