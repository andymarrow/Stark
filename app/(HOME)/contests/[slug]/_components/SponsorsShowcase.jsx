"use client";
import { useState } from "react";
import Image from "next/image";
import { Globe, Twitter, Linkedin, Instagram, X, PlayCircle, ChevronRight, Crown } from "lucide-react";
import ImageLightbox from "@/app/(HOME)/project/[slug]/_components/ImageLightbox";

const isVideoUrl = (url) => typeof url === "string" && (url.includes("youtube.com") || url.includes("youtu.be"));

const getYoutubeId = (url) => {
  let id = "";
  if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1];
  else if (url.includes("v=")) id = url.split("v=")[1].split("&")[0];
  else if (url.includes("embed/")) id = url.split("embed/")[1];
  return id.split("?")[0].split("/")[0];
};

const getThumbnail = (url) => (isVideoUrl(url) ? `https://img.youtube.com/vi/${getYoutubeId(url)}/mqdefault.jpg` : url);

const TIERS = [
  { id: "title", label: "Title Sponsor", accent: true },
  { id: "gold", label: "Gold Sponsors" },
  { id: "silver", label: "Silver Sponsors" },
  { id: "partner", label: "Partners" },
];

const LINK_ICONS = { web: Globe, x: Twitter, linkedin: Linkedin, instagram: Instagram };

function LinkRow({ links }) {
  const entries = Object.entries(links || {}).filter(([k, v]) => v && LINK_ICONS[k]);
  if (!entries.length) return null;
  return (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      {entries.map(([key, url]) => {
        const Icon = LINK_ICONS[key];
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-background border border-border hover:border-accent hover:text-accent transition-colors"
          >
            <Icon size={12} />
          </a>
        );
      })}
    </div>
  );
}

// Full sponsor profile — logo, blurb, links, and the mixed image/video gallery.
function SponsorModal({ sponsor, onClose }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const gallery = Array.isArray(sponsor.gallery) ? sponsor.gallery : [];
  const images = gallery.filter((u) => !isVideoUrl(u));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-background border border-border shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-background/90 border border-border hover:border-accent hover:text-accent transition-colors">
          <X size={16} />
        </button>

        <div className="p-8 border-b border-border flex items-start gap-5">
          <div className="relative w-16 h-16 flex-shrink-0 border border-border bg-secondary/20 overflow-hidden">
            <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-2" />
          </div>
          <div className="min-w-0 flex-1">
            {sponsor.tier && (
              <span className="text-[9px] font-mono uppercase tracking-widest text-accent font-bold">{sponsor.tier} Sponsor</span>
            )}
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-tight">{sponsor.name}</h2>
            {sponsor.tagline && <p className="text-sm text-muted-foreground mt-1">{sponsor.tagline}</p>}
            <div className="mt-3">
              <LinkRow links={sponsor.links} />
            </div>
          </div>
        </div>

        {sponsor.description && (
          <div className="p-8 border-b border-border">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{sponsor.description}</p>
          </div>
        )}

        {gallery.length > 0 && (
          <div className="p-8">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">Showcase</h3>
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((url, i) => {
                const video = isVideoUrl(url);
                return (
                  <div key={i} className="relative aspect-video bg-black border border-border overflow-hidden group">
                    {video ? (
                      <iframe src={`https://www.youtube.com/embed/${getYoutubeId(url)}`} className="w-full h-full" allowFullScreen />
                    ) : (
                      <button className="block w-full h-full cursor-zoom-in" onClick={() => setLightboxIndex(images.indexOf(url))}>
                        <Image src={getThumbnail(url)} alt={sponsor.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ImageLightbox isOpen={lightboxIndex !== null} onClose={() => setLightboxIndex(null)} images={images} initialIndex={lightboxIndex || 0} />
    </div>
  );
}

function SponsorCard({ sponsor, featured, onOpen }) {
  return (
    <button
      onClick={() => onOpen(sponsor)}
      className={`group text-left border bg-card hover:border-accent/60 transition-all relative overflow-hidden w-full
        ${featured ? "border-accent/40 p-8 flex flex-col md:flex-row items-center gap-8" : "border-border p-6 flex flex-col items-center text-center gap-3"}`}
    >
      {featured && (
        <div className="absolute top-0 left-0 bg-accent text-white text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 flex items-center gap-1.5">
          <Crown size={10} /> Title Sponsor
        </div>
      )}

      <div className={`relative flex-shrink-0 bg-secondary/20 border border-border overflow-hidden ${featured ? "w-28 h-28" : "w-16 h-16"}`}>
        <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-3 grayscale group-hover:grayscale-0 transition-all" />
      </div>

      <div className={`min-w-0 flex-1 ${featured ? "" : "w-full"}`}>
        <h3 className={`font-black uppercase tracking-tight text-foreground group-hover:text-accent transition-colors ${featured ? "text-2xl" : "text-sm truncate"}`}>
          {sponsor.name}
        </h3>
        {sponsor.tagline && (
          <p className={`text-muted-foreground mt-1 ${featured ? "text-sm" : "text-[10px] line-clamp-2"}`}>{sponsor.tagline}</p>
        )}
        <div className={`mt-3 flex items-center gap-3 ${featured ? "" : "justify-center"}`}>
          <LinkRow links={sponsor.links} />
          {Array.isArray(sponsor.gallery) && sponsor.gallery.length > 0 && (
            <span className="text-[9px] font-mono uppercase text-muted-foreground flex items-center gap-1">
              {sponsor.gallery.some(isVideoUrl) ? <PlayCircle size={11} /> : null} {sponsor.gallery.length} media
            </span>
          )}
        </div>
      </div>

      {featured && (
        <span className="hidden md:flex items-center gap-1 text-[10px] font-mono uppercase text-accent font-bold flex-shrink-0">
          View Profile <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      )}
    </button>
  );
}

export default function SponsorsShowcase({ sponsors }) {
  const [openSponsor, setOpenSponsor] = useState(null);
  const list = Array.isArray(sponsors) ? sponsors : [];

  const byTier = (tierId) => list.filter((s) => (s.tier || "partner") === tierId);

  if (!list.length) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center text-muted-foreground/40 gap-3">
        <Globe size={40} />
        <p className="text-xs font-mono uppercase tracking-widest">No sponsors yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
      {TIERS.map(({ id, label, accent }) => {
        const tierSponsors = byTier(id);
        if (!tierSponsors.length) return null;

        return (
          <section key={id}>
            <h3 className={`font-bold uppercase text-xs tracking-[0.2em] mb-5 pb-2 border-b border-border ${accent ? "text-accent" : "text-muted-foreground"}`}>
              {label}
            </h3>
            <div className={accent ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"}>
              {tierSponsors.map((sponsor, i) => (
                <SponsorCard key={sponsor.id || i} sponsor={sponsor} featured={accent} onOpen={setOpenSponsor} />
              ))}
            </div>
          </section>
        );
      })}

      {openSponsor && <SponsorModal sponsor={openSponsor} onClose={() => setOpenSponsor(null)} />}
    </div>
  );
}
