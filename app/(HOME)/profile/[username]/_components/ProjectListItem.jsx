"use client";
import Link from "next/link";
import Image from "next/image";
import { Star, Eye, Calendar, ArrowUpRight, GitCommit } from "lucide-react";

export default function ProjectListItem({ project }) {
  // Safe Fallbacks
  const thumbnail = project.thumbnail_url || "/placeholder.jpg";
  const stars = project.likes_count || 0;
  const views = project.views || 0;
  const date = new Date(project.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/project/${project.slug}`}
      className="group flex items-center gap-4 p-3 border-b border-border bg-background hover:bg-secondary/5 transition-all duration-200"
    >
      {/* 1. Miniature Thumbnail (Visual Anchor) */}
      <div className="relative w-20 h-12 bg-secondary border border-border flex-shrink-0 overflow-hidden hidden sm:block">
        <Image
          src={thumbnail}
          alt={project.title}
          fill
          className="object-cover grayscale group-hover:grayscale-0 transition-all"
        />
      </div>

      {/* 2. Main Info (Title & Tech) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-sm text-foreground truncate group-hover:text-accent transition-colors">
            {project.title}
          </h3>
          {/* Status Indicator */}
          {project.status === 'published' ? (
             <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Published" />
          ) : (
             <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Draft" />
          )}
        </div>
        
        {/* Tech Stack - Text Only for compactness */}
        <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {project.type || 'CODE'}
            </span>
            <span className="text-[10px] text-border">|</span>
            <div className="flex gap-2 overflow-hidden">
                {(project.tags || []).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] text-muted-foreground font-mono truncate">
                        {typeof tag === 'string' ? tag : tag.name}
                    </span>
                ))}
            </div>
        </div>
      </div>

      {/* 3. Metrics (Tabular Data) */}
      <div className="flex items-center gap-6 text-muted-foreground">
        
        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 w-16">
                <Star size={12} className="group-hover:text-accent transition-colors" />
                <span>{stars}</span>
            </div>
            <div className="flex items-center gap-1.5 w-16">
                <Eye size={12} />
                <span>{views}</span>
            </div>
        </div>

        {/* Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono w-24 justify-end">
            <Calendar size={12} />
            <span>{date}</span>
        </div>

        {/* Action Arrow */}
        <div className="pl-4 border-l border-border/50">
            <ArrowUpRight 
                size={16} 
                className="text-muted-foreground group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" 
            />
        </div>
      </div>
    </Link>
  );
}