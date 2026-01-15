"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import FeedItem from "@/app/(HOME)/explore/_components/feed/FeedItem"; // Reuse existing FeedItem
import FeedModal from "@/app/(HOME)/explore/_components/feed/FeedModal"; // Reuse existing FeedModal
import { Loader2 } from "lucide-react";

export default function ContestFeed({ contestId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [initialIndex, setInitialIndex] = useState(0);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data } = await supabase
        .from('contest_submissions')
        .select(`
            id,
            submitted_at,
            project:projects!inner (
                id, title, slug, description, thumbnail_url, images, likes_count, views, created_at, tags, source_link, demo_link,
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        {items.map((item) => (
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