"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Save, AlertTriangle, Trash2, Lock, 
  LayoutTemplate, Image as ImageIcon, Calendar 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Reuse components from Create Page (Ensure these paths are correct)
import PrizeManager from "../../../create/_components/PrizeManager";
import MetricsManager from "../../../create/_components/MetricsManager";
import CoverImageUpload from "../../../create/_components/CoverImageUpload";
import StepMedia from "@/app/(HOME)/create/_components/StepMedia";
import RichTextEditor from "@/app/(HOME)/create/_components/RichTextEditor";

// Simple Date Picker Wrapper
const DateTimePicker = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-mono uppercase text-muted-foreground">{label}</label>
    <Input 
      type="datetime-local" 
      value={value}
      onChange={onChange}
      className="rounded-none bg-background border-border text-xs font-mono" 
    />
  </div>
);

export default function SettingsTab({ contest }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Constraints State
  const [constraints, setConstraints] = useState({
    hasSubmissions: false,
    hasJudging: false,
    submissionCount: 0
  });

  // Form State
  const [formData, setFormData] = useState({
    title: contest.title,
    description: contest.description, // JSON or String
    start_date: new Date(contest.start_date).toISOString().slice(0, 16),
    submission_deadline: new Date(contest.submission_deadline).toISOString().slice(0, 16),
    winner_announce_date: new Date(contest.winner_announce_date).toISOString().slice(0, 16),
    prizes: contest.prizes || [],
    metrics: contest.metrics_config || [],
    
    // Media Logic
    cover_preview: contest.cover_image, 
    cover_file: null, // Only set if changed
    gallery_files: contest.sponsors || [], // Using sponsors col for assets as per previous hack, ideally rename col
  });

  // 1. Fetch Constraints on Mount
  useEffect(() => {
    const checkConstraints = async () => {
        // Check Submissions
        const { count: subCount } = await supabase
            .from('contest_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

        // Check Judge Scores
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

  // Handlers
  const handleCoverSelect = (file) => {
    setFormData(prev => ({ ...prev, cover_preview: URL.createObjectURL(file), cover_file: file }));
  };

  const handleGalleryUpdate = (key, value) => {
    setFormData(prev => ({ ...prev, gallery_files: value }));
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
        let coverUrl = formData.cover_preview; // Default to existing

        // 1. Upload New Cover if changed
        if (formData.cover_file) {
            const fileExt = formData.cover_file.name.split('.').pop();
            const fileName = `contests/${contest.creator_id}/cover-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, formData.cover_file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('project-assets').getPublicUrl(fileName);
            coverUrl = data.publicUrl;
        }

        // 2. Update DB
        const { error } = await supabase
            .from('contests')
            .update({
                title: formData.title,
                description: formData.description,
                start_date: formData.start_date,
                submission_deadline: formData.submission_deadline,
                winner_announce_date: formData.winner_announce_date,
                prizes: formData.prizes,
                metrics_config: formData.metrics,
                cover_image: coverUrl,
                sponsors: formData.gallery_files // Saving assets here
            })
            .eq('id', contest.id);

        if (error) throw error;
        toast.success("Settings Updated");
        router.refresh();

    } catch (error) {
        console.error(error);
        toast.error("Update Failed");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (constraints.hasSubmissions) return; // Should be disabled anyway
    if (!confirm("Are you sure? This is irreversible.")) return;
    
    const { error } = await supabase.from('contests').delete().eq('id', contest.id);
    if (!error) {
        toast.success("Contest Deleted");
        router.push("/contests");
    }
  };

  if (loading) return <div className="p-12 text-center text-xs font-mono text-muted-foreground animate-pulse">Checking constraints...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-4xl pb-20">
        
        {/* SECTION 1: IDENTITY (Always Editable) */}
        <div className="border border-border bg-background p-6 space-y-6">
            <div className="flex items-center gap-2 text-accent border-b border-border pb-2">
                <LayoutTemplate size={16} />
                <h3 className="font-bold text-sm uppercase tracking-widest">General Configuration</h3>
            </div>
            
            <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-muted-foreground">Contest Title</label>
                <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="rounded-none bg-background border-border font-bold"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DateTimePicker label="Start Date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                <DateTimePicker label="Deadline" value={formData.submission_deadline} onChange={(e) => setFormData({...formData, submission_deadline: e.target.value})} />
                <DateTimePicker label="Winner Reveal" value={formData.winner_announce_date} onChange={(e) => setFormData({...formData, winner_announce_date: e.target.value})} />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-muted-foreground">Description & Rules</label>
                <div className="min-h-[200px] border border-border">
                    {/* Assuming RichTextEditor can handle the value format passed */}
                    <RichTextEditor 
                        value={formData.description} 
                        onChange={(val) => setFormData({...formData, description: val})} 
                    />
                </div>
            </div>
        </div>

        {/* SECTION 2: VISUALS (Always Editable) */}
        <div className="border border-border bg-background p-6 space-y-6">
            <div className="flex items-center gap-2 text-accent border-b border-border pb-2">
                <ImageIcon size={16} />
                <h3 className="font-bold text-sm uppercase tracking-widest">Visual Assets</h3>
            </div>
            
            <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-muted-foreground">Cover Art</label>
                <CoverImageUpload 
                    preview={formData.cover_preview} 
                    onFileSelect={handleCoverSelect}
                    onRemove={() => setFormData({...formData, cover_preview: null, cover_file: null})}
                />
            </div>

            <div className="space-y-1.5 pt-4">
                <label className="text-[10px] font-mono uppercase text-muted-foreground mb-2 block">
                    Additional Gallery (Max 3)
                </label>
                <StepMedia 
                    data={{ files: formData.gallery_files, demo_link: null }}
                    updateData={handleGalleryUpdate}
                />
            </div>
        </div>

        {/* SECTION 3: PRIZES (Locked if Submissions > 0) */}
        <div className={`border border-border bg-background p-6 space-y-6 relative transition-opacity ${constraints.hasSubmissions ? 'opacity-70 pointer-events-none' : ''}`}>
            {constraints.hasSubmissions && (
                <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-background border border-yellow-500/50 text-yellow-500 px-4 py-2 flex items-center gap-2 text-xs font-mono uppercase shadow-xl">
                        <Lock size={14} /> Prizes Locked ({constraints.submissionCount} Entries Active)
                    </div>
                </div>
            )}
            
            <PrizeManager 
                prizes={formData.prizes} 
                onChange={(p) => setFormData({...formData, prizes: p})} 
            />
        </div>

        {/* SECTION 4: METRICS (Locked if Judging Started) */}
        <div className={`border border-border bg-background p-6 space-y-6 relative transition-opacity ${constraints.hasJudging ? 'opacity-70 pointer-events-none' : ''}`}>
            {constraints.hasJudging && (
                <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-background border border-yellow-500/50 text-yellow-500 px-4 py-2 flex items-center gap-2 text-xs font-mono uppercase shadow-xl">
                        <Lock size={14} /> Metrics Locked (Judging In Progress)
                    </div>
                </div>
            )}

            <MetricsManager 
                metrics={formData.metrics} 
                onChange={(m) => setFormData({...formData, metrics: m})} 
            />
        </div>

        {/* ACTION BAR */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border p-4 flex justify-end gap-4 z-40">
            <Button onClick={handleUpdate} disabled={isSaving} className="h-10 px-8 rounded-none bg-accent hover:bg-accent/90 text-white uppercase font-mono text-xs shadow-lg">
                {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
        </div>

        {/* DANGER ZONE (Disabled if Submissions > 0) */}
        <div className={`border border-red-900/30 bg-red-900/5 p-6 mt-12 ${constraints.hasSubmissions ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertTriangle size={16} />
                <h3 className="font-bold text-xs uppercase tracking-widest">Danger Zone</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
                Deleting this contest is irreversible. 
                {constraints.hasSubmissions && <span className="block mt-1 font-bold text-red-400">Cannot delete while active submissions exist.</span>}
            </p>
            <Button 
                onClick={handleDelete} 
                disabled={constraints.hasSubmissions}
                variant="destructive" 
                className="h-9 rounded-none text-xs font-mono uppercase"
            >
                <Trash2 size={14} className="mr-2" /> Delete Contest
            </Button>
        </div>

    </div>
  );
}