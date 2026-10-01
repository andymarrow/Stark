"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Users, UserCheck, Clock, Search, X, Mail } from "lucide-react";
import { getContestParticipation } from "@/app/actions/getContestParticipation";
import { getAvatar } from "@/constants/assets";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "accepted", label: "Accepted" },
  { id: "pending", label: "Pending" },
];

export default function ParticipantsTab({ contest }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!contest?.id) return;
    getContestParticipation(contest.id)
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res);
      })
      .finally(() => setLoading(false));
  }, [contest?.id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin text-accent" size={28} />
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Counting_Participants...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center border border-dashed border-border bg-secondary/5">
        <p className="text-sm font-mono text-muted-foreground uppercase">{error}</p>
      </div>
    );
  }

  const { totals, teams } = data;

  // Filter decides which members are shown, and hides teams left with none.
  const terms = query.trim().toLowerCase();
  const visibleTeams = teams
    .map((team) => {
      const members =
        filter === "all" ? team.members : team.members.filter((m) => m.status === filter);
      return { ...team, visibleMembers: members };
    })
    .filter((team) => {
      if (filter !== "all" && team.visibleMembers.length === 0) return false;
      if (!terms) return true;
      const haystack = [
        team.title,
        team.owner.username,
        team.owner.name,
        ...team.members.flatMap((m) => [m.username, m.name]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(terms);
    });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pb-20">
      {/* HEADLINE NUMBERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Participating Overall"
          value={totals.withPending}
          hint={`${totals.confirmed} confirmed + ${totals.pending} not yet accepted`}
          icon={Users}
          accent="text-accent"
          emphasis
        />
        <StatCard label="Confirmed" value={totals.confirmed} hint="Owners + accepted teammates" icon={UserCheck} accent="text-emerald-500" />
        <StatCard label="Awaiting Accept" value={totals.pending} hint="Invited, not yet confirmed" icon={Clock} accent="text-yellow-500" />
        <StatCard label="Teams / Entries" value={totals.entries} hint={`${teams.filter(t => t.counts.withPending > 1).length} have teammates`} icon={Users} accent="text-muted-foreground" />
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
                filter === f.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a team or person..."
            className="w-full h-9 pl-9 pr-8 bg-secondary/5 border border-border text-xs font-mono outline-none focus:border-accent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        Showing {visibleTeams.length} of {teams.length} teams
      </div>

      {/* TEAM ROSTERS */}
      {visibleTeams.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border bg-secondary/5">
          <p className="text-sm font-mono text-muted-foreground uppercase">No teams match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTeams.map((team) => (
            <TeamRow key={team.projectId} team={team} filter={filter} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, accent, emphasis }) {
  return (
    <div className={`border p-5 bg-background ${emphasis ? "border-accent/40 bg-accent/[0.03]" : "border-border"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <Icon size={14} className={accent} />
      </div>
      <div className={`text-4xl font-black tabular-nums ${emphasis ? "text-accent" : "text-foreground"}`}>{value}</div>
      <p className="text-[9px] font-mono text-muted-foreground mt-2 leading-relaxed">{hint}</p>
    </div>
  );
}

function TeamRow({ team, filter }) {
  const solo = team.counts.withPending === 1;

  return (
    <div className="border border-border bg-background p-4 hover:border-accent/40 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <Link href={`/project/${team.slug}`} className="font-bold text-sm hover:text-accent transition-colors truncate">
          {team.title}
        </Link>
        <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-widest shrink-0">
          <span className="text-muted-foreground">
            {team.counts.withPending} {team.counts.withPending === 1 ? "person" : "people"}
          </span>
          {team.counts.pending > 0 && (
            <span className="text-yellow-500">{team.counts.pending} pending</span>
          )}
          {solo && <span className="text-muted-foreground/60">solo</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Owner is only hidden when filtering to pending, since they're never pending. */}
        {filter !== "pending" && <PersonChip person={team.owner} />}
        {team.visibleMembers.map((m) => (
          <PersonChip key={m.id} person={m} />
        ))}
      </div>
    </div>
  );
}

function PersonChip({ person }) {
  const tone =
    person.status === "owner"
      ? "border-accent/40 text-accent"
      : person.status === "accepted"
      ? "border-emerald-500/40 text-emerald-500"
      : "border-yellow-500/40 text-yellow-500";

  const body = (
    <>
      {person.emailOnly ? (
        <Mail size={11} className="shrink-0" />
      ) : (
        <span className="relative w-4 h-4 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
          <Image src={getAvatar({ avatar_url: person.avatar, username: person.username })} alt="" fill className="object-cover" />
        </span>
      )}
      <span className="truncate max-w-[160px]">{person.emailOnly ? person.username : `@${person.username}`}</span>
      <span className="opacity-60 uppercase text-[8px] tracking-widest">{person.status}</span>
    </>
  );

  const className = `flex items-center gap-1.5 px-2 py-1 border text-[10px] font-mono bg-secondary/5 ${tone}`;

  if (person.emailOnly) return <span className={className}>{body}</span>;

  return (
    <Link href={`/profile/${person.username}`} className={`${className} hover:bg-secondary/20 transition-colors`}>
      {body}
    </Link>
  );
}
