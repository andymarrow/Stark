"use client";
import { useState } from "react";
import { Search, Filter, Download, Terminal, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import { Button } from "@/components/ui/button";

// --- MOCK LOG DATA ---
const LOGS = Array.from({ length: 15 }).map((_, i) => ({
  id: `log_${Math.random().toString(36).substr(2, 9)}`,
  action: i % 5 === 0 ? "USER_BAN" : i % 3 === 0 ? "PROJECT_DELETE" : i % 4 === 0 ? "SYSTEM_ERROR" : "LOGIN_ATTEMPT",
  actor: i % 4 === 0 ? "System_Bot" : `Admin_${i + 1}`,
  target: i % 5 === 0 ? "User_882" : "Project_Neural_v2",
  ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
  status: i % 4 === 0 ? "failure" : "success",
  timestamp: new Date(Date.now() - i * 1000 * 60 * 12).toISOString(),
}));

export default function AuditLogsPage() {
  const [filter, setFilter] = useState("");

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
            <span className="text-lg font-bold text-white">45,201</span>
        </div>
        <div className="bg-black p-4 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Security Flags</span>
            <span className="text-lg font-bold text-red-500">12</span>
        </div>
        <div className="bg-black p-4 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Admin Actions</span>
            <span className="text-lg font-bold text-blue-400">85</span>
        </div>
      </div>

      {/* The Logs Table */}
      <AdminTable headers={["Timestamp", "Action", "Actor", "Target / Payload", "IP Address", "Status"]}>
        {LOGS.map((log) => (
            <AdminRow key={log.id} className="text-xs">
                
                {/* Timestamp */}
                <AdminCell mono className="text-zinc-500">
                    {log.timestamp.replace("T", " ").substring(0, 19)}
                </AdminCell>

                {/* Action */}
                <AdminCell mono>
                    <span className={`font-bold ${
                        log.action === 'SYSTEM_ERROR' ? 'text-red-500' : 
                        log.action === 'USER_BAN' ? 'text-orange-500' : 
                        'text-zinc-300'
                    }`}>
                        {log.action}
                    </span>
                </AdminCell>

                {/* Actor */}
                <AdminCell>
                    <div className="flex items-center gap-2">
                        {log.actor === 'System_Bot' ? <ServerIcon /> : <UserIcon />}
                        <span className="text-zinc-300">{log.actor}</span>
                    </div>
                </AdminCell>

                {/* Target */}
                <AdminCell mono className="text-zinc-400">
                    {log.target}
                </AdminCell>

                {/* IP */}
                <AdminCell mono className="text-zinc-600">
                    {log.ip}
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