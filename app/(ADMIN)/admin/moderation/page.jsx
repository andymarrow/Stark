"use client";
import { useState, useMemo, useEffect } from "react";
import { 
  Shield, FileCode, User, Check, X, Eye, Loader2, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle 
} from "lucide-react";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import ReportDetailModal from "./_components/ReportDetailModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Pagination from "@/components/ui/Pagination";

const ITEMS_PER_PAGE = 10;

export default function ModerationPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState("all"); 
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // --- 1. FETCH REPORTS ---
  const fetchReports = async () => {
    setLoading(true);
    try {
        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, count, error } = await supabase
            .from('reports')
            .select(`
                *,
                reporter:profiles!reporter_id(username),
                project:projects(id, title, slug, owner_id),
                target_user:profiles!target_user_id(username, id)
            `, { count: 'exact' })
            .order('status', { ascending: true }) // 'pending' comes before 'resolved'
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        setTotalCount(count || 0);

        const formatted = data.map(r => ({
            id: r.id,
            type: r.project_id ? 'project' : 'user',
            reason: r.reason,
            details: r.details,
            status: r.status,
            created_at: r.created_at,
            reporter: r.reporter?.username || 'Unknown',
            project: r.project ? { title: r.project.title, slug: r.project.slug, id: r.project.id } : null,
            user: r.target_user ? { username: r.target_user.username, id: r.target_user.id } : null,
            score: r.reason === 'malware' ? 95 : r.reason === 'spam' ? 40 : 20, 
            reports: 1 
        }));

        setReports(formatted);
    } catch (err) {
        console.error("Reports Error:", err);
        toast.error("Failed to load moderation queue");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page]);

  // --- 2. ACTIONS ---
  
  // This updates local state immediately for instant feedback
  const handleResolve = async (id) => {
      // 1. Optimistic Update
      setReports(prev => prev.map(r => 
          r.id === id ? { ...r, status: 'resolved' } : r
      ));

      // 2. Database Update
      const { data, error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', id)
        .select(); // <--- Add .select() to verify the return
      
      if (error) {
          console.error("DB Update Failed:", error); // Check console if this happens
          toast.error("Database Error: " + error.message);
          fetchReports(); // Revert
      } else if (data.length === 0) {
          // If RLS blocked it, no error is thrown but data is empty
          console.error("RLS Blocked Update: No rows returned");
          toast.error("Permission Denied: You cannot update this report.");
          fetchReports();
      } else {
          toast.success("Report Dismissed ");
      }
  };

  // Callback for Modal (since modal handles the DB update itself for takedowns/dismissals)
  const onModalResolve = (id) => {
      setReports(prev => prev.map(r => 
          r.id === id ? { ...r, status: 'resolved' } : r
      ));
  };

  // Filter Logic
  const filteredQueue = useMemo(() => {
    return filter === 'all' ? reports : reports.filter(item => item.type === filter);
  }, [filter, reports]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Shield className="text-red-500" /> Moderation Console
            </h1>
            <div className="flex gap-4 text-xs font-mono text-zinc-500">
                <span>TOTAL: {totalCount}</span>
                <span className="text-yellow-500">PENDING: {reports.filter(r => r.status === 'pending').length} (on page)</span>
            </div>
        </div>
        
        <div className="flex gap-2">
            <Button variant="outline" onClick={fetchReports} className="h-8 bg-black text-zinc-400 border-zinc-800 text-xs font-mono rounded-none hover:text-white hover:border-zinc-600">
                Refresh Log
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* --- MAIN QUEUE LIST --- */}
        <div className="lg:col-span-3 space-y-4">
            
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

            <div className="bg-black border border-white/10 min-h-[300px] flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center flex-1 h-40">
                        <Loader2 className="animate-spin text-white" />
                    </div>
                ) : filteredQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 h-40 text-zinc-500">
                        <Shield size={32} className="mb-2 opacity-20" />
                        <span className="text-xs font-mono">ALL_CLEAR</span>
                        <p className="text-[10px] mt-2">No pending reports in this category.</p>
                    </div>
                ) : (
                    <>
                        <AdminTable headers={["Target Entity", "Violation", "Risk / Date", "Status", "Actions"]}>
                            {filteredQueue.map((item) => (
                                <AdminRow 
                                    key={item.id} 
                                    className={`cursor-pointer group transition-all duration-300 ${item.status === 'resolved' ? 'opacity-50' : ''}`}
                                >
                                    
                                    {/* Target */}
                                    <AdminCell onClick={() => setSelectedReport(item)}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 border border-white/10 ${item.type === 'project' ? 'bg-blue-900/20 text-blue-400' : 'bg-purple-900/20 text-purple-400'}`}>
                                                {item.type === 'project' ? <FileCode size={16} /> : <User size={16} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                                                    {item.project?.title || item.user?.username || "Unknown"}
                                                </div>
                                                <div className="text-[10px] text-zinc-600 font-mono">
                                                    Reported by {item.reporter}
                                                </div>
                                            </div>
                                        </div>
                                    </AdminCell>
                                    
                                    {/* Violation Reason */}
                                    <AdminCell onClick={() => setSelectedReport(item)}>
                                        <span className="text-xs text-red-300 font-medium uppercase">{item.reason}</span>
                                    </AdminCell>

                                    {/* Risk Score & Date */}
                                    <AdminCell mono onClick={() => setSelectedReport(item)}>
                                        <div className="flex flex-col gap-1.5 w-24">
                                            <div className="flex justify-between text-[9px] text-zinc-500">
                                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
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

                                    {/* STATUS BADGE */}
                                    <AdminCell mono onClick={() => setSelectedReport(item)}>
                                        {item.status === 'pending' ? (
                                            <span className="text-[9px] px-2 py-0.5 border uppercase text-yellow-500 border-yellow-900/50 bg-yellow-900/10 inline-flex items-center gap-1">
                                                <AlertTriangle size={10} /> PENDING
                                            </span>
                                        ) : (
                                            <span className="text-[9px] px-2 py-0.5 border uppercase text-green-500 border-green-900/50 bg-green-900/10 inline-flex items-center gap-1">
                                                <CheckCircle2 size={10} /> RESOLVED
                                            </span>
                                        )}
                                    </AdminCell>

                                    {/* Actions */}
                                    <AdminCell>
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {item.status === 'pending' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleResolve(item.id); }}
                                                    className="p-1.5 bg-green-900/20 text-green-500 hover:bg-green-900/40 border border-transparent hover:border-green-500/50 transition-all"
                                                    title="Mark Resolved"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setSelectedReport(item)}
                                                className="p-1.5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all ml-2"
                                                title="View Details"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </AdminCell>

                                </AdminRow>
                            ))}
                        </AdminTable>

                       {/* NEW PAGINATION COMPONENT */}
                      <Pagination 
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(newPage) => setPage(newPage)}
                        isLoading={loading}
                      />
                    </>
                )}
            </div>
        </div>

        {/* --- RIGHT SIDEBAR --- */}
        <div className="space-y-6">
            <div className="bg-black border border-white/10 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Shield size={60} />
                </div>
                <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 tracking-widest relative z-10">Live Intelligence</h3>
                <div className="space-y-4 relative z-10">
                    <div className="text-xs text-zinc-400">
                        <span className="block text-zinc-500 mb-1">Most Common Violation</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold">SPAM / BOT ACTIVITY</span>
                        </div>
                    </div>
                    <div className="h-[1px] bg-white/10" />
                    <div className="text-xs text-zinc-400">
                        <span className="block text-zinc-500 mb-1">Resolution Rate</span>
                        <div className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">94%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>

      <ReportDetailModal 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)}
        onResolve={onModalResolve} // <--- PASS THE CALLBACK HERE
      />

    </div>
  );
}