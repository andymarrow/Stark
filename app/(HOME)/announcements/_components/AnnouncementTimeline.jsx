"use client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function AnnouncementTimeline({ items, onSelect, activeId }) {
  if (!items.length) return null;

  // Group by Month/Year
  const groups = items.reduce((acc, item) => {
    const date = new Date(item.created_at);
    const key = format(date, "MMMM yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="sticky top-24 hidden lg:block w-72 h-[calc(100vh-140px)] flex flex-col pl-6">
      
      {/* 1. System Header */}
      <div className="flex items-center justify-between mb-6 px-2 border-l-2 border-red-600 bg-red-600/5 py-1.5 -ml-2">
        <div className="flex items-center gap-2">
            <Activity size={12} className="text-red-600 animate-pulse" />
            <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white">
                Registry_Log
            </h3>
        </div>
        <span className="text-[9px] font-mono text-zinc-600">STARK_OS_v2</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-10 relative">
        
        {/* The "Bus Line" - Shifted right to avoid clipping */}
        <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-zinc-800" />
        <div className="absolute left-[14px] top-0 bottom-0 w-[5px] bg-red-600/5" />

        {Object.entries(groups).map(([month, groupItems]) => (
          <div key={month} className="relative">
            
            {/* 2. Month Divider (The Sector Label) */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-4 h-4 bg-zinc-950 border border-zinc-700 rotate-45 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-red-600 rotate-45" />
                </div>
                <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tighter bg-background pr-2">
                   [ {month.replace(" ", "_").toUpperCase()} ]
                </div>
            </div>

            <div className="space-y-6">
                {groupItems.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="group relative flex items-start gap-5 w-full text-left outline-none"
                        >
                            {/* 3. Node Indicator */}
                            <div className="relative mt-1 flex-shrink-0 z-10">
                                <div className={`
                                    w-3.5 h-3.5 transition-all duration-500 border
                                    ${isActive 
                                        ? 'bg-red-600 border-white scale-110 shadow-[0_0_15px_rgba(220,38,38,0.8)]' 
                                        : 'bg-zinc-950 border-zinc-700 group-hover:border-red-500 group-hover:rotate-90'}
                                `} />
                                {isActive && (
                                    <motion.div 
                                        layoutId="scanning-line"
                                        className="absolute left-[-12px] top-1.5 w-10 h-[1px] bg-red-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    />
                                )}
                            </div>

                            {/* 4. Log Entry Content */}
                            <div className={`
                                flex-1 transition-all duration-300 p-2.5 border-l-2
                                ${isActive 
                                    ? 'bg-red-950/10 border-red-600 translate-x-1' 
                                    : 'border-zinc-800/40 group-hover:border-zinc-600'}
                            `}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={`text-[11px] font-mono font-black tracking-tight transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                        {format(new Date(item.created_at), "dd_MMM").toUpperCase()}
                                    </span>
                                    {/* HASH ID REMOVED HERE */}
                                </div>
                                
                                <div className={`text-[9px] font-mono uppercase tracking-widest truncate max-w-[180px] ${isActive ? 'text-red-500 font-bold' : 'text-zinc-600'}`}>
                                    {item.category} // {item.title}
                                </div>

                                {isActive && (
                                    <div className="mt-2 h-[1px] w-full bg-zinc-800 overflow-hidden">
                                        <motion.div 
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "100%" }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="h-full w-1/2 bg-red-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
          </div>
        ))}

        {/* End of Line Symbol */}
        <div className="flex items-center gap-3 px-0.5 pb-20 pt-4">
            <div className="w-3 h-3 border border-zinc-800 flex items-center justify-center">
                <div className="w-1 h-1 bg-zinc-800" />
            </div>
            <span className="text-[9px] font-mono text-zinc-800 uppercase tracking-widest">End_of_Transmission</span>
        </div>
      </div>
    </div>
  );
}