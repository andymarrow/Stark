"use client";
import { useState, useEffect } from "react";
import { Search, Filter, Download, Terminal, AlertCircle, CheckCircle, ShieldAlert, Loader2 } from "lucide-react";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import Pagination from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 15;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats State
  const [stats, setStats] = useState({
    total24h: 0,
    securityFlags: 0,
    actions: 0
  });

  // --- FETCH LOGS ---
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('audit_logs')
        .select(`
            *,
            actor:profiles!actor_id(username)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Search Filter
      if (search) {
        query = query.or(`action.ilike.%${search}%,target.ilike.%${search}%,details.ilike.%${search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);

      // --- CALCULATE STATS (Lightweight approximation) ---
      // In a real app, you might use a separate RPC call for heavy aggregation
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { count: count24h } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo);
        
      const { count: flags } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .in('action', ['USER_BAN', 'PROJECT_DELETE', 'SYSTEM_ERROR']);

      setStats({
          total24h: count24h || 0,
          securityFlags: flags || 0,
          actions: count || 0
      });

    } catch (error) {
      console.error("Logs Fetch Error:", error);
      toast.error("Failed to retrieve ledger");
    } finally {
      setLoading(false);
    }
  };

  // Debounce Search & Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Terminal className="text-zinc-500" /> Security Audit Logs
            </h1>
            <p className="text-zinc-500 font-mono text-xs">RETENTION_POLICY: 90 DAYS | IMMUTABLE_LEDGER</p>
        </div>
        
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search logs..." 
                    className="bg-black border border-white/10 text-xs font-mono text-white h-9 pl-9 pr-3 w-64 focus:border-red-600 focus:outline-none placeholder:text-zinc-700"
                />
            </div>
            <Button variant="outline" className="h-9 bg-black text-zinc-300 border-white/10 hover:bg-white/5 hover:text-white rounded-none font-mono text-xs uppercase">
                <Filter size={14} className="mr-2" /> Filter
            </Button>
            <Button className="h-9 bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase">
                <Download size={14} className="mr-2" /> Export
            </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
        <div className="bg-black p-4 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Events (24h)</span>
            <span className="text-lg font-bold text-white">{stats.total24h.toLocaleString()}</span>
        </div>
        <div className="bg-black p-4 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Security Flags</span>
            <span className="text-lg font-bold text-red-500">{stats.securityFlags}</span>
        </div>
        <div className="bg-black p-4 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Actions</span>
            <span className="text-lg font-bold text-blue-400">{stats.actions.toLocaleString()}</span>
        </div>
      </div>

      {/* The Logs Table */}
      <div className="bg-black border border-white/10 flex flex-col min-h-[400px]">
        
        {loading ? (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" />
            </div>
        ) : logs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-mono">
                NO_LOGS_FOUND
            </div>
        ) : (
            <>
                <AdminTable headers={["Timestamp", "Action", "Actor", "Target / Payload", "Details", "Status"]}>
                    {logs.map((log) => (
                        <AdminRow key={log.id} className="text-xs group hover:bg-white/5">
                            
                            {/* Timestamp */}
                            <AdminCell mono className="text-zinc-500 w-40">
                                {new Date(log.created_at).toLocaleString('en-US', { 
                                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
                                })}
                            </AdminCell>

                            {/* Action */}
                            <AdminCell mono>
                                <span className={`font-bold ${
                                    log.action.includes('ERROR') ? 'text-red-500' : 
                                    log.action.includes('BAN') || log.action.includes('DELETE') ? 'text-orange-500' : 
                                    'text-zinc-300'
                                }`}>
                                    {log.action}
                                </span>
                            </AdminCell>

                            {/* Actor */}
                            <AdminCell>
                                <div className="flex items-center gap-2">
                                    {log.actor?.username === 'system' ? <ServerIcon /> : <UserIcon />}
                                    <span className="text-zinc-300">{log.actor?.username || "Unknown"}</span>
                                </div>
                            </AdminCell>

                            {/* Target */}
                            <AdminCell mono className="text-zinc-400">
                                {log.target}
                            </AdminCell>

                            {/* Details (Truncated) */}
                            <AdminCell className="text-zinc-600 max-w-xs truncate" title={log.details}>
                                {log.details || "-"}
                            </AdminCell>

                            {/* Status */}
                            <AdminCell>
                                <div className={`flex items-center gap-2 uppercase font-mono text-[10px] ${log.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                    {log.status === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                    {log.status}
                                </div>
                            </AdminCell>

                        </AdminRow>
                    ))}
                </AdminTable>

                {/* Pagination */}
                <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChange={setPage} 
                    isLoading={loading}
                />
            </>
        )}
      </div>

    </div>
  );
}

// Simple Icon Helpers
function ServerIcon() {
    return <div className="w-4 h-4 bg-purple-900/30 text-purple-400 flex items-center justify-center border border-purple-500/20"><Terminal size={10} /></div>
}
function UserIcon() {
    return <div className="w-4 h-4 bg-blue-900/30 text-blue-400 flex items-center justify-center border border-blue-500/20"><ShieldAlert size={10} /></div>
}