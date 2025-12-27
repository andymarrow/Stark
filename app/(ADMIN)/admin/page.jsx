"use client";
import { useState, useEffect } from "react";
import { Users, FileCode, AlertTriangle, TrendingUp, Activity, Globe, Loader2 } from "lucide-react";
import MetricCard from "./_components/MetricCard";
import { 
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from "recharts";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    reports: 0,
    traffic: 0
  });
  
  const [logs, setLogs] = useState([]);
  const [activityData, setActivityData] = useState([]); // For chart
  const [loading, setLoading] = useState(true);

  // --- MOCK TRAFFIC DATA (Keep this visual for now) ---
  const TRAFFIC_DATA = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    requests: Math.floor(Math.random() * 5000) + 1000,
  }));

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. KPI Counts
        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: projects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        const { count: reports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        
        // 2. Fetch Recent Audit Logs
        const { data: recentLogs } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        setLogs(recentLogs || []);

        // 3. Fetch Weekly Growth (Users per day) - Lightweight aggregation
        // Note: For large datasets, use an RPC function instead of fetching rows.
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { data: recentUsers } = await supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', oneWeekAgo.toISOString());

        // Group by Day
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const grouped = {};
        recentUsers.forEach(u => {
            const d = new Date(u.created_at);
            const dayName = days[d.getDay()];
            grouped[dayName] = (grouped[dayName] || 0) + 1;
        });

        // Format for Recharts
        const chartData = days.map(day => ({
            name: day,
            signups: grouped[day] || 0,
            // Mock posts for comparison since we fetched users
            posts: Math.floor(Math.random() * 10) 
        }));
        
        setActivityData(chartData);

        setStats({
            users: users || 0,
            projects: projects || 0,
            reports: reports || 0,
            traffic: 142000 // Mock traffic total
        });

      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">System Overview</h1>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                    <span className="flex items-center gap-1"><Activity size={12} className="text-green-500"/> SYSTEM_HEALTH: 98%</span>
                    <span className="flex items-center gap-1"><Globe size={12} className="text-blue-500"/> REGION: GLOBAL</span>
                </div>
            </div>
            <div className="flex gap-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase border border-white/10 px-2 py-1 bg-zinc-900">v2.4.0</span>
            </div>
        </div>

        {/* 1. Top Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Users" value={stats.users.toLocaleString()} trend="+12%" icon={Users} color="blue" />
            <MetricCard label="Projects" value={stats.projects.toLocaleString()} trend="+5%" icon={FileCode} color="purple" />
            <MetricCard label="Reports (Pending)" value={stats.reports.toString()} trend="+2" icon={AlertTriangle} color="red" alert={stats.reports > 0} />
            <MetricCard label="Traffic (Est)" value="142k" trend="+8%" icon={TrendingUp} color="green" />
        </div>

        {/* 2. Visual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Traffic Chart */}
            <div className="lg:col-span-2 bg-black border border-white/10 p-6 h-[400px] relative group">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Network Traffic (Req/s)</h3>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span className="text-[10px] text-zinc-500">Requests</span>
                    </div>
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={TRAFFIC_DATA}>
                            <defs>
                                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="time" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorReq)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* User Growth Bar Chart (Real Data) */}
            <div className="bg-black border border-white/10 p-6 h-[400px]">
                <h3 className="text-xs font-mono text-zinc-500 uppercase mb-6 tracking-widest">Weekly Growth</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData.length > 0 ? activityData : [{name:'-', signups:0}]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: '#222'}} content={<CustomTooltip />} />
                            <Bar dataKey="signups" fill="#22c55e" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="posts" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>

        {/* 3. System Logs (Real Data) */}
        <div className="bg-black border border-white/10 p-4 font-mono text-xs">
            <h3 className="text-zinc-500 uppercase mb-3 px-2">Live_System_Logs</h3>
            <div className="space-y-1 h-32 overflow-y-auto custom-scrollbar px-2">
                {logs.length > 0 ? logs.map((log) => (
                    <div key={log.id} className="flex gap-4 border-b border-white/5 pb-1 mb-1 last:border-0 hover:bg-white/5 p-1 transition-colors">
                        <span className="text-zinc-600 w-32 shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                        <span className={log.action.includes('ERROR') ? "text-red-400 font-bold" : "text-green-400"}>
                            [{log.action}]
                        </span>
                        <span className="text-zinc-400 truncate">{log.details || log.target}</span>
                    </div>
                )) : (
                    <div className="text-zinc-600 p-2">NO_RECENT_LOGS</div>
                )}
            </div>
        </div>

    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 p-2 shadow-xl">
          <p className="text-[10px] font-mono text-zinc-400 mb-1">{label}</p>
          {payload.map((pld, index) => (
              <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: pld.fill || pld.stroke }} />
                  <p className="text-xs font-bold text-white">
                    {pld.value} <span className="text-zinc-500 font-mono text-[9px] uppercase">{pld.dataKey}</span>
                  </p>
              </div>
          ))}
        </div>
      );
    }
    return null;
}