"use client";
import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Gavel } from "lucide-react";

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

  // 1. Initial Load
  useEffect(() => {
    const fetchContest = async () => {
      const { data } = await supabase
        .from('contests')
        .select('*')
        .eq('slug', slug)
        .single();
      setContest(data);
      setLoading(false);
    };
    fetchContest();
  }, [slug]);

  // 2. Verify Access Code
  const handleVerify = async (code) => {
    setVerifying(true);
    try {
        const { data, error } = await supabase
            .from('contest_judges')
            .select('*')
            .eq('contest_id', contest.id)
            .eq('access_code', code)
            .single();

        if (error || !data) throw new Error("Invalid access code.");

        setJudge(data);
        toast.success("Access Granted", { description: "Session encrypted." });
        fetchEntries(data.id);
    } catch (err) {
        toast.error("Auth Failure", { description: err.message });
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

    const formatted = submissions.map(s => ({
        ...s,
        existingScores: scores.find(sc => sc.project_id === s.project_id)?.scores || {}
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
        toast.error("Transmission Error");
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" /></div>;

  if (!judge) {
    return <JudgeLogin contestTitle={contest?.title} onVerify={handleVerify} isVerifying={verifying} />;
  }

  // 📊 Logic Update: Check completion based on manual metrics only
  const manualMetricNames = contest.metrics_config
    .filter(m => m.type === 'manual')
    .map(m => m.name);

  const progressCount = entries.filter(entry => {
    const keys = Object.keys(entry.existingScores || {});
    // An entry is "done" if every manual metric has been given a score
    return manualMetricNames.every(name => keys.includes(name));
  }).length;

  const progressPercent = entries.length > 0 ? (progressCount / entries.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-32 pt-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-border pb-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Gavel size={28} className="text-accent" /> Judging Console
                </h1>
                <p className="text-xs font-mono text-muted-foreground uppercase mt-1">
                    Protocol: {contest.title} // Session: {judge.email}
                </p>
            </div>

            <div className="bg-secondary/10 border border-border p-4 w-full md:w-64 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-accent/5 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                <div className="relative z-10">
                    <div className="flex justify-between text-[10px] font-mono uppercase mb-2">
                        <span>Sync Progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800">
                        <div className="h-full bg-accent transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-2">{progressCount} of {entries.length} nodes verified</p>
                </div>
            </div>
        </div>

        <JudgeGrid 
            entries={entries} 
            onSelectEntry={setSelectedEntry} 
        />
        
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