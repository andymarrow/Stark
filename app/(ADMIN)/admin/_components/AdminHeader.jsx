"use client";
import { useState, useEffect } from "react";
import { Bell, Search, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminSearchModal from "./AdminSearchModal"; // Import Modal
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AdminHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [adminName, setAdminName] = useState("Admin");

  // Fetch Real Notifications (Pending Reports)
  useEffect(() => {
    const fetchData = async () => {
      // 1. Get current admin info
      const { data: { user } } = await supabase.auth.getUser();
      if(user) setAdminName(user.user_metadata?.full_name || "Admin");

      // 2. Get pending reports as "Alerts"
      const { data } = await supabase
        .from('reports')
        .select('id, reason, created_at, project_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setAlerts(data || []);
    };

    fetchData();
  }, []);

  return (
    <>
        <header className="h-16 border-b border-white/10 bg-black flex items-center justify-between px-6 sticky top-0 z-50">
          
          {/* Search Trigger */}
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => setIsSearchOpen(true)}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                <div className="bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-500 h-9 pl-10 pr-4 w-64 flex items-center group-hover:border-red-600 transition-colors">
                    Search database...
                </div>
            </div>
          </div>

          {/* Status & Profile */}
          <div className="flex items-center gap-6">
            
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono border border-green-900/50 bg-green-900/10 px-3 py-1 text-green-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                SYSTEM_ONLINE
            </div>

            {/* Notifications */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="relative text-zinc-400 hover:text-white transition-colors outline-none">
                        <Bell size={18} />
                        {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse" />}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-black border border-white/10 rounded-none p-0 text-zinc-300 mt-2 shadow-2xl">
                    
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/50">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">System Alerts</span>
                        <span className="text-[10px] font-mono text-red-500">{alerts.length} PENDING</span>
                    </div>

                    <ScrollArea className="h-[200px]">
                        {alerts.length > 0 ? alerts.map((alert) => (
                            <Link href="/admin/moderation" key={alert.id}>
                                <DropdownMenuItem className="flex items-start gap-3 p-4 border-b border-white/5 focus:bg-white/5 cursor-pointer rounded-none">
                                    <div className="mt-0.5"><AlertTriangle size={14} className="text-yellow-500" /></div>
                                    <div className="flex-1">
                                        <p className="text-xs font-mono mb-1 text-zinc-300">
                                            Report: <span className="text-white uppercase">{alert.reason}</span>
                                        </p>
                                        <span className="text-[10px] text-zinc-600 block">{new Date(alert.created_at).toLocaleTimeString()}</span>
                                    </div>
                                </DropdownMenuItem>
                            </Link>
                        )) : (
                            <div className="p-6 text-center text-xs font-mono text-zinc-600">ALL SYSTEMS NOMINAL</div>
                        )}
                    </ScrollArea>

                    <Link href="/admin/moderation" className="block p-2 bg-zinc-900/50 border-t border-white/10 text-center">
                        <button className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                            View Console
                        </button>
                    </Link>

                </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white leading-none">{adminName}</div>
                    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-1">Super_Admin</div>
                </div>
                <div className="w-8 h-8 bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
                    <ShieldCheck size={16} />
                </div>
            </div>

          </div>
        </header>

        <AdminSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}