"use client";
import { useState, useEffect } from "react";
import { Activity, Users, Eye, Layers, Loader2, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function OverviewTab({ contest }) {
  const [status, setStatus] = useState(contest.status);
  const [winnersRevealed, setWinnersRevealed] = useState(contest.winners_revealed);
  const [counts, setCounts] = useState({ entries: 0, judges: 0, views: 0 });
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
        const { count: subCount } = await supabase.from('contest_submissions').select('*', { count: 'exact', head: true }).eq('contest_id', contest.id);
        const { count: judgeCount } = await supabase.from('contest_judges').select('*', { count: 'exact', head: true }).eq('contest_id', contest.id);
        const { data: viewsData } = await supabase.from('contest_submissions').select('project:projects(views)').eq('contest_id', contest.id);
        const totalViews = viewsData?.reduce((acc, curr) => acc + (curr.project?.views || 0), 0) || 0;

        setCounts({ entries: subCount || 0, judges: judgeCount || 0, views: totalViews });
        setLoading(false);
    };
    fetchCounts();
  }, [contest.id]);

  const handlePublish = async () => {
    const { error } = await supabase.from('contests').update({ status: 'open' }).eq('id', contest.id);
    if (!error) { setStatus("open"); toast.success("Contest is Live!"); }
  };

  const handleRevealWinners = async () => {
    setIsPublishing(true);
    try {
        // 1. Fetch Data
        const { data: submissions, error: subError } = await supabase
            .from('contest_submissions')
            .select(`id, project:projects(id, likes_count, views)`)
            .eq('contest_id', contest.id);

        if(subError) throw subError;

        const { data: rawScores } = await supabase
            .from('contest_scores')
            .select('*')
            .eq('contest_id', contest.id);

        // 2. Calculate Logic
        const maxLikes = Math.max(...(submissions || []).map(s => s.project.likes_count), 1);
        const maxViews = Math.max(...(submissions || []).map(s => s.project.views), 1);

        const rankedSubmissions = submissions.map(sub => {
            const projectScores = rawScores.filter(s => s.project_id === sub.project.id);
            const metricAverages = {};
            
            contest.metrics_config.forEach(metric => {
                if (metric.type === 'manual') {
                    const valid = projectScores.map(ps => ps.scores[metric.name]).filter(v => v != null);
                    metricAverages[metric.name] = valid.length > 0 ? valid.reduce((a,b)=>a+b,0)/valid.length : 0;
                } else if (metric.type === 'likes') {
                    metricAverages[metric.name] = (sub.project.likes_count / maxLikes) * 10;
                } else if (metric.type === 'views') {
                    metricAverages[metric.name] = (sub.project.views / maxViews) * 10;
                }
            });

            let total = 0;
            contest.metrics_config.forEach(m => total += (metricAverages[m.name] || 0) * (m.weight / 100));

            return { id: sub.id, total };
        }).sort((a, b) => b.total - a.total);

        // 3. Write to DB with Error Checking
        let errorOccurred = false;
        for (const [index, sub] of rankedSubmissions.entries()) {
            const { error: updateError } = await supabase.from('contest_submissions').update({
                final_score: sub.total,
                rank: index + 1,
                is_winner: index < 3
            }).eq('id', sub.id);

            if (updateError) {
                console.error("Rank Update Failed:", updateError);
                errorOccurred = true;
            }
        }

        if (errorOccurred) {
            toast.error("Database Permissions Error: Could not save ranks. Check RLS policies.");
            setIsPublishing(false);
            return; 
        }

        // 4. Reveal
        const { error } = await supabase.from('contests').update({ winners_revealed: true }).eq('id', contest.id);
        
        if (error) throw error;
        
        setWinnersRevealed(true); 
        toast.success("Results Calculated & Published");

    } catch (error) {
        console.error(error);
        toast.error("Failed to finalize results.");
    } finally {
        setIsPublishing(false);
    }
  };

  const now = new Date();
  const announceDate = new Date(contest.winner_announce_date);
  const isRevealTime = now >= announceDate;
  const daysLeft = Math.ceil((new Date(contest.submission_deadline) - now) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-20">
        <div className="p-6 border border-border bg-secondary/5 flex items-center justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />
            <div className="relative z-10">
                <h2 className="text-xl font-bold uppercase tracking-tighter">{contest.title}</h2>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">
                    SYSTEM_STATUS: <span className={status === 'open' ? "text-green-500 font-bold" : "text-accent"}>{status.toUpperCase()}</span>
                    {winnersRevealed && <span className="ml-3 text-yellow-500 border-l border-border pl-3">RESULTS_LIVE</span>}
                </p>
            </div>
            
            <div className="relative z-10 flex gap-3">
                {status === 'draft' && (
                    <button onClick={handlePublish} className="px-6 py-2 bg-accent hover:bg-red-700 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                        Publish Contest
                    </button>
                )}
                
                {status === 'open' && isRevealTime && !winnersRevealed && (
                    <button 
                        onClick={handleRevealWinners} 
                        disabled={isPublishing}
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                        {isPublishing ? <Loader2 className="animate-spin" /> : <><Trophy size={14} className="inline ml-1" /> Publish Results</>}
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
            {[
                { label: "Total Entries", value: counts.entries, icon: Layers },
                { label: "Reach (Views)", value: counts.views, icon: Eye },
                { label: "Judges", value: counts.judges, icon: Users },
                { label: "Days Left", value: daysLeft > 0 ? daysLeft : "0", icon: Activity }
            ].map((stat, i) => (
                <div key={i} className="bg-background p-6 flex flex-col justify-between h-28 hover:bg-secondary/5 transition-colors">
                    <span className="text-[9px] font-mono uppercase text-muted-foreground">{stat.label}</span>
                    {loading ? <Loader2 size={16} className="animate-spin text-accent/20" /> : <div className="text-2xl font-bold font-mono">{stat.value}</div>}
                </div>
            ))}
        </div>
    </div>
  );
}