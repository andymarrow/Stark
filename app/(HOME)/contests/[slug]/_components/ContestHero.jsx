"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Trophy, Users, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
// Icon helper
import { CheckCircle2 } from "lucide-react";

export default function ContestHero({ contest, userEntry }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("upcoming"); // upcoming, active, closed

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(contest.start_date).getTime();
      const end = new Date(contest.submission_deadline).getTime();
      const reveal = new Date(contest.winner_announce_date).getTime();

      if (now < start) {
        setStatus("upcoming");
        return `Starts in ${formatTime(start - now)}`;
      } else if (now < end) {
        setStatus("active");
        return formatTime(end - now);
      } else if (now < reveal) {
        setStatus("judging");
        return "Submissions Closed. Judging in progress.";
      } else {
        setStatus("completed");
        return "Winners Announced";
      }
    };

    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    setTimeLeft(calculateTime()); // Initial call
    return () => clearInterval(timer);
  }, [contest]);

  const formatTime = (ms) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link Copied");
  };

  return (
    <div className="relative w-full border-b border-border bg-black">
      
      {/* Background Blur */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        {contest.cover_image && (
            <Image src={contest.cover_image} alt="bg" fill className="object-cover blur-3xl scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            
            {/* Left: Cover Art & Badges */}
            <div className="md:col-span-4">
                <div className="relative aspect-video w-full border border-border bg-secondary shadow-2xl overflow-hidden group">
                    {contest.cover_image ? (
                        <Image src={contest.cover_image} alt={contest.title} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                            <Trophy size={48} />
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <span className={`px-3 py-1 text-[10px] font-mono font-bold uppercase border backdrop-blur-md text-white
                            ${status === 'active' ? 'bg-green-600/80 border-green-500' : 
                              status === 'judging' ? 'bg-yellow-600/80 border-yellow-500' : 'bg-zinc-800/80 border-zinc-700'}`}>
                            {status === 'active' ? 'Live Now' : status.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="md:col-span-8 space-y-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2 leading-none">
                        {contest.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
                        <span className="flex items-center gap-1.5">
                            <Users size={14} />
                            Hosted by @{contest.creator?.username || 'Stark'}
                        </span>
                        <span>•</span>
                        <span>{contest.max_participants ? `Limit: ${contest.max_participants} Entries` : "Unlimited Entries"}</span>
                    </div>
                </div>

                {/* Timer Box */}
                <div className="bg-zinc-900/50 border border-white/10 p-4 inline-flex items-center gap-4">
                    <div className="p-2 bg-accent/10 text-accent">
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase text-zinc-500 tracking-widest">Time Remaining</div>
                        <div className="text-xl font-bold font-mono text-white tracking-wide">
                            {timeLeft}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    {status === 'active' && !userEntry && (
                        <Link href={`/create?contest=${contest.slug}`}>
                            <Button className="h-12 px-8 bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                                Submit Entry <Plus size={14} className="ml-2" />
                            </Button>
                        </Link>
                    )}
                    
                    {userEntry && (
                        <div className="h-12 px-6 flex items-center bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-mono uppercase">
                            <CheckCircle2 size={16} className="mr-2" /> Entry Submitted
                        </div>
                    )}

                    <Button onClick={handleShare} variant="outline" className="h-12 rounded-none border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 uppercase font-mono text-xs">
                        <Share2 size={16} className="mr-2" /> Share
                    </Button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
