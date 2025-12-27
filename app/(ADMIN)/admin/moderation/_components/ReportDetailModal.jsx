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
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

// FIX: Added 'onResolve' prop
export default function ReportDetailModal({ report, isOpen, onClose, onResolve }) {
  if (!report) return null;

  // Identify Target
  const isProject = report.type === 'project'; 
  const targetName = isProject ? report.project?.title : report.user?.username;
  const targetId = isProject ? report.project?.id : report.user?.id;
  const targetImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"; 

  // --- ACTIONS ---

  const handleDismiss = async () => {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', report.id);
      
      if (!error) {
          toast.success("Report Dismissed");
          if (onResolve) onResolve(report.id); // Notify Parent
          onClose();
      } else {
          toast.error("Action Failed");
      }
  };

  const handleTakedown = async () => {
      if (!confirm(`Are you sure you want to take down ${targetName}?`)) return;

      let error = null;

      if (isProject) {
          // Delete Project
          const { error: err } = await supabase.from('projects').delete().eq('id', targetId);
          error = err;
      } else {
          // Ban User
          const { error: err } = await supabase.from('profiles').update({ role: 'banned' }).eq('id', targetId);
          error = err;
      }

      if (!error) {
          // Also mark report as resolved
          await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
          
          toast.success(isProject ? "Project Removed" : "User Banned");
          if (onResolve) onResolve(report.id); // Notify Parent
          onClose();
      } else {
          toast.error("Takedown Failed", { description: error.message });
      }
  };

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
                        {targetName || "Unknown Target"}
                    </h2>
                    {isProject && report.project?.slug && (
                        <Link 
                            href={`/project/${report.project.slug}`} 
                            target="_blank"
                            className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 mt-1 hover:underline"
                        >
                            view_source <ExternalLink size={10} />
                        </Link>
                    )}
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
            
            {/* Left: Report Details */}
            <div className="flex-1 border-r border-white/10 flex flex-col">
                <div className="p-3 border-b border-white/10 bg-zinc-900/20 text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Flag size={12} /> Violation Details
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-300">Reporter: {report.reporter}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600">{new Date(report.created_at).toLocaleString()}</span>
                    </div>
                    <div className="bg-white/5 p-4 border border-white/10 text-sm text-zinc-300 font-mono leading-relaxed">
                        "{report.details}"
                    </div>
                </div>
            </div>

            {/* Right: History & Context */}
            <div className="w-full md:w-72 bg-zinc-900/10 flex flex-col">
                <div className="p-3 border-b border-white/10 bg-zinc-900/20 text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <History size={12} /> Automated Analysis
                </div>
                <div className="p-4 space-y-4">
                    <div className="border-l-2 border-red-600 pl-3">
                        <span className="text-xs text-zinc-300 block">Flagged Reason</span>
                        <span className="text-[10px] text-zinc-500 uppercase">{report.reason}</span>
                    </div>
                    <div className="border-l-2 border-zinc-800 pl-3">
                        <span className="text-xs text-zinc-500 block">System Verdict</span>
                        <span className="text-[10px] text-zinc-600">Pending Review</span>
                    </div>
                </div>
            </div>

        </div>

        {/* 3. Footer: The Gavel */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-between items-center">
            <div className="text-[10px] font-mono text-zinc-600">REPORT_ID: {report.id}</div>
            
            <div className="flex gap-3">
                <Button 
                    onClick={handleDismiss}
                    className="h-9 bg-green-900/20 text-green-500 border border-green-900/50 hover:bg-green-600 hover:text-white rounded-none text-xs font-mono uppercase tracking-wider"
                >
                    <CheckCircle2 size={14} className="mr-2" /> Dismiss
                </Button>
                <Button 
                    onClick={handleTakedown}
                    className="h-9 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white rounded-none text-xs font-mono uppercase tracking-wider"
                >
                    <AlertOctagon size={14} className="mr-2" /> {isProject ? "Delete Project" : "Ban User"}
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}