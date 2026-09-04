"use client";
import ReactMarkdown from "react-markdown";
import { Gavel, ExternalLink, Handshake, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageLightbox from "@/app/(HOME)/project/[slug]/_components/ImageLightbox"; // Reuse existing lightbox

// YouTube Helper
const getThumbnail = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        if (videoId) return `https://img.youtube.com/vi/${videoId.split("?")[0]}/mqdefault.jpg`;
    }
    return url;
};

export default function RulesTab({ contest, judges, onViewSponsors }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Safe extraction of description
  const content = typeof contest?.description === 'object' ? contest.description.text : contest?.description;

  // Gallery/trailer assets live in media_urls — sponsors get their own tab.
  const galleryAssets = Array.isArray(contest.media_urls) ? contest.media_urls : [];
  const sponsors = (Array.isArray(contest.sponsors) ? contest.sponsors : []).filter(
    (s) => typeof s === "object" && s?.name
  );

  const openLightbox = (index) => {
      setLightboxIndex(index);
      setLightboxOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-2">
        
        {/* LEFT: Content */}
        <div className="lg:col-span-8 space-y-12">
            
            {/* GALLERY SECTION */}
            {galleryAssets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {galleryAssets.map((url, i) => {
                        const isVideo = url.includes("youtube") || url.includes("youtu.be");
                        const thumb = getThumbnail(url);

                        return (
                            <div 
                                key={i} 
                                onClick={() => !isVideo && openLightbox(i)}
                                className={`relative aspect-video bg-black border border-border group overflow-hidden ${isVideo ? '' : 'cursor-zoom-in'}`}
                            >
                                {isVideo ? (
                                    <iframe 
                                        src={`https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0] || url.split('/').pop()}`} 
                                        className="w-full h-full" 
                                        allowFullScreen 
                                    />
                                ) : (
                                    <Image src={thumb} alt="asset" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Description */}
            <section>
                <div className="prose prose-zinc dark:prose-invert max-w-none text-sm font-mono leading-relaxed prose-headings:font-bold prose-headings:uppercase prose-p:text-muted-foreground prose-li:text-muted-foreground">
                    <ReactMarkdown>{content || "No detailed rules provided."}</ReactMarkdown>
                </div>
            </section>

            {/* Judges */}
            {judges && judges.length > 0 && (
                <section className="border-t border-border pt-8">
                    <h3 className="font-bold uppercase text-xs tracking-widest mb-6 flex items-center gap-2 text-muted-foreground">
                        <Gavel size={14} className="text-accent" /> Judged By
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {judges.map((judge) => {
                            const hasProfile = !!judge?.profile?.username;
                            const displayName = judge?.profile?.full_name || judge?.email || "Anonymous Judge";
                            const fallbackChar = (judge?.profile?.username || judge?.email || "?").charAt(0).toUpperCase();

                            const Content = (
                                <div className={`flex items-center gap-4 p-4 border transition-all group h-full
                                    ${hasProfile ? 'bg-card border-border hover:border-accent/50 cursor-pointer' : 'bg-secondary/5 border-border/50 opacity-70 cursor-default'}`}>
                                    <Avatar className="h-10 w-10 rounded-none border border-border group-hover:border-accent transition-colors">
                                        <AvatarImage src={judge?.profile?.avatar_url} />
                                        <AvatarFallback className="rounded-none bg-secondary font-mono">{fallbackChar}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-sm truncate flex items-center gap-2">
                                            {displayName}
                                            {hasProfile && <ExternalLink size={10} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </div>
                                        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-tighter">
                                            {hasProfile ? `@${judge.profile.username}` : "Unlinked_node"}
                                        </div>
                                    </div>
                                </div>
                            );

                            return hasProfile ? (
                                <Link key={judge.id} href={`/profile/${judge.profile.username}`}>{Content}</Link>
                            ) : (
                                <div key={judge.id}>{Content}</div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>

        {/* RIGHT: Sidebar */}
        <div className="lg:col-span-4 space-y-8">
            <div className="bg-secondary/5 border border-border p-6 relative overflow-hidden">
                <h3 className="font-bold uppercase text-[10px] tracking-[0.2em] mb-6 border-b border-border pb-2 text-muted-foreground">Prize Pool</h3>
                <div className="space-y-6">
                    {contest?.prizes?.map((prize, i) => (
                        <div key={i} className="flex items-start gap-4 group">
                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold text-xs border bg-secondary/20 border-border text-muted-foreground">
                                0{prize.rank}
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-black uppercase leading-none mb-2 group-hover:text-accent transition-colors truncate">{prize.title}</div>
                                <div className="space-y-1">
                                    {prize.rewards?.map((r, rIdx) => (
                                        <div key={rIdx} className="text-[10px] text-muted-foreground font-mono flex items-center gap-2">
                                            <span className="w-1 h-1 bg-accent rounded-full" /> {r}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sponsors get real estate of their own now — this is just a
                pointer to it, with a peek at the logos so it doesn't read
                as a dead end. */}
            {sponsors.length > 0 && onViewSponsors && (
                <button
                    onClick={onViewSponsors}
                    className="w-full text-left bg-background border border-border p-6 group hover:border-accent/50 transition-all"
                >
                    <h3 className="font-bold uppercase text-[10px] tracking-[0.2em] mb-4 border-b border-border pb-2 text-muted-foreground flex items-center gap-2">
                        <Handshake size={12} className="text-accent" /> Backed By
                    </h3>
                    <div className="flex items-center -space-x-2 mb-4">
                        {sponsors.slice(0, 6).map((sponsor, i) => (
                            <div key={i} className="relative w-9 h-9 rounded-full border-2 border-background bg-secondary overflow-hidden flex-shrink-0" style={{ zIndex: 6 - i }}>
                                <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {sponsors.length > 6 && (
                            <div className="relative w-9 h-9 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[9px] font-mono font-bold text-muted-foreground">
                                +{sponsors.length - 6}
                            </div>
                        )}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-tight text-foreground group-hover:text-accent transition-colors flex items-center gap-1.5">
                        View {sponsors.length} Sponsor{sponsors.length > 1 ? "s" : ""}
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                </button>
            )}
        </div>

        {/* LIGHTBOX FOR IMAGES */}
        <ImageLightbox 
            isOpen={lightboxOpen} 
            onClose={() => setLightboxOpen(false)} 
            images={galleryAssets.filter(url => !url.includes("youtube") && !url.includes("youtu.be"))} 
            initialIndex={lightboxIndex} 
        />
    </div>
  );
}