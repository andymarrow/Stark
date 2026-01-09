"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Calculator, Loader2, ExternalLink, 
  ChevronDown, ChevronUp, Shield, BarChart3 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResultsMatrix({ contest }) {
  const [data, setData] = useState([]);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch all judges
      const { data: judgeData } = await supabase
        .from('contest_judges')
        .select('id, email, profile:profiles(full_name, username)')
        .eq('contest_id', contest.id);

      // 2. Fetch all submissions
      const { data: submissions } = await supabase
        .from('contest_submissions')
        .select(`
            id,
            project:projects!inner (
                id, title, slug, likes_count, views, owner:profiles!projects_owner_id_fkey(username)
            )
        `)
        .eq('contest_id', contest.id);

      // 3. Fetch all raw scores
      const { data: rawScores } = await supabase
        .from('contest_scores')
        .select('*')
        .eq('contest_id', contest.id);

      setJudges(judgeData || []);

      // 4. FIND MAX LIKES/VIEWS FOR NORMALIZATION (Option A Logic)
      const maxLikes = Math.max(...(submissions || []).map(s => s.project.likes_count), 1);
      const maxViews = Math.max(...(submissions || []).map(s => s.project.views), 1);

      // 5. THE MATRIX LOGIC
      const matrix = (submissions || []).map(sub => {
          const projectScores = (rawScores || []).filter(s => s.project_id === sub.project.id);
          
          // Calculate average per metric from judges
          const metricAverages = {};
          (contest.metrics_config || []).forEach(metric => {
              if (metric.type === 'manual') {
                  const validScores = projectScores
                    .map(ps => ps.scores[metric.name])
                    .filter(val => val !== undefined && val !== null);
                  
                  const avg = validScores.length > 0 
                    ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
                    : 0;
                  
                  metricAverages[metric.name] = avg;
              } else if (metric.type === 'likes') {
                  // Normalize: (Project Likes / Max Likes) * 10
                  metricAverages[metric.name] = (sub.project.likes_count / maxLikes) * 10;
              } else if (metric.type === 'views') {
                  metricAverages[metric.name] = (sub.project.views / maxViews) * 10;
              }
          });

          // Calculate final weighted total
          let finalTotal = 0;
          (contest.metrics_config || []).forEach(m => {
              const score = metricAverages[m.name] || 0;
              finalTotal += (score * (m.weight / 100));
          });

          return {
              ...sub,
              metricAverages,
              projectScores,
              finalTotal: parseFloat(finalTotal).toFixed(2)
          };
      });

      setData(matrix.sort((a, b) => b.finalTotal - a.finalTotal));
      setLoading(false);
    };

    if (contest.id) fetchData();
  }, [contest]);

  if (loading) return (
    <div className="py-20 text-center animate-pulse">
        <Loader2 className="animate-spin mx-auto text-accent mb-4" size={32} />
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Compiling Multi-Node Result Grid...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-20">
        
        {/* Logic Explanation Box */}
        <div className="bg-secondary/5 border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                <BarChart3 className="text-accent shrink-0" size={20} />
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Protocol: Normalized_Results</h4>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">
                        MATH: Manual(AVG) + System(Ranked_Scale) // CLICK ROWS FOR DETAILED JUDGE DATA
                    </p>
                </div>
            </div>
            <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 uppercase">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" /> Final_Scores_Live
                 </div>
            </div>
        </div>

        <div className="border border-border bg-black">
            <table className="w-full text-left border-collapse">
                <thead className="bg-secondary/10 text-[9px] font-mono text-muted-foreground uppercase">
                    <tr>
                        <th className="px-4 py-4 border-b border-border w-10">Rank</th>
                        <th className="px-4 py-4 border-b border-border min-w-[200px]">Submission Node</th>
                        
                        {/* Averages for each Metric */}
                        {contest.metrics_config.map((m, i) => (
                            <th key={i} className="px-4 py-4 border-b border-border text-right">
                                {m.name}
                                <div className="opacity-40">{m.weight}%</div>
                            </th>
                        ))}

                        <th className="px-4 py-4 border-b border-border text-right text-accent font-black bg-accent/5">NET_SCORE</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {data.map((row, idx) => (
                        <>
                            <tr 
                                key={row.id} 
                                onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                                className={`group cursor-pointer transition-colors ${expandedRow === row.id ? 'bg-secondary/10' : 'hover:bg-secondary/5'}`}
                            >
                                <td className="px-4 py-4 font-mono text-xs text-zinc-600">#{idx + 1}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 group/link">
                                        <div className="font-bold text-xs uppercase truncate text-foreground group-hover:text-accent transition-colors">
                                            {row.project.title}
                                        </div>
                                        <a 
                                            href={`/project/${row.project.slug}`} 
                                            target="_blank" 
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-zinc-600 hover:text-white transition-colors"
                                        >
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <div className="text-[9px] text-zinc-600 font-mono tracking-tighter">NODE: @{row.project.owner.username}</div>
                                </td>

                                {contest.metrics_config.map((m, i) => (
                                    <td key={i} className="px-4 py-4 text-right font-mono text-xs text-muted-foreground">
                                        {Number(row.metricAverages[m.name] || 0).toFixed(1)}
                                    </td>
                                ))}

                                <td className="px-4 py-4 text-right font-mono text-lg font-black text-accent bg-accent/5 relative">
                                    {row.finalTotal}
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {expandedRow === row.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </div>
                                </td>
                            </tr>

                            {/* --- EXPANDED VIEW: JUDGE BREAKDOWN --- */}
                            <AnimatePresence>
                                {expandedRow === row.id && (
                                    <tr className="bg-zinc-950/50">
                                        <td colSpan={contest.metrics_config.length + 3} className="p-0 border-b border-border/50">
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                                                        <Shield size={10} className="text-accent" /> Individual_Jury_Payloads
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {judges.map(j => {
                                                            const judgeScore = row.projectScores.find(s => s.judge_id === j.id);
                                                            return (
                                                                <div key={j.id} className="border border-border p-3 bg-black">
                                                                    <div className="flex justify-between items-center mb-3 border-b border-border/50 pb-2">
                                                                        <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">
                                                                            {j.profile?.full_name || j.email.split('@')[0]}
                                                                        </span>
                                                                        <span className={`text-[8px] font-mono px-1 ${judgeScore ? 'text-green-500 bg-green-500/10' : 'text-zinc-600 bg-zinc-900'}`}>
                                                                            {judgeScore ? 'SYNCED' : 'PENDING'}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-1.5">
                                                                        {contest.metrics_config.filter(m => m.type === 'manual').map((m, mi) => (
                                                                            <div key={mi} className="flex justify-between text-[10px] font-mono">
                                                                                <span className="text-zinc-500">{m.name}:</span>
                                                                                <span className="text-foreground">{judgeScore?.scores[m.name] ?? '--'}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </>
                    ))}
                </tbody>
            </table>
        </div>

    </div>
  );
}