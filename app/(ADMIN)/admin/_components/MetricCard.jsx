import { ArrowUpRight } from "lucide-react";

export default function MetricCard({ label, value, trend, icon: Icon, color, alert }) {
  return (
    <div className={`p-5 bg-black border ${alert ? 'border-red-500/50 bg-red-950/10' : 'border-white/10'} relative group overflow-hidden`}>
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 bg-zinc-900 border border-white/5 ${alert ? 'text-red-500' : 'text-zinc-400'}`}>
            <Icon size={18} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-mono ${alert ? 'text-red-400' : 'text-green-500'}`}>
            {trend}
            <ArrowUpRight size={10} />
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</p>
      </div>

      {/* Hover Effect */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
}