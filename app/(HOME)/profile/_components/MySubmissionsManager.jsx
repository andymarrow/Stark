"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, Filter, MoreHorizontal, Eye, EyeOff, 
  Trash2, MessageSquare, ArrowRight, Loader2,
  CheckCircle2, XCircle, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { toggleSubmissionPublic } from "@/app/actions/toggleSubmissionPublic";
import { withdrawSubmission, updateSubmissionNote } from "@/app/actions/submissionManagement";

export default function MySubmissionsManager({ user }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, accepted, pending, rejected

  // Modal States
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_submissions')
        .select(`
            *,
            project:projects!inner(*),
            event:events(*)
        `)
        .eq('project.owner_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) {
        toast.error("Failed to load submissions");
      } else {
        setSubmissions(data);
      }
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

  // 2. Handlers
  const handleTogglePublic = async (id, currentStatus) => {
    // Optimistic Update
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_public: !currentStatus } : s));
    
    const res = await toggleSubmissionPublic(id, !currentStatus);
    if (res.error) {
        toast.error(res.error);
        // Revert
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_public: currentStatus } : s));
    } else {
        toast.success(currentStatus ? "Submission is now Private" : "Submission is now Public");
    }
  };

  const handleWithdraw = async (id) => {
    if(!confirm("Are you sure? This will remove your project from the event permanently.")) return;
    
    setSubmissions(prev => prev.filter(s => s.id !== id));
    const res = await withdrawSubmission(id);
    
    if (res.error) {
        toast.error(res.error);
        // We'd theoretically need to re-fetch here to undo the optimistic delete, 
        // but for now we assume success or page refresh.
    } else {
        toast.success("Submission Withdrawn");
    }
  };

  const openNoteModal = (submission) => {
      setSelectedSubmission(submission);
      setNoteContent(submission.internal_notes || "");
      setNoteModalOpen(true);
  };

  const saveNote = async () => {
      if (!selectedSubmission) return;
      setIsSaving(true);
      
      // Optimistic
      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, internal_notes: noteContent } : s));
      
      const res = await updateSubmissionNote(selectedSubmission.id, noteContent);
      if (res.error) {
          toast.error("Failed to save note");
      } else {
          toast.success("Note Updated");
          setNoteModalOpen(false);
      }
      setIsSaving(false);
  };

  // 3. Filtering
  const filtered = submissions.filter(s => {
      const matchesSearch = s.project.title.toLowerCase().includes(search.toLowerCase()) || 
                            s.event.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || s.status === filter;
      return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
        
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center">
            <div>
                <h2 className="text-lg font-bold uppercase tracking-tight">Submission Console</h2>
                <p className="text-xs text-muted-foreground font-mono mt-1">Manage your entries across the network.</p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                    <Input 
                        placeholder="Search entries..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-secondary/5 border-border rounded-none text-xs font-mono"
                    />
                </div>
                <div className="flex bg-secondary/5 border border-border p-1 gap-1">
                    {['all', 'accepted', 'pending', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-[10px] font-mono uppercase transition-colors ${filter === f ? 'bg-accent text-white font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* SUBMISSIONS LIST */}
        <div className="space-y-3">
            {filtered.length === 0 ? (
                <div className="h-40 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                    <Filter size={24} className="opacity-20 mb-2" />
                    <span className="text-xs font-mono uppercase">No records found</span>
                </div>
            ) : (
                filtered.map(sub => (
                    <div key={sub.id} className="group relative border border-border bg-background hover:bg-secondary/5 transition-all p-4 flex flex-col md:flex-row items-center gap-6">
                        
                        {/* LEFT: PROJECT */}
                        <div className="flex items-center gap-4 w-full md:w-1/3">
                            <div className="w-12 h-12 bg-secondary border border-border shrink-0 relative overflow-hidden">
                                {sub.project.thumbnail_url && <Image src={sub.project.thumbnail_url} alt="t" fill className="object-cover" />}
                            </div>
                            <div className="min-w-0">
                                <span className="text-[9px] font-mono text-muted-foreground uppercase">Project Node</span>
                                <Link href={`/project/${sub.project.slug}`} className="block text-sm font-bold truncate hover:text-accent transition-colors">
                                    {sub.project.title}
                                </Link>
                            </div>
                        </div>

                        {/* MIDDLE: STATUS ARROW */}
                        <div className="flex-1 flex items-center justify-center w-full md:w-auto relative py-2 md:py-0">
                            <div className="h-px w-full bg-border absolute top-1/2 left-0 -z-10 hidden md:block" />
                            <div className={`
                                flex items-center gap-2 px-3 py-1 border text-[10px] font-mono uppercase bg-background z-10
                                ${sub.status === 'accepted' ? 'text-green-500 border-green-500/30' : sub.status === 'rejected' ? 'text-red-500 border-red-500/30' : 'text-yellow-500 border-yellow-500/30'}
                            `}>
                                {sub.status === 'accepted' ? <CheckCircle2 size={12}/> : sub.status === 'rejected' ? <XCircle size={12}/> : <Clock size={12}/>}
                                {sub.status}
                            </div>
                            <ArrowRight className="absolute right-0 text-muted-foreground/20 hidden md:block" size={14} />
                        </div>

                        {/* RIGHT: EVENT & ACTIONS */}
                        <div className="flex items-center justify-between gap-4 w-full md:w-1/3">
                            <div className="text-right min-w-0 flex-1">
                                <span className="text-[9px] font-mono text-muted-foreground uppercase">Target Event</span>
                                <h4 className="text-xs font-bold truncate">{sub.event.title}</h4>
                            </div>

                            <div className="flex items-center gap-1 border-l border-border pl-4">
                                <button 
                                    onClick={() => handleTogglePublic(sub.id, sub.is_public)}
                                    className={`p-2 transition-colors ${sub.is_public ? 'text-green-500 hover:bg-green-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                                    title={sub.is_public ? "Public Visibility" : "Private"}
                                >
                                    {sub.is_public ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-none border-border bg-background">
                                        <DropdownMenuItem onClick={() => openNoteModal(sub)} className="text-xs font-mono uppercase cursor-pointer">
                                            <MessageSquare size={12} className="mr-2" /> Private Note
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-border"/>
                                        <DropdownMenuItem onClick={() => handleWithdraw(sub.id)} className="text-xs font-mono uppercase text-red-500 cursor-pointer">
                                            <Trash2 size={12} className="mr-2" /> Withdraw
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                    </div>
                ))
            )}
        </div>

        {/* NOTE DIALOG */}
        <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
            <DialogContent className="max-w-md bg-background border border-border p-0 gap-0">
                <DialogHeader className="p-4 border-b border-border bg-secondary/5">
                    <DialogTitle className="text-sm font-bold uppercase">Internal Note</DialogTitle>
                    <DialogDescription className="text-[10px] font-mono uppercase">Private notes for this submission.</DialogDescription>
                </DialogHeader>
                <div className="p-4">
                    <Textarea 
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add details, reminders or feedback..."
                        className="min-h-[100px] bg-secondary/5 border-border rounded-none text-xs font-mono focus-visible:ring-accent"
                    />
                </div>
                <DialogFooter className="p-4 border-t border-border bg-secondary/5">
                    <Button onClick={() => setNoteModalOpen(false)} variant="ghost" size="sm" className="rounded-none h-8 text-xs uppercase">Cancel</Button>
                    <Button onClick={saveNote} disabled={isSaving} size="sm" className="bg-accent text-white rounded-none h-8 text-xs uppercase">
                        {isSaving ? <Loader2 className="animate-spin" size={12} /> : "Save Note"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}