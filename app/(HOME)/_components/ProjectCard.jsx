// app/(HOME)/_components/ProjectCard.jsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { Star, Eye, ArrowUpRight, PlayCircle, ShieldCheck, Trophy, Radio, Zap } from "lucide-react"; // Added Zap
import { getSmartThumbnail, isVideoUrl } from "@/lib/mediaUtils"; 

// --- HELPER: STRIP MARKDOWN & MENTIONS ---
function stripMarkdown(md) {
  if (!md) return "";
  return md
    .replace(/@\[([^\]]+)\]\([^\)]+\)/g, "@$1")
    .replace(/#+\s/g, "") 
    .replace(/\*\*?|__?/g, "") 
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") 
    .replace(/`{1,3}[^`]*`{1,3}/g, "") 
    .replace(/<\/?[^>]+(>|$)/g, "") 
    .replace(/[>|\\-]/g, "") 
    .replace(/\s+/g, " ") 
    .trim();
}

function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num;
}

export default function ProjectCard({ project }) {
  const stars = project?.likes_count ?? project?.stats?.stars ?? 0;
  const views = project?.views ?? project?.stats?.views ?? 0;
  const qScore = project?.quality_score ?? project?.qualityScore ?? 0;
  const fuelInjections = project?.fuel_injections || 0; // NEW
  
  // Contest Info
  const contestName = project?.contestName; 
  const contestSlug = project?.contestSlug; 
  
  // Event Info
  const eventName = project?.eventName;
  const eventId = project?.eventId;
  const eventColor = project?.eventColor || "#DC2626";

  const rawThumbnail = project?.thumbnail_url || project?.thumbnail || "";
  const imageSrc = getSmartThumbnail(rawThumbnail);
  const isVideo = isVideoUrl(rawThumbnail);

  const authorName = project?.author?.full_name || project?.author?.name || "User";
  const authorUsername = project?.author?.username || "user";
  const authorAvatar = project?.author?.avatar_url || project?.author?.avatar;

  const cleanDescription = stripMarkdown(project?.description || "No description provided.");

  return (
    <article className="group relative flex flex-col h-full bg-card border border-border transition-all duration-300 ease-out hover:-translate-y-1 hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.1)]">
        
        {/* Main Link Overlay */}
        <Link 
            href={`/project/${project?.slug}`} 
            className="absolute inset-0 z-10"
            aria-label={`View ${project?.title}`}
        />

        <div className="relative w-full aspect-video overflow-hidden bg-secondary border-b border-border group-hover:border-accent/50 transition-colors">
          {imageSrc && imageSrc !== "/placeholder.jpg" ? (
            <Image
                src={imageSrc}
                alt={project?.title || "Project Preview"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                <div className="text-[10px] font-mono uppercase text-muted-foreground border border-border border-dashed px-3 py-1">
                    Signal_Lost // No_Preview
                </div>
            </div>
          )}
          
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20">
                    <PlayCircle size={20} fill="currentColor" className="text-white" />
                </div>
            </div>
          )}

          <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 items-start pointer-events-none">
              {/* Contest Badge */}
              {contestName && contestSlug && (
                 <Link 
                    href={`/contests/${contestSlug}`}
                    onClick={(e) => e.stopPropagation()} 
                    className="bg-yellow-500/90 text-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-sm backdrop-blur-sm pointer-events-auto hover:bg-yellow-400 transition-colors cursor-pointer border border-yellow-600/20"
                 >
                    <Trophy size={10} />
                    <span className="truncate max-w-[120px]">{contestName}</span>
                 </Link>
              )}

              {/* Public Event Badge */}
              {eventName && eventId && (
                 <Link 
                    href={`/events/${eventId}`}
                    onClick={(e) => e.stopPropagation()} 
                    className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-sm backdrop-blur-sm pointer-events-auto transition-colors cursor-pointer text-white"
                    style={{ backgroundColor: eventColor }} 
                 >
                    <Radio size={10} className="animate-pulse" />
                    <span className="truncate max-w-[120px]">{eventName}</span>
                 </Link>
              )}
          </div>

          {/* Quality Score Badge */}
          {qScore > 0 && (
             <div className="absolute bottom-2 left-2 z-20 bg-background/80 backdrop-blur-md border border-border px-1.5 py-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ShieldCheck size={10} className="text-accent" />
                <span className="text-[9px] font-mono font-bold text-foreground">{qScore}</span>
             </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
          
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 z-20">
            <div className="bg-accent text-white p-1.5 shadow-sm">
              <ArrowUpRight size={16} strokeWidth={3} />
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-5 pointer-events-none"> 

          <div className="flex justify-between items-start mb-2 relative z-0">
            <h3 className="font-bold text-lg leading-tight tracking-tight text-foreground group-hover:text-accent transition-colors duration-300 uppercase truncate pr-4">
              {project?.title || "Untitled Project"}
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground border border-border px-1.5 py-0.5 flex-shrink-0">
              {project?.category || project?.type || "CODE"}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-light relative z-0">
            {cleanDescription}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-auto mb-4 relative z-0">
            {(project?.tags || []).slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="text-[10px] font-mono text-foreground/80 bg-secondary/50 px-2 py-1 border border-transparent group-hover:border-border transition-colors uppercase"
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

          <div className="flex items-center justify-between pt-4 border-t border-border border-dashed group-hover:border-accent/20 transition-colors relative z-20 overflow-hidden">
            
            <Link 
                href={`/profile/${authorUsername}`} 
                className="flex items-center gap-2 pointer-events-auto hover:opacity-80 transition-opacity group/author min-w-0 flex-1 mr-2"
            >
              <div className="w-5 h-5 relative overflow-hidden bg-secondary border border-transparent group-hover/author:border-accent flex-shrink-0 flex items-center justify-center">
                {authorAvatar ? (
                    <Image 
                        src={authorAvatar} 
                        alt={authorName} 
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                ) : (
                    <span className="text-[9px] font-mono font-bold text-muted-foreground group-hover:text-foreground">
                        {authorUsername?.[0]?.toUpperCase() || "?"}
                    </span>
                )}
              </div>
              
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                @{authorUsername}
              </span>
            </Link>

            <div className="flex items-center gap-3 text-muted-foreground font-mono text-[10px] flex-shrink-0">
              
              {/* NEW: FUEL INDICATOR */}
              {fuelInjections > 0 && (
                <div className="flex items-center gap-1 text-accent animate-pulse" title={`${fuelInjections} Fuel Injections`}>
                    <Zap size={12} className="fill-accent" />
                    <span>{formatNumber(fuelInjections)}</span>
                </div>
              )}

              <div 
                className="flex items-center gap-1 cursor-pointer pointer-events-auto"
                onClick={async (e) => {
                    e.preventDefault();
                    window.starkClickCount = (window.starkClickCount || 0) + 1;
                    if (window.starkClickCount === 100) {
                         await fetch('/api/achievements/award', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ badgeId: 'click_frenzy' })
                        });
                        window.starkClickCount = 0; 
                    }
                }}
              >
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