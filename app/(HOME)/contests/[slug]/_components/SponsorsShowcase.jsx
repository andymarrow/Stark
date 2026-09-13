"use client";
import { useState } from "react";
import Image from "next/image";
import { Globe, Twitter, Linkedin, Instagram, X, PlayCircle, ArrowRight, Crown, Award, Medal, ImageIcon } from "lucide-react";
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

// Each tier gets its own identity — color, icon, banner aspect — so the
// hierarchy reads instantly instead of every sponsor looking the same size.
const TIERS = {
  title: { label: "Title Sponsor", icon: Crown, accent: "text-accent", glow: "from-accent/20", border: "border-accent/40", bg: "bg-accent/10" },
  gold: { label: "Gold Sponsors", icon: Award, accent: "text-yellow-500", glow: "from-yellow-500/15", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
  silver: { label: "Silver Sponsors", icon: Medal, accent: "text-zinc-400", glow: "from-zinc-400/10", border: "border-zinc-400/25", bg: "bg-zinc-400/10" },
  partner: { label: "Partners", icon: Globe, accent: "text-muted-foreground", glow: "from-foreground/5", border: "border-border", bg: "bg-secondary/20" },
};
const TIER_ORDER = ["title", "gold", "silver", "partner"];

const LINK_ICONS = { web: Globe, x: Twitter, linkedin: Linkedin, instagram: Instagram };

function LinkRow({ links, size = 13 }) {
  const entries = Object.entries(links || {}).filter(([k, v]) => v && LINK_ICONS[k]);
  if (!entries.length) return null;
  return (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
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
            <Icon size={size} />
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
  const tier = TIERS[sponsor.tier] || TIERS.partner;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-background border border-border shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-background/90 border border-border hover:border-accent hover:text-accent transition-colors">
          <X size={16} />
        </button>

        <div className={`relative h-40 bg-gradient-to-br ${tier.glow} to-transparent border-b border-border flex items-end p-8 overflow-hidden`}>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
          <div className="relative flex items-end gap-5">
            <div className="w-20 h-20 flex-shrink-0 border border-border bg-background overflow-hidden shadow-lg">
              <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-2" />
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest font-bold ${tier.accent}`}>
                <tier.icon size={11} /> {sponsor.tier || "partner"} sponsor
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-tight">{sponsor.name}</h2>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {sponsor.tagline && <p className="text-sm text-foreground/90 font-medium">{sponsor.tagline}</p>}
          {sponsor.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{sponsor.description}</p>}
          <LinkRow links={sponsor.links} size={14} />
        </div>

        {gallery.length > 0 && (
          <div className="p-8 pt-0">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4 border-t border-border pt-6">Showcase</h3>
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

// The title sponsor: a full hero banner, not just a bigger card.
function TitleSponsorBanner({ sponsor, onOpen }) {
  const tier = TIERS.title;
  return (
    <button onClick={() => onOpen(sponsor)} className="group relative w-full text-left border border-accent/40 bg-card overflow-hidden">
      <div className={`relative h-56 md:h-64 bg-gradient-to-br ${tier.glow} via-secondary/10 to-transparent overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute top-0 left-0 bg-accent text-white text-[10px] font-mono font-bold uppercase tracking-widest px-4 py-1.5 flex items-center gap-1.5 z-10">
          <Crown size={12} /> Title Sponsor
        </div>

        <div className="relative h-full flex flex-col md:flex-row items-center md:items-end gap-6 p-8">
          <div className="w-28 h-28 md:w-36 md:h-36 flex-shrink-0 bg-background border border-border shadow-2xl overflow-hidden">
            <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-4" />
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none mb-2 group-hover:text-accent transition-colors">
              {sponsor.name}
            </h3>
            {sponsor.tagline && <p className="text-sm md:text-base text-muted-foreground max-w-xl">{sponsor.tagline}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-t border-border bg-background">
        <LinkRow links={sponsor.links} />
        <div className="flex items-center gap-4">
          {Array.isArray(sponsor.gallery) && sponsor.gallery.length > 0 && (
            <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
              {sponsor.gallery.some(isVideoUrl) ? <PlayCircle size={13} /> : <ImageIcon size={13} />} {sponsor.gallery.length} media
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase text-accent font-bold group-hover:gap-2.5 transition-all">
            View Profile <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </button>
  );
}

// Gold / Silver / Partner — a banner-style card (logo on a tier-tinted
// backdrop, not a lonely icon floating in whitespace), consistent with the
// cover-art card language used across the rest of Stark's contest pages.
function SponsorCard({ sponsor, tierKey, onOpen }) {
  const tier = TIERS[tierKey] || TIERS.partner;
  return (
    <button
      onClick={() => onOpen(sponsor)}
      className={`group relative text-left border ${tier.border} bg-card hover:border-accent/60 transition-all overflow-hidden w-full flex flex-col`}
    >
      {/* Corner brackets — Stark's brutalist card signature, turns accent on hover */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-border group-hover:border-accent transition-colors z-20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-border group-hover:border-accent transition-colors z-20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-border group-hover:border-accent transition-colors z-20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-border group-hover:border-accent transition-colors z-20" />

      <div className={`relative aspect-[16/10] bg-gradient-to-br ${tier.glow} to-transparent flex items-center justify-center p-8 border-b ${tier.border}`}>
        <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest font-bold ${tier.accent}`}>
          <tier.icon size={10} /> {tierKey}
        </span>
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
        />
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-black uppercase tracking-tight text-foreground group-hover:text-accent transition-colors truncate">
          {sponsor.name}
        </h3>
        {sponsor.tagline && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">{sponsor.tagline}</p>}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <LinkRow links={sponsor.links} size={11} />
          <span className="text-[9px] font-mono uppercase text-muted-foreground group-hover:text-accent transition-colors flex items-center gap-1">
            Profile <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
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
    <div className="space-y-14 animate-in fade-in slide-in-from-bottom-2">
      {TIER_ORDER.map((tierKey) => {
        const tierSponsors = byTier(tierKey);
        if (!tierSponsors.length) return null;
        const tier = TIERS[tierKey];

        return (
          <section key={tierKey}>
            <div className="flex items-center gap-2.5 mb-5 pb-2.5 border-b border-border">
              <tier.icon size={14} className={tier.accent} />
              <h3 className={`font-bold uppercase text-xs tracking-[0.25em] ${tierKey === "title" ? tier.accent : "text-muted-foreground"}`}>
                {tier.label}
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground/60">({tierSponsors.length})</span>
            </div>

            {tierKey === "title" ? (
              <div className="space-y-4">
                {tierSponsors.map((sponsor, i) => (
                  <TitleSponsorBanner key={sponsor.id || i} sponsor={sponsor} onOpen={setOpenSponsor} />
                ))}
              </div>
            ) : (
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${tierKey === "gold" ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
                {tierSponsors.map((sponsor, i) => (
                  <SponsorCard key={sponsor.id || i} sponsor={sponsor} tierKey={tierKey} onOpen={setOpenSponsor} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {openSponsor && <SponsorModal sponsor={openSponsor} onClose={() => setOpenSponsor(null)} />}
    </div>
  );
}
