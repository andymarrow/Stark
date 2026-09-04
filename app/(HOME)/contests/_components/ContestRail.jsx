"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Trophy, Users } from "lucide-react";

// The main grid below shows individual project *entries*, not contests — so
// without this, the only way to learn other contests exist was a small
// toolbar button. This rail sits right under the hero and surfaces them
// immediately, no click required, with the full searchable index always one
// click further via the trailing "View All" card.
export default function ContestRail({ contests, onViewAll }) {
  if (!contests?.length) return null;

  return (
    <div className="border-b border-border bg-secondary/10">
      <div className="container mx-auto px-4 max-w-[1400px] py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
              More Live Arenas
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">
              ({contests.length})
            </span>
          </div>
          <button
            onClick={onViewAll}
            className="text-[10px] font-mono uppercase text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
          >
            View All <ArrowRight size={11} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border">
          {contests.map((contest) => (
            <Link
              key={contest.id}
              href={`/contests/${contest.slug}`}
              className="group relative flex-shrink-0 w-[220px] border border-border bg-card hover:border-accent transition-all overflow-hidden"
            >
              <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
                {contest.cover_image ? (
                  <Image
                    src={contest.cover_image}
                    alt={contest.title}
                    fill
                    sizes="220px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                    <Trophy size={24} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-xs font-bold uppercase text-foreground truncate group-hover:text-accent transition-colors">
                  {contest.title}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users size={10} /> {contest.participant_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {contest.days_left > 0 ? `${contest.days_left}d` : "Ending"}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Trailing "view all" card — keeps the full searchable index one tap away */}
          <button
            onClick={onViewAll}
            className="flex-shrink-0 w-[220px] border border-dashed border-border hover:border-accent bg-background flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-accent transition-all"
          >
            <Trophy size={20} />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              View All Contests
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
