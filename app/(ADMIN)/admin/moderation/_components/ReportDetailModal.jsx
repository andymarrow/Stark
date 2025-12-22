"use client";
import { 
  X, Shield, Ban, ExternalLink, Flag, MessageSquare, 
  AlertOctagon, CheckCircle2, History 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- MOCK EVIDENCE DATA ---
// Specific messages from users who reported this item
const REPORT_LOGS = [
    { id: 1, reporter: "User_882", reason: "Malware", message: "I downloaded this and my antivirus went crazy. Check the package.json scripts.", time: "2h ago", weight: "critical" },
    { id: 2, reporter: "Dev_Sarah", reason: "Malware", message: "Suspicious obfuscated code in /lib/utils.js", time: "3h ago", weight: "critical" },
    { id: 3, reporter: "Anon_User", reason: "Spam", message: "Just a clone of existing repo with no changes.", time: "5h ago", weight: "low" },
];

export default function ReportDetailModal({ report, isOpen, onClose }) {
  if (!report) return null;

  // Determine if target is a Project or User based on data structure
  const isProject = report.type === 'project' || report.project; 
  const targetName = report.project || report.user;
  const targetImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"; // Mock

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] bg-zinc-950 border border-white/10 p-0 gap-0 rounded-none overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 1. Header: The Accused */}
        <div className="p-6 border-b border-white/10 bg-zinc-900/50 flex justify-between items-start">
            <div className="flex gap-5">
                <div className="relative w-24 h-16 border border-white/10 bg-black">
                    <Image src={targetImage} alt="Target" fill className="object-cover" />
                    <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono bg-red-900/30 text-red-500 px-2 py-0.5 border border-red-900/50 uppercase">
                            {report.reason}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            Risk Score: {report.score}%
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {targetName}
                    </h2>
                    <Link 
                        href="#" 
                        className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 mt-1 hover:underline"
                    >
                        view_source <ExternalLink size={10} />
                    </Link>
                </div>
            </div>
            <DialogClose asChild>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </DialogClose>
        </div>

        {/* 2. Body: The Evidence */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left: User Reports */}
            <div className="flex-1 border-r border-white/10 flex flex-col">
                <div className="p-3 border-b border-white/10 bg-zinc-900/20 text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Flag size={12} /> User Reports ({REPORT_LOGS.length})
                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y divide-white/5">
                        {REPORT_LOGS.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] text-zinc-400">
                                            {log.reporter[0]}
                                        </div>
                                        <span className="text-xs font-bold text-zinc-300">{log.reporter}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-600">{log.time}</span>
                                </div>
                                <div className="pl-7">
                                    <p className="text-sm text-zinc-400 leading-relaxed">"{log.message}"</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-[9px] uppercase px-1.5 py-0.5 border ${log.weight === 'critical' ? 'text-red-400 border-red-900/50' : 'text-zinc-500 border-zinc-800'}`}>
                                            {log.weight}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Right: History & Context */}
            <div className="w-full md:w-72 bg-zinc-900/10 flex flex-col">
                <div className="p-3 border-b border-white/10 bg-zinc-900/20 text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <History size={12} /> Prior Infractions
                </div>
                <div className="p-4 space-y-4">
                    <div className="border-l-2 border-yellow-600 pl-3">
                        <span className="text-xs text-zinc-300 block">Warning Issued</span>
                        <span className="text-[10px] text-zinc-500">2 months ago - Spamming</span>
                    </div>
                    <div className="border-l-2 border-zinc-800 pl-3">
                        <span className="text-xs text-zinc-500 block">Clean Record</span>
                        <span className="text-[10px] text-zinc-600">Prior to that</span>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-white/10">
                    <h4 className="text-xs font-bold text-zinc-400 mb-2">Automated Analysis</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                        System detected matching hash with known malware signature (SHA-256). Confidence: 98%.
                    </p>
                </div>
            </div>

        </div>

        {/* 3. Footer: The Gavel */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-between items-center">
            <Button variant="ghost" className="h-9 text-zinc-400 hover:text-white text-xs font-mono uppercase">
                <MessageSquare size={14} className="mr-2" /> Contact Owner
            </Button>
            
            <div className="flex gap-3">
                <Button className="h-9 bg-green-900/20 text-green-500 border border-green-900/50 hover:bg-green-600 hover:text-white rounded-none text-xs font-mono uppercase tracking-wider">
                    <CheckCircle2 size={14} className="mr-2" /> Dismiss
                </Button>
                <Button className="h-9 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white rounded-none text-xs font-mono uppercase tracking-wider">
                    <AlertOctagon size={14} className="mr-2" /> Takedown & Ban
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}