"use client";
import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
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
                username, full_name, avatar_url
            )
          `)
          .eq('status', 'published')
          // Order by Quality Score to show best work on home
          .order('quality_score', { ascending: false }) 
          .limit(6);

        if (error) throw error;

        // Transform data for ProjectCard
        const formatted = (data || []).map(p => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            category: p.type, // Map 'type' to 'category' prop
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
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Trending This Week
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Hand-picked projects that push the boundaries of UI and performance.
            </p>
          </div>
          
          <Link href="/explore" className="group flex items-center gap-2 text-sm font-mono text-accent hover:text-foreground transition-colors">
            <span>View all projects</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* The Grid */}
        {loading ? (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
        ) : (
            <div className="h-40 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                <p className="font-mono text-sm uppercase">NO_DATA_AVAILABLE</p>
            </div>
        )}

        {/* Load More / End of List Indicator */}
        <div className="mt-16 flex justify-center">
            <Link href="/explore">
                <button className="px-8 py-3 border border-border bg-secondary/20 hover:bg-secondary hover:border-accent transition-all text-sm font-mono tracking-wide">
                    EXPLORE_ALL()
                </button>
            </Link>
        </div>

      </div>
    </section>
  );
}