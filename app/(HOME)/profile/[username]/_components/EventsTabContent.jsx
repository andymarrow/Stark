"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Lock, 
  Globe, 
  ArrowRight, 
  Calendar, 
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

// HELPER: Smart Thumbnail Extraction
const getSmartThumbnail = (url) => {
    if (!url) return null;
    // Check for YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1];
        
        if (videoId) {
            const cleanId = videoId.split("?")[0].split("/")[0];
            return `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`;
        }
    }
    return url; 
};

// Helper for status colors
const getStatusConfig = (status) => {
  switch (status) {
    case 'accepted': return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2, label: 'ACCEPTED' };
    case 'rejected': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'REJECTED' };
    default: return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock, label: 'PENDING' };
  }
};

export default function EventsTabContent({ hostedEvents, attendedEvents }) {
  const hasHosted = hostedEvents && hostedEvents.length > 0;
  const hasAttended = attendedEvents && attendedEvents.length > 0;

  if (!hasHosted && !hasAttended) {
    return (
      <div className="col-span-full py-20 text-center border border-dashed border-border bg-secondary/5 rounded-sm">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Calendar size={48} className="opacity-20" />
          <p className="text-xs font-mono uppercase tracking-widest">No Event Activity Detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. HOSTED EVENTS SECTION */}
      {hasHosted && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-4 w-1 bg-accent" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Hosted Events</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hostedEvents.map(event => (
              <HostEventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* 2. ATTENDED EVENTS (SUBMISSIONS) SECTION */}
      {hasAttended && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-4 w-1 bg-purple-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Submissions & Entries</h3>
          </div>
          <div className="flex flex-col gap-6">
            {attendedEvents.map(submission => (
              <SubmissionEventCard key={submission.id} submission={submission} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: HOST CARD (Private/Public Logic) ---
function HostEventCard({ event }) {
  // DEFENSIVE PROGRAMMING: Ensure event exists
  if (!event) return null;

  const isPublic = event.is_public === true;
  
  const Wrapper = isPublic ? Link : 'div';
  const wrapperProps = isPublic ? { href: `/events/${event.id}`, target: "_blank" } : {};
  
  const coverImage = getSmartThumbnail(event.cover_image);

  return (
    <Wrapper 
      {...wrapperProps}
      className={`
        group relative w-full aspect-[4/3] overflow-hidden border bg-secondary/5
        transition-all duration-300 block
        ${isPublic 
          ? 'border-border hover:border-accent cursor-pointer hover:shadow-2xl hover:shadow-accent/10' 
          : 'border-border/50 opacity-80 cursor-not-allowed grayscale-[0.5]'}
      `}
    >
      {/* Background Image */}
      {coverImage ? (
        <Image 
          src={coverImage} 
          alt={event.title || "Event"} 
          fill 
          className={`object-cover transition-transform duration-700 ${isPublic ? 'group-hover:scale-110' : ''}`}
        />
      ) : (
        <div className="w-full h-full bg-secondary flex items-center justify-center">
           <Calendar size={32} className="text-muted-foreground/20" />
        </div>
      )}

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        {/* Top Badge */}
        <div className="flex justify-end">
          <span className={`
            text-[9px] font-mono uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 backdrop-blur-md border
            ${isPublic 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : 'bg-black/40 text-muted-foreground border-white/10'}
          `}>
            {isPublic ? <><Globe size={10} /> PUBLIC NODE</> : <><Lock size={10} /> RESTRICTED</>}
          </span>
        </div>

        {/* Bottom Info */}
        <div>
          <h4 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-2">{event.title || "Untitled Protocol"}</h4>
          <div className="flex items-center gap-2 text-white/50 text-[10px] font-mono uppercase">
             <Calendar size={10} />
             <span>{event.created_at ? new Date(event.created_at).toLocaleDateString() : "Unknown Date"}</span>
             {!isPublic && <span className="text-red-400 ml-auto flex items-center gap-1"><Lock size={8}/> Private Access Only</span>}
          </div>
        </div>
      </div>

      {/* Hover Reveal Icon (Only for Public) */}
      {isPublic && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-accent/90 text-white flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <ExternalLink size={20} />
          </div>
        </div>
      )}
    </Wrapper>
  );
}

// --- SUB-COMPONENT: SUBMISSION CARD (The Creative Arrow) ---
function SubmissionEventCard({ submission }) {
  if (!submission) return null;

  // 🛡️ EXTREME DEFENSIVE PROGRAMMING
  // Fallback to empty objects if RLS blocks them to prevent undefined/null crashes
  const project = submission.project || {};
  const event = submission.event || {};
  const status = submission.status || 'pending';

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const isEventPublic = event.is_public === true;
  const eventId = event.id;
  
  const projectThumb = getSmartThumbnail(project.thumbnail_url);
  const projectTitle = project.title || "Restricted Project";
  const projectSlug = project.slug;

  return (
    <div className="w-full h-auto md:h-32 border border-border bg-background flex flex-col md:flex-row items-stretch overflow-hidden group hover:border-foreground/30 transition-colors">
      
      {/* LEFT: PROJECT (Source) */}
      {projectSlug ? (
        <Link href={`/project/${projectSlug}`} className="relative w-full md:w-64 shrink-0 bg-secondary border-b md:border-b-0 md:border-r border-border group/project overflow-hidden h-32 md:h-auto block">
          <ProjectLeftContent thumb={projectThumb} title={projectTitle} />
        </Link>
      ) : (
        <div className="relative w-full md:w-64 shrink-0 bg-secondary border-b md:border-b-0 md:border-r border-border overflow-hidden h-32 md:h-auto opacity-50 grayscale cursor-not-allowed">
          <ProjectLeftContent thumb={projectThumb} title="Classified Node" />
        </div>
      )}

      {/* CENTER: THE CONNECTION (Creative Arrow) */}
      <div className="flex-1 relative flex items-center justify-center px-4 py-4 md:py-0 bg-gradient-to-r from-background via-secondary/10 to-background">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border group-hover:bg-border/80 transition-colors hidden md:block" />
        
        <div className={`
            relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-[10px] uppercase tracking-wider shadow-sm backdrop-blur-md bg-background
            ${statusConfig.color} ${statusConfig.border}
        `}>
            <StatusIcon size={12} />
            <span>{statusConfig.label}</span>
        </div>

        <motion.div 
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground/20 hidden md:block"
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
            <ArrowRight size={16} />
        </motion.div>
      </div>

      {/* RIGHT: EVENT (Destination) */}
      {isEventPublic && eventId ? (
        <Link 
            href={`/events/${eventId}`} 
            target="_blank"
            className="relative w-full md:w-64 shrink-0 bg-secondary border-t md:border-t-0 md:border-l border-border group/event overflow-hidden h-32 md:h-auto cursor-pointer block"
        >
            <EventRightContent event={event} isPublic={true} />
        </Link>
      ) : (
        <div className="relative w-full md:w-64 shrink-0 bg-secondary border-t md:border-t-0 md:border-l border-border group/event overflow-hidden h-32 md:h-auto cursor-not-allowed opacity-80 grayscale">
            <EventRightContent event={event} isPublic={false} />
        </div>
      )}

    </div>
  );
}

// Helper for the Left Side (Project) to keep JSX clean
function ProjectLeftContent({ thumb, title }) {
    return (
        <>
            {thumb ? (
                <Image src={thumb} alt={title} fill className="object-cover transition-transform duration-500 group-hover/project:scale-105" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800 font-mono text-xs">NO_IMAGE</div>
            )}
            <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-3">
                <span className="text-[9px] font-mono text-white/60 uppercase mb-0.5">Source Project</span>
                <h4 className="text-white text-xs font-bold truncate group-hover/project:text-accent transition-colors">{title}</h4>
            </div>
        </>
    );
}

// Helper for the Right side (Event) to avoid code duplication
function EventRightContent({ event, isPublic }) {
    const coverImage = getSmartThumbnail(event?.cover_image);
    const eventTitle = event?.title || "Classified Sector";

    return (
        <>
            {coverImage ? (
                <Image src={coverImage} alt={eventTitle} fill className="object-cover transition-transform duration-500 group-hover/event:scale-105" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800 font-mono text-xs">EVENT_COVER</div>
            )}
            <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-3 text-right">
                <div className="flex justify-end mb-0.5">
                    {isPublic ? (
                        <span className="text-[9px] font-mono text-green-400 flex items-center gap-1 uppercase"><Globe size={8}/> Public Event</span>
                    ) : (
                        <span className="text-[9px] font-mono text-red-400 flex items-center gap-1 uppercase"><Lock size={8}/> Private</span>
                    )}
                </div>
                <h4 className="text-white text-xs font-bold truncate group-hover/event:underline decoration-white/30 underline-offset-4">{eventTitle}</h4>
            </div>
        </>
    );
}