"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Trophy, Search, ShieldCheck, Flame, Trash2, Eye 
} from "lucide-react";
import AdminTable , { AdminRow, AdminCell } from "../_components/AdminTable";
import { Button } from "@/components/ui/button";
import ContestDetailModal from "./_components/ContestDetailModal"; 

export default function ContestControlPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState(null);

  const fetchContests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contests')
      .select(`
        *,
        creator:profiles!creator_id(username, email),
        participant_count:contest_submissions(count)
      `)
      .order('created_at', { ascending: false });
    
    setContests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContests(); }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <Trophy className="text-yellow-500" /> Contest Control
                </h1>
                <p className="text-zinc-500 font-mono text-xs">GLOBAL_EVENTS: {contests.length}</p>
            </div>
            {/* Search (Simplified) */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                <input className="bg-black border border-white/10 text-xs font-mono text-white h-9 pl-9 w-64 focus:border-red-600 outline-none" placeholder="Search ID or Title..." />
            </div>
        </div>

        {/* Table */}
        <div className="bg-black border border-white/10 min-h-[400px]">
            <AdminTable headers={["Identity", "Host Node", "Status", "Metrics", "Flags", "Actions"]}>
                {contests.map((c) => (
                    <AdminRow key={c.id} className="cursor-pointer group">
                        
                        <AdminCell onClick={() => setSelectedContest(c)}>
                            <div className="font-bold text-white uppercase text-xs truncate max-w-[200px]">{c.title}</div>
                            <div className="text-[9px] font-mono text-zinc-600">{c.id}</div>
                        </AdminCell>

                        <AdminCell onClick={() => setSelectedContest(c)}>
                            <div className="text-xs text-zinc-300">@{c.creator?.username}</div>
                            <div className="text-[9px] font-mono text-zinc-600">{c.creator?.email}</div>
                        </AdminCell>

                        <AdminCell mono>
                            <span className={`text-[9px] px-2 py-0.5 border uppercase ${
                                c.status === 'open' ? 'text-green-500 border-green-900/50' : 
                                c.status === 'draft' ? 'text-zinc-500 border-zinc-800' : 'text-red-500 border-red-900/50'
                            }`}>
                                {c.status}
                            </span>
                        </AdminCell>

                        <AdminCell mono>
                            <div className="flex gap-4 text-xs text-zinc-400">
                                <span>{c.participant_count[0]?.count || 0} Entries</span>
                            </div>
                        </AdminCell>

                        <AdminCell>
                            {/* Flags / Featured Badges */}
                            <div className="flex gap-2">
                                {c.is_featured && <span className="text-[8px] bg-green-900/20 text-green-500 px-1 border border-green-900">FEATURED</span>}
                                {c.is_verified && <span className="text-[8px] bg-blue-900/20 text-blue-500 px-1 border border-blue-900">VERIFIED</span>}
                                {c.report_count > 0 && <span className="text-[8px] bg-red-900/20 text-red-500 px-1 border border-red-900">{c.report_count} REPORTS</span>}
                            </div>
                        </AdminCell>

                        <AdminCell>
                            <Button onClick={() => setSelectedContest(c)} variant="outline" className="h-7 rounded-none text-[10px] border-white/10 hover:bg-white/5 hover:text-white">
                                <Eye size={12} className="mr-2" /> Inspect
                            </Button>
                        </AdminCell>

                    </AdminRow>
                ))}
            </AdminTable>
        </div>

        {/* Detail Modal (Where the power is) */}
        {selectedContest && (
            <ContestDetailModal 
                contest={selectedContest} 
                isOpen={!!selectedContest} 
                onClose={() => { setSelectedContest(null); fetchContests(); }} // Refresh on close
            />
        )}

    </div>
  );
}