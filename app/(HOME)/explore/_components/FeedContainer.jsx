"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { getFeedContent } from "@/app/actions/getFeed"; 
import FeedItem from "./feed/FeedItem";
import FeedModal from "./feed/FeedModal";

const TABS = [
    { id: 'for_you', label: 'For You' },
    { id: 'today', label: 'Today' },
    { id: 'network', label: 'Network' }
];

export default function FeedContainer({ activeMention }) {
  const [activeTab, setActiveTab] = useState("for_you");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // Initial load
  const [fetchingMore, setFetchingMore] = useState(false); // Background fetch
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Modal State
  const [modalItem, setModalItem] = useState(null);
  const [modalIndex, setModalIndex] = useState(0);

  // Infinite Scroll Ref
  const loaderRef = useRef(null);

  // 1. Initial Fetch (Reset on Tab Change OR Mention Change)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setItems([]); // Clear previous data
    loadFeed(1, true);
  }, [activeTab, activeMention]); // Trigger refresh when mention is selected

  // 2. Fetch Logic
  const loadFeed = async (pageNum, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setFetchingMore(true);
    
    // Pass activeMention to the server action
    const { data, hasMore: more } = await getFeedContent({ 
        filter: activeTab, 
        page: pageNum,
        mention: activeMention // Passing the username to filter
    });

    if (isInitial) {
        setItems(data);
    } else {
        // Prevent duplicates in case of race conditions
        setItems(prev => {
            const existingIds = new Set(prev.map(i => `${i.type}-${i.id}`));
            const filteredNew = data.filter(i => !existingIds.has(`${i.type}-${i.id}`));
            return [...prev, ...filteredNew];
        });
    }
    
    setHasMore(more);
    if (isInitial) setLoading(false);
    else setFetchingMore(false);
  };

  // 3. Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        const target = entries[0];
        // Only trigger if intersecting AND we have more to load AND not already fetching
        if (target.isIntersecting && hasMore && !loading && !fetchingMore) {
            setPage(prev => {
                const nextPage = prev + 1;
                loadFeed(nextPage, false);
                return nextPage;
            });
        }
    }, {
        root: null,
        rootMargin: "400px", // Increased margin for smoother infinite scroll
        threshold: 0.1
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    
    return () => {
        if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading, fetchingMore]);

  return (
    <div className="max-w-2xl mx-auto pb-20">
        
        {/* Feed Filters */}
        <div className="flex items-center justify-center gap-4 mb-8 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-30 pt-4">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? 'border-accent text-foreground font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Feed Content */}
        <div className="min-h-[500px]">
            {items.map((item) => (
                <FeedItem 
                    key={`${item.type}-${item.id}`} 
                    item={item} 
                    onOpen={(itm, idx) => { setModalItem(itm); setModalIndex(idx); }}
                />
            ))}

            {/* Loading State (Initial) */}
            {loading && (
                <div className="py-20 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-accent" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Scanning_Frequencies...</span>
                </div>
            )}

            {/* Loading State (Infinite Scroll) */}
            {!loading && hasMore && (
                <div ref={loaderRef} className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-muted-foreground opacity-50" size={20} />
                </div>
            )}
            
            {/* End of Feed */}
            {!loading && !hasMore && items.length > 0 && (
                <div className="py-16 text-center">
                    <div className="inline-block px-4 py-1 border border-border border-dashed text-muted-foreground font-mono text-[9px] uppercase tracking-[0.3em]">
                        End_of_Transmission
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && (
                <div className="py-32 text-center border border-dashed border-border mt-8 bg-secondary/5">
                    <div className="text-muted-foreground font-mono text-xs uppercase tracking-widest mb-2">No signals found in this sector.</div>
                    {activeMention && (
                         <p className="text-[10px] font-mono text-accent uppercase">Filter: @{activeMention}</p>
                    )}
                </div>
            )}
        </div>

        {/* Modal */}
        <FeedModal 
            isOpen={!!modalItem} 
            onClose={() => setModalItem(null)} 
            item={modalItem} 
            initialIndex={modalIndex} 
        />
    </div>
  );
}