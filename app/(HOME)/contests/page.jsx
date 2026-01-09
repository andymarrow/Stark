"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Trophy, Calendar, Users, ArrowRight, Loader2, Clock 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function ContestsExplorePage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      // Fetch contests that are NOT drafts
      const { data, error } = await supabase
        .from('contests')
        .select(`
            *,
            creator:profiles!creator_id(username, full_name, avatar_url)
        `)
        .neq('status', 'draft') 
        .order('created_at', { ascending: false });

      if (!error) setContests(data || []);
      setLoading(false);
    };

    fetchContests();
  }, []);

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* Hero */}
      <section className="relative border-b border-border bg-secondary/5 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                        Competitions
                    </h1>
                    <p className="text-muted-foreground max-w-xl text-lg font-light">
                        Join global hackathons, design sprints, and coding challenges. 
                        Build your reputation and win prizes.
                    </p>
                </div>
                <Link href="/contests/create">
                    <Button className="h-12 px-8 rounded-none bg-accent hover:bg-accent/90 text-white uppercase font-mono tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                        Host Event
                    </Button>
                </Link>
            </div>
        </div>
      </section>

      {/* Contest Grid */}
      <section className="container mx-auto max-w-6xl px-4 py-12">
        {contests.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center text-muted-foreground">
                <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold uppercase tracking-widest">No Active Events</h3>
                <p className="font-mono text-xs mt-2">Be the first to launch a contest.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {contests.map((contest) => (
                    <ContestCard key={contest.id} contest={contest} />
                ))}
            </div>
        )}
      </section>

    </div>
  );
}

function ContestCard({ contest }) {
    // Calculate Status & Time Left
    const now = new Date();
    const deadline = new Date(contest.submission_deadline);
    const isClosed = now > deadline;
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    // Get Top Prize
    const topPrize = contest.prizes?.[0]?.reward || "TBD";

    return (
        <Link href={`/contests/${contest.slug}`} className="group block border border-border bg-card hover:border-accent transition-colors relative overflow-hidden">
            
            {/* Cover Image */}
            <div className="relative aspect-video w-full bg-secondary border-b border-border overflow-hidden">
                {contest.cover_image ? (
                    <Image 
                        src={contest.cover_image} 
                        alt={contest.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                        <Trophy size={48} className="text-muted-foreground opacity-20" />
                    </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 text-[10px] font-mono font-bold uppercase border backdrop-blur-md 
                        ${isClosed 
                            ? 'bg-black/50 border-white/20 text-white' 
                            : 'bg-accent text-white border-accent'}`}>
                        {isClosed ? "Ended" : "Active"}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold uppercase tracking-tight mb-1 group-hover:text-accent transition-colors">
                            {contest.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span>Hosted by @{contest.creator?.username}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-dashed border-border">
                    <div>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Top Prize</span>
                        <span className="text-lg font-bold text-foreground">{topPrize}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Time Remaining</span>
                        <div className={`flex items-center justify-end gap-1 font-bold ${daysLeft < 3 && !isClosed ? 'text-red-500' : 'text-foreground'}`}>
                            {isClosed ? (
                                <span>Closed</span>
                            ) : (
                                <>
                                    <Clock size={14} />
                                    <span>{daysLeft} Days</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <Users size={12} /> {contest.max_participants ? `Limit: ${contest.max_participants}` : "Unlimited Entry"}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-foreground">
                        View Details <ArrowRight size={12} />
                    </span>
                </div>
            </div>
        </Link>
    );
}