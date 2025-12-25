"use client";
import Link from "next/link";
import Image from "next/image";
import { Star, Eye, ArrowUpRight } from "lucide-react";

export default function ProjectCard({ project }) {
  // --- MAPPING REAL DB FIELDS ---
  // If the DB provides 'likes_count', use it; otherwise fallback to nested mock structure or 0
  const stars = project?.likes_count ?? project?.stats?.stars ?? 0;
  const views = project?.views ?? project?.stats?.views ?? 0;
  
  // Handling image source differences
  const imageSrc = project?.thumbnail_url || project?.thumbnail || "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=1000";

  // Handling author details
  const authorName = project?.author?.full_name || project?.author?.name || "User";
  const authorUsername = project?.author?.username || "user";
  const authorAvatar = project?.author?.avatar_url || project?.author?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";

  return (
    <article className="group relative flex flex-col h-full bg-card border border-border transition-all duration-300 ease-out hover:-translate-y-1 hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(var(--accent),0.1)]">
        
        {/* --- 1. MAIN CARD LINK (Invisible Overlay) --- */}
        <Link 
            href={`/project/${project?.slug}`} 
            className="absolute inset-0 z-10"
            aria-label={`View ${project?.title}`}
        />

        {/* --- 2. IMAGE SECTION --- */}
        <div className="relative w-full aspect-video overflow-hidden bg-secondary border-b border-border group-hover:border-accent/50 transition-colors">
          <Image
            src={imageSrc}
            alt={project?.title || "Project Preview"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="bg-accent text-white p-1.5 shadow-sm">
              <ArrowUpRight size={16} strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* --- 3. CONTENT SECTION --- */}
        <div className="flex flex-col flex-1 p-5 pointer-events-none"> 

          {/* Title & Category */}
          <div className="flex justify-between items-start mb-2 relative z-0">
            <h3 className="font-bold text-lg leading-tight tracking-tight text-foreground group-hover:text-accent transition-colors duration-300 uppercase">
              {project?.title || "Untitled Project"}
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground border border-border px-1.5 py-0.5">
              {project?.category || project?.type || "CODE"}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-light relative z-0">
            {project?.description || "No description provided."}
          </p>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-1.5 mt-auto mb-4 relative z-0">
            {(project?.tags || []).slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="text-[10px] font-mono text-foreground/80 bg-secondary/50 px-2 py-1 border border-transparent group-hover:border-border transition-colors"
              >
                {tag}
              </span>
            ))}
            {(project?.tags?.length || 0) > 3 && (
              <span className="text-[10px] font-mono text-muted-foreground px-2 py-1">
                +{(project?.tags?.length || 0) - 3}
              </span>
            )}
          </div>

          {/* Footer: Author & Metrics */}
          <div className="flex items-center justify-between pt-4 border-t border-border border-dashed group-hover:border-accent/20 transition-colors relative z-20">
            
            {/* --- AUTHOR LINK --- */}
            <Link 
                href={`/profile/${authorUsername}`} 
                className="flex items-center gap-2 pointer-events-auto hover:opacity-80 transition-opacity group/author"
            >
              <div className="w-5 h-5 relative overflow-hidden bg-secondary border border-transparent group-hover/author:border-accent">
                <Image 
                  src={authorAvatar} 
                  alt={authorName} 
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all"
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                @{authorUsername}
              </span>
            </Link>

            {/* Metrics (NOW FIXED) */}
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-[10px]">
              <div className="flex items-center gap-1">
                <Star size={12} className="group-hover:text-accent transition-colors" />
                <span>{formatNumber(stars)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={12} />
                <span>{formatNumber(views)}</span>
              </div>
            </div>

          </div>
        </div>
    </article>
  );
}

// Helper for 1.2k, 10k notation
function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num;
}