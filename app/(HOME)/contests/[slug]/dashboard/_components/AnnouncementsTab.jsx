"use client";
import { useState } from "react";
import { Megaphone, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this or use standard textarea
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function AnnouncementsTab({ contest }) {
  const [updates, setUpdates] = useState(contest.announcements || []);
  const [newUpdate, setNewUpdate] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!newUpdate.trim()) return;
    setIsPosting(true);

    const updateObj = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content: newUpdate
    };

    const newUpdatesList = [updateObj, ...updates]; // Prepend

    try {
        const { error } = await supabase
            .from('contests')
            .update({ announcements: newUpdatesList })
            .eq('id', contest.id);

        if (error) throw error;

        setUpdates(newUpdatesList);
        setNewUpdate("");
        toast.success("Announcement Posted");
        // TODO: Trigger Notification to participants (Future)

    } catch (error) {
        toast.error("Failed to post");
    } finally {
        setIsPosting(false);
    }
  };

  const handleDelete = async (id) => {
    const newUpdatesList = updates.filter(u => u.id !== id);
    const { error } = await supabase.from('contests').update({ announcements: newUpdatesList }).eq('id', contest.id);
    if (!error) {
        setUpdates(newUpdatesList);
        toast.success("Deleted");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
        
        {/* COMPOSER */}
        <div className="border border-border bg-background p-4 space-y-3">
            <label className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
                <Megaphone size={14} /> Broadcast Update
            </label>
            <textarea 
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                placeholder="Write an update for all participants..."
                className="w-full min-h-[100px] bg-secondary/5 border border-border p-3 text-sm focus:border-accent outline-none resize-y"
            />
            <div className="flex justify-end">
                <Button 
                    onClick={handlePost} 
                    disabled={isPosting || !newUpdate}
                    className="h-9 rounded-none bg-accent hover:bg-accent/90 text-white uppercase font-mono text-xs"
                >
                    {isPosting ? "Posting..." : <><Send size={12} className="mr-2" /> Publish</>}
                </Button>
            </div>
        </div>

        {/* FEED */}
        <div className="space-y-4">
            {updates.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8">No announcements yet.</div>
            ) : (
                updates.map((update) => (
                    <div key={update.id} className="flex gap-4 p-4 border-l-2 border-accent bg-secondary/5 relative group">
                        <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                            <span className="text-[10px] font-mono text-muted-foreground mt-2 block">
                                {new Date(update.date).toLocaleString()}
                            </span>
                        </div>
                        <button 
                            onClick={() => handleDelete(update.id)}
                            className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))
            )}
        </div>

    </div>
  );
}