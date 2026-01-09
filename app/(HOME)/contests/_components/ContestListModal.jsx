"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Search, Calendar, Users, Trophy, Filter, Clock, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- HELPER: FORMAT STATUS ---
const getStatus = (c) => {
    const now = new Date().getTime();
    const end = new Date(c.submission_deadline).getTime();
    const reveal = new Date(c.winner_announce_date).getTime();
    
    if (c.winners_revealed) return { label: "Completed", color: "text-zinc-500 border-zinc-700" };
    if (now > end && now < reveal) return { label: "Judging", color: "text-yellow-500 border-yellow-500" };
    if (now > reveal) return { label: "Ended", color: "text-red-500 border-red-500" };
    return { label: "Live", color: "text-green-500 border-green-500 bg-green-500/10" };
};

export default function ContestListModal({ isOpen, onClose, contests }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, live, completed
  const [sortOrder, setSortOrder] = useState("newest"); // newest, prize, deadline

  // --- FILTER ENGINE ---
  const filtered = useMemo(() => {
    let result = contests.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

    if (filterStatus !== 'all') {
        const now = new Date().getTime();
        result = result.filter(c => {
            const end = new Date(c.submission_deadline).getTime();
            if (filterStatus === 'live') return now < end;
            if (filterStatus === 'completed') return now > end;
            return true;
        });
    }

    return result.sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortOrder === 'deadline') return new Date(a.submission_deadline) - new Date(b.submission_deadline);
        if (sortOrder === 'prize') {
            // Rough heuristic: parse first number from reward string
            const prizeA = parseInt(a.prizes?.[0]?.reward?.replace(/\D/g, '') || 0);
            const prizeB = parseInt(b.prizes?.[0]?.reward?.replace(/\D/g, '') || 0);
            return prizeB - prizeA;
        }
        return 0;
    });
  }, [contests, search, filterStatus, sortOrder]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-black border border-zinc-800 p-0 overflow-hidden flex flex-col rounded-none shadow-2xl">
        
        {/* HEADER */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
            <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                    <Trophy className="text-accent" /> Operations Index
                </h2>
                <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                    Global Archive // {filtered.length} Active Protocols
                </p>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors hover:bg-zinc-900">
                <X size={24} />
            </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by keyword..."
                    className="w-full h-10 bg-black border border-zinc-800 pl-10 text-sm font-mono text-white focus:border-accent outline-none uppercase placeholder:text-zinc-700"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px] h-10 rounded-none bg-black border-zinc-800 text-xs uppercase font-mono">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="live">Live Now</SelectItem>
                        <SelectItem value="completed">Archived</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[140px] h-10 rounded-none bg-black border-zinc-800 text-xs uppercase font-mono">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="deadline">Ending Soon</SelectItem>
                        <SelectItem value="prize">Highest Prize</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* GRID LIST */}
        <div className="flex-1 overflow-y-auto p-6 bg-black custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((contest) => {
                    const status = getStatus(contest);
                    const now = new Date();
                    const deadline = new Date(contest.submission_deadline);
                    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                    const isClosed = now > deadline;

                    return (
                        <Link 
                            key={contest.id} 
                            href={`/contests/${contest.slug}`}
                            className="flex flex-col border border-zinc-800 bg-zinc-950 hover:border-accent transition-all group relative overflow-hidden"
                        >
                            {/* Top Image */}
                            <div className="relative aspect-[2/1] bg-zinc-900 border-b border-zinc-800">
                                {contest.cover_image ? (
                                    <Image src={contest.cover_image} alt="c" fill className="object-cover opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-800"><Trophy size={32} /></div>
                                )}
                                <div className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] font-mono font-bold uppercase border backdrop-blur-md ${status.color}`}>
                                    {status.label}
                                </div>
                            </div>
                            
                            {/* Info */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-sm uppercase text-white leading-tight line-clamp-2 mb-3 group-hover:text-accent transition-colors">
                                        {contest.title}
                                    </h3>
                                    
                                    <div className="space-y-2 text-[10px] font-mono text-zinc-500">
                                        <div className="flex justify-between border-b border-zinc-800 pb-1">
                                            <span className="flex items-center gap-1.5"><Users size={12} /> Entries</span>
                                            <span className="text-zinc-300">
                                                {contest.participant_count || 0} / {contest.max_participants || "∞"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-zinc-800 pb-1">
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> Deadline</span>
                                            <span className={daysLeft < 3 && !isClosed ? "text-red-500" : "text-zinc-300"}>
                                                {isClosed ? "Ended" : `${daysLeft} Days`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-dashed border-zinc-800 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Top Prize</span>
                                        <span className="text-sm font-bold text-white">
                                            {contest.prizes?.[0]?.reward || "Undisclosed"}
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 flex items-center justify-center bg-white text-black group-hover:bg-accent group-hover:text-white transition-colors">
                                        <CheckCircle2 size={16} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
            
            {filtered.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                    <Filter size={48} className="opacity-20" />
                    <p className="text-xs font-mono uppercase">No operations match your query.</p>
                </div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}