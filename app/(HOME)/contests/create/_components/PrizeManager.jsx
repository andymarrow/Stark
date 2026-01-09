"use client";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PrizeManager({ prizes, onChange }) {
  const addPrize = () => {
    onChange([...prizes, { rank: prizes.length + 1, title: "", rewards: [""] }]);
  };

  const updatePrizeTitle = (index, val) => {
    const newPrizes = [...prizes];
    newPrizes[index].title = val;
    onChange(newPrizes);
  };

  const addRewardLine = (index) => {
    const newPrizes = [...prizes];
    newPrizes[index].rewards.push("");
    onChange(newPrizes);
  };

  const updateRewardLine = (prizeIndex, rewardIndex, val) => {
    const newPrizes = [...prizes];
    newPrizes[prizeIndex].rewards[rewardIndex] = val;
    onChange(newPrizes);
  };

  const removeRewardLine = (prizeIndex, rewardIndex) => {
    const newPrizes = [...prizes];
    newPrizes[prizeIndex].rewards = newPrizes[prizeIndex].rewards.filter((_, i) => i !== rewardIndex);
    onChange(newPrizes);
  };

  const removePrize = (index) => {
    onChange(prizes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-mono uppercase text-muted-foreground">Prize Pool</label>
        <Button onClick={addPrize} size="sm" variant="outline" className="h-6 text-[10px] uppercase rounded-none border-dashed border-zinc-700">
          <Plus size={12} className="mr-1" /> Add Rank
        </Button>
      </div>
      <div className="space-y-4">
        {prizes.map((prize, i) => (
          <div key={i} className="flex gap-3 items-start p-3 border border-border bg-secondary/5 relative group">
            <div className="w-8 h-8 flex items-center justify-center bg-accent text-white font-bold text-sm flex-shrink-0">
              #{prize.rank}
            </div>
            <div className="flex-1 space-y-3">
                <Input 
                    placeholder="Rank Title (e.g. Grand Winner)" 
                    value={prize.title}
                    onChange={(e) => updatePrizeTitle(i, e.target.value)}
                    className="h-8 rounded-none bg-background border-border text-xs font-bold"
                />
                <div className="space-y-2">
                    {prize.rewards.map((reward, rIdx) => (
                        <div key={rIdx} className="flex gap-2">
                            <Input 
                                placeholder={rIdx === 0 ? "Main Reward" : "Additional Perk"}
                                value={reward}
                                onChange={(e) => updateRewardLine(i, rIdx, e.target.value)}
                                className="h-8 rounded-none bg-background border-border text-xs flex-1"
                            />
                            {prize.rewards.length > 1 && (
                                <button onClick={() => removeRewardLine(i, rIdx)} className="text-zinc-600 hover:text-red-500">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        onClick={() => addRewardLine(i)}
                        className="text-[9px] font-mono text-accent uppercase hover:underline flex items-center gap-1"
                    >
                        <Plus size={10} /> Add Reward Item
                    </button>
                </div>
            </div>
            <button 
                onClick={() => removePrize(i)} 
                className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}