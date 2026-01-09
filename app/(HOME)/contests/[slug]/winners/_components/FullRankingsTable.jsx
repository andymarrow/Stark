"use client";
import { useState } from "react";
import Image from "next/image";
import { Users, ExternalLink, ChevronDown, ChevronUp, Shield, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "@/components/ui/Pagination";
import Link from "next/link";

const getThumbnail = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        if (videoId) return `https://img.youtube.com/vi/${videoId.split("?")[0]}/mqdefault.jpg`;
    }
    return url;
};

export default function FullRankingsTable({ rankings, metrics }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(rankings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = rankings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="border border-white/10 bg-zinc-950/50 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-zinc-900/80 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                <tr>
                    <th className="px-6 py-4 border-b border-white/5 w-16">Rank</th>
                    <th className="px-6 py-4 border-b border-white/5">Submission_Node</th>
                    {metrics.map((m, i) => (
                        <th key={i} className="px-4 py-4 border-b border-white/5 text-right font-normal">
                            {m.name} <span className="opacity-20">({m.weight}%)</span>
                        </th>
                    ))}
                    <th className="px-6 py-4 border-b border-white/5 text-right text-accent font-bold bg-accent/5">Net_Score</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {paginatedData.map((row, idx) => {
                    const rankNumber = startIndex + idx + 1;
                    return (
                    <>
                        <tr 
                            key={row.id} 
                            onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                            className="hover:bg-white/5 transition-colors group cursor-pointer"
                        >
                            <td className="px-6 py-4 font-mono text-sm text-zinc-500">{rankNumber.toString().padStart(2, '0')}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    {/* Thumbnail Link */}
                                    <Link href={`/project/${row.project.slug}`} target="_blank" className="relative w-10 h-10 border border-white/10 bg-black flex-shrink-0 block hover:border-accent transition-colors">
                                        <Image src={getThumbnail(row.project.thumbnail_url)} alt="t" fill className="object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                    </Link>
                                    
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            {/* Title Link */}
                                            <Link href={`/project/${row.project.slug}`} target="_blank" className="font-bold text-xs uppercase truncate text-white hover:text-accent transition-colors flex items-center gap-2">
                                                {row.project.title}
                                            </Link>
                                            {/* Expand Toggle Icon */}
                                            <button onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === row.id ? null : row.id); }} className="text-zinc-600 hover:text-white">
                                                {expandedRow === row.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>
                                        </div>
                                        <div className="text-[9px] font-mono text-zinc-600">@{row.project.owner.username}</div>
                                    </div>
                                </div>
                            </td>

                            {metrics.map((m, i) => (
                                <td key={i} className="px-4 py-4 text-right font-mono text-xs text-zinc-400">
                                    {Number(row.metricAverages[m.name] || 0).toFixed(1)}
                                </td>
                            ))}

                            <td className="px-6 py-4 text-right bg-accent/5">
                                <div className="text-lg font-mono font-black text-white">{row.finalTotal.toFixed(2)}</div>
                            </td>
                        </tr>

                        <AnimatePresence>
                            {expandedRow === row.id && (
                                <tr>
                                    <td colSpan={metrics.length + 3} className="p-0 border-b border-white/5">
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-black/40 border-l-4 border-accent">
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
                                                    <Shield size={12} className="text-accent" /> Consensus_Audit_Log
                                                </div>
                                                
                                                {/* RAW DATA GRID */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {row.projectScores?.length > 0 ? row.projectScores.map((score, sIdx) => (
                                                        <div key={sIdx} className="border border-white/10 p-3 bg-zinc-900/50">
                                                            <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                                                <span className="text-[9px] font-bold uppercase text-zinc-400">Judge #{sIdx + 1}</span>
                                                                <span className="text-[8px] font-mono text-green-500 bg-green-900/20 px-1">VERIFIED</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {metrics.filter(m => m.type === 'manual').map((m, k) => (
                                                                    <div key={k} className="flex justify-between text-[10px] font-mono">
                                                                        <span className="text-zinc-600">{m.name}:</span>
                                                                        <span className="text-zinc-300">{score.scores[m.name] ?? '-'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="text-xs text-zinc-600 font-mono">No manual judge data available.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </>
                    );
                })}
            </tbody>
        </table>
      </div>

      {totalPages > 1 && <div className="flex justify-center mt-6"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
    </div>
  );
}