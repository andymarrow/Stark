"use client";
import { useState, useEffect } from "react";
import { 
  AlertTriangle, Trash2, Lock, 
  LayoutTemplate, Image as ImageIcon, Calendar,
  CheckCircle2, Info, Loader2, Save, Globe , Award , BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Reuse components from Create Page logic
import PrizeManager from "../../../create/_components/PrizeManager";
import MetricsManager from "../../../create/_components/MetricsManager";
import CoverImageUpload from "../../../create/_components/CoverImageUpload";
import StepMedia from "@/app/(HOME)/create/_components/StepMedia";
import RichTextEditor from "@/app/(HOME)/create/_components/RichTextEditor";

/**
 * --- TIMEZONE UTILITIES ---
 * Prevents the "3-hour offset" bug by standardizing to UTC for DB
 * and Local for the HTML inputs.
 */
const toLocalInputFormat = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
};

const toUTCISOString = (localString) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
};

const DateTimePicker = ({ label, value, onChange, disabled }) => (
  <div className={`space-y-1.5 ${disabled ? 'opacity-50' : ''}`}>
    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{label}</label>
    <div className="relative group">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-accent" />
        <Input 
            type="datetime-local" 
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="pl-9 rounded-none bg-background border-border text-xs font-mono h-10 focus-visible:ring-accent" 
        />
    </div>
    <p className="text-[7px] text-zinc-600 text-right uppercase tracking-tighter">System_Clock: Local</p>
  </div>
);

