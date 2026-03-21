"use client";
import Link from "next/link";
import Image from "next/image";
import { Terminal, Heart, Eye, Clock, ArrowUpRight, MessageSquare } from "lucide-react";

export default function BlogsTabContent({ blogs, viewMode, author }) {
  if (!blogs || blogs.length === 0) {
    return (
      <div className="h-64 border border-dashed border-border bg-secondary/5 flex flex-col items-center justify-center text-muted-foreground gap-3">
         <Terminal size={24} className="opacity-20" />
         <span className="font-mono text-xs uppercase tracking-widest">No Intelligence Reports Deployed</span>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col border-t border-border">
        {blogs.map(blog => <BlogListItem key={blog.id} blog={blog} author={author} />)}
      </div>
    );
  }

  // Grid Mode
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map(blog => <BlogCard key={blog.id} blog={blog} author={author} />)}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function BlogCard({ blog, author }) {
  const targetUrl = `/${author.username}/blog/${blog.slug}`;
  
  return (
    <article className="group flex flex-col border border-border bg-background hover:border-accent transition-all duration-300 overflow-hidden shadow-sm h-full">
      {/* Cover Image Area */}
      <Link href={targetUrl} className="relative w-full aspect-[2/1] bg-secondary border-b border-border overflow-hidden shrink-0">
        {blog.cover_image ? (
            <Image 
                src={blog.cover_image} 
                alt={blog.title} 
                fill 
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" 
            />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-10">
                <Terminal size={32} />
            </div>
        )}
        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-md px-2 py-0.5 border border-border text-[8px] font-mono uppercase font-bold text-foreground">
            REPORT
        </div>
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-4">
        <Link href={targetUrl} className="flex-1 min-w-0">
          <h3 className="font-bold text-base uppercase tracking-tight leading-tight text-foreground group-hover:text-accent transition-colors line-clamp-2 mb-2">
            {blog.title}
          </h3>
          <p className="text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">
            {blog.excerpt || "Decrypt documentation to view full intelligence data package..."}
          </p>
        </Link>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
                {blog.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[8px] font-mono uppercase tracking-widest bg-secondary/50 border border-border px-1.5 py-0.5 text-muted-foreground group-hover:border-accent/30 group-hover:text-foreground transition-colors">
                        {tag}
                    </span>
                ))}
            </div>
        )}

        {/* Footer Metrics */}
        <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
            <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Clock size={10}/> {blog.reading_time || 5} MIN</span>
                <span className="flex items-center gap-1.5"><Heart size={10} className="group-hover:text-accent transition-colors"/> {blog.likes_count || 0}</span>
                <span className="flex items-center gap-1.5"><Eye size={10}/> {blog.views || 0}</span>
            </div>
            <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-accent shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  );
}

function BlogListItem({ blog, author }) {
  const targetUrl = `/${author.username}/blog/${blog.slug}`;
  const date = new Date(blog.published_at || blog.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Link href={targetUrl} className="group flex items-center gap-4 p-4 border-b border-border bg-background hover:bg-secondary/5 transition-all duration-200">
      
      {/* Thumbnail */}
      <div className="relative w-24 h-16 bg-secondary border border-border flex-shrink-0 overflow-hidden hidden sm:block">
        {blog.cover_image ? (
            <Image src={blog.cover_image} alt={blog.title} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-10">
                <Terminal size={20} />
            </div>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-bold text-sm text-foreground truncate uppercase tracking-tight group-hover:text-accent transition-colors">
          {blog.title}
        </h3>
        
        <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-accent uppercase tracking-wider bg-accent/10 px-1.5 border border-accent/20">
                REPORT
            </span>
            <span className="text-[10px] text-border">|</span>
            <div className="flex gap-2 overflow-hidden">
                {(blog.tags || []).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] text-muted-foreground font-mono truncate uppercase">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-6 text-muted-foreground shrink-0">
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 w-14">
                <Heart size={12} className="group-hover:text-accent transition-colors" />
                <span>{blog.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 w-14">
                <MessageSquare size={12} />
                <span>{blog.comments_count || 0}</span>
            </div>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono w-24 justify-end">
            <Clock size={12} />
            <span>{date}</span>
        </div>

        <div className="pl-4 border-l border-border/50">
            <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}