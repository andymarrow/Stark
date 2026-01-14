"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trash2, Gavel, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { removeJudgeAsAdmin, removeSponsorAsAdmin } from "@/app/actions/adminContestActions"; // Import new action

export default function PersonnelTab({ contest }) {
  const [judges, setJudges] = useState([]);
  const [sponsors, setSponsors] = useState(contest.sponsors || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
        const { data } = await supabase.from('contest_judges').select('*').eq('contest_id', contest.id);
        setJudges(data || []);
        setLoading(false);
    };
    fetch();
  }, [contest.id]);

  const handleRemoveJudge = async (judge) => {
    const reason = prompt("Enter reason for removing Judge:");
    if (!reason) return;

    try {
        const res = await removeJudgeAsAdmin(judge.id, reason, contest.title, contest.creator?.email);
        if (res.error) throw new Error(res.error);
        setJudges(prev => prev.filter(j => j.id !== judge.id));
        toast.success("Judge Removed");
    } catch (e) {
        toast.error("Failed", { description: e.message });
    }
  };

  const handleRemoveSponsor = async (sponsorName) => {
    const reason = prompt(`Enter reason for removing Sponsor "${sponsorName}":`);
    if (!reason) return;

    try {
        const res = await removeSponsorAsAdmin(contest.id, sponsorName, reason, contest.title, contest.creator?.email);
        if (res.error) throw new Error(res.error);
        
        setSponsors(prev => prev.filter(s => s.name !== sponsorName));
        toast.success("Sponsor Removed");
    } catch (e) {
        toast.error("Failed", { description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
        
        {/* Judges Section */}
        <div>
            <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 flex items-center gap-2">
                <Gavel size={14} /> Active Jury Panel
            </h3>
            <div className="border border-white/10 bg-zinc-900/20">
                {judges.map(j => (
                    <div key={j.id} className="flex justify-between items-center p-4 border-b border-white/5 last:border-0">
                        <div>
                            <div className="text-sm font-bold text-zinc-200">{j.email}</div>
                            <div className="text-[10px] font-mono text-zinc-600">CODE: {j.access_code}</div>
                        </div>
                        <Button onClick={() => handleRemoveJudge(j)} variant="destructive" size="sm" className="h-7 text-[10px] bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-900">
                            Revoke
                        </Button>
                    </div>
                ))}
                {judges.length === 0 && <div className="p-4 text-center text-zinc-600 text-xs font-mono">No judges found.</div>}
            </div>
        </div>

        {/* Sponsors Section */}
        <div>
            <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 flex items-center gap-2">
                <Award size={14} /> Sponsor Manifest
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsors.map((s, i) => (
                    <div key={i} className="p-4 border border-white/10 bg-zinc-900/20 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 relative grayscale opacity-50">
                                <img src={s.logo_url} className="object-contain w-full h-full" alt="s" />
                            </div>
                            <span className="text-xs font-bold text-zinc-400">{s.name}</span>
                        </div>
                        
                        <Button 
                            onClick={() => handleRemoveSponsor(s.name)}
                            variant="destructive" 
                            size="sm" 
                            className="h-7 w-7 p-0 rounded-none bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </Button>
                    </div>
                ))}
                {sponsors.length === 0 && <div className="col-span-2 p-4 text-center text-zinc-600 text-xs font-mono border border-dashed border-zinc-800">No sponsors listed.</div>}
            </div>
        </div>

    </div>
  );
}