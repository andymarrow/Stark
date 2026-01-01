"use client";
import { useState } from "react";
import { 
  Users, Radio, Hash, Lock, Globe 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateCommunityDialog({ isOpen, onClose }) {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("group"); // 'group' | 'channel'
  const [isPublic, setIsPublic] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      // 1. Create Conversation
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({
          type: mode, // 'group' or 'channel'
          title: title,
          description: desc,
          owner_id: user.id,
          is_public: isPublic,
          last_message: "System initialized.",
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Add Self as Owner
      await supabase.from('conversation_participants').insert({
        conversation_id: conv.id,
        user_id: user.id,
        role: 'owner',
        status: 'active'
      });

      toast.success(`${mode === 'group' ? 'Group' : 'Channel'} Initialized`);
      onClose();
      router.push(`/chat?id=${conv.id}`); // Navigate to new chat

    } catch (error) {
      toast.error("Creation Failed", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-background border border-border p-0 gap-0 rounded-none">
        
        <DialogHeader className="p-6 border-b border-border bg-secondary/5">
          <DialogTitle className="text-lg font-mono font-bold uppercase tracking-widest">
            Initialize_Node
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setMode("group")}
              className={`p-4 border transition-all flex flex-col items-center gap-2
                ${mode === 'group' ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-foreground/50 text-muted-foreground"}
              `}
            >
              <Users size={24} />
              <span className="text-xs font-bold uppercase">Group Chat</span>
            </button>
            <button 
              onClick={() => setMode("channel")}
              className={`p-4 border transition-all flex flex-col items-center gap-2
                ${mode === 'channel' ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-foreground/50 text-muted-foreground"}
              `}
            >
              <Radio size={24} />
              <span className="text-xs font-bold uppercase">Broadcast Channel</span>
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-muted-foreground">Title</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={mode === 'group' ? "Team Alpha" : "Announcements"}
                className="rounded-none bg-secondary/10 border-border focus-visible:ring-accent"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-muted-foreground">Topic / Description</label>
              <Textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="rounded-none bg-secondary/10 border-border focus-visible:ring-accent min-h-[80px]"
              />
            </div>

            {/* Visibility Toggle */}
            <div 
                onClick={() => setIsPublic(!isPublic)}
                className="flex items-center justify-between p-3 border border-border cursor-pointer hover:bg-secondary/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isPublic ? <Globe size={18} className="text-green-500" /> : <Lock size={18} className="text-yellow-500" />}
                    <div>
                        <p className="text-sm font-bold text-foreground">
                            {isPublic ? "Public Frequency" : "Private Encrypted"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {isPublic ? "Searchable by anyone." : "Invite-only access."}
                        </p>
                    </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${isPublic ? "bg-green-500" : "bg-yellow-500"}`} />
            </div>
          </div>

        </div>

        <DialogFooter className="p-4 border-t border-border bg-secondary/5">
            <Button variant="ghost" onClick={onClose} className="rounded-none text-xs font-mono uppercase">Cancel</Button>
            <Button 
                onClick={handleCreate} 
                disabled={loading || !title}
                className="bg-accent hover:bg-accent/90 text-white rounded-none text-xs font-mono uppercase tracking-widest"
            >
                {loading ? "Deploying..." : "Create Node"}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}