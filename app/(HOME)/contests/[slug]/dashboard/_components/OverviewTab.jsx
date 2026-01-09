"use client";
import { useState, useEffect } from "react";
import { Activity, Users, Eye, Layers, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function OverviewTab({ contest }) {
  const [status, setStatus] = useState(contest.status);
  const [counts, setCounts] = useState({ entries: 0, judges: 0, views: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
        // 1. Count Submissions
        const { count: subCount } = await supabase
            .from('contest_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

        // 2. Count Judges
        const { count: judgeCount } = await supabase
            .from('contest_judges')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

        // 3. Aggregate Total Views from submitted projects
        const { data: viewsData } = await supabase
            .from('contest_submissions')
            .select('project:projects(views)')
            .eq('contest_id', contest.id);
        
        const totalViews = viewsData?.reduce((acc, curr) => acc + (curr.project?.views || 0), 0) || 0;

        setCounts({
            entries: subCount || 0,
            judges: judgeCount || 0,
            views: totalViews
        });
        setLoading(false);
    };

    fetchCounts();
  }, [contest.id]);

  const handlePublish = async () => {
    const { error } = await supabase
        .from('contests')
        .update({ status: 'open' }) 
        .eq('id', contest.id);
    
    if (error) {
        toast.error("Failed to publish");
    } else {
        setStatus("open");
        toast.success("Contest is Live!");
    }
  };

  const now = new Date();
  const deadline = new Date(contest.submission_deadline);
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  const stats = [
    { label: "Total Entries", value: counts.entries, icon: Layers },
    { label: "Reach (Views)", value: counts.views, icon: Eye },
    { label: "Judges", value: counts.judges, icon: Users },
    { label: "Days Left", value: daysLeft > 0 ? daysLeft : "0", icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="p-6 border border-border bg-secondary/5 flex items-center justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />
            <div className="relative z-10">
                <h2 className="text-xl font-bold uppercase tracking-tighter">{contest.title}</h2>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">
                    SYSTEM_STATUS: <span className={status === 'open' ? "text-green-500 font-bold" : "text-accent"}>
                        {status.toUpperCase()}
                    </span>
                </p>
            </div>
            <div className="relative z-10">
                {status === 'draft' && (
                    <button 
                        onClick={handlePublish}
                        className="px-6 py-2 bg-accent hover:bg-red-700 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                        Publish Contest
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
            {stats.map((stat, i) => (
                <div key={i} className="bg-background p-6 flex flex-col justify-between h-28 hover:bg-secondary/5 transition-colors">
                    <div className="flex justify-between items-start text-muted-foreground">
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em]">{stat.label}</span>
                        <stat.icon size={12} />
                    </div>
                    {loading ? (
                        <Loader2 size={16} className="animate-spin text-accent/20" />
                    ) : (
                        <div className="text-2xl font-bold font-mono tracking-tighter">{stat.value}</div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
}