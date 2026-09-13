"use client";
import Link from "next/link";
import { Gavel, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Weight bars cycle through these so a rubric with several criteria reads
// as a spectrum at a glance, not just a stack of identical grey rows.
const BAR_COLORS = ["bg-accent", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-pink-500", "bg-zinc-400"];

function RubricBar({ metrics }) {
  const manual = metrics.filter((m) => m.type === "manual");
  if (!manual.length) return null;
  return (
    <div className="flex h-1.5 w-full overflow-hidden bg-secondary/30">
      {manual.map((m, i) => (
        <div key={i} className={BAR_COLORS[i % BAR_COLORS.length]} style={{ width: `${m.weight}%` }} title={`${m.name} — ${m.weight}%`} />
      ))}
    </div>
  );
}

function JudgeCard({ judge, contestMetrics }) {
  const profile = judge.profile;
  const rubric = judge.metrics_config || contestMetrics || [];
  const manual = rubric.filter((m) => m.type === "manual");
  const systemMetrics = rubric.filter((m) => m.type !== "manual");
  const hasProfile = !!profile?.username;
  const displayName = profile?.full_name || profile?.username || judge.email?.split("@")[0] || "Guest Judge";
  const fallbackChar = (profile?.username || judge.email || "?").charAt(0).toUpperCase();

  return (
    <div className="border border-border bg-card hover:border-accent/50 transition-all overflow-hidden group">
      <div className="p-5 flex items-center gap-4">
        <Avatar className="h-12 w-12 rounded-none border border-border group-hover:border-accent transition-colors flex-shrink-0">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="rounded-none bg-secondary font-mono">{fallbackChar}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {hasProfile ? (
            <Link href={`/profile/${profile.username}`} className="font-bold text-sm truncate flex items-center gap-1.5 hover:text-accent transition-colors w-fit">
              {displayName} <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ) : (
            <div className="font-bold text-sm truncate">{displayName}</div>
          )}
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-tighter">
            {hasProfile ? `@${profile.username}` : "Guest evaluator"}
          </div>
        </div>
        {judge.metrics_config && (
          <span className="text-[8px] font-mono uppercase text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 flex-shrink-0">
            Own Rubric
          </span>
        )}
      </div>

      {profile?.bio && <p className="px-5 pb-4 text-xs text-muted-foreground leading-relaxed line-clamp-2">{profile.bio}</p>}

      {manual.length > 0 && (
        <div className="border-t border-border">
          <RubricBar metrics={rubric} />
          <div className="p-4 space-y-1.5">
            {manual.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                  <span className={`w-1.5 h-1.5 flex-shrink-0 ${BAR_COLORS[i % BAR_COLORS.length]}`} />
                  {m.name}
                </span>
                <span className="text-foreground font-bold flex-shrink-0">{m.weight}%</span>
              </div>
            ))}
            {systemMetrics.map((m, i) => (
              <div key={`sys-${i}`} className="flex items-center justify-between text-[10px] font-mono opacity-50">
                <span className="truncate">{m.name} (auto)</span>
                <span className="font-bold flex-shrink-0">{m.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JudgesShowcase({ judges, contestMetrics }) {
  const list = Array.isArray(judges) ? judges : [];

  if (!list.length) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center text-muted-foreground/40 gap-3">
        <Gavel size={40} />
        <p className="text-xs font-mono uppercase tracking-widest">Judging panel not yet announced.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <p className="text-xs text-muted-foreground font-mono mb-6 max-w-2xl">
        Here's exactly how each juror is scoring — every submission is judged on the criteria listed below their name.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((judge) => (
          <JudgeCard key={judge.id} judge={judge} contestMetrics={contestMetrics} />
        ))}
      </div>
    </div>
  );
}
