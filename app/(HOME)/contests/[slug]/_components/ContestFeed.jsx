"use client";
import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { hasLiveDemo } from "@/lib/projectDemo";
import { supabase } from "@/lib/supabaseClient";
import FeedItem from "@/app/(HOME)/explore/_components/feed/FeedItem"; // Reuse existing FeedItem
import FeedModal from "@/app/(HOME)/explore/_components/feed/FeedModal"; // Reuse existing FeedModal
import { Loader2 } from "lucide-react";

export default function ContestFeed({ contestId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [initialIndex, setInitialIndex] = useState(0);
  const [demoOnly, setDemoOnly] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data } = await supabase
        .from('contest_submissions')
        .select(`
            id,
            submitted_at,
            project:projects!inner (
                id, title, slug, description, thumbnail_url, images, likes_count, views, created_at, tags, source_link, demo_link, additional_links,
                owner:profiles!projects_owner_id_fkey (username, full_name, avatar_url)
            )
        `)
        .eq('contest_id', contestId)
        .order('submitted_at', { ascending: false });

      if (data) {
        // Map to FeedItem format with Deduplication
        const formatted = data.map(sub => {
            const rawImages = sub.project.images || [];
            const thumbnail = sub.project.thumbnail_url;
            
            // Deduplicate: Create Set from thumbnail + images, filtering out nulls
            const uniqueMedia = [...new Set([thumbnail, ...rawImages].filter(Boolean))];

            return {
                id: sub.project.id,
                slug: sub.project.slug,
                title: sub.project.title,
                description: sub.project.description,
                created_at: sub.submitted_at, // Use submission time for feed
                author: sub.project.owner,
                likes: sub.project.likes_count,
                views: sub.project.views,
                media: uniqueMedia, // Fixed: No duplicates
                tech: sub.project.tags,
                source_link: sub.project.source_link,
                demo_link: sub.project.demo_link,
                additional_links: sub.project.additional_links,
                type: 'project'
            };
        });
        setItems(formatted);
      }
      setLoading(false);
    };

    fetchFeed();
  }, [contestId]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>;

  if (items.length === 0) {
    return (
        <div className="py-20 text-center border border-dashed border-border bg-secondary/5">
            <p className="text-sm font-mono text-muted-foreground uppercase">No feed data available.</p>
        </div>
    );
  }

  const demoCount = items.filter(hasLiveDemo).length;
  const visible = demoOnly ? items.filter(hasLiveDemo) : items;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        {/* Same filter as the grid view, so switching layout doesn't
            silently drop what you were looking at. */}
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-xs font-mono text-muted-foreground uppercase">
                {demoOnly ? `${visible.length} of ${items.length} Entries` : `All Entries (${items.length})`}
            </span>
            <button
                onClick={() => setDemoOnly((v) => !v)}
                aria-pressed={demoOnly}
                className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    demoOnly
                        ? "bg-emerald-500 border-emerald-500 text-black"
                        : "border-border text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/50"
                }`}
            >
                <Globe size={11} strokeWidth={2.5} />
                Has Demo
                <span className={demoOnly ? "opacity-70" : "opacity-50"}>({demoCount})</span>
            </button>
        </div>

        {visible.length === 0 && (
            <div className="py-16 text-center border border-dashed border-border bg-secondary/5">
                <p className="text-sm font-mono text-muted-foreground uppercase">No entries have a demo link yet</p>
                <button onClick={() => setDemoOnly(false)} className="mt-2 text-xs font-mono text-accent hover:underline uppercase">Clear filter</button>
            </div>
        )}

        {visible.map((item) => (
            <FeedItem 
                key={item.id} 
                item={item} 
                onOpen={(it, idx) => { setSelectedItem(it); setInitialIndex(idx); }} 
            />
        ))}

        <FeedModal 
            item={selectedItem} 
            isOpen={!!selectedItem} 
            onClose={() => setSelectedItem(null)} 
            initialIndex={initialIndex}
        />
    </div>
  );
}