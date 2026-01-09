"use client";
import { Plus, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MetricsManager({ metrics, onChange }) {
  const addMetric = () => {
    onChange([...metrics, { type: "manual", name: "", weight: 10 }]);
  };

  const updateMetric = (index, field, value) => {
    const newMetrics = [...metrics];
    newMetrics[index][field] = value;
    if (field === 'type') {
        if (value === 'likes') newMetrics[index].name = 'Community Likes';
        if (value === 'views') newMetrics[index].name = 'Total Views';
        if (value === 'manual') newMetrics[index].name = '';
    }
    onChange(newMetrics);
  };

  const removeMetric = (index) => {
    onChange(metrics.filter((_, i) => i !== index));
  };

  const totalWeight = metrics.reduce((sum, m) => sum + (parseInt(m.weight) || 0), 0);
  const isValid = totalWeight === 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-mono uppercase text-muted-foreground">Evaluation Logic</label>
        <div className={`flex items-center gap-2 text-[10px] font-mono font-bold ${isValid ? 'text-green-500' : 'text-red-500'}`}>
            {isValid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            Total: {totalWeight}%
        </div>
      </div>
      <div className="space-y-2">
        {metrics.map((metric, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="w-24 flex-shrink-0">
                <Select 
                    value={metric.type} 
                    onValueChange={(val) => updateMetric(i, 'type', val)}
                >
                    <SelectTrigger className="h-9 rounded-none bg-secondary/10 border-border text-[10px] uppercase">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="manual">Judge</SelectItem>
                        <SelectItem value="likes">Likes</SelectItem>
                        <SelectItem value="views">Views</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Input 
                placeholder="Criteria Name" 
                value={metric.name}
                onChange={(e) => updateMetric(i, 'name', e.target.value)}
                disabled={metric.type !== 'manual'}
                className="flex-1 h-9 rounded-none bg-background border-border text-xs disabled:opacity-50"
            />
            <div className="relative w-20">
                <Input 
                    type="number"
                    value={metric.weight}
                    onChange={(e) => updateMetric(i, 'weight', parseInt(e.target.value) || 0)}
                    className={`h-9 rounded-none bg-background text-xs pr-5 text-right ${totalWeight > 100 ? 'border-red-500 text-red-500' : 'border-border'}`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
            </div>
            <button onClick={() => removeMetric(i)} className="p-2 text-zinc-600 hover:text-red-500">
                <X size={14} />
            </button>
          </div>
        ))}
        <Button onClick={addMetric} variant="ghost" className="w-full h-8 text-[10px] border border-dashed border-border uppercase hover:bg-secondary/10">
            + Add Criteria
        </Button>
      </div>
    </div>
  );
}