"use client";
import { 
  X, AlertOctagon, CheckCircle2, Flag, ExternalLink, MessageSquare, UserX 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function ReportDetailModal({ report, isOpen, onClose, onResolve }) {
  if (!report) return null;

  // Identify Target
  const type = report.type; 
  
  // Determine Name
  let targetName = "Unknown Target";
  if (type === 'project') targetName = report.project?.title;
  if (type === 'user') targetName = report.user?.username;
  if (type === 'comment') targetName = "User Comment";

  // Determine IDs
  let targetId = null;
  let commentAuthorId = null;

  if (type === 'project') targetId = report.project?.id;
  if (type === 'user') targetId = report.user?.id;
  if (type === 'comment') {
      targetId = report.comment?.id;
      commentAuthorId = report.comment?.user_id; // Get ID for banning
  }

  const targetImage = type === 'comment' 
    ? "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200" 
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000";

  // --- ACTIONS ---

  const handleDismiss = async () => {
      const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
      if (!error) {
          toast.success("Report Dismissed");
          if (onResolve) onResolve(report.id); 
          onClose();
      } else {
          toast.error("Action Failed");
      }
  };

  const handleTakedown = async () => {
      if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

      let error = null;

      if (type === 'project') {
          const { error: err } = await supabase.from('projects').delete().eq('id', targetId);
          error = err;
      } else if (type === 'user') {
          const { error: err } = await supabase.from('profiles').update({ role: 'banned' }).eq('id', targetId);
          error = err;
      } else if (type === 'comment') {
          const { error: err } = await supabase.from('comments').delete().eq('id', targetId);
          error = err;
      }

      if (!error) {
          await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
          toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} Removed`);
          if (onResolve) onResolve(report.id); 
          onClose();
      } else {
          toast.error("Takedown Failed", { description: error.message });
      }
  };

  // New: Specific Ban Action for Comment Authors
  const handleBanAuthor = async () => {
    if (!commentAuthorId) return;
    if (!confirm(`Permanently BAN the author of this comment?`)) return;

    const { error } = await supabase.from('profiles').update({ role: 'banned' }).eq('id', commentAuthorId);
    
    if (!error) {
        // Also delete the comment and resolve report
        await supabase.from('comments').delete().eq('id', targetId);
        await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
        
        toast.success("User Banned & Comment Purged");
        if (onResolve) onResolve(report.id);
        onClose();
    } else {
        toast.error("Ban Failed", { description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] bg-zinc-950 border border-white/10 p-0 gap-0 rounded-none overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 1. Header */}
        <div className="p-6 border-b border-white/10 bg-zinc-900/50 flex justify-between items-start">
            <div className="flex gap-5">
                <div className="relative w-20 h-14 border border-white/10 bg-black shrink-0">
                    <Image src={targetImage} alt="Target" fill className="object-cover opacity-80" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono bg-red-900/30 text-red-500 px-2 py-0.5 border border-red-900/50 uppercase">
                            {report.reason}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            Type: {type}
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {targetName}
                    </h2>
                </div>
            </div>
            <DialogClose asChild>
                <button className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
            </DialogClose>
        </div>

        {/* 2. Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Show Comment Content if it is a comment report */}
            {type === 'comment' && report.comment && (
                <div className="border border-yellow-500/20 bg-yellow-500/5 p-4 relative">
                    <div className="absolute top-0 right-0 p-1 bg-yellow-500/10 text-yellow-500">
                        <MessageSquare size={12} />
                    </div>
                    <h4 className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-widest">Reported Content</h4>
                    <p className="text-sm text-zinc-300 font-mono leading-relaxed">
                        "{report.comment.content}"
                    </p>
                    <div className="mt-3 pt-3 border-t border-yellow-500/10 text-[10px] text-zinc-500 font-mono flex justify-between">
                        <span>Author: <span className="text-white font-bold">@{report.comment.author?.username || "Unknown"}</span></span>
                        <span>ID: {report.comment.user_id}</span>
                    </div>
                </div>
            )}

            <div>
                <h4 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Flag size={12} /> Reporter Details
                </h4>
                <div className="bg-white/5 p-4 border border-white/10 text-sm text-zinc-300">
                    <div className="mb-2 text-xs font-mono text-zinc-500">
                        @{report.reporter} • {new Date(report.created_at).toLocaleString()}
                    </div>
                    <p>{report.details || "No additional details provided."}</p>
                </div>
            </div>
        </div>

        {/* 3. Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-between items-center">
            <div className="text-[10px] font-mono text-zinc-600">ID: {report.id}</div>
            
            <div className="flex gap-3">
                <Button 
                    onClick={handleDismiss}
                    className="h-9 bg-green-900/20 text-green-500 border border-green-900/50 hover:bg-green-600 hover:text-white rounded-none text-xs font-mono uppercase"
                >
                    <CheckCircle2 size={14} className="mr-2" /> Dismiss
                </Button>

                {/* If Comment, show specific Ban Option */}
                {type === 'comment' && (
                    <Button 
                        onClick={handleBanAuthor}
                        className="h-9 bg-orange-900/20 text-orange-500 border border-orange-900/50 hover:bg-orange-600 hover:text-white rounded-none text-xs font-mono uppercase"
                    >
                        <UserX size={14} className="mr-2" /> Ban Author
                    </Button>
                )}

                <Button 
                    onClick={handleTakedown}
                    className="h-9 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white rounded-none text-xs font-mono uppercase"
                >
                    <AlertOctagon size={14} className="mr-2" /> 
                    {type === 'project' ? "Delete Project" : type === 'user' ? "Ban User" : "Delete Comment"}
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}