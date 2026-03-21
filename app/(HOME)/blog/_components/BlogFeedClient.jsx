// app/(HOME)/blog/_components/BlogFeedClient.jsx
"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Rocket, TrendingUp, Clock, Flame, 
  Terminal, Search, Heart, Eye, ArrowUpRight, 
  UserPlus, Hash, ChevronRight, X, Command, ShieldCheck,
  MessageSquare, User, Filter, LayoutGrid, Check, FileCode,
  ChevronDown, Calendar, SlidersHorizontal, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAvatar } from "@/constants/assets";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import BroadcastCarousel from "./BroadcastCarousel";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const ALL_SECTORS = [
  "ARCHITECTURE", "UI_UX", "REACT", "SUPABASE", "SYSTEM_DESIGN",
  "NEXTJS", "TYPESCRIPT", "WEB3", "PERFORMANCE", "SECURITY",
  "CAREER", "TUTORIAL", "BACKEND", "AI_ML"
];

export default function BlogFeedClient({ currentUser, initialPosts, carouselPosts, recommendedNodes }) {
  const router = useRouter();
  
  // --- CORE FEED STATES ---
  const [posts, setPosts] = useState(initialPosts || []);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState((initialPosts?.length || 0) === 10);
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // --- FILTER STATES ---
  const [feedMode, setFeedMode] = useState("latest"); 
  const [selectedSector, setSelectedSector] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); 
  const [timeframe, setTimeframe] = useState("all"); 
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- UI STATES ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAllSectors, setShowAllSectors] = useState(false);
  
  // --- HANDSHAKE STATE ---
  const [followingIds, setFollowingIds] = useState([]);
  const [isProcessingLink, setIsProcessingLink] = useState(false);

  // 1. FETCH FOLLOWING LIST
  useEffect(() => {
    if (currentUser) {
        const fetchFollowing = async () => {
            const { data } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.id);
            if (data) setFollowingIds(data.map(f => f.following_id));
        };
        fetchFollowing();
    }
  }, [currentUser]);

  // 2. RESET ENGINE WHEN FILTERS CHANGE
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    setPage(0);
    setPosts([]);
    setHasMore(true);
  }, [feedMode, selectedSector, sortBy, timeframe, searchQuery]);

  // 3. DATABASE FETCH ENGINE (Runs on page change or filter reset)
  useEffect(() => {
    if (isInitialLoad && page === 0) return; // Skip initial mount, we already have initialPosts
    
    let isMounted = true;

    const fetchPage = async () => {
      setIsFetching(true);
      const from = page * 10;
      const to = from + 9;

      let query = supabase
        .from('blogs')
        .select('*, author:profiles!author_id(id, username, full_name, avatar_url, role)')
        .eq('status', 'published');

      // Filter: Mode
      if (feedMode === 'following') {
          if (followingIds.length === 0) {
              if (isMounted) { setPosts([]); setHasMore(false); setIsFetching(false); }
              return;
          }
          query = query.in('author_id', followingIds);
      }

      // Filter: Search & Sector
      if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
      if (selectedSector) query = query.contains('tags', [selectedSector]);

      // Filter: Timeframe
      if (timeframe !== 'all') {
          const date = new Date();
          if (timeframe === 'today') date.setDate(date.getDate() - 1);
          if (timeframe === 'week') date.setDate(date.getDate() - 7);
          query = query.gte('published_at', date.toISOString());
      }

      // Filter: Sorting
      if (sortBy === 'oldest') query = query.order('published_at', { ascending: true });
      else if (sortBy === 'views') query = query.order('views', { ascending: false });
      else if (sortBy === 'likes') query = query.order('likes_count', { ascending: false });
      else query = query.order('published_at', { ascending: false }); // newest

      query = query.range(from, to);

      const { data, error } = await query;
      
      if (isMounted && !error && data) {
          if (page === 0) setPosts(data);
          else setPosts(prev => [...prev, ...data]);
          setHasMore(data.length === 10);
      }
      if (isMounted) setIsFetching(false);
    };

    fetchPage();
    return () => { isMounted = false; };
  }, [page, feedMode, selectedSector, sortBy, timeframe, searchQuery, followingIds, isInitialLoad]);

  // 4. INFINITE SCROLL OBSERVER
  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
      if (isFetching) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) {
              setPage(prevPage => prevPage + 1);
          }
      });
      
      if (node) observer.current.observe(node);
  }, [isFetching, hasMore]);

  // --- HANDSHAKE PROTOCOL ---
  const handleHandshake = async (targetId) => {
    if (!currentUser) return toast.error("Clearance Denied", { description: "Authentication required to establish links." });
    if (isProcessingLink) return;

    setIsProcessingLink(true);
    const isCurrentlyLinked = followingIds.includes(targetId);
    
    setFollowingIds(prev => isCurrentlyLinked ? prev.filter(id => id !== targetId) : [...prev, targetId]);

    try {
        if (isCurrentlyLinked) {
            await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetId);
            toast.info("Connection Terminated");
        } else {
            await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetId });
            toast.success("Handshake Established");
        }
    } catch (error) {
        setFollowingIds(prev => isCurrentlyLinked ? [...prev, targetId] : prev.filter(id => id !== targetId));
        toast.error("Transmission Failed");
    } finally {
        setIsProcessingLink(false);
    }
  };

  const smartRecommendedNodes = useMemo(() => {
    if (!recommendedNodes) return [];
    return recommendedNodes.filter(node => node.id !== currentUser?.id && !followingIds.includes(node.id)).slice(0, 5); 
  }, [recommendedNodes, currentUser, followingIds]);

  const visibleSectors = showAllSectors ? ALL_SECTORS : ALL_SECTORS.slice(0, 6);

  return (
    <div className="container mx-auto px-4 max-w-7xl animate-in fade-in duration-700">
      
      {/* 1. THE COMMAND PROMPT */}
      <div className="max-w-3xl mx-auto mb-12 relative">
          <div className="flex items-center bg-background border border-border p-2 focus-within:border-accent transition-colors">
              <div className="w-10 h-10 bg-secondary border border-border shrink-0 relative overflow-hidden hidden sm:block ml-2">
                  <Image src={getAvatar({ avatar_url: currentUser?.user_metadata?.avatar_url })} alt="You" fill className="object-cover grayscale" />
              </div>
              <input 
                  readOnly
                  placeholder={currentUser ? "DEPLOY_NEW_REPORT_SEQUENCE..." : "AUTHENTICATION_REQUIRED..."}
                  className="flex-1 bg-transparent h-12 text-sm font-mono px-4 outline-none placeholder:text-muted-foreground/30 text-foreground cursor-pointer"
                  onClick={() => { if (currentUser) router.push('/blog/write') }}
              />
              <Button disabled={!currentUser} onClick={() => router.push('/blog/write')} className="h-10 bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono text-[10px] uppercase tracking-widest px-6 shrink-0 transition-colors">Initialize</Button>
          </div>
      </div>

      {/* 2. THE FULL-WIDTH BROADCAST CAROUSEL */}
      <div className="w-full">
        <BroadcastCarousel posts={carouselPosts} />
      </div>

      {/* 3. THE 3-COLUMN MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative mt-8">
          
          {/* LEFT: FIXED TOOLS (SECTORS & NODES) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-32 self-start space-y-10">
              <section>
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2"><Hash size={12} className="text-accent" /> Active_Sectors</span>
                      {selectedSector && (
                          <button onClick={() => setSelectedSector(null)} className="text-accent hover:underline text-[8px]">CLEAR</button>
                      )}
                  </h3>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
                      {visibleSectors.map(tag => (
                          <button 
                              key={tag} 
                              onClick={() => setSelectedSector(selectedSector === tag ? null : tag)}
                              className={`
                                text-[9px] font-mono uppercase px-2 py-2 border transition-all text-left truncate flex items-center justify-between
                                ${selectedSector === tag 
                                    ? 'bg-accent/10 border-accent/50 text-accent shadow-[inset_2px_0_0_0_#ef4444]' 
                                    : 'border-transparent bg-secondary/5 hover:border-border hover:bg-secondary/10 text-muted-foreground hover:text-foreground'}
                              `}
                          >
                              <span className="truncate">#{tag}</span>
                          </button>
                      ))}
                  </div>
                  
                  <button 
                      onClick={() => setShowAllSectors(!showAllSectors)}
                      className="w-full mt-2 text-[9px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-dashed border-border py-2 flex items-center justify-center gap-1 transition-colors"
                  >
                      {showAllSectors ? "Collapse Matrix" : `View All Sectors (${ALL_SECTORS.length})`}
                  </button>
              </section>

              <section className="pt-6 border-t border-border border-dashed">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-2">
                      <UserPlus size={12} className="text-accent" /> Recommended Nodes
                  </h3>
                  <div className="space-y-4">
                      {smartRecommendedNodes.length > 0 ? (
                          smartRecommendedNodes.map((node) => (
                              <div key={node.id} className="flex items-center justify-between group">
                                  <Link href={`/profile/${node.username}`} className="flex items-center gap-3 min-w-0">
                                      <div className="w-8 h-8 bg-secondary border border-border relative shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
                                          <Image src={getAvatar(node)} alt="" fill className="object-cover" />
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-[11px] font-bold uppercase truncate text-foreground group-hover:text-accent transition-colors">{node.full_name || node.username}</p>
                                          <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-tighter">@{node.username}</p>
                                      </div>
                                  </Link>
                                  
                                  <Button 
                                      variant="ghost" 
                                      onClick={() => handleHandshake(node.id)}
                                      disabled={isProcessingLink}
                                      className="h-6 px-2 text-[9px] font-mono uppercase rounded-none border transition-all text-accent border-accent/30 hover:bg-accent/10 hover:border-accent"
                                  >
                                      Link
                                  </Button>
                              </div>
                          ))
                      ) : (
                          <div className="p-4 border border-dashed border-border bg-secondary/5 text-center flex flex-col items-center gap-2 text-muted-foreground opacity-50">
                              <ShieldCheck size={16} />
                              <p className="text-[8px] font-mono uppercase tracking-widest">Network_Optimized</p>
                          </div>
                      )}
                  </div>
              </section>
          </aside>

          {/* CENTER: THE STREAM */}
          <div className="lg:col-span-6 space-y-6 min-h-screen">
              
              {/* TABS & ADVANCED CONTROLS */}
              <div className="sticky top-[64px] md:top-[68px] bg-background/95 backdrop-blur-md z-40 border-b border-border pt-4 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                      <div className="flex gap-8">
                          <button onClick={() => setFeedMode('latest')} className={`text-[10px] font-mono uppercase tracking-[0.2em] transition-all relative pb-2 ${feedMode === 'latest' ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                            Global_Intel
                            {feedMode === 'latest' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                          </button>
                          <button onClick={() => setFeedMode('following')} className={`text-[10px] font-mono uppercase tracking-[0.2em] transition-all relative pb-2 ${feedMode === 'following' ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                            Following
                            {feedMode === 'following' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                          </button>
                      </div>
                      <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors font-mono text-[10px] uppercase">
                        <Search size={14} /> <span className="hidden sm:inline">Search_Index</span>
                      </button>
                  </div>

                  {/* FILTER CONTROL BAR */}
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                      
                      <div className="flex items-center gap-2">
                          <SlidersHorizontal size={12} className="text-muted-foreground hidden sm:block" />
                          
                          {/* Sort Dropdown */}
                          <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                  <button className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest border border-border px-2 py-1 hover:bg-secondary transition-colors">
                                      Sort: <span className="text-foreground font-bold">{sortBy}</span> <ChevronDown size={10} />
                                  </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="bg-background border-border rounded-none shadow-xl min-w-[140px]">
                                  <DropdownMenuLabel className="text-[8px] font-mono text-muted-foreground">Order Parameter</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-border" />
                                  <DropdownMenuItem onClick={() => setSortBy('newest')} className={`text-xs font-mono uppercase cursor-pointer rounded-none ${sortBy === 'newest' ? 'bg-accent/10 text-accent' : ''}`}>Newest First</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSortBy('oldest')} className={`text-xs font-mono uppercase cursor-pointer rounded-none ${sortBy === 'oldest' ? 'bg-accent/10 text-accent' : ''}`}>Oldest First</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSortBy('views')} className={`text-xs font-mono uppercase cursor-pointer rounded-none ${sortBy === 'views' ? 'bg-accent/10 text-accent' : ''}`}>Highest Traffic</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSortBy('likes')} className={`text-xs font-mono uppercase cursor-pointer rounded-none ${sortBy === 'likes' ? 'bg-accent/10 text-accent' : ''}`}>Most Endorsed</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Timeframe Dropdown */}
                          <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                  <button className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest border border-border px-2 py-1 hover:bg-secondary transition-colors">
                                      Time: <span className="text-foreground font-bold">{timeframe}</span> <ChevronDown size={10} />
                                  </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="bg-background border-border rounded-none shadow-xl min-w-[140px]">
                                  <DropdownMenuLabel className="text-[8px] font-mono text-muted-foreground">Time Horizon</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-border" />
                                  <DropdownMenuItem onClick={() => setTimeframe('all')} className={`text-xs font-mono uppercase cursor-pointer rounded-none ${timeframe === 'all' ? 'bg-accent/10 text-accent' : ''}`}>All Time</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setTimeframe('week')} className={`text-xs font-mono uppercase cursor-pointer rounded-none ${timeframe === 'week' ? 'bg-accent/10 text-accent' : ''}`}>Past 7 Days</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setTimeframe('today')} className={`text-xs font-mono uppercase cursor-pointer rounded-none ${timeframe === 'today' ? 'bg-accent/10 text-accent' : ''}`}>Today</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>

                      {/* Active State Indicators */}
                      <div className="flex items-center gap-2">
                          {(selectedSector || timeframe !== 'all' || sortBy !== 'newest') && (
                             <span className="text-[8px] font-mono text-accent animate-pulse uppercase tracking-widest hidden sm:block">
                                 Filters Active
                             </span>
                          )}
                          <span className="text-[9px] font-mono text-muted-foreground uppercase">
                              [{posts.length}] Loaded
                          </span>
                      </div>
                  </div>
              </div>

              {/* POST STREAM (INFINITE SCROLL) */}
              <div className="space-y-16 pb-20 pt-4 relative">
                {posts.length > 0 ? (
                    <>
                        {posts.map((post, index) => {
                            // Attach the observer to the last item
                            if (index === posts.length - 1) {
                                return (
                                    <div ref={lastPostElementRef} key={`${post.id}-${index}`}>
                                        <FeedCard post={post} />
                                    </div>
                                );
                            }
                            return <FeedCard key={`${post.id}-${index}`} post={post} />;
                        })}
                        
                        {/* Loading Indicator at Bottom */}
                        {isFetching && (
                            <div className="py-10 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <Loader2 className="animate-spin text-accent" size={24} />
                                <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Extracting_More_Intel...</span>
                            </div>
                        )}
                        
                        {/* End of Line Indicator */}
                        {!hasMore && posts.length > 0 && (
                            <div className="py-10 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full mb-2" />
                                <span className="text-[9px] font-mono uppercase tracking-[0.3em]">END_OF_TRANSMISSION</span>
                            </div>
                        )}
                    </>
                ) : (
                    !isFetching && (
                        <div className="py-24 text-center border border-dashed border-border bg-secondary/5 flex flex-col items-center gap-4">
                            <ShieldCheck size={32} className="text-muted-foreground opacity-10" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Empty_Sector: Adjust Filter Parameters</p>
                            {(selectedSector || timeframe !== 'all') && (
                                <Button variant="outline" onClick={() => { setSelectedSector(null); setTimeframe('all'); }} className="h-8 rounded-none border-border text-[9px] font-mono uppercase">
                                    Reset Matrix
                                </Button>
                            )}
                        </div>
                    )
                )}
                
                {/* Initial Loading State */}
                {isFetching && posts.length === 0 && (
                     <div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <Loader2 className="animate-spin text-accent" size={32} />
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Querying_Database...</span>
                    </div>
                )}
              </div>
          </div>

          {/* RIGHT: FIXED VELOCITY */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-32 self-start space-y-10">
              <section className="bg-secondary/5 border border-border p-5">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
                      <TrendingUp size={12} className="text-green-500" /> High_Velocity
                  </h3>
                  <div className="space-y-6">
                      {carouselPosts.slice(0, 5).map((post, idx) => (
                          <Link key={post.id} href={`/${post.username}/blog/${post.slug}`} className="group block">
                              <div className="flex gap-4 items-start">
                                  <span className="text-xl font-black italic text-muted-foreground/20 group-hover:text-accent transition-colors font-mono leading-none">0{idx + 1}</span>
                                  <div className="min-w-0">
                                      <h4 className="text-xs font-bold uppercase tracking-tight leading-snug group-hover:text-accent transition-colors line-clamp-2 mb-1">{post.title}</h4>
                                      <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-tighter">@{post.username} • {post.views} Nodes</p>
                                  </div>
                              </div>
                          </Link>
                      ))}
                  </div>
              </section>

              {/* ALGO DIRECTIVE */}
              <section className="border border-accent/30 bg-accent/5 p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent opacity-[0.02] rounded-bl-full pointer-events-none group-hover:opacity-[0.05] transition-opacity" />
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                      <Flame size={12} /> ALGO_DIRECTIVE
                  </h3>
                  <p className="text-[11px] text-foreground/80 font-sans leading-relaxed mb-4">
                      The Stark Neural Indexer computes visibility based on a weighted <span className="font-bold text-foreground">Hype Matrix</span>.
                  </p>
                  
                  <div className="space-y-2 mb-6 border-l-2 border-accent/30 pl-3">
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span>Raw Traffic (Views)</span>
                          <span className="text-foreground font-bold">1x Multiplier</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span>Stars (Likes)</span>
                          <span className="text-accent font-bold">5x Multiplier</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span>Margin Signals</span>
                          <span className="text-foreground font-bold">Boosted</span>
                      </div>
                  </div>

                  <Link href="/blog/guidelines" className="block">
                      <Button variant="outline" className="w-full border-accent/30 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-none font-mono text-[9px] uppercase h-8 tracking-[0.2em] transition-all">
                          Review Network Guidelines
                      </Button>
                  </Link>
              </section>
          </aside>
      </div>

      <SearchTerminal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

function FeedCard({ post }) {
    return (
        <article className="group relative animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 mb-4">
                <Link href={`/profile/${post.author?.username}`} className="w-8 h-8 relative bg-secondary border border-border grayscale group-hover:grayscale-0 transition-all duration-500">
                    <Image src={getAvatar(post.author)} alt="" fill className="object-cover" />
                </Link>
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                    <Link href={`/profile/${post.author?.username}`} className="text-foreground font-bold hover:text-accent transition-colors">@{post.author?.username}</Link>
                    <span className="opacity-30">•</span>
                    <span className="text-accent">{post.tags?.[0] || 'GENERAL'}</span>
                    <span className="opacity-30">•</span>
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0">
                    <Link href={`/${post.author?.username}/blog/${post.slug}`}>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground leading-[1.05] mb-4 group-hover:text-accent transition-all duration-300">{post.title}</h2>
                        <p className="text-sm text-muted-foreground font-sans line-clamp-3 leading-relaxed mb-6">{post.excerpt || "Decrypt documentation to view full intelligence data package..."}</p>
                    </Link>
                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                        <div className="flex items-center gap-5 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Clock size={12} /> {post.reading_time || 5} MIN</span>
                            <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors"><Heart size={12} className="text-accent" /> {post.likes_count || 0}</span>
                            <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors"><MessageSquare size={12} /> {post.comments_count || 0}</span>
                        </div>
                        <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-accent group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
                {post.cover_image && (
                    <Link href={`/${post.author?.username}/blog/${post.slug}`} className="w-full md:w-[220px] aspect-video relative bg-zinc-900 border border-border shrink-0 overflow-hidden group-hover:border-accent transition-colors">
                        <Image src={post.cover_image} alt="" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
                    </Link>
                )}
            </div>
        </article>
    );
}

// --- SERVER-SIDE SEARCH TERMINAL ---
function SearchTerminal({ isOpen, onClose }) {
    const [q, setQ] = useState("");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!q.trim()) {
                setResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            
            // Search the entire database for published posts matching the title
            const { data } = await supabase
                .from('blogs')
                .select('*, author:profiles!author_id(id, username, full_name, avatar_url)')
                .eq('status', 'published')
                .ilike('title', `%${q}%`)
                .order('views', { ascending: false }) // Prioritize high-traffic results
                .limit(5);

            setResults(data || []);
            setIsSearching(false);
        }, 400); // 400ms debounce
        
        return () => clearTimeout(timer);
    }, [q]);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) { setQ(""); setResults([]); }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-black border border-border p-0 rounded-none shadow-2xl overflow-hidden gap-0 z-[100]">
                <div className="p-5 bg-zinc-950 border-b border-border flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                        <Search size={22} className="text-accent" />
                        <input 
                            autoFocus 
                            value={q} 
                            onChange={(e) => setQ(e.target.value)} 
                            placeholder="SEARCH_NETWORK_REPORTS..." 
                            className="flex-1 bg-transparent border-none outline-none font-mono text-base uppercase tracking-widest text-foreground placeholder:text-zinc-800" 
                        />
                        <button onClick={onClose} className="p-1 hover:bg-white/10 transition-colors"><X size={20} className="text-zinc-600" /></button>
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto bg-black p-4 custom-scrollbar">
                    {isSearching ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4 text-zinc-600">
                            <Loader2 size={32} className="animate-spin" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.4em]">Querying_Mainframe...</p>
                        </div>
                    ) : q.length > 0 ? (
                        results.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-300">
                                {results.map(p => (
                                    <Link key={p.id} href={`/${p.author?.username}/blog/${p.slug}`} className="group flex gap-4 p-4 bg-zinc-950/50 border border-zinc-900 hover:border-accent hover:bg-accent/5 transition-all">
                                        <div className="w-24 h-16 bg-zinc-900 border border-zinc-800 relative shrink-0 overflow-hidden">
                                            {p.cover_image ? <Image src={p.cover_image} alt="" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><FileCode size={20} /></div>}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="text-sm font-bold uppercase tracking-tight text-foreground group-hover:text-accent transition-colors truncate">{p.title}</h4>
                                                <ArrowUpRight size={14} className="text-zinc-700 group-hover:text-accent shrink-0" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-4 h-4 relative rounded-full overflow-hidden border border-zinc-700"><Image src={getAvatar(p.author)} alt="" fill className="object-cover" /></div>
                                                        <span className="text-[10px] font-mono text-muted-foreground uppercase">@{p.author?.username}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-zinc-800 hidden sm:block">|</span>
                                                    <span className="text-[9px] font-mono text-zinc-600 uppercase hidden sm:block">{new Date(p.published_at).toLocaleDateString()}</span>
                                                </div>
                                                <span className="text-[9px] font-mono text-accent uppercase tracking-widest">{p.reading_time || 5} MIN</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : <div className="py-20 text-center flex flex-col items-center gap-4 text-zinc-800"><ShieldCheck size={40} /><p className="text-[10px] font-mono uppercase tracking-[0.4em]">[ Zero_Signals_In_Buffer ]</p></div>
                    ) : <div className="py-24 flex flex-col items-center justify-center text-zinc-900 gap-4"><Terminal size={64} strokeWidth={0.5} className="opacity-40" /><p className="text-[11px] font-mono uppercase tracking-[0.6em] opacity-40">Awaiting_Input_Parameters...</p></div>}
                </div>
                
                <div className="p-3 border-t border-border bg-zinc-950 flex justify-between items-center px-4">
                   <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-600 uppercase"><Command size={10}/> <span>+ K to quickly initialize search</span></div>
                   <div className="flex items-center gap-2"><span className="text-[8px] font-mono text-green-500 uppercase">System_Online</span><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,1)]" /></div>
                </div>
            </DialogContent>
        </Dialog>
    );
}