"use client";
import Link from "next/link";
import { Users, Clock, Flame, Star } from "lucide-react";

// One spotlight panel. Shared between the single-contest and dual-contest
// layouts so both read as the same "hero card" — bottom-anchored content
// over a dimmed cover image, exactly like the rest of Stark's photo cards.
function HeroPanel({ contest, index, total }) {
  const isPick = contest.is_featured; // true = curator's pick, false = hype fallback

  return (
    <Link
      href={`/contests/${contest.slug}`}
      className="group relative flex flex-col justify-end overflow-hidden h-[360px] md:h-[440px] bg-secondary/20"
    >
      {/* Editorial index — only meaningful once there's more than one panel */}
      {total > 1 && (
        <span className="absolute top-3 right-5 z-10 font-black text-6xl text-foreground/[0.07] leading-none select-none pointer-events-none">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-25 dark:opacity-45"
        style={{ backgroundImage: `url(${contest.cover_image || "/placeholder.jpg"})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/20" />

      {/* Content */}
      <div className="relative z-[1] p-6 md:p-8">
        <div
          className={`inline-flex items-center gap-2 border px-3 py-1 w-fit mb-4 ${
            isPick
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
          }`}
        >
          {isPick ? <Star size={11} className="fill-current" /> : <Flame size={11} />}
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
            {isPick ? "Featured" : "Trending Now"}
          </span>
        </div>

        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground mb-3 leading-[0.95] line-clamp-2">
          {contest.title}
        </h2>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-mono text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5" title="Total Entries">
            <Users size={13} /> {contest.participant_count} Contenders
          </span>
          <span className="flex items-center gap-1.5" title="Hype Score (Total Likes)">
            <Flame size={13} className="text-orange-500" /> {contest.hype_score} Hype
          </span>
          <span className="flex items-center gap-1.5" title="Time Remaining">
            <Clock size={13} /> {contest.days_left > 0 ? `${contest.days_left}d left` : "Final Stages"}
          </span>
        </div>

        <span className="inline-block h-11 px-6 leading-[44px] bg-foreground text-background font-black uppercase text-[11px] tracking-widest group-hover:bg-accent group-hover:text-white transition-all skew-x-[-10deg] w-fit">
          <span className="skew-x-[10deg] inline-block">Enter The Arena</span>
        </span>
      </div>
    </Link>
  );
}

export default function ArenaHero({ contests = [] }) {
  if (!contests.length) return null;

  const isDual = contests.length === 2;

  return (
    <div className="relative w-full border-b border-border">
      <div className={`grid grid-cols-1 ${isDual ? "md:grid-cols-2 md:divide-x md:divide-border" : ""}`}>
        {contests.map((c, i) => (
          <HeroPanel key={c.id} contest={c} index={i} total={contests.length} />
        ))}
      </div>

      {/* "VS" emblem straddling the seam — only makes sense with two panels */}
      {isDual && (
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-background border-2 border-accent flex items-center justify-center rotate-[-8deg] shadow-[0_0_0_5px_hsl(var(--background))]">
            <span className="font-black text-accent text-sm tracking-tighter">VS</span>
          </div>
        </div>
      )}
    </div>
  );
}
