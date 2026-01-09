"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Heart, ExternalLink, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function SubmissionsTab({ contest }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contest_submissions')
      .select(`
          id,
          final_score,
          project:projects!inner (
              id, title, slug, thumbnail_url, likes_count, views,
              owner:profiles!projects_owner_id_fkey (username, avatar_url)
          )
      `)
      .eq('contest_id', contest.id)
      .order('final_score', { ascending: false });

    if (error) {
        console.error("Dashboard Entries Error:", error);
    } else {
        setEntries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (contest.id) fetchEntries();
  }, [contest.id]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="text-xs font-mono text-muted-foreground uppercase">
                Active Submissions: <span className="text-foreground font-bold">{entries.length}</span>
            </div>
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input className="w-full h-9 bg-black border border-border pl-8 text-xs font-mono text-white outline-none focus:border-accent" placeholder="Filter by title..." />
            </div>
        </div>

        <div className="border border-border bg-black overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase">
                    <tr>
                        <th className="px-4 py-3 font-medium">Rank</th>
                        <th className="px-4 py-3 font-medium">Project</th>
                        <th className="px-4 py-3 font-medium">Creator</th>
                        <th className="px-4 py-3 font-medium text-right">Likes</th>
                        <th className="px-4 py-3 font-medium text-right">Views</th>
                        <th className="px-4 py-3 font-medium text-right text-accent">Total Score</th>
                        <th className="px-4 py-3 font-medium w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {loading ? (
                        <tr><td colSpan="7" className="p-12 text-center"><Loader2 className="animate-spin text-accent mx-auto" /></td></tr>
                    ) : entries.length === 0 ? (
                        <tr><td colSpan="7" className="p-12 text-center text-xs text-muted-foreground font-mono">No nodes registered in contest buffer.</td></tr>
                    ) : (
                        entries.map((entry, idx) => (
                            <tr key={entry.id} className="group hover:bg-secondary/5 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{idx + 1}</td>
                                <td className="px-4 py-3">
                                    <div className="font-bold text-foreground text-xs uppercase truncate max-w-[150px]">{entry.project.title}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 rounded-none border border-border">
                                            <AvatarImage src={entry.project.owner.avatar_url} />
                                            <AvatarFallback className="rounded-none text-[8px] bg-secondary">
                                                {entry.project.owner.username?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] text-muted-foreground font-mono">@{entry.project.owner.username}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[10px] text-muted-foreground">{entry.project.likes_count}</td>
                                <td className="px-4 py-3 text-right font-mono text-[10px] text-muted-foreground">{entry.project.views}</td>
                                <td className="px-4 py-3 text-right font-mono text-base font-black text-accent">{entry.final_score || 0}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={`/project/${entry.project.slug}`} target="_blank" className="text-zinc-600 hover:text-white transition-colors">
                                        <ExternalLink size={14} />
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}