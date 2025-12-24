"use client";
import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home, Share2, Flag, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

import ProjectGallery from "./_components/ProjectGallery";
import ProjectSidebar from "./_components/ProjectSidebar";
import ProjectReadme from "./_components/ProjectReadme";
import ProjectComments from "./_components/ProjectComments";

export default function ProjectDetailPage({ params }) {
  const { slug } = use(params);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching project:", slug);

        // FIX: Use the specific Constraint Name from the error hint
        // 'author:profiles!projects_owner_id_fkey(*)'
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            author:profiles!projects_owner_id_fkey(*) 
          `)
          .eq('slug', slug)
          .single();

        if (error) {
          console.error("❌ Supabase Error:", error);
          setError(true);
          return;
        }

        if (!data) {
          setError(true);
          return;
        }

        // --- INCREMENT VIEW COUNT ---
        supabase.rpc('increment_project_view', { project_id: data.id });

        const formattedData = {
            ...data,
            images: data.images || [],
            techStack: data.tags ? data.tags.map(t => ({ name: t })) : [],
            
            // Map the joined profile data
            author: {
                id: data.author?.id, 
                name: data.author?.full_name || "Anonymous",
                username: data.author?.username || "user",
                avatar: data.author?.avatar_url,
                isForHire: data.author?.is_for_hire,
                role: data.author?.bio ? data.author.bio.split('.')[0] : "Creator"
            },
            
            stats: {
                stars: data.likes_count || 0,
                views: (data.views || 0) + 1,
                forks: 0
            }
        };
        setProject(formattedData);

      } catch (err) {
        console.error("Catch Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
        fetchProject();
    }
  }, [slug]);

  // 1. Loading State
  if (loading) {
    return (
        <div className="min-h-screen bg-background pt-32 px-4 flex flex-col items-center">
            <Loader2 className="animate-spin text-accent mb-4" size={40} />
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Retrieving Asset Bundle...</p>
        </div>
    );
  }

  // 2. Error / Not Found State
  if (error || !project) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
            <p className="text-muted-foreground font-mono text-sm mb-6">Project coordinates not found in sector.</p>
            <Link href="/explore" className="text-accent hover:underline font-mono text-xs uppercase">Return to Explore</Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      
      {/* 3. Navigation Breadcrumb */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 md:top-16 z-40">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-accent transition-colors"><Home size={14} /></Link>
            <ChevronRight size={12} />
            <Link href="/explore" className="hover:text-foreground transition-colors">Projects</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold truncate max-w-[150px]">{project.title}</span>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link Copied", { description: "Project URL copied to clipboard." });
                }}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
             >
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {/* 4. The Gallery */}
        <div className="mb-12">
           <ProjectGallery images={project.images.length > 0 ? project.images : [project.thumbnail_url]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* 5. Left Content: Title & Readme & Comments */}
            <div className="lg:col-span-8 space-y-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                        {project.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {project.tags.map(tag => (
                            <span key={tag.name || tag} className="px-2 py-1 bg-secondary/30 border border-border text-[10px] font-mono text-muted-foreground uppercase">
                                {tag.name || tag}
                            </span>
                        ))}
                    </div>
                </div>
                
                {/* Readme Content */}
                <ProjectReadme content={project.description} />

                {/* Comments Section */}
                <ProjectComments projectId={project.id} />
            </div>

            {/* 6. Right Content: Sticky Sidebar */}
            <div className="lg:col-span-4">
                <div className="sticky top-32">
                    <ProjectSidebar project={project} />
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}