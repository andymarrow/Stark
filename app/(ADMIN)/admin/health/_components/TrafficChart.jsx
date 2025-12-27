"use client";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

// Simulated Data Generator
const generateTrafficData = () => {
    return Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      requests: Math.floor(Math.random() * 5000) + 1000,
    }));
};

const DATA = generateTrafficData();

export default function TrafficChart() {
  return (
    <div className="bg-black border border-white/10 p-6 h-[400px]">
        <h3 className="text-xs font-mono text-zinc-500 uppercase mb-6 tracking-widest flex justify-between">
            <span>Inbound Traffic (Req/s)</span>
            <span className="text-zinc-700">24H Window</span>
        </h3>
        <div className="h-full w-full pb-6">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DATA}>
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
  );
}

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 p-2 shadow-xl">
          <p className="text-[10px] font-mono text-zinc-400 mb-1">{label}</p>
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500" />
              <p className="text-xs font-bold text-white">
                {payload[0].value} <span className="text-zinc-500 font-mono text-[9px]">REQS</span>
              </p>
          </div>
        </div>
      );
    }
    return null;
}