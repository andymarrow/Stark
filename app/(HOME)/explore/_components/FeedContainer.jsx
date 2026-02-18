"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, RefreshCw, Radio } from "lucide-react";
import { getFeedContent } from "@/app/actions/getFeed"; 
import FeedItem from "./feed/FeedItem";
import FeedModal from "./feed/FeedModal";

const TABS = [
    { id: 'for_you', label: 'For You' },
    { id: 'today', label: 'Today' },
    { id: 'network', label: 'Network' }
];

/**
 * FEED_CONTAINER
 * Handles the scrollable stream of projects and changelogs.
 * Interfaces with the getFeedContent server action.
 */
export default function FeedContainer({ activeMention }) {
  const [activeTab, setActiveTab] = useState("for_you");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [fetchingMore, setFetchingMore] = useState(false); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Modal State for inspecting items in the stream
  const [modalItem, setModalItem] = useState(null);
  const [modalIndex, setModalIndex] = useState(0);

  // Infinite Scroll Observer Ref
  const loaderRef = useRef(null);

  // 1. Initial Fetch Logic
  // Triggers when the tab changes or when an Admin Mention is selected in the UI
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setItems([]); 
    loadFeed(1, true);
  }, [activeTab, activeMention]); 

  // 2. Data Fetcher
  const loadFeed = async (pageNum, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setFetchingMore(true);
    
    /**
     * Note: The server action 'getFeedContent' is responsible for 
     * enforcing the '.eq("is_contest_entry", false)' rule.
     */
    const { data, hasMore: more } = await getFeedContent({ 
        filter: activeTab, 
        page: pageNum,
        mention: activeMention 
    });

    if (isInitial) {
        setItems(data);
    } else {
        // Prevent duplicates in the stream during rapid scrolling
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

  // 3. Intersection Observer (Infinite Scroll)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !fetchingMore) {
            setPage(prev => {
                const nextPage = prev + 1;
                loadFeed(nextPage, false);
                return nextPage;
            });
        }
    }, {
        root: null,
        rootMargin: "600px", // Trigger earlier for seamless scroll
        threshold: 0.1
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    
    return () => {
        if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading, fetchingMore]);

  return (
    <div className="max-w-2xl mx-auto pb-20 px-0 sm:px-4">
        
        {/* Feed Control Bar */}
        <div className="flex items-center justify-center gap-2 mb-8 border-b border-border sticky top-16 bg-background/95 backdrop-blur-md z-30 pt-4">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        pb-3 px-4 text-[10px] font-mono uppercase tracking-[0.2em] border-b-2 transition-all duration-300
                        ${activeTab === tab.id 
                            ? 'border-accent text-foreground font-bold' 
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
                    `}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* The Stream */}
        <div className="min-h-[600px] space-y-px bg-border">
            {items.map((item) => (
                <FeedItem 
                    key={`${item.type}-${item.id}`} 
                    item={item} 
                    onOpen={(itm, idx) => { setModalItem(itm); setModalIndex(idx); }}
                />
            ))}

            {/* Loading / Infinite Scroll Sentinel */}
            <div ref={loaderRef} className="bg-background">
                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-4">
                        <div className="relative">
                            <Loader2 className="animate-spin text-accent" size={32} />
                            <Radio className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent opacity-20" size={16} />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.4em] animate-pulse">
                            Synchronizing_Nodes...
                        </span>
                    </div>
                ) : hasMore ? (
                    <div className="py-12 flex justify-center bg-background">
                        <Loader2 className="animate-spin text-muted-foreground opacity-30" size={20} />
                    </div>
                ) : items.length > 0 ? (
                    <div className="py-20 text-center bg-background border-t border-border border-dashed">
                        <div className="inline-block px-6 py-2 border border-border text-muted-foreground font-mono text-[9px] uppercase tracking-[0.5em]">
                            End_of_Stream
                        </div>
                    </div>
                ) : null}
            </div>

            {/* No Data State */}
            {!loading && items.length === 0 && (
                <div className="py-40 text-center bg-background border border-dashed border-border mt-8 mx-4">
                    <div className="text-muted-foreground font-mono text-xs uppercase tracking-widest mb-3">
                        Zero frequencies detected.
                    </div>
                    {activeMention ? (
                         <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/5 border border-accent/20 text-accent font-mono text-[10px] uppercase">
                            Target: @{activeMention}
                         </div>
                    ) : (
                        <p className="text-[10px] text-zinc-600 font-mono uppercase">
                            Adjust filters or expand network scope.
                        </p>
                    )}
                </div>
            )}
        </div>

        {/* Global Inspection Modal */}
        <FeedModal 
            isOpen={!!modalItem} 
            onClose={() => setModalItem(null)} 
            item={modalItem} 
            initialIndex={modalIndex} 
        />
    </div>
  );
}