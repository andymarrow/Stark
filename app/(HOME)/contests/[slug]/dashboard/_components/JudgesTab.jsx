"use client";
import { useState, useEffect } from "react";
import { 
  UserPlus, Mail, Copy, Trash2, ShieldCheck, 
  Loader2, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sendJudgeInvite } from "@/app/actions/inviteJudge"; 

/**
 * COMPONENT: JudgesTab
 * Manages the roster of evaluators for a specific contest.
 * Generates secure access codes and dispatches emails via Resend.
 */
export default function JudgesTab({ contestId, contestTitle, contestSlug, creatorName }) {
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // --- 1. DATA FETCHING ---
  const fetchJudges = async () => {
    const { data, error } = await supabase
      .from("contest_judges")
      .select(`*, profile:profiles(full_name, avatar_url, username)`)
      .eq("contest_id", contestId)
      .order("created_at", { ascending: false });

    if (!error) setJudges(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (contestId) fetchJudges();
  }, [contestId]);

  // --- 2. INVITATION LOGIC ---
  const handleInvite = async () => {
    // Basic validation
    if (!inviteEmail.includes("@")) {
      toast.error("Invalid Email Pattern", { description: "Please enter a valid electronic mail address." });
      return;
    }

    setIsInviting(true);

    try {
      // Step A: Generate unique 6-digit cryptographic access code
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Step B: Check if the user is already on the Stark Network
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail)
        .single();

      // Step C: Record invitation in the database
      const { error } = await supabase.from("contest_judges").insert({
        contest_id: contestId,
        email: inviteEmail,
        access_code: accessCode,
        user_id: existingUser?.id || null, // Link node if exists
        status: "invited"
      });

      if (error) {
          if (error.code === '23505') throw new Error("This email is already invited to this contest.");
          throw error;
      }

      // Step D: Dispatch Email via Resend Server Action
      // Passing 'contestSlug' ensures the email link goes to /contests/[slug]/judge
      const emailResult = await sendJudgeInvite(
        inviteEmail, 
        contestTitle || "Stark Hackathon", 
        contestSlug, // Critical: Defines the deep-link path
        accessCode, 
        creatorName || "System Administrator"
      );

      if (!emailResult.success) {
          toast.warning("Database synced, but email delivery failed.", { description: emailResult.error });
      } else {
          toast.success("Invitation Dispatched", { description: `Secure link sent to ${inviteEmail}` });
      }

      // Cleanup
      setInviteEmail("");
      fetchJudges();

    } catch (error) {
      console.error("Invite Error:", error);
      toast.error("Protocol Error", { description: error.message });
    } finally {
      setIsInviting(false);
    }
  };

  // --- 3. MANAGEMENT ACTIONS ---
  const handleRemove = async (judgeId) => {
    const { error } = await supabase.from("contest_judges").delete().eq("id", judgeId);
    if (!error) {
      setJudges(prev => prev.filter(j => j.id !== judgeId));
      toast.success("Node Terminated", { description: "Judge access has been revoked." });
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Code Copied", { description: "Credential saved to clipboard." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-24">
      
      {/* Invite Interface */}
      <div className="bg-secondary/5 border border-border p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={20} className="text-accent" />
            <h3 className="font-bold text-sm uppercase tracking-widest">Protocol: Judge_Invite</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-2 relative z-10">
            <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                    placeholder="Enter judge's secure email..." 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10 h-10 rounded-none bg-background border-border text-sm focus-visible:ring-accent"
                />
            </div>
            <Button 
                onClick={handleInvite} 
                disabled={isInviting || !inviteEmail}
                className="h-10 rounded-none bg-foreground text-background hover:bg-accent hover:text-white uppercase font-mono text-xs w-full md:w-auto transition-all"
            >
                {isInviting ? <Loader2 className="animate-spin" /> : <><UserPlus size={14} className="mr-2" /> Send Invite</>}
            </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 font-mono ml-1">
            * System will generate a unique entry key and dispatch an invitation email.
        </p>
      </div>

      {/* Active Jury List */}
      <div className="border border-border bg-background">
        <div className="p-3 border-b border-border bg-secondary/10 flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                Active_Panel_Buffer ({judges.length})
            </span>
            <button onClick={fetchJudges} className="text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
        </div>

        {loading && judges.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-muted-foreground animate-pulse">Scanning Roster...</div>
        ) : judges.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-muted-foreground">
                No active jury members found in this sector.
            </div>
        ) : (
            <div className="divide-y divide-border">
                {judges.map((judge) => (
                    <div key={judge.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-secondary/5 transition-colors">
                        
                        {/* Profile Identity */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-none border border-border group-hover:border-accent transition-colors">
                                <AvatarImage src={judge.profile?.avatar_url} />
                                <AvatarFallback className="rounded-none bg-secondary text-xs">
                                    {(judge.profile?.username || judge.email).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="text-sm font-bold truncate max-w-[180px] sm:max-w-xs flex items-center gap-2">
                                    {judge.profile?.full_name || judge.email}
                                    {judge.status === 'active' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                                    {judge.status} // node: {judge.profile?.username || 'unlinked'}
                                </div>
                            </div>
                        </div>

                        {/* Actions & Code */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <div 
                                onClick={() => copyCode(judge.access_code)}
                                title="Click to copy code"
                                className="flex-1 sm:flex-none text-center px-4 py-2 bg-secondary/20 border border-border cursor-pointer hover:border-accent hover:text-accent transition-colors text-xs font-mono tracking-widest font-bold"
                            >
                                {judge.access_code}
                            </div>
                            <button 
                                onClick={() => handleRemove(judge.id)}
                                className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                title="Revoke Access"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}