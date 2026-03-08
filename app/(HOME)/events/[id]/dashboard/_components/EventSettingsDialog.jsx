"use client";
import { useState } from "react";
import { 
  Loader2, Calendar, Globe, Lock, ShieldAlert, AlertTriangle, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateEvent } from "@/app/actions/updateEvent";

// HELPER: Convert UTC string from DB to Local time for Input
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
  return localISOTime;
};

export default function EventSettingsDialog({ event, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || "",
    deadline: formatDateForInput(event.deadline), // FIXED: Uses helper
    is_public: event.is_public,
    allow_multiple: event.allow_multiple,
    is_closed: event.is_closed,
    accent_color: event.accent_color || "#FF0000"
  });

  const handleSave = async () => {
    setLoading(true);
    const result = await updateEvent(event.id, formData);
    
    if (result.success) {
        toast.success("Protocol Updated", { description: "Event configuration saved." });
        onUpdate(result.data);
        onClose();
    } else {
        toast.error("Update Failed", { description: result.error });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background border border-border p-0 rounded-none gap-0 overflow-hidden">
        
        <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight">
                Event Configuration
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground uppercase">
                ID: {event.id}
            </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-4">
                    General Parameters
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Event Title</label>
                        <Input 
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="bg-background border-border rounded-none h-10 font-bold" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Accent Color</label>
                        <div className="flex items-center gap-2 border border-border h-10 px-2 bg-background">
                            <div className="w-4 h-4 border border-border" style={{ backgroundColor: formData.accent_color }} />
                            <input 
                                type="text"
                                value={formData.accent_color}
                                onChange={(e) => setFormData({...formData, accent_color: e.target.value})}
                                className="w-full bg-transparent outline-none text-xs font-mono uppercase"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Directive / Description</label>
                        <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full h-24 bg-background border border-border p-3 text-sm focus:border-accent outline-none resize-none"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-4">
                    Access Protocols
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start justify-between p-4 border border-border bg-secondary/5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase flex items-center gap-2">
                                {formData.is_public ? <Globe size={14} className="text-green-500"/> : <Lock size={14} />} 
                                Public Visibility
                            </label>
                            <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                                If enabled, this event will be visible on the Events Hub page.
                            </p>
                        </div>
                        <Switch 
                            checked={formData.is_public}
                            onCheckedChange={(c) => setFormData({...formData, is_public: c})}
                        />
                    </div>

                    <div className="flex items-start justify-between p-4 border border-border bg-secondary/5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase">Multiple Submissions</label>
                            <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                                Allow a single user node to submit multiple projects.
                            </p>
                        </div>
                        <Switch 
                            checked={formData.allow_multiple}
                            onCheckedChange={(c) => setFormData({...formData, allow_multiple: c})}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Submission Deadline</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                className="w-full h-10 pl-9 bg-background border border-border text-xs font-mono uppercase outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-red-500/20 bg-red-500/5">
                        <div className="space-y-0.5">
                            <label className="text-xs font-bold uppercase text-red-500">Force Close</label>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                                Stop all incoming submissions immediately.
                            </span>
                        </div>
                        <Switch 
                            checked={formData.is_closed}
                            onCheckedChange={(c) => setFormData({...formData, is_closed: c})}
                            className="data-[state=checked]:bg-red-500"
                        />
                    </div>
                </div>
            </section>

        </div>

        <DialogFooter className="p-4 border-t border-border bg-secondary/5">
            <Button onClick={onClose} variant="ghost" className="h-10 rounded-none text-xs uppercase hover:bg-secondary">
                Discard Changes
            </Button>
            <Button 
                onClick={handleSave} 
                disabled={loading} 
                className="h-10 bg-accent hover:bg-accent/90 text-white rounded-none text-xs uppercase min-w-[140px]"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Deploy Configuration"}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}