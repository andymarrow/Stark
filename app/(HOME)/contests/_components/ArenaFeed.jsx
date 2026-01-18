"use client";
import { useState, useEffect } from "react";
import { Loader2, Flame, Clock, Users, Terminal } from "lucide-react";
import FeedItem from "@/app/(HOME)/explore/_components/feed/FeedItem";
import FeedModal from "@/app/(HOME)/explore/_components/feed/FeedModal";
import { getArenaFeed } from "@/app/actions/getArenaFeed";

export default function ArenaFeed() {
  const [filter, setFilter] = useState("for_you");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchFeed = async (isNewFilter = false) => {
    setLoading(true);
    const currentPage = isNewFilter ? 1 : page;
    const res = await getArenaFeed({ filter, page: currentPage });
    
    if (isNewFilter) setItems(res.data);
    else setItems(prev => [...prev, ...res.data]);
    
    setHasMore(res.hasMore);
    setLoading(false);
  };

  useEffect(() => { fetchFeed(true); }, [filter]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
        
        {/* SUB-FILTER BAR */}
        <div className="flex items-center gap-2 bg-secondary border border-border p-1 w-fit mx-auto md:mx-0">
            <FilterBtn active={filter === 'for_you'} onClick={() => setFilter('for_you')} icon={Flame} label="For You" />
            <FilterBtn active={filter === 'today'} onClick={() => setFilter('today')} icon={Clock} label="Today" />
            <FilterBtn active={filter === 'network'} onClick={() => setFilter('network')} icon={Users} label="Network" />
        </div>

        {/* FEED ITEMS */}
        <div className="space-y-4">
            {items.map((item) => (
                <FeedItem 
                    key={item.id} 
                    item={item} 
                    onOpen={(it, idx) => setSelectedItem({ ...it, initialIndex: idx })} 
                />
            ))}

            {loading && (
                <div className="py-10 flex justify-center">
                    <Loader2 className="animate-spin text-accent" />
                </div>
            )}

            {!loading && hasMore && (
                <button 
                    onClick={() => { setPage(p => p + 1); fetchFeed(); }}
                    className="w-full py-4 border border-dashed border-border text-[10px] font-mono text-muted-foreground hover:text-foreground uppercase transition-colors"
                >
                    <Terminal size={14} className="inline mr-2" /> Load_More_Entries()
                </button>
            )}
        </div>

        <FeedModal 
            item={selectedItem} 
            isOpen={!!selectedItem} 
            onClose={() => setSelectedItem(null)} 
            initialIndex={selectedItem?.initialIndex || 0}
        />
    </div>
  );
}

function FilterBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-mono uppercase transition-all
                ${active ? 'bg-accent text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <Icon size={12} /> {label}
        </button>
    )
}