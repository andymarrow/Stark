"use client";
import { useState } from "react";
import { 
  X, Shield, Trash2, Zap, CheckCircle, AlertTriangle, 
  Users, Award, Gavel, Mail, Save 
} from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { deleteContestAsAdmin, removeJudgeAsAdmin } from "@/app/actions/adminContestActions";

// --- SUB-COMPONENTS (Internal for organization) ---
import PersonnelTab from "./PersonnelTab";
import ModerationTab from "./ModerationTab";
import OverviewTab from "./OverviewTab";

export default function ContestDetailModal({ contest, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Local state for immediate UI updates
  const [isFeatured, setIsFeatured] = useState(contest.is_featured);
  const [isVerified, setIsVerified] = useState(contest.is_verified);

  // Toggle Handlers
  const toggleFeatured = async () => {
    const newVal = !isFeatured;
    setIsFeatured(newVal);
    await supabase.from('contests').update({ is_featured: newVal }).eq('id', contest.id);
    toast.success(newVal ? "Contest Featured" : "Contest Unfeatured");
  };

  const toggleVerified = async () => {
    const newVal = !isVerified;
    setIsVerified(newVal);
    await supabase.from('contests').update({ is_verified: newVal }).eq('id', contest.id);
    toast.success(newVal ? "Contest Verified" : "Verification Removed");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] bg-zinc-950 border border-white/10 p-0 gap-0 rounded-none overflow-hidden flex flex-col shadow-2xl">
        
        {/* 1. Header: The Control Deck */}
        <div className="p-6 border-b border-white/10 bg-black flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[9px] font-mono px-2 py-0.5 border uppercase ${
                        contest.status === 'open' ? 'text-green-500 border-green-900/50' : 'text-zinc-500 border-zinc-800'
                    }`}>
                        {contest.status}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase">ID: {contest.id}</span>
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-tight max-w-2xl leading-tight">
                    {contest.title}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                    <Users size={12} /> Host: {contest.creator?.email}
                </div>
            </div>

            <div className="flex flex-col items-end gap-2">
                <DialogClose asChild>
                    <button className="text-zinc-500 hover:text-white mb-2"><X size={20} /></button>
                </DialogClose>
                
                {/* Quick Actions */}
                <div className="flex gap-2">
                    <button 
                        onClick={toggleVerified}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase border transition-colors
                            ${isVerified ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'}
                        `}
                    >
                        <Shield size={12} /> Verified
                    </button>
                    <button 
                        onClick={toggleFeatured}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase border transition-colors
                            ${isFeatured ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'}
                        `}
                    >
                        <Zap size={12} /> Featured
                    </button>
                </div>
            </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-zinc-900/30">
            {['overview', 'personnel', 'moderation'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-xs font-mono uppercase tracking-widest transition-colors border-r border-white/5
                        ${activeTab === tab ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300'}
                    `}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* 3. Main Body */}
        <div className="flex-1 overflow-y-auto bg-black p-6">
            {activeTab === 'overview' && <OverviewTab contest={contest} />}
            {activeTab === 'personnel' && <PersonnelTab contest={contest} />}
            {activeTab === 'moderation' && <ModerationTab contest={contest} onClose={onClose} />}
        </div>

      </DialogContent>
    </Dialog>
  );
}