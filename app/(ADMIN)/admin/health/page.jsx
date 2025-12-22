"use client";
import { Activity, Server, Database, Globe, Cpu, AlertCircle, CheckCircle2 } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line
} from "recharts";

// --- ABUNDANT MOCK DATA ---

// 1. Traffic Data (24 Hours)
const TRAFFIC_DATA = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  requests: Math.floor(Math.random() * 5000) + 1000,
  errors: Math.floor(Math.random() * 100),
  latency: Math.floor(Math.random() * 200) + 20,
}));

// 2. Server Nodes Status
const NODES = [
  { id: "api-01", region: "us-east", status: "healthy", load: 45 },
  { id: "api-02", region: "us-east", status: "healthy", load: 52 },
  { id: "api-03", region: "eu-west", status: "warning", load: 88 },
  { id: "db-primary", region: "us-east", status: "healthy", load: 60 },
  { id: "db-replica", region: "us-west", status: "healthy", load: 24 },
  { id: "cdn-edge", region: "global", status: "critical", load: 99 },
  { id: "worker-01", region: "ap-south", status: "healthy", load: 30 },
  { id: "worker-02", region: "ap-south", status: "healthy", load: 32 },
];

export default function SystemHealthPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Activity className="text-green-500" /> System Diagnostics
            </h1>
            <p className="text-zinc-500 font-mono text-xs">UPTIME: 99.98% | LAST_INCIDENT: 42d ago</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-mono text-green-500 font-bold">LIVE_FEED</span>
        </div>
      </div>

      {/* 1. Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <HealthCard label="API Latency" value="42ms" status="good" icon={Activity} />
        <HealthCard label="CPU Load" value="78%" status="warning" icon={Cpu} />
        <HealthCard label="Database IOPS" value="4.2k" status="good" icon={Database} />
        <HealthCard label="Error Rate" value="0.02%" status="good" icon={AlertCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Main Traffic Graph */}
        <div className="lg:col-span-2 bg-black border border-white/10 p-6 h-[400px]">
            <h3 className="text-xs font-mono text-zinc-500 uppercase mb-6 tracking-widest flex justify-between">
                <span>Inbound Traffic (Req/s)</span>
                <span className="text-zinc-700">24H Window</span>
            </h3>
            <div className="h-full w-full pb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TRAFFIC_DATA}>
                        <defs>
                            <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="time" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="requests" stroke="#10b981" fillOpacity={1} fill="url(#colorReq)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 3. Server Status Grid */}
        <div className="bg-black border border-white/10 p-6">
            <h3 className="text-xs font-mono text-zinc-500 uppercase mb-6 tracking-widest">
                Infrastructure Nodes
            </h3>
            <div className="space-y-4">
                {NODES.map((node) => (
                    <div key={node.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-2 h-2 rounded-full 
                                ${node.status === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                  node.status === 'warning' ? 'bg-yellow-500 animate-pulse' : 
                                  'bg-red-500 animate-bounce'}
                            `} />
                            <div>
                                <div className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{node.id}</div>
                                <div className="text-[10px] font-mono text-zinc-600 uppercase">{node.region}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-mono ${node.load > 90 ? 'text-red-500' : 'text-zinc-400'}`}>
                                {node.load}% LOAD
                            </div>
                            {/* Mini Load Bar */}
                            <div className="w-16 h-1 bg-zinc-900 mt-1">
                                <div 
                                    className={`h-full ${node.load > 90 ? 'bg-red-600' : node.load > 70 ? 'bg-yellow-600' : 'bg-green-600'}`} 
                                    style={{ width: `${node.load}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* 4. Secondary Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Latency Chart */}
          <div className="bg-black border border-white/10 p-6 h-[300px]">
            <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 tracking-widest">Global Latency (ms)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TRAFFIC_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="time" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="step" dataKey="latency" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Distribution */}
          <div className="bg-black border border-white/10 p-6 h-[300px]">
            <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 tracking-widest">Error Anomalies</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TRAFFIC_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="time" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="errors" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>

      </div>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function HealthCard({ label, value, status, icon: Icon }) {
    const colorClass = status === 'good' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-500';
    const bgClass = status === 'good' ? 'bg-green-500/10 border-green-500/20' : status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

    return (
        <div className={`p-4 border ${bgClass} flex items-center justify-between`}>
            <div>
                <p className="text-[10px] font-mono uppercase text-zinc-400">{label}</p>
                <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
            </div>
            <Icon className={`${colorClass} opacity-50`} size={24} />
        </div>
    )
}

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 p-2 shadow-xl">
          <p className="text-[10px] font-mono text-zinc-400 mb-1">{label}</p>
          {payload.map((pld, index) => (
              <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: pld.color }} />
                  <p className="text-xs font-bold text-white">
                    {pld.value} <span className="text-zinc-500 font-mono text-[9px]">{pld.name}</span>
                  </p>
              </div>
          ))}
        </div>
      );
    }
    return null;
}