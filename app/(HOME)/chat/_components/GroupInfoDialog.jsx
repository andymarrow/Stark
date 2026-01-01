"use client";
import { useState, useEffect } from "react";
import { Users, UserPlus, X, Shield, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function GroupInfoDialog({ isOpen, onClose, conversation }) {
  const [members, setMembers] = useState([]);
  const [inviteUser, setInviteUser] = useState("");

  useEffect(() => {
    if (isOpen) fetchMembers();
  }, [isOpen]);

  const fetchMembers = async () => {
    const { data } = await supabase
        .from('conversation_participants')
        .select('role, profile:profiles(username, avatar_url)')
        .eq('conversation_id', conversation.id);
    setMembers(data || []);
  };

  const handleAddMember = async () => {
    // 1. Find user ID from username
    const { data: userToAdd } = await supabase
        .from('profiles')
        .select('id, settings')
        .eq('username', inviteUser)
        .single();

    if (!userToAdd) {
        toast.error("User node not found");
        return;
    }

    // 2. Check Privacy Setting
    const autoAdd = userToAdd.settings?.auto_add ?? true;

    if (autoAdd) {
        await supabase.from('conversation_participants').insert({
            conversation_id: conversation.id,
            user_id: userToAdd.id,
            status: 'active'
        });
        toast.success("User added to node");
        fetchMembers();
    } else {
        // Send Invite Link (Simulation)
        // In real app, insert into 'notifications' table
        await supabase.from('notifications').insert({
            receiver_id: userToAdd.id,
            sender_id: (await supabase.auth.getUser()).data.user.id,
            type: 'system',
            message: `Invited you to join group: ${conversation.title}`,
            link: `/chat?id=${conversation.id}` // They would see a "Join" button there
        });
        toast.info("Invite Signal Transmitted");
    }
    setInviteUser("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border border-border p-0 rounded-none sm:max-w-[400px]">
        <DialogHeader className="p-4 border-b border-border bg-secondary/5">
            <DialogTitle className="font-mono uppercase text-sm font-bold flex items-center gap-2">
                <Users size={16} /> Node_Manifest
            </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-6">
            
            {/* Add Member */}
            <div className="flex gap-2">
                <input 
                    className="flex-1 bg-secondary/10 border border-border px-3 py-2 text-xs font-mono focus:outline-none focus:border-accent"
                    placeholder="Enter username..."
                    value={inviteUser}
                    onChange={(e) => setInviteUser(e.target.value)}
                />
                <Button onClick={handleAddMember} className="rounded-none bg-accent h-auto text-xs uppercase">
                    <UserPlus size={14} />
                </Button>
            </div>

            {/* Member List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-secondary/10">
                        <div className="flex items-center gap-3">
                            <img src={m.profile?.avatar_url} className="w-6 h-6 rounded-full bg-zinc-800" />
                            <span className="text-sm font-bold">{m.profile?.username}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase border border-border px-1">
                            {m.role}
                        </span>
                    </div>
                ))}
            </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}