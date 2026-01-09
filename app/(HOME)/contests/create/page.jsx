"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Trophy, Calendar, LayoutTemplate, Sliders, 
  Loader2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/app/_context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

// Import Refactored Components
import PrizeManager from "./_components/PrizeManager";
import MetricsManager from "./_components/MetricsManager";
import CoverImageUpload from "./_components/CoverImageUpload";
import StepMedia from "@/app/(HOME)/create/_components/StepMedia";
import RichTextEditor from "@/app/(HOME)/create/_components/RichTextEditor";

// --- NEW COMPONENT: BETTER DATE PICKER ---
// Forces the picker to open on click and shows styling
const DateTimePicker = ({ label, value, onChange }) => {
  const inputRef = useRef(null);

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono uppercase text-muted-foreground">{label}</label>
      <div 
        className="relative group cursor-pointer"
        onClick={() => inputRef.current?.showPicker()} // Force open picker on container click
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-accent transition-colors pointer-events-none">
          <Calendar size={14} />
        </div>
        <Input 
          ref={inputRef}
          type="datetime-local" 
          value={value}
          onChange={onChange}
          className="pl-9 rounded-none bg-background border-border text-xs cursor-pointer font-mono h-10" 
        />
        {/* Visual Indicator if empty */}
        {!value && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Clock size={12} className="text-red-500 animate-pulse" />
            </div>
        )}
      </div>
    </div>
  );
};

