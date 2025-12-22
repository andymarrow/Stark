"use client";
import { Users, FileCode, AlertTriangle, TrendingUp, Activity, Globe } from "lucide-react";
import MetricCard from "./_components/MetricCard";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from "recharts";

// --- VISUAL DATA ---
const TRAFFIC_DATA = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  visitors: Math.floor(Math.random() * 5000) + 2000,
  requests: Math.floor(Math.random() * 8000) + 3000,
}));

const ACTIVITY_DATA = [
  { name: 'Mon', signups: 400, posts: 240 },
  { name: 'Tue', signups: 300, posts: 139 },
  { name: 'Wed', signups: 500, posts: 380 },
  { name: 'Thu', signups: 200, posts: 400 },
  { name: 'Fri', signups: 600, posts: 500 },
  { name: 'Sat', signups: 800, posts: 600 },
  { name: 'Sun', signups: 700, posts: 450 },
];

export default function AdminDashboard() {
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
            <MetricCard label="Total Users" value="12,402" trend="+12%" icon={Users} color="blue" />
            <MetricCard label="Projects" value="8,230" trend="+5%" icon={FileCode} color="purple" />
            <MetricCard label="Reports" value="14" trend="+2" icon={AlertTriangle} color="red" alert />
            <MetricCard label="Traffic (24h)" value="145k" trend="+8%" icon={TrendingUp} color="green" />
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

            {/* User Growth Bar Chart */}
            <div className="bg-black border border-white/10 p-6 h-[400px]">
                <h3 className="text-xs font-mono text-zinc-500 uppercase mb-6 tracking-widest">Weekly Growth</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ACTIVITY_DATA}>
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

        {/* 3. System Logs (Terminal Style) */}
        <div className="bg-black border border-white/10 p-4 font-mono text-xs">
            <h3 className="text-zinc-500 uppercase mb-3 px-2">Live_System_Logs</h3>
            <div className="space-y-1 h-32 overflow-y-auto custom-scrollbar px-2">
                {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className="flex gap-4 border-b border-white/5 pb-1 mb-1 last:border-0 hover:bg-white/5 p-1 transition-colors">
                        <span className="text-zinc-600">10:42:{10+i}</span>
                        <span className={i%3===0 ? "text-red-400" : "text-green-400"}>
                            {i%3===0 ? "[ERROR] CONNECTION_REFUSED" : "[INFO]  PACKET_RECEIVED"}
                        </span>
                        <span className="text-zinc-400">Node_0{i%4 + 1}</span>
                    </div>
                ))}
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