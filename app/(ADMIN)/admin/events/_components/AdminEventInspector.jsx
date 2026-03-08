"use client";
import { useState, useEffect } from "react";
import { 
  X, Loader2, ShieldAlert, Star, Eye, EyeOff, 
  ExternalLink, FolderOpen, MessageSquare, ArrowLeft, Terminal
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getEventDashboard } from "@/app/actions/getEventDashboard";
import { toggleSubmissionPublic } from "@/app/actions/toggleSubmissionPublic";
import { toggleFeatured } from "@/app/actions/toggleFeatured";
import ProjectChatTerminal from "@/app/(HOME)/project/[slug]/_components/ProjectChatTerminal"; // REUSE COMPONENT
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";

export default function AdminEventInspector({ eventId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // DRILLED VIEW STATE
  const [activeSubmission, setActiveSubmission] = useState(null);

  useEffect(() => {
    if (isOpen && eventId) {
        fetchDetails();
        setActiveSubmission(null); // Reset view on open
    }
  }, [isOpen, eventId]);

  const fetchDetails = async () => {
    setLoading(true);
    const res = await getEventDashboard(eventId);
    if (res.success) setData(res.data);
    setLoading(false);
  };

  const handleAction = async (subId, actionType, currentState) => {
    const newState = !currentState;
    setData(prev => ({
        ...prev,
        submissions: prev.submissions.map(s => s.id === subId ? { ...s, [actionType]: newState } : s)
    }));
    const res = actionType === 'is_public' 
        ? await toggleSubmissionPublic(subId, newState)
        : await toggleFeatured(subId, newState);

    if (res.error) {
        toast.error("Overrule Failed");
        fetchDetails(); 
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0 bg-black border-l border-white/10 flex flex-col gap-0 shadow-2xl">
        
        {/* HEADER */}
        <SheetHeader className="p-6 border-b border-white/10 bg-zinc-900/50">
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-red-500 font-mono text-[10px] uppercase tracking-widest mb-1">
                        <ShieldAlert size={12} /> {activeSubmission ? "Comms_Intercept_Active" : "Admin_Oversight_Active"}
                    </div>
                    <SheetTitle className="text-xl font-bold text-white uppercase tracking-tight truncate">
                        {activeSubmission ? activeSubmission.project.title : (data?.event?.title || "Scanning...")}
                    </SheetTitle>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
        </SheetHeader>

        {/* VIEW AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
                    <Loader2 className="animate-spin text-red-600" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Establishing Uplink...</span>
                </div>
            ) : activeSubmission ? (
                /* --- CHAT DRILL DOWN VIEW --- */
                <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                    <div className="p-4 bg-zinc-900/30 border-b border-white/5 flex items-center justify-between">
                        <button 
                            onClick={() => setActiveSubmission(null)}
                            className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 hover:text-white transition-colors uppercase"
                        >
                            <ArrowLeft size={14} /> Back to Ledger
                        </button>
                        <span className="text-[9px] font-mono text-red-500 bg-red-500/10 px-2 py-0.5 border border-red-500/20 uppercase animate-pulse">
                            Live Intercept
                        </span>
                    </div>
                    <div className="flex-1">
                        {/* REUSING THE EXISTING CHAT COMPONENT */}
                        <ProjectChatTerminal 
                            submissionId={activeSubmission.id} 
                            role="ADMIN_OVERSEER" 
                        />
                    </div>
                </div>
            ) : (
                /* --- MAIN SUBMISSIONS LIST --- */
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <StatItem label="Total Subs" value={data.submissions.length} />
                        <StatItem label="Folders" value={data.folders.length} />
                        <StatItem label="Status" value={data.event.is_closed ? "Offline" : "Active"} color={data.event.is_closed ? "text-red-500" : "text-green-500"} />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <FolderOpen size={12} /> Master_Submission_Registry
                        </h3>
                        
                        <div className="space-y-2">
                            {data.submissions.map((sub) => (
                                <div 
                                    key={sub.id} 
                                    onClick={() => setActiveSubmission(sub)}
                                    className="bg-zinc-900/50 border border-white/5 p-3 flex items-center justify-between group hover:border-red-600/50 hover:bg-red-950/5 cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 bg-black border border-white/10 overflow-hidden shrink-0">
                                            <Image src={sub.project.thumbnail_url || "/placeholder.jpg"} alt="" fill className="object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-white uppercase truncate max-w-[180px]">{sub.project.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-mono text-zinc-500">@{sub.project.author.username}</p>
                                                <div className="flex gap-1">
                                                    {sub.is_featured && <Star size={10} className="text-yellow-500 fill-yellow-500" />}
                                                    {sub.is_public && <Eye size={10} className="text-green-500" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleAction(sub.id, 'is_public', sub.is_public); }}
                                            className={`p-2 border border-white/10 ${sub.is_public ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 hover:text-white'}`}
                                        >
                                            {sub.is_public ? <Eye size={14}/> : <EyeOff size={14}/>}
                                        </button>
                                        <div className="bg-red-600 text-white px-2 py-2 flex items-center gap-2 text-[10px] font-mono font-bold uppercase shadow-lg">
                                            Open_Comms <MessageSquare size={12} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-white/10 bg-zinc-900/30 flex justify-between items-center">
            <span className="text-[9px] font-mono text-zinc-600 uppercase">System: Overseer_Module_v4.2</span>
            {!activeSubmission && (
                <Button onClick={onClose} variant="outline" className="h-9 rounded-none border-white/10 text-zinc-400 hover:text-white font-mono text-[10px] uppercase">
                    Terminate Session
                </Button>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatItem({ label, value, color = "text-white" }) {
    return (
        <div className="bg-zinc-900 border border-white/5 p-3 flex flex-col">
            <span className="text-[8px] font-mono text-zinc-500 uppercase mb-1">{label}</span>
            <span className={`text-lg font-bold font-mono leading-none ${color}`}>{value}</span>
        </div>
    )
}