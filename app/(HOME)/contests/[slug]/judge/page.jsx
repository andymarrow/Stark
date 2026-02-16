"use client";
import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Gavel, CheckCircle } from "lucide-react";

// Sub Components
import JudgeLogin from "./_components/JudgeLogin";
import JudgeGrid from "./_components/JudgeGrid";
import EvaluationModal from "./_components/EvaluationModal";

export default function JudgePortalPage({ params }) {
  const { slug } = use(params);
  
  const [contest, setContest] = useState(null);
  const [judge, setJudge] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Initial Load: Fetch Contest Info
  useEffect(() => {
    const fetchContest = async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) console.error(" [Jury_System] Fetch Error:", error);
      setContest(data);
      setLoading(false);
    };
    fetchContest();
  }, [slug]);

  // 2. Verify Access Code
  const handleVerify = async (inputCode) => {
    if (!contest?.id) {
        toast.error("Protocol Syncing", { description: "Please wait a moment and try again." });
        return;
    }

    const cleanCode = inputCode.trim().toUpperCase(); 
    setVerifying(true);

    console.log(`[Jury_Auth] Verifying code: ${cleanCode} for Contest: ${contest.id}`);

    try {
        // We query the judge record. RLS must be set to 'true' for SELECT on this table.
        const { data, error } = await supabase
            .from('contest_judges')
            .select('*')
            .eq('contest_id', contest.id)
            .eq('access_code', cleanCode)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            console.warn("[Jury_Auth] No match found in registry.");
            throw new Error("Invalid access code for this contest.");
        }

        // Success! Establish Session
        setJudge(data);
        toast.success("Access Granted", { description: "Jury session established." });
        
        // 🔄 Sync Judge Status
        // Try to link current user ID if they happen to be logged in
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('contest_judges')
            .update({ status: 'active', user_id: user?.id || null })
            .eq('id', data.id);

        fetchEntries(data.id);
    } catch (err) {
        console.error("[Jury_Auth] Protocol Failure:", err.message);
        toast.error("Access Denied", { description: err.message });
    } finally {
        setVerifying(false);
    }
  };

  // 3. Fetch Entries + Scores
  const fetchEntries = async (judgeId) => {
    const { data: submissions } = await supabase
        .from('contest_submissions')
        .select(`*, project:projects(id, title, slug, thumbnail_url)`)
        .eq('contest_id', contest.id);

    const { data: scores } = await supabase
        .from('contest_scores')
        .select('*')
        .eq('judge_id', judgeId);

    const formatted = (submissions || []).map(s => ({
        ...s,
        existingScores: scores?.find(sc => sc.project_id === s.project_id)?.scores || {}
    }));

    setEntries(formatted);
  };

  // 4. Save Score
  const handleSaveScore = async (projectId, scoresMap) => {
    setIsSaving(true);
    try {
        const { error } = await supabase
            .from('contest_scores')
            .upsert({
                contest_id: contest.id,
                judge_id: judge.id,
                project_id: projectId,
                scores: scoresMap
            }, { onConflict: 'contest_id, judge_id, project_id' });

        if (error) throw error;

        toast.success("Scores Committed");
        setSelectedEntry(null);
        fetchEntries(judge.id);
    } catch (err) {
        toast.error("Sync Failure");
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-accent" /></div>;

  if (!judge) {
    return <JudgeLogin contestTitle={contest?.title} onVerify={handleVerify} isVerifying={verifying} />;
  }

  const manualMetricNames = contest.metrics_config
    .filter(m => m.type === 'manual')
    .map(m => m.name);

  const progressCount = entries.filter(entry => {
    const keys = Object.keys(entry.existingScores || {});
    return manualMetricNames.every(name => keys.includes(name));
  }).length;

  const progressPercent = entries.length > 0 ? (progressCount / entries.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-32 pt-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-border pb-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Gavel size={28} className="text-accent" /> Judging Console
                </h1>
                <p className="text-xs font-mono text-muted-foreground uppercase mt-1">
                    Node: {judge.email} // Sector: {contest.title}
                </p>
            </div>

            <div className="bg-secondary/10 border border-border p-4 w-full md:w-64 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-accent/5 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                <div className="relative z-10">
                    <div className="flex justify-between text-[10px] font-mono uppercase mb-2">
                        <span>Evaluation Progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800">
                        <div className="h-full bg-accent transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-2">{progressCount} of {entries.length} units verified</p>
                </div>
            </div>
        </div>

        <JudgeGrid entries={entries} onSelectEntry={setSelectedEntry} />
        
      </div>

      <EvaluationModal 
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
        metrics={contest.metrics_config}
        onSave={handleSaveScore}
        isSaving={isSaving}
      />
    </div>
  );
}