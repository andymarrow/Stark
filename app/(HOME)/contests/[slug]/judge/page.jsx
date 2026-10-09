"use client";
import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Gavel, CheckCircle, Globe } from "lucide-react";
import { hasLiveDemo } from "@/lib/projectDemo";

// Sub Components
import JudgeLogin from "./_components/JudgeLogin";
import JudgeGrid from "./_components/JudgeGrid";
import EvaluationModal from "./_components/EvaluationModal";

// A judge's session used to live only in React state, so every reload,
// tab close or wander off to look at a project meant typing the access
// code again. Judges review dozens of entries in a sitting, so that was
// constant. Remembered per contest, re-checked against the database on
// each restore so a revoked code stops working rather than living on in
// someone's browser.
const SESSION_DAYS = 14;
const sessionKey = (contestId) => `stark_jury_session_${contestId}`;

const loadSession = (contestId) => {
  try {
    const raw = localStorage.getItem(sessionKey(contestId));
    if (!raw) return null;
    const { code, savedAt } = JSON.parse(raw);
    if (!code || !savedAt) return null;
    if (Date.now() - savedAt > SESSION_DAYS * 86400000) {
      localStorage.removeItem(sessionKey(contestId));
      return null;
    }
    return code;
  } catch {
    return null; // private mode or corrupt value — just ask for the code
  }
};

const saveSession = (contestId, code) => {
  try { localStorage.setItem(sessionKey(contestId), JSON.stringify({ code, savedAt: Date.now() })); } catch {}
};

const clearSession = (contestId) => {
  try { localStorage.removeItem(sessionKey(contestId)); } catch {}
};

export default function JudgePortalPage({ params }) {
  const { slug } = use(params);
  
  const [contest, setContest] = useState(null);
  const [judge, setJudge] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [demoOnly, setDemoOnly] = useState(false);
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
  // `silent` is a session being restored rather than a code being typed:
  // no toasts, and a failure quietly drops back to the login screen.
  const handleVerify = async (inputCode, { silent = false } = {}) => {
    if (!contest?.id) {
        if (!silent) toast.error("Protocol Syncing", { description: "Please wait a moment and try again." });
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
        saveSession(contest.id, cleanCode);
        if (!silent) toast.success("Access Granted", { description: "Jury session established." });

        // 🔄 Sync Judge Status
        // Only ever ADD a user link — never clear one. This used to write
        // `user_id: user?.id || null`, so a judge signing in while logged
        // out wiped the account link they already had, every single time.
        const { data: { user } } = await supabase.auth.getUser();
        const statusUpdate = { status: 'active' };
        if (user?.id) statusUpdate.user_id = user.id;
        await supabase.from('contest_judges')
            .update(statusUpdate)
            .eq('id', data.id);

        fetchEntries(data.id);
    } catch (err) {
        console.error("[Jury_Auth] Protocol Failure:", err.message);
        if (silent) clearSession(contest.id);
        else toast.error("Access Denied", { description: err.message });
    } finally {
        setVerifying(false);
    }
  };

  const endSession = () => {
    if (contest?.id) clearSession(contest.id);
    setJudge(null);
    setEntries([]);
    toast.info("Jury session ended");
  };

  // Restore a remembered session once the contest is known.
  useEffect(() => {
    if (!contest?.id || judge) return;
    const code = loadSession(contest.id);
    if (code) handleVerify(code, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest?.id]);

  // 3. Fetch Entries + Scores
  const fetchEntries = async (judgeId) => {
    const { data: submissions } = await supabase
        .from('contest_submissions')
        .select(`*, project:projects(id, title, slug, thumbnail_url, demo_link, additional_links)`)
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

  // Shared with the public entries tab so "has a demo" means the same
  // thing in both places (lib/projectDemo.js).
  const demoCount = entries.filter((e) => hasLiveDemo(e.project)).length;
  const visibleEntries = demoOnly ? entries.filter((e) => hasLiveDemo(e.project)) : entries;

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" /></div>;

  if (!judge) {
    return <JudgeLogin contestTitle={contest?.title} onVerify={handleVerify} isVerifying={verifying} />;
  }

  // This judge's own rubric, if the host set one — otherwise the contest's
  // shared default. Judges from different backgrounds can be weighted (or
  // even scored on entirely different criteria) without affecting anyone
  // else's evaluation.
  const activeMetrics = judge.metrics_config || contest.metrics_config;

  const manualMetricNames = activeMetrics
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
                <button
                    onClick={endSession}
                    className="mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
                >
                    End session
                </button>
            </div>

            <div className="bg-secondary/10 border border-border p-4 w-full md:w-64 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-accent/5 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                <div className="relative z-10">
                    <div className="flex justify-between text-[10px] font-mono uppercase mb-2">
                        <span>Evaluation Progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1 w-full bg-secondary">
                        <div className="h-full bg-accent transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-2">{progressCount} of {entries.length} units verified</p>
                </div>
            </div>
        </div>

        {/* Same Has Demo filter as the public entries tab — judges asked
            for it there first, and it's more useful here where the job is
            working through the list one entry at a time. Filtering never
            hides an entry you've already scored. */}
        <div className="flex items-center justify-between gap-3 mb-6">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                {demoOnly ? `${visibleEntries.length} of ${entries.length} Entries` : `${entries.length} Entries`}
            </span>
            <button
                onClick={() => setDemoOnly((v) => !v)}
                aria-pressed={demoOnly}
                className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    demoOnly
                        ? "bg-emerald-500 border-emerald-500 text-black"
                        : "border-border text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/50"
                }`}
            >
                <Globe size={11} strokeWidth={2.5} />
                Has Demo
                <span className={demoOnly ? "opacity-70" : "opacity-50"}>({demoCount})</span>
            </button>
        </div>

        {visibleEntries.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border bg-secondary/5">
                <p className="text-sm font-mono text-muted-foreground uppercase">No entries have a demo link</p>
                <button onClick={() => setDemoOnly(false)} className="mt-2 text-xs font-mono text-accent hover:underline uppercase">Clear filter</button>
            </div>
        ) : (
            <JudgeGrid entries={visibleEntries} onSelectEntry={setSelectedEntry} />
        )}
        
      </div>

      <EvaluationModal 
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
        metrics={activeMetrics}
        onSave={handleSaveScore}
        isSaving={isSaving}
      />
    </div>
  );
}