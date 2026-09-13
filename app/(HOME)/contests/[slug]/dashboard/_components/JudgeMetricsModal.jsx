"use client";
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import MetricsManager from "@/app/(HOME)/contests/create/_components/MetricsManager";

// Judges from different backgrounds don't all want the same rubric — a
// design-focused judge might want UI/UX to carry real weight, while an
// engineering judge doesn't want to score something outside their lane.
// This lets a host give one judge their own weighted metrics, independent
// of the contest's shared default. Reuses the exact same MetricsManager
// (name/type/weight, must total 100%) used at contest creation.
export default function JudgeMetricsModal({ judge, contestId, defaultMetrics, isOpen, onClose, onSaved }) {
  const [metrics, setMetrics] = useState(judge.metrics_config || defaultMetrics || []);
  const [isSaving, setIsSaving] = useState(false);

  const totalWeight = metrics.reduce((sum, m) => sum + (parseInt(m.weight) || 0), 0);

  const handleSave = async () => {
    if (totalWeight !== 100) {
      toast.error("Math Error", { description: "This judge's metrics must total exactly 100%." });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("contest_judges").update({ metrics_config: metrics }).eq("id", judge.id);
      if (error) throw error;
      toast.success("Judge Rubric Updated", { description: `${judge.profile?.full_name || judge.email} now scores on their own criteria.` });
      onSaved({ ...judge, metrics_config: metrics });
      onClose();
    } catch (error) {
      toast.error("Save Failed", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => setMetrics(defaultMetrics || []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-background border-border rounded-none">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight text-base font-black">
            Rubric — {judge.profile?.full_name || judge.email}
          </DialogTitle>
          <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
            Overrides the contest default for this judge only.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <MetricsManager metrics={metrics} onChange={setMetrics} />

          <div className="flex gap-2 pt-2">
            <Button
              onClick={resetToDefault}
              variant="outline"
              className="h-10 rounded-none border-border text-[10px] uppercase font-mono flex-shrink-0"
            >
              <RotateCcw size={12} className="mr-2" /> Use Contest Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || totalWeight !== 100}
              className="h-10 flex-1 bg-accent hover:bg-accent/90 text-white uppercase font-mono text-xs tracking-widest disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : "Save Rubric"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
