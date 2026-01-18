"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Trophy, Users, Share2, Plus, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContestHero({ contest, userEntry }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("upcoming"); // upcoming, active, judging, completed

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
        return "Judging Protocol Active";
      } else {
        setStatus("completed");
        return "Contest Terminated";
      }
    };

    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    setTimeLeft(calculateTime()); 
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
    toast.success("Protocol Link Copied");
  };

  return (
    <div className="relative w-full border-b border-border bg-background transition-colors duration-300">
      
      {/* Background Ambience - Shifts with Theme */}
      <div className="absolute inset-0 overflow-hidden opacity-20 dark:opacity-30 pointer-events-none">
        {contest.cover_image && (
            <Image src={contest.cover_image} alt="bg" fill className="object-cover blur-3xl scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            
            {/* Left: Cover Art Card */}
            <div className="md:col-span-4">
                <div className="relative aspect-video w-full border border-border bg-secondary shadow-2xl overflow-hidden group rounded-none">
                    {contest.cover_image ? (
                        <Image src={contest.cover_image} alt={contest.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                            <Trophy size={48} />
                        </div>
                    )}
                    
                    {/* Floating Status Badge */}
                    <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 text-[9px] font-mono font-bold uppercase border backdrop-blur-md text-white
                            ${status === 'active' ? 'bg-green-600/80 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 
                              status === 'judging' ? 'bg-yellow-600/80 border-yellow-500' : 
                              status === 'completed' ? 'bg-accent/80 border-accent' :
                              'bg-zinc-800/80 border-zinc-700'}`}>
                            {status === 'active' ? 'LIVE_NOW' : status.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Meta Info & Logic Actions */}
            <div className="md:col-span-8 space-y-6">
                <div>
                    <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-2 leading-[0.9]">
                        {contest.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-muted-foreground/60" />
                            Node: @{contest.creator?.username || 'stark'}
                        </span>
                        <span className="opacity-30">//</span>
                        <span>{contest.max_participants ? `Quota: ${contest.max_participants}` : "Open_Quota"}</span>
                    </div>
                </div>

                {/* Timer / Winner Announcement Block */}
                <div className="bg-secondary/50 border border-border p-5 inline-flex items-center gap-5 shadow-inner rounded-none">
                    <div className={`p-3 rounded-none ${status === 'completed' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' : 'bg-accent/10 text-accent'}`}>
                        {status === 'completed' ? <Award size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                        <div className="text-[9px] uppercase text-muted-foreground font-mono tracking-[0.2em] mb-1">
                            {status === 'completed' ? 'Final_Resolution' : 'Time_Buffer_Remaining'}
                        </div>
                        <div className={`text-xl md:text-2xl font-black font-mono tracking-tighter 
                            ${status === 'completed' ? 'text-yellow-600 dark:text-yellow-500' : 'text-foreground'}`}>
                            {timeLeft}
                        </div>
                    </div>
                </div>

                {/* ACTION SECTION */}
                <div className="flex flex-wrap gap-3 pt-2">
                    
                    {/* 1. VIEW WINNERS (Yellow Logic) */}
                    {contest.winners_revealed && (
                        <Link href={`/contests/${contest.slug}/winners`}>
                            <Button className="h-14 px-10 bg-yellow-500 hover:bg-yellow-400 text-black rounded-none font-mono font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                                <Award size={18} className="mr-2" /> View Final Results
                            </Button>
                        </Link>
                    )}

                    {/* 2. SUBMIT ENTRY (Red Logic) */}
                    {status === 'active' && !userEntry && !contest.winners_revealed && (
                        <Link href={`/create?contest=${contest.slug}`}>
                            <Button className="h-14 px-10 bg-accent hover:bg-red-700 text-white rounded-none font-mono font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[0_0_25px_rgba(220,38,38,0.3)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                                <Plus size={18} className="mr-2" /> Initiate Submission
                            </Button>
                        </Link>
                    )}
                    
                    {/* 3. ENTRY STATUS */}
                    {userEntry && !contest.winners_revealed && (
                        <div className="h-14 px-8 flex items-center bg-green-500/5 border border-green-500/30 text-green-600 dark:text-green-500 text-[10px] font-mono font-bold uppercase tracking-widest">
                            <CheckCircle2 size={18} className="mr-3" /> Node_Registered_Successfully
                        </div>
                    )}

                    {/* 4. UTILITY ACTIONS */}
                    <Button 
                        onClick={handleShare} 
                        variant="outline" 
                        className="h-14 px-8 rounded-none border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary uppercase font-mono text-[10px] tracking-widest transition-colors"
                    >
                        <Share2 size={16} className="mr-2" /> Broadcast_Link
                    </Button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}