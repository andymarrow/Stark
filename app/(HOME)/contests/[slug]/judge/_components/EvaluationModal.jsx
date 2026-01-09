"use client";
import { useState, useEffect } from "react";
import { X, ExternalLink, Info, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";

export default function EvaluationModal({ isOpen, onClose, entry, metrics, onSave, isSaving }) {
  // Local state for scores: { "Metric Name": score }
  const [scores, setScores] = useState({});

  // Reset scores when entry changes
  useEffect(() => {
    if (entry) {
        setScores(entry.existingScores || {});
    }
  }, [entry]);

  const updateScore = (name, value) => {
    setScores(prev => ({ ...prev, [name]: value[0] }));
  };

  const handleSubmit = () => {
    onSave(entry.project.id, scores);
  };

  if (!entry) return null;

  // 🛡️ CRITICAL FILTER: Only show metrics that require manual judging
  const manualMetrics = metrics.filter(m => m.type === 'manual');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-black border-white/10 p-0 rounded-none gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-white/5 bg-zinc-900/30">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight mb-1">Evaluating Entry</DialogTitle>
              <p className="text-xs font-mono text-accent uppercase">{entry.project.title}</p>
            </div>
            <a 
                href={`/project/${entry.project.slug}`} 
                target="_blank" 
                className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border text-[10px] font-mono uppercase text-muted-foreground hover:text-white transition-colors"
            >
                Inspect Project <ExternalLink size={12} />
            </a>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {manualMetrics.length > 0 ? (
                manualMetrics.map((m, i) => (
                    <div key={i} className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                    {m.name} 
                                    <span className="text-[10px] font-mono text-zinc-500 font-normal">({m.weight}%)</span>
                                </h4>
                            </div>
                            <div className="text-2xl font-mono font-black text-accent">
                                {scores[m.name] || 0}<span className="text-[10px] text-zinc-600">/10</span>
                            </div>
                        </div>
                        
                        <Slider 
                            value={[scores[m.name] || 0]} 
                            max={10} 
                            step={1} 
                            onValueChange={(val) => updateScore(m.name, val)}
                            className="py-4"
                        />
                    </div>
                ))
            ) : (
                <div className="py-10 text-center text-zinc-500 font-mono text-xs uppercase">
                    No manual metrics configured for this contest.
                </div>
            )}
        </div>

        <div className="p-6 border-t border-white/5 bg-zinc-900/30 flex justify-end">
            <Button 
                onClick={handleSubmit}
                disabled={isSaving || manualMetrics.length === 0}
                className="h-12 px-10 bg-white text-black hover:bg-accent hover:text-white rounded-none font-mono font-bold uppercase tracking-widest transition-all"
            >
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Commit Scores</>}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}