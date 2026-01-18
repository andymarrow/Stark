"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Users, ChevronDown, ChevronUp, Shield, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "@/components/ui/Pagination";
import Link from "next/link";

const getThumbnail = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1];
        if (videoId) {
            const cleanId = videoId.split("?")[0].split("/")[0];
            return `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`;
        }
    }
    return url;
};

export default function FullRankingsTable({ rankings, metrics, judges = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(rankings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = rankings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card overflow-x-auto custom-scrollbar rounded-none shadow-sm transition-colors duration-300">
        <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-secondary/80 text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                <tr>
                    <th className="px-6 py-4 border-b border-border w-16">Rank</th>
                    <th className="px-6 py-4 border-b border-border">Submission_Node</th>
                    {metrics.map((m, i) => (
                        <th key={i} className="px-4 py-4 border-b border-border text-right font-normal">
                            {m.name} <span className="opacity-40">({m.weight}%)</span>
                        </th>
                    ))}
                    <th className="px-6 py-4 border-b border-border text-right text-accent font-black bg-accent/5">Net_Score</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
                {paginatedData.map((row, idx) => {
                    const rankNumber = startIndex + idx + 1;
                    const isExpanded = expandedRow === row.id;

                    return (
                    <React.Fragment key={row.id}>
                        <tr 
                            onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                            className={`
                                transition-all duration-200 group cursor-pointer
                                ${isExpanded ? 'bg-secondary/40' : 'hover:bg-secondary/20'}
                            `}
                        >
                            <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                                {rankNumber.toString().padStart(2, '0')}
                            </td>
                            
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <Link href={`/project/${row.project.slug}`} target="_blank" className="relative w-10 h-10 border border-border bg-secondary flex-shrink-0 block hover:border-accent transition-all overflow-hidden">
                                        <Image src={getThumbnail(row.project.thumbnail_url)} alt="t" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    </Link>
                                    
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/project/${row.project.slug}`} target="_blank" className="font-bold text-xs uppercase truncate text-foreground hover:text-accent transition-colors flex items-center gap-2 tracking-tight">
                                                {row.project.title}
                                            </Link>
                                            <button className="text-muted-foreground/40 group-hover:text-foreground transition-colors">
                                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>
                                        </div>
                                        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                                            @{row.project.owner.username}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {metrics.map((m, i) => (
                                <td key={i} className="px-4 py-4 text-right font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                    {Number(row.metricAverages[m.name] || 0).toFixed(1)}
                                </td>
                            ))}

                            <td className="px-6 py-4 text-right bg-accent/[0.02]">
                                <div className={`text-lg font-mono font-black transition-colors ${isExpanded ? 'text-accent' : 'text-foreground'}`}>
                                    {row.finalTotal.toFixed(2)}
                                </div>
                            </td>
                        </tr>

                        <AnimatePresence>
                            {isExpanded && (
                                <tr>
                                    <td colSpan={metrics.length + 3} className="p-0 border-b border-border">
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }} 
                                            className="overflow-hidden bg-secondary/10 border-l-4 border-accent"
                                        >
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-4">
                                                    <Shield size={12} className="text-accent" /> Consensus_Audit_Log
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {row.projectScores?.length > 0 ? row.projectScores.map((scorePacket, sIdx) => {
                                                        // FIND JUDGE NAME FROM THE JUROR ROSTER
                                                        const juror = judges.find(j => j.id === scorePacket.judge_id);
                                                        const judgeName = juror?.profile?.full_name || juror?.profile?.username || juror?.email?.split('@')[0] || `Jury_Node_${sIdx + 1}`;

                                                        return (
                                                            <div key={sIdx} className="border border-border p-3 bg-card shadow-sm">
                                                                <div className="flex justify-between items-center mb-2 border-b border-border border-dashed pb-2">
                                                                    <span className="text-[9px] font-black uppercase text-muted-foreground truncate max-w-[120px]">
                                                                        {judgeName}
                                                                    </span>
                                                                    <span className="text-[8px] font-mono text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 border border-green-500/20">VERIFIED_LOG</span>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    {metrics.filter(m => m.type === 'manual').map((m, k) => (
                                                                        <div key={k} className="flex justify-between text-[10px] font-mono">
                                                                            <span className="text-zinc-600 uppercase">{m.name}:</span>
                                                                            <span className="text-foreground font-bold">{scorePacket.scores[m.name] ?? '-'}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="text-[10px] text-zinc-500 font-mono uppercase italic p-4 border border-border border-dashed w-full col-span-full text-center bg-secondary/5">
                                                            No individual judge packets detected in registry.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </React.Fragment>
                    );
                })}
            </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
            />
        </div>
      )}
    </div>
  );
}