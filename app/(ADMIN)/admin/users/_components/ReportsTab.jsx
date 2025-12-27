"use client";
import { useState } from "react";
import { AlertTriangle, Shield, FileCode, ExternalLink, AlertOctagon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase
import { toast } from "sonner";

export default function ReportsTab({ profileReports, projectReports, onTakedown }) {
  const [subTab, setSubTab] = useState("profile");
  
  // Local state to manage status updates without refetching parent
  const [localProfileReports, setLocalProfileReports] = useState(profileReports);
  const [localProjectReports, setLocalProjectReports] = useState(projectReports);

  const handleDismiss = async (reportId, type) => {
      // 1. Optimistic Update
      if (type === 'profile') {
          setLocalProfileReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      } else {
          setLocalProjectReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      }

      // 2. DB Update
      const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
      
      if (error) {
          toast.error("Failed to dismiss");
          // Revert logic here if needed
      } else {
          toast.success("Flag Resolved");
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        
        {/* Sub-Tab Switcher */}
        <div className="flex gap-4 border-b border-white/10 pb-2">
            <button onClick={() => setSubTab('profile')} className={`text-xs font-mono uppercase transition-colors ${subTab === 'profile' ? 'text-white font-bold border-b border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Profile Flags ({localProfileReports.length})
            </button>
            <button onClick={() => setSubTab('projects')} className={`text-xs font-mono uppercase transition-colors ${subTab === 'projects' ? 'text-white font-bold border-b border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Project Flags ({localProjectReports.length})
            </button>
        </div>

        {/* PROFILE REPORTS */}
        {subTab === 'profile' && (
            <div className="space-y-4">
                {localProfileReports.length > 0 ? (
                    localProfileReports.map(report => (
                        <div key={report.id} className="border border-red-900/30 bg-red-900/5 p-4 flex gap-4">
                            <div className="mt-1"><AlertTriangle className="text-red-500" size={18} /></div>
                            <div className="flex-1">
                                <ReportHeader report={report} />
                                <ReportBody report={report} />
                                {/* Add Dismiss Action */}
                                {report.status === 'pending' && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                                        <Button size="sm" onClick={() => handleDismiss(report.id, 'profile')} className="h-6 bg-green-900/20 text-green-500 hover:bg-green-600 hover:text-white text-[10px] uppercase border border-green-900/50 rounded-none">
                                            <CheckCircle2 size={12} className="mr-1" /> Dismiss
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>
        )}

        {/* PROJECT REPORTS */}
        {subTab === 'projects' && (
            <div className="space-y-4">
                {localProjectReports.length > 0 ? (
                    localProjectReports.map(report => (
                        <div key={report.id} className="border border-red-900/30 bg-red-900/5 p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-white">
                                    <FileCode size={16} className="text-zinc-500" />
                                    {report.project?.title || "Unknown Project"}
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/project/${report.project?.slug}`} target="_blank">
                                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-zinc-400 hover:text-white uppercase"><ExternalLink size={12} className="mr-1" /> Inspect</Button>
                                    </Link>
                                    
                                    {/* Dismiss Button for Projects */}
                                    {report.status === 'pending' && (
                                        <Button size="sm" onClick={() => handleDismiss(report.id, 'project')} className="h-6 bg-green-900/20 text-green-500 hover:bg-green-600 hover:text-white text-[10px] uppercase border border-green-900/50 rounded-none">
                                            <CheckCircle2 size={12} className="mr-1" /> Dismiss
                                        </Button>
                                    )}

                                    <Button size="sm" onClick={() => onTakedown(report.project?.id, report.project?.title)} className="h-6 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white text-[10px] uppercase border border-red-900/50 rounded-none"><AlertOctagon size={12} className="mr-1" /> Takedown</Button>
                                </div>
                            </div>
                            <ReportBody report={report} />
                        </div>
                    ))
                ) : (
                    <EmptyState type="project" />
                )}
            </div>
        )}
    </div>
  );
}

function ReportHeader({ report }) {
    return (
        <div className="flex justify-between mb-1">
            <span className="text-sm font-bold text-red-400 uppercase">{report.reason}</span>
            <span className="text-[10px] font-mono text-zinc-500">{new Date(report.created_at).toLocaleDateString()}</span>
        </div>
    )
}

function ReportBody({ report }) {
    return (
        <>
            <p className="text-xs text-zinc-300 mb-2">"{report.details}"</p>
            <div className={`text-[10px] font-mono uppercase inline-block px-2 py-1 border ${report.status === 'resolved' ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-white/5 text-zinc-600 bg-black/50'}`}>
                STATUS: {report.status}
            </div>
        </>
    )
}

function EmptyState({ type = "profile" }) {
    return (
        <div className="h-20 flex flex-col items-center justify-center border border-dashed border-white/10 text-zinc-500">
            <Shield size={24} className="mb-1 opacity-20" />
            <span className="text-xs font-mono uppercase">NO_{type.toUpperCase()}_FLAGS</span>
        </div>
    )
}