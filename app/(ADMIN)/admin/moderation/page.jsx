"use client";
import { useState, useMemo } from "react";
import { 
  Shield, AlertTriangle, FileCode, User, Filter, 
  ArrowUpRight, Check, X, Eye 
} from "lucide-react";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import ReportDetailModal from "./_components/ReportDetailModal";
import { Button } from "@/components/ui/button";

// --- MOCK DATA: MODERATION QUEUE ---
const QUEUE = [
  { 
    id: "rep_01", 
    type: "project", 
    project: "Free Bitcoin Miner", 
    author: "CryptoKing", 
    reason: "Malware / Virus", 
    reports: 42, 
    score: 98, 
    status: "critical", 
    lastReport: "10m ago" 
  },
  { 
    id: "rep_02", 
    type: "user", 
    user: "SpamBot_99", 
    reason: "Mass DM Spam", 
    reports: 156, 
    score: 95, 
    status: "critical", 
    lastReport: "1m ago" 
  },
  { 
    id: "rep_03", 
    type: "project", 
    project: "Netflix Clone (Exact Copy)", 
    author: "DevNewbie", 
    reason: "Copyright / IP", 
    reports: 5, 
    score: 60, 
    status: "warning", 
    lastReport: "4h ago" 
  },
  { 
    id: "rep_04", 
    type: "user", 
    user: "TrollAccount", 
    reason: "Harassment", 
    reports: 12, 
    score: 75, 
    status: "warning", 
    lastReport: "1h ago" 
  },
  { 
    id: "rep_05", 
    type: "project", 
    project: "Broken Demo", 
    author: "JuniorDev", 
    reason: "Low Quality", 
    reports: 1, 
    score: 20, 
    status: "pending", 
    lastReport: "1d ago" 
  },
];

