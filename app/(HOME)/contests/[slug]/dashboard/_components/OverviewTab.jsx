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
        const totalViews = viewsData?.reduce((acc, curr) => acc + (Number(curr.project?.views) || 0), 0) || 0;
        setCounts({ entries: subCount || 0, judges: judgeCount || 0, views: totalViews });
        setLoading(false);
    };
    fetchCounts();
  }, [contest.id]);

  const handleRevealWinners = async () => {
    setIsPublishing(true);
    try {
        // 1. Fetch Data
        const { data: submissions, error: subError } = await supabase
            .from('contest_submissions')
            .select(`id, project_id, project:projects(id, likes_count, views)`)
            .eq('contest_id', contest.id);

        if(subError) throw subError;

        const { data: rawScores, error: scoreError } = await supabase
            .from('contest_scores')
            .select('*')
            .eq('contest_id', contest.id);
        
        if(scoreError) throw scoreError;

        // 2. Constants for Normalization
        const maxLikes = Math.max(...(submissions || []).map(s => Number(s.project.likes_count) || 0), 1);
        const maxViews = Math.max(...(submissions || []).map(s => Number(s.project.views) || 0), 1);

        // 3. Calculation Engine
        const rankedSubmissions = submissions.map(sub => {
            const projectScores = (rawScores || []).filter(s => s.project_id === sub.project_id);
            const metricAverages = {};
            
            contest.metrics_config.forEach(metric => {
                const weight = Number(metric.weight) || 0;
                
                if (metric.type === 'manual') {
                    const valid = projectScores.map(ps => ps.scores[metric.name]).filter(v => v != null);
                    metricAverages[metric.name] = valid.length > 0 ? (valid.reduce((a,b) => a + b, 0) / valid.length) : 0;
                } else if (metric.type === 'likes') {
                    metricAverages[metric.name] = ( (Number(sub.project.likes_count) || 0) / maxLikes ) * 10;
                } else if (metric.type === 'views') {
                    metricAverages[metric.name] = ( (Number(sub.project.views) || 0) / maxViews ) * 10;
                }
            });

            let total = 0;
            contest.metrics_config.forEach(m => {
                const score = Number(metricAverages[m.name]) || 0;
                const weightFactor = (Number(m.weight) || 0) / 100;
                total += score * weightFactor;
            });

            return { id: sub.id, total: Number(total.toFixed(2)) };
        }).sort((a, b) => b.total - a.total);

        // 4. Batch DB Write
        for (const [index, sub] of rankedSubmissions.entries()) {
            console.log(`[Reveal] Updating Entry ${sub.id} with Score ${sub.total} at Rank ${index + 1}`);
            const { error: updateError } = await supabase
                .from('contest_submissions')
                .update({
                    final_score: sub.total,
                    rank: index + 1,
                    is_winner: index < 3
                })
                .eq('id', sub.id);

            if (updateError) throw new Error(`Submission ${sub.id} failed: ${updateError.message}`);
        }

        // 5. Reveal Globally
        const { error: finalError } = await supabase.from('contests').update({ winners_revealed: true }).eq('id', contest.id);
        if (finalError) throw finalError;
        
        setWinnersRevealed(true); 
        toast.success("Hall of Fame Finalized");

    } catch (error) {
        console.error(" [Reveal] Fatal Error:", error);
        toast.error("Operation Failed", { description: error.message });
    } finally {
        setIsPublishing(false);
    }
  };

  const handlePublish = async () => {
    const { error } = await supabase.from('contests').update({ status: 'open' }).eq('id', contest.id);
    if (!error) { setStatus("open"); toast.success("Contest is Live!"); }
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
                    {winnersRevealed && <span className="ml-3 text-yellow-500 border-l border-zinc-800 pl-3">PROTOCOL_FINALIZED</span>}
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
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
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
                    <span className="text-[9px] font-mono uppercase text-muted-foreground tracking-widest">{stat.label}</span>
                    {loading ? <Loader2 size={16} className="animate-spin text-accent/20" /> : <div className="text-2xl font-bold font-mono tracking-tighter">{stat.value}</div>}
                </div>
            ))}
        </div>
    </div>
  );
}