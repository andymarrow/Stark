"use client";
import { useState, useRef } from "react";
import { 
  Users, Radio, Lock, Globe, Link as LinkIcon, Camera, Loader2, X 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CreateCommunityDialog({ isOpen, onClose }) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form State
  const [mode, setMode] = useState("group"); 
  const [isPublic, setIsPublic] = useState(false);
  const [linkGroup, setLinkGroup] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [avatar, setAvatar] = useState(""); // Image URL
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // --- IMAGE UPLOAD HANDLER ---
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large (Max 2MB)");
        return;
    }

    setUploading(true);
    try {
        // We use a temp ID or timestamp since we don't have a conv ID yet
        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/temp-${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        setAvatar(data.publicUrl);
        toast.success("Image Uploaded");
    } catch (error) {
        console.error(error);
        toast.error("Upload Failed");
    } finally {
        setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      let linkedGroupId = null;

      // 1. If Channel + Link Group: Create the Group first
      if (mode === 'channel' && linkGroup) {
        const { data: groupData, error: groupError } = await supabase
            .from('conversations')
            .insert({
                type: 'group',
                title: `${title} (Discussion)`,
                description: `Official discussion group for ${title} channel.`,
                owner_id: user.id,
                is_public: isPublic,
                avatar_url: avatar, // Inherit avatar
                last_message: "Group initialized.",
            })
            .select()
            .single();
        
        if (groupError) throw groupError;
        linkedGroupId = groupData.id;

        // Add owner to group
        await supabase.from('conversation_participants').insert({
            conversation_id: linkedGroupId,
            user_id: user.id,
            role: 'owner',
            status: 'active'
        });
      }

      // 2. Create the Main Conversation
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({
          type: mode,
          title: title,
          description: desc,
          owner_id: user.id,
          is_public: isPublic,
          linked_group_id: linkedGroupId,
          avatar_url: avatar, // Save the image URL
          last_message: "System initialized.",
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Add Self as Owner to Main
      await supabase.from('conversation_participants').insert({
        conversation_id: conv.id,
        user_id: user.id,
        role: 'owner',
        status: 'active'
      });

      toast.success(`${mode === 'group' ? 'Group' : 'Channel'} Initialized`);
      onClose();
      router.push(`/chat?id=${conv.id}`); 
      
      // Reset Form
      setTitle("");
      setDesc("");
      setAvatar("");

    } catch (error) {
      toast.error("Creation Failed", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-background border border-border p-0 gap-0 rounded-none overflow-hidden">
        
        <DialogHeader className="p-6 border-b border-border bg-secondary/5">
          <DialogTitle className="text-lg font-mono font-bold uppercase tracking-widest flex items-center gap-2">
             {mode === 'group' ? <Users size={18} /> : <Radio size={18} />} Initialize_Node
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          
          {/* Top Section: Avatar & Type */}
          <div className="flex gap-6">
            
            {/* Avatar Upload */}
            <div 
                className="relative w-24 h-24 shrink-0 bg-secondary border-2 border-dashed border-border flex items-center justify-center cursor-pointer group hover:border-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                />
                
                {uploading ? (
                    <Loader2 className="animate-spin text-accent" />
                ) : avatar ? (
                    <>
                        <Image src={avatar} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera size={20} className="text-white" />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-muted-foreground group-hover:text-accent">
                        <Camera size={24} />
                        <span className="text-[9px] font-mono mt-1 uppercase">Upload</span>
                    </div>
                )}
            </div>

            {/* Type Selector (Compact) */}
            <div className="flex-1 flex flex-col gap-2">
                <button 
                  onClick={() => setMode("group")}
                  className={`flex-1 flex items-center gap-3 px-4 border transition-all
                    ${mode === 'group' ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-foreground/50 text-muted-foreground"}
                  `}
                >
                  <Users size={16} />
                  <span className="text-xs font-bold uppercase">Group Chat</span>
                </button>
                <button 
                  onClick={() => setMode("channel")}
                  className={`flex-1 flex items-center gap-3 px-4 border transition-all
                    ${mode === 'channel' ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-foreground/50 text-muted-foreground"}
                  `}
                >
                  <Radio size={16} />
                  <span className="text-xs font-bold uppercase">Channel</span>
                </button>
            </div>
          </div>

          {/* Form Fields */}
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
              <label className="text-xs font-mono uppercase text-muted-foreground">Description</label>
              <Textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="rounded-none bg-secondary/10 border-border focus-visible:ring-accent min-h-[80px]"
                placeholder="What is this node for?"
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
                            {isPublic ? "Searchable by global directory." : "Invite-only access."}
                        </p>
                    </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${isPublic ? "bg-green-500" : "bg-yellow-500"}`} />
            </div>

            {/* Link Group Toggle (Only for Channels) */}
            {mode === 'channel' && (
                <div className="flex items-center justify-between p-3 border border-border bg-secondary/5">
                    <div className="flex items-center gap-3">
                        <LinkIcon size={18} className="text-accent" />
                        <div>
                            <p className="text-sm font-bold text-foreground">Link Discussion Group</p>
                            <p className="text-[10px] text-muted-foreground">
                                Auto-forward posts to a linked chat group.
                            </p>
                        </div>
                    </div>
                    <Switch checked={linkGroup} onCheckedChange={setLinkGroup} className="data-[state=checked]:bg-accent" />
                </div>
            )}

          </div>

        </div>

        <DialogFooter className="p-4 border-t border-border bg-secondary/5">
            <Button variant="ghost" onClick={onClose} className="rounded-none text-xs font-mono uppercase">Cancel</Button>
            <Button 
                onClick={handleCreate} 
                disabled={loading || !title || uploading}
                className="bg-accent hover:bg-accent/90 text-white rounded-none text-xs font-mono uppercase tracking-widest"
            >
                {loading ? "Deploying..." : "Create Node"}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}