"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  X, Loader2, Link as LinkIcon, Radio, FolderOpen, 
  CheckCircle2, AlertTriangle, ShieldAlert
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { uplinkExistingProject } from "@/app/actions/uplinkExistingProject";

export default function SubmitToEventModal({ isOpen, onClose, project, onComplete }) {
  const [tokenInput, setTokenInput] = useState("");
  const [eventData, setEventData] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanError, setScanError] = useState(null);

  // --- 1. SMART PARSER & VALIDATOR ---
  const validateToken = useCallback(async (input) => {
    if (!input || input.length < 5) {
        setEventData(null);
        setFolders([]);
        setScanError(null);
        return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
        // Extract token from full URL if necessary
        let cleanToken = input.trim();
        if (cleanToken.includes('/events/join/')) {
            cleanToken = cleanToken.split('/events/join/')[1].split('/')[0].split('?')[0];
        }

        // Fetch Event Details securely via RPC
        const { data: event, error } = await supabase.rpc('get_event_by_token', { token_input: cleanToken });

        if (error || !event) throw new Error("INVALID_TOKEN: Protocol not found.");
        if (event.is_closed) throw new Error("SECTOR_OFFLINE: Submissions are closed.");
        
        // Fetch Public Folders
        const { data: folderData } = await supabase
            .from('event_folders')
            .select('id, name')
            .eq('event_id', event.id)
            .eq('is_public', true)
            .not('name', 'in', '("Inbox", "Accepted", "Rejected")'); // Exclude system folders

        setEventData(event);
        setFolders(folderData || []);
        setSelectedFolder(""); // Reset selection

    } catch (err) {
        setEventData(null);
        setFolders([]);
        setScanError(err.message);
    } finally {
        setIsScanning(false);
    }
  }, []);

  // Debounce the input scanning
  useEffect(() => {
    const timer = setTimeout(() => {
        validateToken(tokenInput);
    }, 600);
    return () => clearTimeout(timer);
  }, [tokenInput, validateToken]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
        setTokenInput("");
        setEventData(null);
        setFolders([]);
        setSelectedFolder("");
        setScanError(null);
    }
  }, [isOpen]);

  // --- 2. UPLINK ACTION ---
  const handleSubmit = async () => {
    if (!eventData || !project) return;

    setIsSubmitting(true);
    toast.info("Establishing Connection...");

    // Send the raw input to the server action; it will parse it again safely
    const res = await uplinkExistingProject(project.id, tokenInput, selectedFolder || null);

    if (res.success) {
        toast.success("Uplink Successful", { description: `Dossier transmitted to ${res.eventTitle}` });
        if (onComplete) onComplete();
        onClose();
    } else {
        toast.error("Transmission Failed", { description: res.error });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border border-border p-0 rounded-none shadow-2xl overflow-hidden gap-0">
        
        {/* HEADER */}
        <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <div className="flex justify-between items-start">
                <div>
                    <DialogTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                        <Radio size={18} className="text-accent" /> Uplink Protocol
                    </DialogTitle>
                    <p className="text-xs font-mono text-muted-foreground uppercase mt-1">
                        Target Dossier: <span className="text-foreground font-bold">{project?.title || "Unknown"}</span>
                    </p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18}/></button>
            </div>
        </DialogHeader>

        {/* BODY */}
        <div className="p-6 space-y-6">
            
            {/* Input Area */}
            <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest flex items-center justify-between">
                    <span>Event Token / Invite Link</span>
                    {isScanning && <Loader2 size={12} className="animate-spin text-accent" />}
                </label>
                <div className={`relative flex items-center border transition-colors ${scanError ? 'border-red-500' : eventData ? 'border-green-500' : 'border-border focus-within:border-accent'}`}>
                    <div className="absolute left-3 text-muted-foreground">
                        <LinkIcon size={14} />
                    </div>
                    <Input 
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="ev_... or https://stark.et/events/join/ev_..."
                        className="pl-9 h-12 bg-secondary/5 border-none rounded-none font-mono text-xs focus-visible:ring-0"
                        autoFocus
                    />
                </div>
                
                {/* Feedback States */}
                {scanError && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-500 uppercase mt-2 bg-red-500/10 p-2 border border-red-500/20">
                        <ShieldAlert size={12} /> {scanError}
                    </div>
                )}
                {eventData && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-500 uppercase mt-2 bg-green-500/10 p-2 border border-green-500/20">
                        <CheckCircle2 size={12} /> Target Acquired: {eventData.title}
                    </div>
                )}
            </div>

            {/* Folder Selection (Appears only if event is valid and has public folders) */}
            {eventData && folders.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <FolderOpen size={12} /> Select Target Directory
                    </label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger className="w-full h-12 rounded-none bg-background border-border text-xs font-mono uppercase">
                            <SelectValue placeholder="System Default (Inbox)" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-border bg-background">
                            <SelectItem value="">System Default (Inbox)</SelectItem>
                            {folders.map(f => (
                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Event Details Preview */}
            {eventData && (
                <div className="p-4 border border-dashed border-border bg-secondary/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                        <span className="text-muted-foreground">Host Node</span>
                        <span className="text-foreground">@{eventData.host.username}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                        <span className="text-muted-foreground">Format</span>
                        <span className="text-foreground">{eventData.allow_multiple ? 'Multi-Entry' : 'Single-Entry'}</span>
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-between">
            <span className="text-[9px] font-mono text-muted-foreground uppercase flex items-center pt-2">
                <AlertTriangle size={10} className="mr-1" /> Existing publicity rules apply
            </span>
            <Button 
                onClick={handleSubmit} 
                disabled={!eventData || isSubmitting || isScanning} 
                className="h-10 bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase min-w-[120px] transition-all disabled:opacity-50"
            >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Initiate Transfer"}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}