export default function ModerationPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'project', 'user'

  // Filter Logic
  const filteredQueue = useMemo(() => {
    return filter === 'all' ? QUEUE : QUEUE.filter(item => item.type === filter);
  }, [filter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Shield className="text-red-500" /> Moderation Console
            </h1>
            <div className="flex gap-4 text-xs font-mono text-zinc-500">
                <span>PENDING: {QUEUE.length}</span>
                <span className="text-red-500">CRITICAL: {QUEUE.filter(i => i.status === 'critical').length}</span>
            </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
            <Button variant="outline" className="h-8 bg-black text-zinc-400 border-zinc-800 text-xs font-mono rounded-none hover:text-white hover:border-zinc-600">
                History Log
            </Button>
            <Button variant="destructive" className="h-8 rounded-none text-xs font-mono bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white">
                Purge Critical ({QUEUE.filter(q => q.status === 'critical').length})
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* --- MAIN QUEUE LIST --- */}
        <div className="lg:col-span-3 space-y-4">
            
            {/* Filter Tabs */}
            <div className="flex border-b border-white/10">
                {['all', 'project', 'user'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`
                            px-6 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors
                            ${filter === tab 
                                ? "border-red-500 text-white bg-white/5" 
                                : "border-transparent text-zinc-500 hover:text-zinc-300"}
                        `}
                    >
                        {tab}s
                    </button>
                ))}
            </div>

            {/* The Table */}
            <div className="bg-black border border-white/10">
                <AdminTable headers={["Target Entity", "Violation", "Risk / Reports", "Status", "Actions"]}>
                    {filteredQueue.map((item) => (
                        <AdminRow key={item.id} className="cursor-pointer group">
                            
                            {/* Target (User or Project) */}
                            <AdminCell onClick={() => setSelectedReport(item)}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 border border-white/10 ${item.type === 'project' ? 'bg-blue-900/20 text-blue-400' : 'bg-purple-900/20 text-purple-400'}`}>
                                        {item.type === 'project' ? <FileCode size={16} /> : <User size={16} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                                            {item.project || item.user}
                                        </div>
                                        {item.author && <div className="text-[10px] text-zinc-600 font-mono">by {item.author}</div>}
                                    </div>
                                </div>
                            </AdminCell>
                            
                            {/* Violation Reason */}
                            <AdminCell onClick={() => setSelectedReport(item)}>
                                <span className="text-xs text-red-300 font-medium">{item.reason}</span>
                            </AdminCell>

                            {/* Risk Score & Reports */}
                            <AdminCell mono onClick={() => setSelectedReport(item)}>
                                <div className="flex flex-col gap-1.5 w-24">
                                    <div className="flex justify-between text-[9px] text-zinc-500">
                                        <span>{item.reports} REPORTS</span>
                                        <span className={item.score > 80 ? "text-red-500" : "text-yellow-500"}>{item.score}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-800">
                                        <div 
                                            className={`h-full ${item.score > 80 ? 'bg-red-600' : item.score > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                            style={{ width: `${item.score}%` }} 
                                        />
                                    </div>
                                </div>
                            </AdminCell>

                            {/* Status Tag */}
                            <AdminCell mono onClick={() => setSelectedReport(item)}>
                                <span className={`
                                    text-[9px] px-2 py-0.5 border uppercase
                                    ${item.status === 'critical' ? 'text-red-500 border-red-900/50 bg-red-900/10' : 
                                      item.status === 'warning' ? 'text-yellow-500 border-yellow-900/50 bg-yellow-900/10' : 
                                      'text-zinc-500 border-zinc-800'}
                                `}>
                                    {item.status}
                                </span>
                            </AdminCell>

                            {/* Actions */}
                            <AdminCell>
                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); /* Approve Logic */ }}
                                        className="p-1.5 bg-green-900/20 text-green-500 hover:bg-green-900/40 border border-transparent hover:border-green-500/50 transition-all"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); /* Ban Logic */ }}
                                        className="p-1.5 bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-transparent hover:border-red-500/50 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setSelectedReport(item)}
                                        className="p-1.5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all ml-2"
                                    >
                                        <Eye size={14} />
                                    </button>
                                </div>
                            </AdminCell>

                        </AdminRow>
                    ))}
                </AdminTable>
            </div>
        </div>

        {/* --- RIGHT SIDEBAR: INTELLIGENCE --- */}
        <div className="space-y-6">
            
            {/* Auto-Mod Feed */}
            <div className="bg-black border border-white/10 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Shield size={60} />
                </div>
                <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 tracking-widest relative z-10">Live Intelligence</h3>
                <div className="space-y-4 relative z-10">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="flex gap-3 items-start text-xs border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <AlertTriangle size={12} className="text-yellow-500 mt-0.5 shrink-0" />
                            <div className="text-zinc-400">
                                <span className="text-zinc-200 font-bold block mb-0.5">Spam Wave Detected</span>
                                <span className="font-mono text-[10px] text-zinc-600 leading-tight block">
                                    Origin: 192.168.x.x<br/>
                                    Target: /api/comments
                                </span>
                                <span className="text-[9px] text-zinc-700 mt-1 block">2m ago • Auto-Blocked</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Threshold Settings */}
            <div className="bg-zinc-900/20 border border-white/5 p-4">
                <h4 className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-2">
                    <Filter size={12} /> Sensitivity Levels
                </h4>
                <div className="space-y-3">
                    <SensitivitySlider label="Malware Detection" value={95} color="red" />
                    <SensitivitySlider label="Spam Filter" value={80} color="yellow" />
                    <SensitivitySlider label="Toxic Language" value={60} color="blue" />
                </div>
            </div>

        </div>

      </div>

      {/* Detail Modal */}
      <ReportDetailModal 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)} 
      />

    </div>
  );
}

function SensitivitySlider({ label, value, color }) {
    const bg = color === 'red' ? 'bg-red-600' : color === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500';
    return (
        <div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-1 w-full bg-black border border-white/10">
                <div className={`h-full ${bg}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    )
}