export default function SettingsTab({ contest }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- MODERATION CONSTRAINTS ---
  const [constraints, setConstraints] = useState({
    hasSubmissions: false,
    hasJudging: false,
    submissionCount: 0
  });

  // Safe Extraction of TipTap Description
  const initialDescription = typeof contest.description === 'object' ? contest.description : { type: 'markdown', text: contest.description || "" };

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    title: contest.title,
    description: initialDescription, 
    start_date: toLocalInputFormat(contest.start_date),
    submission_deadline: toLocalInputFormat(contest.submission_deadline),
    winner_announce_date: toLocalInputFormat(contest.winner_announce_date),
    prizes: contest.prizes || [],
    metrics: contest.metrics_config || [],
    
    // MEDIA LOGIC: Using the NEW media_urls column
    cover_preview: contest.cover_image, 
    cover_file: null, 
    gallery_files: contest.media_urls || [], // <--- CORRECTED: Using dedicated assets column
  });

  // 1. Fetch System Constraints (Locking Logic)
  useEffect(() => {
    const checkConstraints = async () => {
        // Count entries
        const { count: subCount } = await supabase
            .from('contest_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

        // Count scores (Judging status)
        const { count: scoreCount } = await supabase
            .from('contest_scores')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

        setConstraints({
            hasSubmissions: (subCount || 0) > 0,
            submissionCount: subCount || 0,
            hasJudging: (scoreCount || 0) > 0
        });
        setLoading(false);
    };
    checkConstraints();
  }, [contest.id]);

  // --- HANDLERS ---
  const handleCoverSelect = (file) => {
    setFormData(prev => ({ ...prev, cover_preview: URL.createObjectURL(file), cover_file: file }));
  };

  const handleGalleryUpdate = (key, value) => {
    setFormData(prev => ({ ...prev, gallery_files: value }));
  };

  /**
   * --- CORE UPDATE LOGIC ---
   * This function updates everything EXCEPT the sponsors column.
   */
  const handleUpdate = async () => {
    setIsSaving(true);
    try {
        let coverUrl = formData.cover_preview; 

        // 1. Handle Cover Upload if changed
        if (formData.cover_file) {
            const fileExt = formData.cover_file.name.split('.').pop();
            const fileName = `contests/${contest.creator_id}/cover-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, formData.cover_file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('project-assets').getPublicUrl(fileName);
            coverUrl = data.publicUrl;
        }

        // 2. Commit to Database
        // NOTICE: 'sponsors' is NOT included in this payload.
        const { error } = await supabase
            .from('contests')
            .update({
                title: formData.title,
                description: formData.description,
                start_date: toUTCISOString(formData.start_date),
                submission_deadline: toUTCISOString(formData.submission_deadline),
                winner_announce_date: toUTCISOString(formData.winner_announce_date),
                prizes: formData.prizes,
                metrics_config: formData.metrics,
                cover_image: coverUrl,
                media_urls: formData.gallery_files // <--- CORRECTED: Saving gallery to its own home
            })
            .eq('id', contest.id);

        if (error) throw error;
        toast.success("Configuration Synced", { description: "Global timestamps and assets updated." });
        router.refresh();

    } catch (error) {
        console.error(error);
        toast.error("Protocol Error", { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (constraints.hasSubmissions) {
        toast.error("Action Blocked", { description: "Active nodes exist. Purge submissions first." });
        return;
    }
    if (!confirm("DANGER: This action will permanently erase this contest protocol. Proceed?")) return;
    
    const { error } = await supabase.from('contests').delete().eq('id', contest.id);
    if (!error) {
        toast.success("Contest Nuked");
        router.push("/contests");
    }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4 animate-in fade-in">
        <Loader2 className="animate-spin text-accent" size={32} />
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">Checking_System_Constraints...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 max-w-5xl pb-32">
        
        {/* SECTION 1: IDENTITY & DESCRIPTION */}
        <div className="border border-border bg-background p-6 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-center gap-3 text-accent border-b border-border pb-4 mb-4">
                <LayoutTemplate size={20} />
                <h3 className="font-bold text-base uppercase tracking-widest">Protocol Identity</h3>
            </div>
            
            <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Event Title</label>
                <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-12 rounded-none bg-background border-border font-bold text-lg focus-visible:ring-accent"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DateTimePicker label="Start Sequence" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                <DateTimePicker label="Submission Cutoff" value={formData.submission_deadline} onChange={(e) => setFormData({...formData, submission_deadline: e.target.value})} />
                <DateTimePicker label="Final Reveal" value={formData.winner_announce_date} onChange={(e) => setFormData({...formData, winner_announce_date: e.target.value})} />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Rules & Intelligence</label>
                <div className="min-h-[300px] border border-border bg-black/20">
                    <RichTextEditor 
                        value={formData.description} 
                        onChange={(val) => setFormData({...formData, description: val})} 
                    />
                </div>
            </div>
        </div>

        {/* SECTION 2: VISUAL ASSETS */}
        <div className="border border-border bg-background p-6 space-y-6">
            <div className="flex items-center gap-3 text-accent border-b border-border pb-4 mb-4">
                <ImageIcon size={20} />
                <h3 className="font-bold text-base uppercase tracking-widest">Visual Assets</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Primary Cover Art</label>
                    <CoverImageUpload 
                        preview={formData.cover_preview} 
                        onFileSelect={handleCoverSelect}
                        onRemove={() => setFormData({...formData, cover_preview: null, cover_file: null})}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest block mb-2">Secondary Gallery (Max 3)</label>
                    <StepMedia 
                        data={{ files: formData.gallery_files, demo_link: null }}
                        updateData={handleGalleryUpdate}
                    />
                    <p className="text-[9px] text-zinc-600 font-mono mt-2 uppercase tracking-tighter">
                        // Video links or high-res static images supported.
                    </p>
                </div>
            </div>
        </div>

        {/* SECTION 3: PRIZE LOGIC (LOCKED IF SUBMISSIONS EXIST) */}
        <div className={`border border-border bg-background p-6 space-y-6 relative transition-all ${constraints.hasSubmissions ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="flex items-center gap-3 text-accent border-b border-border pb-4 mb-4">
                <Award className={constraints.hasSubmissions ? 'text-zinc-600' : 'text-accent'} size={20} />
                <h3 className="font-bold text-base uppercase tracking-widest">Reward Distribution</h3>
            </div>
            
            {constraints.hasSubmissions && (
                <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-black border border-yellow-600/50 text-yellow-500 px-6 py-3 flex items-center gap-3 text-xs font-mono uppercase shadow-2xl skew-x-[-12deg]">
                        <Lock size={16} className="skew-x-[12deg]" /> 
                        <span className="skew-x-[12deg] font-bold">Prizes Locked: {constraints.submissionCount} Entries Active</span>
                    </div>
                </div>
            )}
            
            <PrizeManager 
                prizes={formData.prizes} 
                onChange={(p) => setFormData({...formData, prizes: p})} 
            />
        </div>

        {/* SECTION 4: EVALUATION METRICS (LOCKED IF JUDGING BEGUN) */}
        <div className={`border border-border bg-background p-6 space-y-6 relative transition-all ${constraints.hasJudging ? 'opacity-60 grayscale-[0.5]' : ''}`}>
             <div className="flex items-center gap-3 text-accent border-b border-border pb-4 mb-4">
                <BarChart3 className={constraints.hasJudging ? 'text-zinc-600' : 'text-accent'} size={20} />
                <h3 className="font-bold text-base uppercase tracking-widest">Evaluation Logic</h3>
            </div>

            {constraints.hasJudging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-black border border-yellow-600/50 text-yellow-500 px-6 py-3 flex items-center gap-3 text-xs font-mono uppercase shadow-2xl skew-x-[-12deg]">
                        <Lock size={16} className="skew-x-[12deg]" /> 
                        <span className="skew-x-[12deg] font-bold">Metrics Immutable: Judging in Progress</span>
                    </div>
                </div>
            )}

            <MetricsManager 
                metrics={formData.metrics} 
                onChange={(m) => setFormData({...formData, metrics: m})} 
            />
        </div>

        {/* --- GLOBAL ACTION BAR --- */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-zinc-950/80 backdrop-blur-md border-t border-border p-4 flex justify-between items-center z-50 px-8">
            <div className="hidden md:flex items-center gap-3 text-zinc-500 text-[10px] font-mono uppercase">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Connection: Active</div>
                <div className="w-px h-3 bg-zinc-800" />
                <span>ID: {contest.id.slice(0,8)}...</span>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
                <Button 
                    variant="outline" 
                    onClick={() => router.refresh()} 
                    className="flex-1 md:flex-none h-11 rounded-none border-border hover:bg-secondary text-xs font-mono uppercase"
                >
                    Reset Changes
                </Button>
                <Button 
                    onClick={handleUpdate} 
                    disabled={isSaving} 
                    className="flex-1 md:flex-none h-11 px-10 rounded-none bg-accent hover:bg-red-700 text-white uppercase font-mono font-bold text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                    {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Commit Configuration
                </Button>
            </div>
        </div>

        {/* DANGER ZONE */}
        <div className={`border border-red-900/30 bg-red-900/5 p-8 mt-20 transition-opacity ${constraints.hasSubmissions ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertTriangle size={24} />
                <h3 className="font-bold text-lg uppercase tracking-tighter">Decommission Protocol</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-6 max-w-2xl leading-relaxed">
                Erasing this contest is an irreversible administrative action. All associated metadata, rankings, and judging packets will be wiped from the Stark index.
            </p>
            <Button 
                onClick={handleDelete} 
                disabled={constraints.hasSubmissions}
                variant="destructive" 
                className="h-10 px-8 rounded-none text-[10px] font-mono font-bold uppercase bg-red-600 hover:bg-red-700 transition-all"
            >
                <Trash2 size={14} className="mr-2" /> Execute Deletion
            </Button>
            {constraints.hasSubmissions && (
                <p className="text-[9px] text-red-400 font-mono mt-3 uppercase tracking-widest animate-pulse">
                    Action Blocked: Submissions Detected in Buffer.
                </p>
            )}
        </div>

    </div>
  );
}