"use client";
import { useState, useRef } from "react";
import { 
  Loader2, Calendar, Lock, Globe, ShieldCheck, UploadCloud, LayoutTemplate 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createEvent } from "@/app/actions/createEvent";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function CreateEventModal({ isOpen, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover_image: "",
    allow_multiple: false,
    deadline: "",
    accent_color: "#FF0000"
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
        const fileName = `events/covers/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('project-assets').upload(fileName, file);
        if (error) throw error;
        
        const { data } = supabase.storage.from('project-assets').getPublicUrl(fileName);
        setFormData(prev => ({ ...prev, cover_image: data.publicUrl }));
    } catch (err) {
        toast.error("Upload Failed");
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) return toast.error("Event Title Required");
    
    setLoading(true);
    const result = await createEvent(formData);
    
    if (result.success) {
        toast.success("Protocol Initialized", { description: "Event node created successfully." });
        onCreated();
        onClose();
    } else {
        toast.error("Initialization Failed", { description: result.error });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border border-border p-0 rounded-none gap-0">
        
        <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight">
                <ShieldCheck size={18} className="text-accent" />
                Initialize Event Node
            </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
            
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-32 border-2 border-dashed border-border hover:border-accent/50 bg-secondary/5 flex flex-col items-center justify-center cursor-pointer group transition-all overflow-hidden"
            >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                
                {previewUrl ? (
                    <>
                        <Image src={previewUrl} alt="Cover" fill className="object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                        <div className="z-10 flex flex-col items-center">
                            <span className="text-[10px] font-mono uppercase bg-black/80 text-white px-2 py-1">Replace Art</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-accent transition-colors">
                        <UploadCloud size={20} />
                        <span className="text-[9px] font-mono uppercase">Upload Cover Art</span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground">Event Title</label>
                    <Input 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="h-10 rounded-none bg-background border-border font-bold"
                        placeholder="e.g. Design Sprint 2026"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground">Brief Directive</label>
                    <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full h-20 bg-background border border-border p-3 text-xs focus:border-accent outline-none resize-none"
                        placeholder="Define submission parameters..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Deadline</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                className="w-full h-10 pl-9 bg-background border border-border text-[10px] font-mono uppercase outline-none focus:border-accent"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Accent Hex</label>
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
                </div>

                <div className="flex items-center justify-between p-3 border border-border bg-secondary/5">
                    <div className="space-y-0.5">
                        <label className="text-xs font-bold uppercase block">Allow Multiple Entries</label>
                        <span className="text-[10px] text-muted-foreground font-mono">One user, many submissions.</span>
                    </div>
                    <Switch 
                        checked={formData.allow_multiple}
                        onCheckedChange={(c) => setFormData({...formData, allow_multiple: c})}
                    />
                </div>
            </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-secondary/5">
            <Button onClick={onClose} variant="ghost" className="h-10 rounded-none text-xs uppercase hover:bg-secondary">
                Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="h-10 bg-accent hover:bg-accent/90 text-white rounded-none text-xs uppercase min-w-[120px]">
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Initialize"}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}