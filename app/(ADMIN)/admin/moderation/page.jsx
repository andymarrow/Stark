"use client";
import { Check, X, ExternalLink, AlertTriangle, FileCode, Shield } from "lucide-react";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import { Button } from "@/components/ui/button";

// --- EXPANDED MOCK REPORTED ITEMS ---
const QUEUE = [
  { id: "rep_01", project: "Free Bitcoin Miner", author: "CryptoKing", reason: "Malware Suspected", type: "Security", score: 98, status: "pending" },
  { id: "rep_02", project: "Netflix Clone", author: "DevNewbie", reason: "Copyright Violation", type: "Legal", score: 75, status: "pending" },
  { id: "rep_03", project: "NSFW Assets Pack", author: "Unknown", reason: "Inappropriate Content", type: "Policy", score: 45, status: "pending" },
  { id: "rep_04", project: "Spam Bot v2", author: "BotNet", reason: "Automated Content", type: "Spam", score: 92, status: "pending" },
  { id: "rep_05", project: "Broken Link Gen", author: "Troll", reason: "Low Quality / Broken", type: "Quality", score: 30, status: "pending" },
];

export default function ModerationPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Shield className="text-red-500" /> Moderation Queue
            </h1>
            <p className="text-zinc-500 font-mono text-xs">PENDING_REVIEW: {QUEUE.length} ITEMS</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="h-8 bg-black text-zinc-400 border-zinc-800 text-xs font-mono rounded-none hover:text-white">
                View History
            </Button>
            <Button variant="destructive" className="h-8 rounded-none text-xs font-mono">
                Purge High Risk ({QUEUE.filter(q => q.score > 90).length})
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main List */}
        <div className="lg:col-span-2">
            <AdminTable headers={["Project", "Type / Score", "Reason", "Actions"]}>
                {QUEUE.map((item) => (
                    <AdminRow key={item.id}>
                        <AdminCell>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-900 border border-white/10 text-zinc-400">
                                    <FileCode size={16} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-200">{item.project}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono">by {item.author}</div>
                                </div>
                            </div>
                        </AdminCell>
                        
                        <AdminCell mono>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-white/5 w-fit">
                                    {item.type.toUpperCase()}
                                </span>
                                {/* Visual Risk Bar */}
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${item.score > 80 ? 'bg-red-600' : item.score > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                            style={{ width: `${item.score}%` }} 
                                        />
                                    </div>
                                    <span className={`text-[9px] ${item.score > 80 ? 'text-red-500' : 'text-zinc-500'}`}>{item.score}%</span>
                                </div>
                            </div>
                        </AdminCell>

                        <AdminCell>
                            <span className="text-xs text-zinc-300">{item.reason}</span>
                        </AdminCell>

                        <AdminCell>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 bg-green-900/20 text-green-500 hover:bg-green-900/40 border border-green-900/30 transition-all" title="Approve">
                                    <Check size={14} />
                                </button>
                                <button className="p-1.5 bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/30 transition-all" title="Ban User & Project">
                                    <X size={14} />
                                </button>
                                <button className="p-1.5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all ml-2" title="Inspect Source">
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </AdminCell>
                    </AdminRow>
                ))}
            </AdminTable>
        </div>

        {/* Sidebar Info - Auto Mod Feed */}
        <div className="space-y-6">
            <div className="bg-black border border-white/10 p-5 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Shield size={60} />
                </div>

                <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 tracking-widest relative z-10">Auto-Mod Activity</h3>
                <div className="space-y-4 relative z-10">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex gap-3 items-start text-xs border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <AlertTriangle size={12} className="text-yellow-500 mt-0.5 shrink-0" />
                            <div className="text-zinc-400">
                                <span className="text-zinc-200 font-bold block mb-0.5">Spam Pattern Detected</span>
                                <span className="font-mono text-[10px] text-zinc-600 leading-tight block">User_923 posted 50 links in 1m. Action: 1hr Mute.</span>
                                <span className="text-[9px] text-zinc-700 mt-1 block">Log ID: #9823_{i}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 p-4">
                <h4 className="text-xs font-bold text-zinc-400 mb-2">Policy Updates</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                    New heuristics added for crypto-miner detection. False positive rate currently at 0.4%.
                </p>
            </div>
        </div>

      </div>

    </div>
  );
}