export default function CreateContestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    cover_preview: null, 
    cover_file: null,    
    gallery_files: [], 
    description: "", 
    start_date: "",
    submission_deadline: "",
    winner_announce_date: "",
    max_participants: "", 
    team_allowed: true,
    prizes: [
        { rank: 1, title: "Grand Winner", rewards: ["$1000 Cash"] },
        { rank: 2, title: "Runner Up", rewards: ["$500 Cash"] }
    ],
    metrics: [
        { type: "manual", name: "Design & UX", weight: 40 },
        { type: "manual", name: "Functionality", weight: 30 },
        { type: "likes", name: "Community Likes", weight: 30 }
    ]
  });

  const handleCoverSelect = (file) => {
    const url = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, cover_preview: url, cover_file: file }));
  };

  const handleCoverRemove = () => {
    setFormData(prev => ({ ...prev, cover_preview: null, cover_file: null }));
  };

  // StepMedia Handler
  const handleGalleryUpdate = (key, value) => {
    if (value.length > 3) {
        toast.error("Limit Reached", { description: "Maximum 3 gallery assets allowed." });
        return;
    }
    setFormData(prev => ({ ...prev, gallery_files: value }));
  };

  const handleCreate = async () => {
    if (!user) return;
    
    // 1. Math Validation
    const totalWeight = formData.metrics.reduce((sum, m) => sum + (parseInt(m.weight) || 0), 0);
    if (totalWeight !== 100) {
        toast.error("Math Error", { description: "Scoring metrics must equal exactly 100%." });
        return;
    }

    // 2. Field Validation
    if (!formData.title) {
        toast.error("Missing Data", { description: "Contest Title is required." });
        return;
    }
    
    // Strict Date Validation
    if (!formData.start_date) {
        toast.error("Missing Data", { description: "Start Date/Time is incomplete." });
        return;
    }
    if (!formData.submission_deadline) {
        toast.error("Missing Data", { description: "Submission Deadline is incomplete." });
        return;
    }
    if (!formData.winner_announce_date) {
        toast.error("Missing Data", { description: "Winner Reveal Date is incomplete." });
        return;
    }

    // 3. Logic Validation (Dates must make sense)
    if (new Date(formData.submission_deadline) <= new Date(formData.start_date)) {
        toast.error("Logic Error", { description: "Deadline must be after Start Date." });
        return;
    }
    if (new Date(formData.winner_announce_date) <= new Date(formData.submission_deadline)) {
        toast.error("Logic Error", { description: "Reveal must be after Deadline." });
        return;
    }

    setIsSubmitting(true);
    try {
        const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
        
        // Upload Cover
        let coverUrl = null;
        if (formData.cover_file) {
            const fileExt = formData.cover_file.name.split('.').pop();
            const fileName = `contests/${user.id}/cover-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, formData.cover_file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('project-assets').getPublicUrl(fileName);
            coverUrl = data.publicUrl;
        }

        // Insert Contest
        const { error } = await supabase.from('contests').insert({
            creator_id: user.id,
            title: formData.title,
            slug: slug,
            cover_image: coverUrl,
            sponsors: formData.gallery_files, 
            description: { type: "markdown", text: formData.description },
            start_date: new Date(formData.start_date),
            submission_deadline: new Date(formData.submission_deadline),
            winner_announce_date: new Date(formData.winner_announce_date),
            max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
            team_allowed: formData.team_allowed,
            prizes: formData.prizes,
            metrics_config: formData.metrics,
            status: 'draft'
        });

        if (error) throw error;

        toast.success("Contest Initialized");
        router.push(`/contests/${slug}/dashboard`); 

    } catch (error) {
        console.error(error);
        toast.error("Creation Failed", { description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const totalWeight = formData.metrics.reduce((sum, m) => sum + (parseInt(m.weight) || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-wrap space-y-6 items-center justify-between mb-8 border-b border-border pb-6">
            <div>
                <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
                    <Trophy size={28} className="text-accent" />
                    Host a Contest
                </h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                    Design challenges, hackathons, and sprints.
                </p>
            </div>
            
                <Button 
                    onClick={handleCreate}
                    disabled={isSubmitting || totalWeight !== 100}
                    className="h-10 px-8 bg-accent  hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Initialize Event"}
                </Button>
            
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: Main Config */}
            <div className="lg:col-span-7 space-y-8">
                
                {/* Identity */}
                <section className="space-y-6 bg-secondary/5 border border-border p-6">
                    <div className="flex items-center gap-2 text-accent mb-2">
                        <LayoutTemplate size={18} />
                        <h3 className="font-bold uppercase text-sm tracking-widest">Event Identity</h3>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Contest Title</label>
                        <Input 
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="h-12 text-lg font-bold rounded-none bg-background border-border" 
                            placeholder="e.g. Summer UI Design Sprint 2025" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Cover Art (1920x1080)</label>
                        <CoverImageUpload 
                            preview={formData.cover_preview} 
                            onFileSelect={handleCoverSelect}
                            onRemove={handleCoverRemove}
                        />
                    </div>
                    <div className="space-y-1.5 pt-4 border-t border-dashed border-border">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground mb-2 block">
                            Additional Gallery / Trailer (Max 3)
                        </label>
                        <StepMedia 
                            data={{ files: formData.gallery_files, demo_link: null }}
                            updateData={handleGalleryUpdate}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Description & Rules</label>
                        <div className="min-h-[250px] border border-border">
                            <RichTextEditor 
                                value={formData.description} 
                                onChange={(val) => setFormData({...formData, description: val})} 
                            />
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section className="space-y-4 bg-secondary/5 border border-border p-6">
                    <div className="flex items-center gap-2 text-accent mb-2">
                        <Calendar size={18} />
                        <h3 className="font-bold uppercase text-sm tracking-widest">Timeline Sequence</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <DateTimePicker 
                            label="Start Date" 
                            value={formData.start_date}
                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        />
                        <DateTimePicker 
                            label="Submission Deadline" 
                            value={formData.submission_deadline}
                            onChange={(e) => setFormData({...formData, submission_deadline: e.target.value})}
                        />
                        <DateTimePicker 
                            label="Winner Reveal" 
                            value={formData.winner_announce_date}
                            onChange={(e) => setFormData({...formData, winner_announce_date: e.target.value})}
                        />
                    </div>
                </section>

            </div>

            {/* RIGHT: Settings & Logic */}
            <div className="lg:col-span-5 space-y-6">
                <section className="bg-background border border-border p-5 space-y-6 sticky top-8">
                    <div className="flex items-center gap-2 text-accent border-b border-border pb-2">
                        <Sliders size={16} />
                        <h3 className="font-bold uppercase text-xs tracking-widest">Configuration</h3>
                    </div>

                    <PrizeManager 
                        prizes={formData.prizes} 
                        onChange={(p) => setFormData({...formData, prizes: p})} 
                    />

                    <div className="h-px bg-border border-t border-dashed" />

                    <MetricsManager 
                        metrics={formData.metrics} 
                        onChange={(m) => setFormData({...formData, metrics: m})} 
                    />

                    <div className="h-px bg-border border-t border-dashed" />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono uppercase text-muted-foreground">Allow Teams?</label>
                            <Switch 
                                checked={formData.team_allowed} 
                                onCheckedChange={(c) => setFormData({...formData, team_allowed: c})} 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase text-muted-foreground">Participant Limit</label>
                            <Input 
                                type="number" 
                                placeholder="Leave empty for infinite" 
                                value={formData.max_participants}
                                onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                                className="h-8 rounded-none bg-background border-border text-xs"
                            />
                        </div>
                    </div>

                </section>

            </div>

        </div>
      </div>
    </div>
  );
}