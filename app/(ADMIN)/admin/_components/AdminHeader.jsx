"use client";
import { Bell, Search, ShieldCheck, Server, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- MOCK ALERTS DATA ---
const ALERTS = [
  { id: 1, type: "critical", message: "High CPU Usage (92%) on Node_04", time: "2m ago" },
  { id: 2, type: "warning", message: "Failed Login Attempt: IP 192.168.x.x", time: "15m ago" },
  { id: 3, type: "success", message: "Database Backup Completed", time: "1h ago" },
  { id: 4, type: "info", message: "New User Registration Spike", time: "3h ago" },
  { id: 5, type: "warning", message: "API Latency > 200ms", time: "5h ago" },
];

export default function AdminHeader() {
  return (
    <header className="h-16 border-b border-white/10 bg-black flex items-center justify-between px-6 sticky top-0 z-50">
      
      {/* Search / Command */}
      <div className="flex items-center gap-4">
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white" />
            <input 
                type="text" 
                placeholder="Search user ID, project hash..." 
                className="bg-zinc-900 border border-white/10 text-xs font-mono text-white h-9 pl-10 pr-4 w-64 focus:border-red-600 focus:outline-none transition-colors placeholder:text-zinc-700"
            />
        </div>
      </div>

      {/* Status & Profile */}
      <div className="flex items-center gap-6">
        
        {/* System Status Indicator */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono border border-green-900/50 bg-green-900/10 px-3 py-1 text-green-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            SYSTEM_ONLINE
        </div>

        {/* --- NOTIFICATION DROPDOWN --- */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative text-zinc-400 hover:text-white transition-colors outline-none">
                    <Bell size={18} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-black border border-white/10 rounded-none p-0 text-zinc-300 mt-2 shadow-2xl">
                
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/50">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">System Alerts</span>
                    <span className="text-[10px] font-mono text-red-500">2 CRITICAL</span>
                </div>

                <ScrollArea className="h-[300px]">
                    {ALERTS.map((alert) => (
                        <DropdownMenuItem key={alert.id} className="flex items-start gap-3 p-4 border-b border-white/5 focus:bg-white/5 cursor-pointer rounded-none">
                            <div className="mt-0.5">
                                {alert.type === 'critical' && <XCircle size={14} className="text-red-500" />}
                                {alert.type === 'warning' && <AlertTriangle size={14} className="text-yellow-500" />}
                                {alert.type === 'success' && <CheckCircle size={14} className="text-green-500" />}
                                {alert.type === 'info' && <Server size={14} className="text-blue-500" />}
                            </div>
                            <div className="flex-1">
                                <p className={`text-xs font-mono mb-1 ${alert.type === 'critical' ? 'text-red-400 font-bold' : 'text-zinc-300'}`}>
                                    {alert.message}
                                </p>
                                <span className="text-[10px] text-zinc-600 block">{alert.time}</span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </ScrollArea>

                <div className="p-2 bg-zinc-900/50 border-t border-white/10 text-center">
                    <button className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                        View All Logs
                    </button>
                </div>

            </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <div className="flex items-center gap-3 border-l border-white/10 pl-6">
            <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-white leading-none">AdminUser</div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-1">Super_Admin</div>
            </div>
            <div className="w-8 h-8 bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
                <ShieldCheck size={16} />
            </div>
        </div>

      </div>
    </header>
  );
}