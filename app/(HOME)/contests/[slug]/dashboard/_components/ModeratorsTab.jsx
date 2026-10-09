"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, UserPlus, Trash2, Search, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { getAvatar } from "@/constants/assets";
import {
  listContestModerators,
  addContestModerator,
  removeContestModerator,
} from "@/app/actions/contestModerators";

export default function ModeratorsTab({ contest }) {
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const res = await listContestModerators(contest.id);
    if (res.notReady) setNotReady(true);
    else if (res.error) toast.error("Could not load moderators", { description: res.error });
    setModerators(res.moderators || []);
    setLoading(false);
  };

  useEffect(() => {
    if (contest?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest?.id]);

  // Same debounced search as the collaborator picker.
  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .ilike("username", `%${query.trim().replace(/^@/, "")}%`)
        .limit(5);
      const existing = new Set(moderators.map((m) => m.userId));
      setResults((data || []).filter((u) => u.id !== contest.creator_id && !existing.has(u.id)));
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query, moderators, contest?.creator_id]);

  const add = async (username) => {
    setBusyId(username);
    const res = await addContestModerator(contest.id, username);
    if (res.error) toast.error("Could not add", { description: res.error });
    else {
      toast.success(`@${res.moderator.username} can now run this contest`);
      setQuery("");
      setResults([]);
      await load();
    }
    setBusyId(null);
  };

  const remove = async (mod) => {
    setBusyId(mod.id);
    const res = await removeContestModerator(contest.id, mod.id);
    if (res.error) toast.error("Could not remove", { description: res.error });
    else {
      toast.info(`@${mod.username} no longer has access`);
      await load();
    }
    setBusyId(null);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin text-accent" size={28} />
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Loading_Moderators...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-3xl pb-20">
      <div className="border border-border bg-background p-6 space-y-2">
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck size={18} />
          <h3 className="font-bold text-sm uppercase tracking-widest">Moderators</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Moderators get this dashboard — judges, announcements, submissions and settings.
          Deleting the contest and changing this list stay with you, so access you give can always be taken back.
        </p>
      </div>

      {notReady && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 flex gap-3">
          <Info size={16} className="text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            The moderators table hasn&apos;t been created yet. Run the migration
            <span className="font-mono text-foreground"> 20261010000000_contest_moderators.sql </span>
            in the Supabase SQL editor, then reload this page.
          </p>
        </div>
      )}

      {/* ADD */}
      <div className="space-y-3">
        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Add a moderator</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            disabled={notReady}
            className="w-full h-11 pl-10 pr-4 bg-secondary/5 border border-border text-sm font-mono outline-none focus:border-accent transition-colors disabled:opacity-50"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-accent" />}
        </div>

        {results.length > 0 && (
          <div className="border border-border bg-background divide-y divide-border">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => add(u.username)}
                disabled={busyId === u.username}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/20 text-left transition-colors disabled:opacity-50"
              >
                <span className="relative w-8 h-8 border border-border bg-secondary overflow-hidden shrink-0">
                  <Image src={getAvatar(u)} alt="" fill className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold truncate">{u.full_name || u.username}</span>
                  <span className="block text-xs font-mono text-muted-foreground">@{u.username}</span>
                </span>
                {busyId === u.username
                  ? <Loader2 size={14} className="ml-auto animate-spin text-accent" />
                  : <UserPlus size={14} className="ml-auto text-muted-foreground" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CURRENT */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
          Current moderators ({moderators.length})
        </span>

        {moderators.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border bg-secondary/5">
            <p className="text-xs font-mono text-muted-foreground uppercase">
              You&apos;re the only one running this contest
            </p>
          </div>
        ) : (
          <div className="border border-border bg-background divide-y divide-border">
            {moderators.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3">
                <Link href={`/profile/${m.username}`} className="relative w-8 h-8 border border-border bg-secondary overflow-hidden shrink-0">
                  <Image src={getAvatar({ avatar_url: m.avatar, username: m.username })} alt="" fill className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${m.username}`} className="block text-sm font-bold truncate hover:text-accent transition-colors">
                    {m.name}
                  </Link>
                  <span className="block text-xs font-mono text-muted-foreground">@{m.username}</span>
                </div>
                <Button
                  onClick={() => remove(m)}
                  disabled={busyId === m.id}
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-none text-muted-foreground hover:text-red-500 hover:bg-red-500/10 font-mono text-[10px] uppercase tracking-widest"
                >
                  {busyId === m.id ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={12} className="mr-1.5" /> Remove</>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
