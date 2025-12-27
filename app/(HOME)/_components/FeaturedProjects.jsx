"use client";
import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import { ArrowRight, Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            author:profiles!projects_owner_id_fkey(
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('status', 'published')
          // --- THE HYPE ENGINE LOGIC ---
          // 1. Primary Sort: Most Stars (Likes)
          // 2. Secondary Sort: Most Views (Traffic)
          .order('likes_count', { ascending: false })
          .order('views', { ascending: false })
          .limit(6);

        if (error) throw error;

        // Transform data for ProjectCard
        const formatted = (data || []).map(p => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.type, 
          description: p.description,
          thumbnail_url: p.thumbnail_url,
          tags: p.tags || [],
          views: p.views,
          likes_count: p.likes_count,
          author: {
            name: p.author?.full_name || "Anonymous",
            username: p.author?.username,
            avatar: p.author?.avatar_url
          }
        }));

        setProjects(formatted);
      } catch (err) {
        console.error("Featured Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <section className="py-20 bg-background relative z-10">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent mb-2">
                <TrendingUp size={18} />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Hype_Engine_Active</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 uppercase">
              Trending <span className="text-accent">Now</span>
            </h2>
            <p className="text-muted-foreground max-w-lg text-sm font-light">
              High-velocity projects gaining the most traction across the network today.
            </p>
          </div>
          
          <Link href="/explore" className="group flex items-center gap-2 text-sm font-mono text-accent hover:text-foreground transition-colors uppercase tracking-widest">
            <span>Scan all nodes</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* The Grid */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-accent" size={32} />
            <span className="font-mono text-[10px] text-muted-foreground uppercase">Calculating_Velocity...</span>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="h-40 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
            <p className="font-mono text-sm uppercase">NO_SIGNALS_DETECTED</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 flex justify-center">
          <Link href="/explore">
            <button className="px-10 py-4 border border-border bg-secondary/10 hover:bg-accent hover:text-white hover:border-accent transition-all text-xs font-mono tracking-[0.2em] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1">
              Explore_Global_Index()
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
}