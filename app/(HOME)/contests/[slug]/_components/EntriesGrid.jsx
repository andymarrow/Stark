"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Heart, Eye, Trophy, PlayCircle, Globe, Search, X } from "lucide-react";
import { getContestEntryCollaborators } from "@/app/actions/getContestEntryCollaborators";

// "Can I actually try this?" — the dedicated demo field, or a website link
// added through the extra-links list, which is the same thing by another name.
const hasLiveDemo = (project) => {
    if (project?.demo_link) return true;
    return (Array.isArray(project?.additional_links) ? project.additional_links : [])
        .some((l) => l?.url && l?.type === "website");
};

const DemoBadge = () => (
    <span
        title="Has a live demo"
        className="flex items-center gap-1 bg-emerald-500/90 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-widest backdrop-blur-sm"
    >
        <Globe size={9} strokeWidth={2.5} /> Demo
    </span>
);

// Helper for YouTube
const getThumbnail = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1];
        if (videoId) return `https://img.youtube.com/vi/${videoId.split("?")[0]}/mqdefault.jpg`;
    }
    return url;
};

export default function EntriesGrid({ contestId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("latest"); // 'latest', 'likes', 'views'
  const [query, setQuery] = useState("");
  const [collaborators, setCollaborators] = useState({}); // project_id -> [{username, name}]

  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('contest_submissions')
        .select(`
            id,
            submitted_at,
            project:projects!inner (
                id, title, slug, thumbnail_url, likes_count, views, status,
                demo_link, source_link, additional_links, tags,
                owner:profiles!projects_owner_id_fkey (username, full_name, avatar_url)
            )
        `)
        .eq('contest_id', contestId);

      if (!error) {
          // Sort client-side for dynamic switching without refetch
          setEntries(data || []);
      }
      setLoading(false);
    };

    if(contestId) fetchEntries();
  }, [contestId]);

  // Team members, so searching a person finds the entry even when the work
  // is filed under a teammate's account.
  useEffect(() => {
    if (!contestId) return;
    getContestEntryCollaborators(contestId).then(setCollaborators).catch(() => {});
  }, [contestId]);

  // Search across everything a judge might remember about an entry: its
  // title, whoever submitted it, any teammate on it, and its tech tags.
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (entry) => {
      if (terms.length === 0) return true;
      const p = entry.project;
      const haystack = [
          p.title,
          p.owner?.username,
          p.owner?.full_name,
          ...(Array.isArray(p.tags) ? p.tags : []),
          ...(collaborators[p.id] || []).flatMap((c) => [c.username, c.name]),
      ].filter(Boolean).join(" ").toLowerCase();
      // Every term must appear, so extra words narrow rather than widen.
      return terms.every((t) => haystack.includes(t));
  };

  const visibleEntries = entries.filter(matches);

  // Sorting Logic
  const sortedEntries = [...visibleEntries].sort((a, b) => {
      if (filter === 'likes') return b.project.likes_count - a.project.likes_count;
      if (filter === 'views') return b.project.views - a.project.views;
      return new Date(b.submitted_at) - new Date(a.submitted_at);
  });

  // Top 3 for Leaderboard (based on Likes for public hype)
  const top3 = [...entries].sort((a, b) => b.project.likes_count - a.project.likes_count).slice(0, 3);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>;

  if (entries.length === 0) {
    return (
        <div className="py-20 text-center border border-dashed border-border bg-secondary/5">
            <p className="text-sm font-mono text-muted-foreground uppercase">No submissions yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to enter.</p>
        </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. LEADERBOARD (Top 3 by Likes) */}
      {entries.length >= 3 && (
          <div className="bg-gradient-to-b from-secondary/10 to-transparent border border-border p-6 md:p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-500" /> Community Favorites
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {top3.map((entry, i) => (
                    <LeaderboardCard key={entry.id} entry={entry} rank={i + 1} />
                ))}
            </div>
          </div>
      )}

      {/* 2. SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by project, author, teammate, or tech..."
            className="w-full h-11 pl-10 pr-10 bg-secondary/5 border border-border text-sm font-mono outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/60"
        />
        {query && (
            <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors"
                aria-label="Clear search"
            >
                <X size={14} />
            </button>
        )}
      </div>

      {/* 3. FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-border pb-4">
        <span className="text-xs font-mono text-muted-foreground uppercase">
            {terms.length > 0
                ? `${sortedEntries.length} of ${entries.length} Entries`
                : `All Entries (${entries.length})`}
        </span>
        <div className="flex gap-4 text-xs font-mono">
            <button onClick={() => setFilter("latest")} className={filter === "latest" ? "text-accent underline" : "text-muted-foreground hover:text-foreground"}>Newest</button>
            <button onClick={() => setFilter("likes")} className={filter === "likes" ? "text-accent underline" : "text-muted-foreground hover:text-foreground"}>Top Liked</button>
            <button onClick={() => setFilter("views")} className={filter === "views" ? "text-accent underline" : "text-muted-foreground hover:text-foreground"}>Most Viewed</button>
        </div>
      </div>

      {/* 4. MAIN GRID */}
      {sortedEntries.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border bg-secondary/5">
            <p className="text-sm font-mono text-muted-foreground uppercase">No entries match "{query}"</p>
            <button onClick={() => setQuery("")} className="mt-2 text-xs font-mono text-accent hover:underline uppercase">Clear filter</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
            ))}
        </div>
      )}

    </div>
  );
}

