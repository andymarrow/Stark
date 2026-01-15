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

export default function FeedContainer() {
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

  // 1. Initial Fetch (Reset on Tab Change)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setItems([]); // Clear previous
    loadFeed(1, true);
  }, [activeTab]);

  // 2. Fetch Logic
  const loadFeed = async (pageNum, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setFetchingMore(true);
    
    const { data, hasMore: more } = await getFeedContent({ 
        filter: activeTab, 
        page: pageNum 
    });

    if (isInitial) {
        setItems(data);
    } else {
        setItems(prev => [...prev, ...data]);
    }
    
    setHasMore(more);
    if (isInitial) setLoading(false);
    else setFetchingMore(false);
  };

  // 3. Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !fetchingMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadFeed(nextPage, false);
        }
    }, {
        root: null,
        rootMargin: "200px", // Load before hitting bottom
        threshold: 0.1
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    
    return () => {
        if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading, fetchingMore, page, activeTab]);

  return (
    <div className="max-w-2xl mx-auto pb-20">
        
        {/* Feed Filters */}
        <div className="flex items-center justify-center gap-4 mb-8 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-30 pt-4">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
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
                <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-accent" />
                </div>
            )}

            {/* Loading State (Infinite Scroll) */}
            {!loading && hasMore && (
                <div ref={loaderRef} className="py-8 flex justify-center opacity-50">
                    <Loader2 className="animate-spin text-muted-foreground" size={20} />
                </div>
            )}
            
            {/* End of Feed */}
            {!loading && !hasMore && items.length > 0 && (
                <div className="py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest border-t border-dashed border-border mt-8">
                    End of Transmission
                </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && (
                <div className="py-20 text-center text-muted-foreground font-mono text-xs uppercase border border-dashed border-border mt-8">
                    No signals found in this sector.
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