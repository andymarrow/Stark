"use client";
import { useState, useEffect } from "react";
import { 
  X, Shield, Lock, Eye, EyeOff, UserX, Unlock, Loader2 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Image from "next/image";

export default function ChatSettingsDialog({ isOpen, onClose, user }) {
  const [activeTab, setActiveTab] = useState("privacy");
  const [settings, setSettings] = useState({
    global_search: true,
    auto_add: true
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile Settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single();
      
      if (profile?.settings) {
        setSettings(profile.settings);
      }

      // 2. Fetch Blocked Users
      const { data: blocked } = await supabase
        .from('blocked_users')
        .select(`
          blocked_id,
          profile:profiles!blocked_users_blocked_id_fkey(id, username, avatar_url)
        `)
        .eq('blocker_id', user.id);
      
      setBlockedUsers(blocked || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings); // Optimistic Update

    try {
      await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('id', user.id);
    } catch (error) {
      toast.error("Failed to update setting");
      setSettings(settings); // Revert
    }
  };

  const unblockUser = async (blockedId) => {
    try {
      await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);
      
      setBlockedUsers(prev => prev.filter(u => u.blocked_id !== blockedId));
      toast.success("User Unblocked");
    } catch (error) {
      toast.error("Failed to unblock");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border border-border p-0 gap-0 rounded-none overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-secondary/5">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-mono font-bold uppercase tracking-widest flex items-center gap-2">
              <Shield size={18} /> Secure_Config
            </DialogTitle>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button 
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors
              ${activeTab === "privacy" ? "bg-accent/10 text-accent border-b-2 border-accent" : "hover:bg-secondary/10 text-muted-foreground"}
            `}
          >
            Privacy Protocols
          </button>
          <button 
            onClick={() => setActiveTab("blocked")}
            className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors
              ${activeTab === "blocked" ? "bg-accent/10 text-accent border-b-2 border-accent" : "hover:bg-secondary/10 text-muted-foreground"}
            `}
          >
            Blacklist ({blockedUsers.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 h-[300px] overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-accent" />
            </div>
          ) : activeTab === "privacy" ? (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    {settings.global_search ? <Eye size={16} /> : <EyeOff size={16} />}
                    Global Visibility
                  </div>
                  <p className="text-[10px] text-muted-foreground max-w-[280px]">
                    Allow strangers to find you via search. If OFF, only mutual connections can initiate chats.
                  </p>
                </div>
                <Switch 
                  checked={settings.global_search} 
                  onCheckedChange={() => toggleSetting("global_search")} 
                  className="data-[state=checked]:bg-accent"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    {settings.auto_add ? <Unlock size={16} /> : <Lock size={16} />}
                    Auto-Join Groups
                  </div>
                  <p className="text-[10px] text-muted-foreground max-w-[280px]">
                    Allow people to add you to groups instantly. If OFF, you receive an invite link instead.
                  </p>
                </div>
                <Switch 
                  checked={settings.auto_add} 
                  onCheckedChange={() => toggleSetting("auto_add")} 
                  className="data-[state=checked]:bg-accent"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              {blockedUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <UserX size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-mono uppercase">List Empty</p>
                </div>
              ) : (
                blockedUsers.map((item) => (
                  <div key={item.blocked_id} className="flex items-center justify-between p-3 bg-secondary/10 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 bg-secondary border border-border overflow-hidden">
                        <Image src={item.profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="User" fill className="object-cover" />
                      </div>
                      <span className="text-sm font-bold">{item.profile?.username || "Unknown"}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => unblockUser(item.blocked_id)}
                      className="h-7 text-[10px] uppercase font-mono rounded-none border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Unblock
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}