function LeaderboardCard({ entry, rank }) {
    const isVideo = entry.project.thumbnail_url && (entry.project.thumbnail_url.includes("youtube") || entry.project.thumbnail_url.includes("youtu.be"));
    const thumb = getThumbnail(entry.project.thumbnail_url);

    return (
        <Link href={`/project/${entry.project.slug}`} className="block group relative">
            <div className={`absolute -top-3 -left-3 z-10 w-8 h-8 flex items-center justify-center font-bold text-sm border shadow-lg
                ${rank === 1 ? 'bg-yellow-500 text-black border-yellow-400' : 
                  rank === 2 ? 'bg-zinc-400 text-black border-zinc-300' : 
                  'bg-amber-700 text-white border-amber-600'}`}>
                #{rank}
            </div>
            <div className="relative aspect-video bg-black border border-border overflow-hidden">
                <Image src={thumb} alt={entry.project.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                {isVideo && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><PlayCircle className="text-white opacity-80" /></div>}
                {hasLiveDemo(entry.project) && (
                    <div className="absolute bottom-2 left-2 z-10"><DemoBadge /></div>
                )}
            </div>
            <div className="mt-3">
                <h4 className="font-bold text-sm truncate">{entry.project.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Heart size={12} className="text-red-500 fill-red-500" /> {entry.project.likes_count}
                </div>
            </div>
        </Link>
    )
}

function EntryCard({ entry }) {
    const isVideo = entry.project.thumbnail_url && (entry.project.thumbnail_url.includes("youtube") || entry.project.thumbnail_url.includes("youtu.be"));
    const thumb = getThumbnail(entry.project.thumbnail_url);

    return (
        <Link 
            href={`/project/${entry.project.slug}`}
            className="group block bg-card border border-border hover:border-accent transition-colors overflow-hidden"
        >
            <div className="relative aspect-video w-full bg-secondary overflow-hidden">
                <Image 
                    src={thumb} 
                    alt={entry.project.title} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                {isVideo && (
                    <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full backdrop-blur-sm">
                        <PlayCircle size={14} className="text-white" />
                    </div>
                )}
                {hasLiveDemo(entry.project) && (
                    <div className="absolute bottom-2 left-2 z-10"><DemoBadge /></div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-foreground truncate text-sm uppercase tracking-wide">{entry.project.title}</h3>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden bg-secondary border border-border">
                            <Image src={entry.project.owner.avatar_url || "/placeholder.jpg"} alt="av" fill className="object-cover" />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">@{entry.project.owner.username}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1 group-hover:text-accent transition-colors"><Heart size={10} /> {entry.project.likes_count}</span>
                        <span className="flex items-center gap-1"><Eye size={10} /> {entry.project.views}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}