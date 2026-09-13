"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Calculator, Loader2, ExternalLink,
  ChevronDown, ChevronUp, Shield, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * RESULTS_MATRIX
 * The high-fidelity audit station for the Contest Creator.
 *
 * Judges can each carry their own weighted rubric now (see
 * contest_judges.metrics_config), so metric names/weights are no longer
 * guaranteed to line up across judges — averaging raw scores "by metric
 * name" the old way stops making sense. Instead: each judge's own scores
 * are weighted down to a single 0-10 total using THEIR OWN rubric, and a
 * project's final score is the average of those per-judge totals across
 * whoever has actually scored it. The old per-metric columns move into the
 * per-judge drill-down, where each judge's own criteria are shown.
 */
export default function ResultsMatrix({ contest }) {
  const [data, setData] = useState([]);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all judges linked to this contest
        const { data: judgeData } = await supabase
          .from('contest_judges')
          // `*` (not naming metrics_config explicitly) so this keeps working
          // even before the per-judge-metrics migration has been applied —
          // PostgREST errors the whole query on a genuinely missing column.
          .select('*, profile:profiles(full_name, username, avatar_url)')
          .eq('contest_id', contest.id);

        // 2. Fetch all submissions with project and owner details
        // Explicit FK used to prevent ambiguity
        const { data: submissions } = await supabase
          .from('contest_submissions')
          .select(`
              id,
              project:projects!inner (
                  id, title, slug, likes_count, views, owner:profiles!projects_owner_id_fkey(username)
              )
          `)
          .eq('contest_id', contest.id);

        // 3. Fetch all score packets (Requires RLS policy allowing creator access)
        const { data: rawScores } = await supabase
          .from('contest_scores')
          .select('*')
          .eq('contest_id', contest.id);

        setJudges(judgeData || []);

        // 4. FIND MAX METRICS FOR NORMALIZATION (Option A Logic)
        // This ensures likes/views are scaled from 0 to 10 relative to the top performer
        const maxLikes = Math.max(...(submissions || []).map(s => s.project.likes_count), 1);
        const maxViews = Math.max(...(submissions || []).map(s => s.project.views), 1);

        // Resolve one score (0-10) for a single metric, for a given project.
        const scoreForMetric = (metric, project, judgeScore) => {
          if (metric.type === 'likes') return (project.likes_count / maxLikes) * 10;
          if (metric.type === 'views') return (project.views / maxViews) * 10;
          const v = judgeScore?.scores?.[metric.name];
          return v !== undefined && v !== null ? v : null; // null = not yet scored
        };

        // A judge's own weighted total for a project, using THEIR rubric.
        const judgeWeightedTotal = (judgeMetrics, project, judgeScore) => {
          let total = 0;
          for (const m of judgeMetrics) {
            const v = scoreForMetric(m, project, judgeScore);
            total += (v || 0) * ((parseFloat(m.weight) || 0) / 100);
          }
          return total;
        };

        // 5. THE MATRIX COMPILATION ENGINE
        const matrix = (submissions || []).map(sub => {
            const projectScores = (rawScores || []).filter(s => s.project_id === sub.project.id);

            // Each judge who has actually scored this project contributes
            // one weighted total (0-10), computed on their own rubric.
            const judgeTotals = (judgeData || [])
              .map(j => {
                  const judgeScore = projectScores.find(s => s.judge_id === j.id);
                  if (!judgeScore) return null; // hasn't scored yet — excluded from the average
                  const rubric = j.metrics_config || contest.metrics_config || [];
                  return judgeWeightedTotal(rubric, sub.project, judgeScore);
              })
              .filter(t => t !== null);

            const finalTotal = judgeTotals.length
              ? judgeTotals.reduce((a, b) => a + b, 0) / judgeTotals.length
              : 0;

            return {
                ...sub,
                projectScores, // Raw packets for the expanded drill-down view
                judgesScored: judgeTotals.length,
                finalTotal: finalTotal.toFixed(2)
            };
        });

        // Rank by final total
        setData(matrix.sort((a, b) => b.finalTotal - a.finalTotal));
      } catch (err) {
        console.error("Matrix compilation error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (contest?.id) fetchData();
  }, [contest]);

  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-accent" size={32} />
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Aggregating_Jury_Streams...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-20">

        {/* Protocol Banner */}
        <div className="bg-secondary/5 border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                <BarChart3 className="text-accent shrink-0" size={20} />
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Protocol: Audit_Matrix</h4>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">
                        MATH_MODEL: Avg(Per-Judge Weighted Total) // Each judge scores on their own rubric — click rows for the breakdown
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-green-500 bg-green-500/10 px-2 py-1 uppercase font-bold">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Final_Scores_Synced
            </div>
        </div>

        <div className="border border-border bg-black overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-secondary/10 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                    <tr>
                        <th className="px-4 py-4 border-b border-white/5 w-12 text-center">Rank</th>
                        <th className="px-4 py-4 border-b border-white/5 sticky left-0 bg-black z-10 w-64 border-r border-white/5">Submission Node</th>
                        <th className="px-4 py-4 border-b border-white/5 text-right font-normal">Judges Scored</th>
                        <th className="px-4 py-4 border-b border-white/5 text-right text-accent font-black bg-accent/5">NET_SCORE</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.length === 0 ? (
                        <tr><td colSpan={4} className="p-20 text-center font-mono text-xs text-muted-foreground">No data packets detected in buffer.</td></tr>
                    ) : (
                        data.map((row, idx) => (
                            <React.Fragment key={row.id}>
                                {/* MAIN ROW */}
                                <tr
                                    onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                                    className={`group cursor-pointer transition-colors ${expandedRow === row.id ? 'bg-secondary/10' : 'hover:bg-secondary/5'}`}
                                >
                                    <td className="px-4 py-4 font-mono text-xs text-zinc-600 text-center">#{idx + 1}</td>
                                    <td className="px-4 py-4 sticky left-0 bg-black z-10 border-r border-white/5">
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
                                        <div className="text-[9px] text-zinc-600 font-mono tracking-tighter uppercase">NODE: @{row.project.owner.username}</div>
                                    </td>

                                    <td className="px-4 py-4 text-right font-mono text-xs text-muted-foreground group-hover:text-foreground">
                                        {row.judgesScored} / {judges.length}
                                    </td>

                                    <td className="px-4 py-4 text-right font-mono text-lg font-black text-accent bg-accent/5 relative">
                                        {row.finalTotal}
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {expandedRow === row.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </div>
                                    </td>
                                </tr>

                                {/* EXPANDED DRILL-DOWN VIEW */}
                                <AnimatePresence>
                                    {expandedRow === row.id && (
                                        <tr>
                                            <td colSpan={4} className="p-0 border-b border-white/10">
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-zinc-950/80 p-6 border-l-4 border-accent"
                                                >
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                                                            <Shield size={12} className="text-accent" /> Individual_Jury_Payloads (each judge's own rubric)
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {judges.map(j => {
                                                                // Extract this specific judge's score record for this project
                                                                const judgeScore = row.projectScores.find(s => s.judge_id === j.id);
                                                                const rubric = (j.metrics_config || contest.metrics_config || []).filter(m => m.type === 'manual');
                                                                const isCustom = !!j.metrics_config;
                                                                return (
                                                                    <div key={j.id} className="border border-white/5 p-4 bg-black group/juror">
                                                                        <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                                                                            <span className="text-[10px] font-bold uppercase text-zinc-300 truncate max-w-[150px] flex items-center gap-1.5">
                                                                                {j.profile?.full_name || j.email.split('@')[0]}
                                                                                {isCustom && <span className="text-[7px] px-1 py-0.5 bg-accent/10 text-accent border border-accent/20 normal-case">Custom</span>}
                                                                            </span>
                                                                            <span className={`text-[8px] font-mono px-1.5 py-0.5 ${judgeScore ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-zinc-700 bg-zinc-900'}`}>
                                                                                {judgeScore ? 'SYNCED' : 'PENDING'}
                                                                            </span>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            {rubric.map((m, mi) => (
                                                                                <div key={mi} className="flex justify-between text-[10px] font-mono">
                                                                                    <span className="text-zinc-600 uppercase truncate max-w-[65%]" title={`${m.name} (${m.weight}%)`}>{m.name} <span className="opacity-50">({m.weight}%)</span>:</span>
                                                                                    <span className={`font-bold ${judgeScore ? 'text-white' : 'text-zinc-800'}`}>
                                                                                        {judgeScore?.scores[m.name] ?? '--'}
                                                                                    </span>
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
                            </React.Fragment>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest text-right px-2">
            Secure_Administrative_Interface // Stark_Consensus_Matrix
        </p>
    </div>
  );
}
