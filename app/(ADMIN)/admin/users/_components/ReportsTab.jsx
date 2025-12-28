"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, Shield, FileCode, ExternalLink, AlertOctagon, CheckCircle2, MessageSquare, Trash2, Flag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient"; 
import { toast } from "sonner";

export default function ReportsTab({ profileReports, projectReports, onTakedown }) {
  const [subTab, setSubTab] = useState("profile");
  const [commentReports, setCommentReports] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Local state for optimistic updates
  const [localProfileReports, setLocalProfileReports] = useState(profileReports);
  const [localProjectReports, setLocalProjectReports] = useState(projectReports);

  // 1. Fetch Comment Reports (Lazy Load on Tab Switch)
  useEffect(() => {
    if (subTab === 'comments' && commentReports.length === 0) {
        const fetchComments = async () => {
            setLoadingComments(true);
            const { data } = await supabase
                .from('reports')
                .select(`
                    *, 
                    reporter:profiles!reporter_id(username),
                    comment:comments(
                        id, 
                        content, 
                        user_id, 
                        author:profiles!user_id(username)
                    )
                `)
                .not('comment_id', 'is', null)
                .order('created_at', { ascending: false });
            
            setCommentReports(data || []);
            setLoadingComments(false);
        };
        fetchComments();
    }
  }, [subTab]);

  // 2. Action Handlers
  const handleDismiss = async (reportId, type) => {
      // Optimistic Update
      if (type === 'profile') setLocalProfileReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      else if (type === 'project') setLocalProjectReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      else setCommentReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));

      // DB Update
      const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
      if (error) toast.error("Failed to dismiss");
      else toast.success("Flag Resolved");
  };

  const handleDeleteComment = async (commentId, reportId) => {
      // Anti-Freeze: Ensure body is unlocked before confirm
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';

      if (!confirm("Permanently delete this comment?")) return;

      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (!error) {
          await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
          setCommentReports(prev => prev.filter(r => r.comment_id !== commentId));
          toast.success("Comment Purged");
      } else {
          toast.error("Delete Failed");
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        
        {/* Sub-Tab Switcher */}
        <div className="flex gap-4 border-b border-white/10 pb-2">
            <button onClick={() => setSubTab('profile')} className={`text-xs font-mono uppercase transition-colors ${subTab === 'profile' ? 'text-white font-bold border-b border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Profile ({localProfileReports.length})
            </button>
            <button onClick={() => setSubTab('projects')} className={`text-xs font-mono uppercase transition-colors ${subTab === 'projects' ? 'text-white font-bold border-b border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Projects ({localProjectReports.length})
            </button>
            <button onClick={() => setSubTab('comments')} className={`text-xs font-mono uppercase transition-colors ${subTab === 'comments' ? 'text-white font-bold border-b border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Comments ({commentReports.length})
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
                ) : <EmptyState type="profile" />}
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
                ) : <EmptyState type="project" />}
            </div>
        )}

        {/* COMMENT REPORTS (FIXED UI) */}
        {subTab === 'comments' && (
            <div className="space-y-4">
                {loadingComments ? (
                    <div className="text-center py-10 text-xs font-mono text-zinc-500 animate-pulse">Scanning Logs...</div>
                ) : commentReports.length > 0 ? (
                    commentReports.map(report => (
                        <div key={report.id} className="border border-yellow-900/30 bg-yellow-900/5 p-4 flex flex-col gap-3">
                             
                             {/* HEADER: Shows WHO wrote the bad comment */}
                             <div className="flex justify-between items-start border-b border-white/5 pb-2">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">
                                        <MessageSquare size={14} /> Comment Flag
                                    </div>
                                    <span className="text-xs font-bold text-white">
                                        Author: @{report.comment?.author?.username || 'Unknown'}
                                    </span>
                                </div>
                                
                                {/* ACTIONS */}
                                <div className="flex gap-2">
                                    {report.status === 'pending' && (
                                        <Button size="sm" onClick={() => handleDismiss(report.id, 'comment')} className="h-6 bg-green-900/20 text-green-500 hover:bg-green-600 hover:text-white text-[10px] uppercase border border-green-900/50 rounded-none">
                                            <CheckCircle2 size={12} className="mr-1" /> Dismiss
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={() => handleDeleteComment(report.comment_id, report.id)} className="h-6 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white text-[10px] uppercase border border-red-900/50 rounded-none">
                                        <Trash2 size={12} className="mr-1" /> Delete
                                    </Button>
                                </div>
                            </div>

                            {/* CONTENT: The bad comment itself */}
                            <div className="bg-black p-3 border border-white/10 text-sm text-zinc-300 font-mono italic">
                                "{report.comment?.content || '[DELETED_CONTENT]'}"
                            </div>

                            {/* FOOTER: Who reported it + Reason */}
                            <div className="flex justify-between items-end text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Flag size={12} />
                                    Reported by @{report.reporter?.username || 'Unknown'}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-red-400 uppercase font-bold">{report.reason}</span>
                                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : <EmptyState type="comment" />}
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
            <p className="text-xs text-zinc-400 mb-2 mt-2">Report Details: "{report.details}"</p>
            <div className={`text-[10px] font-mono uppercase inline-block px-2 py-1 border ${report.status === 'resolved' ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-white/5 text-zinc-600 bg-black/50'}`}>
                STATUS: {report.status}
            </div>
        </>
    )
}

function EmptyState({ type }) {
    return (
        <div className="h-24 flex flex-col items-center justify-center border border-dashed border-white/10 text-zinc-500">
            <Shield size={24} className="mb-2 opacity-20" />
            <span className="text-xs font-mono uppercase">NO_{type.toUpperCase()}_FLAGS_FOUND</span>
        </div>
    )
}