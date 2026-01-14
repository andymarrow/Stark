"use client";
import { useState } from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { deleteContestAsAdmin } from "@/app/actions/adminContestActions";

export default function ModerationTab({ contest, onClose }) {
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!reason || reason.length < 10) {
        toast.error("Validation Error", { description: "Please provide a detailed reason (>10 chars)." });
        return;
    }
    if (!confirm(`PERMANENTLY DELETE "${contest.title}"? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
        const res = await deleteContestAsAdmin(contest.id, reason);
        if (res.error) throw new Error(res.error);

        toast.success("Contest Terminated", { description: "Creator and participants have been notified." });
        onClose(); // Close modal which triggers refresh
    } catch (e) {
        toast.error("Termination Failed", { description: e.message });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 max-w-2xl">
        
        <div className="border border-red-900/30 bg-red-900/5 p-8">
            <div className="flex items-center gap-3 text-red-500 mb-6">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold uppercase tracking-widest">Termination Protocol</h3>
            </div>
            
            <div className="space-y-4">
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                    Executing this action will:
                    <br/>1. Delete the contest record permanently.
                    <br/>2. Delink all project submissions (projects remain, but lose contest data).
                    <br/>3. Send an automated email to the Creator ({contest.creator?.email}).
                    <br/>4. Send automated emails to all participants explaining the cancellation.
                </p>

                <div className="space-y-2 pt-4">
                    <label className="text-[10px] font-mono text-red-400 uppercase">Reason for Termination (Required)</label>
                    <Textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Violation of Terms: Spam / Fraudulent Activity..."
                        className="bg-black border-red-900/50 text-zinc-300 min-h-[100px] focus:border-red-500"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <Button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        variant="destructive" 
                        className="h-10 px-6 rounded-none font-mono text-xs uppercase bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? <Loader2 className="animate-spin" /> : <><Trash2 size={14} className="mr-2" /> Execute Delete</>}
                    </Button>
                </div>
            </div>
        </div>

    </div>
  );
}