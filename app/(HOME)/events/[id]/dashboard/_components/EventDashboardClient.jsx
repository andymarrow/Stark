"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Inbox, ChevronLeft, Settings, Plus, Search, LayoutGrid, List, 
  MoreHorizontal, CheckCircle2, XCircle, Star, X, Menu, CheckSquare,
  Eye, EyeOff, ExternalLink, ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { bulkMoveSubmissions } from "@/app/actions/bulkMoveSubmissions"; 
import { toggleFeatured } from "@/app/actions/toggleFeatured";
import { toggleSubmissionPublic } from "@/app/actions/toggleSubmissionPublic";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import EventSettingsDialog from "./EventSettingsDialog";
import SubmissionInspector from "./SubmissionInspector";
import FolderTreeItem from "./FolderTreeItem";

// HELPER: Smart Thumbnail Extraction
const getSmartThumbnail = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1];
        if (videoId) {
            const cleanId = videoId.split("?")[0].split("/")[0];
            return `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`;
        }
    }
    return url; 
};

export default function EventDashboardClient({ initialEvent, initialFolders, initialSubmissions }) {
  const [event, setEvent] = useState(initialEvent);
  const [folders, setFolders] = useState(initialFolders);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [activeFolderId, setActiveFolderId] = useState(null);
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'featured'

  // Selection & Drag State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);

  // Folder Management State
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isNewFolderPublic, setIsNewFolderPublic] = useState(false);
  const [targetParentId, setTargetParentId] = useState(null);

  const inboxId = folders.find(f => f.name === "Inbox")?.id;
  const currentFolderId = activeFolderId || inboxId;
  const rootFolders = folders.filter(f => !f.parent_id);
  
  // --- SORTING & FILTERING ---
  const currentSubmissions = useMemo(() => {
    let filtered = submissions.filter(s => {
        if (s.folder_id === currentFolderId) return true;
        if (currentFolderId === inboxId && !s.folder_id) return true;
        return false;
    });

    return filtered.sort((a, b) => {
        if (sortBy === 'featured') return (b.is_featured === a.is_featured) ? 0 : b.is_featured ? 1 : -1;
        if (sortBy === 'oldest') return new Date(a.submitted_at) - new Date(b.submitted_at);
        // Default Newest
        return new Date(b.submitted_at) - new Date(a.submitted_at);
    });
  }, [submissions, currentFolderId, inboxId, sortBy]);

  // --- KEYBOARD SHORTCUTS (GOD MODE) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
        // Ignore if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'Escape') {
            setSelectedIds(new Set());
            setSelectedSubmission(null);
        }
        
        // Select All (Cmd+A)
        if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
            e.preventDefault();
            const allIds = new Set(currentSubmissions.map(s => s.id));
            setSelectedIds(allIds);
        }

        // Open Inspector (Space)
        if (e.code === 'Space' && selectedIds.size === 1 && !selectedSubmission) {
            e.preventDefault();
            const id = Array.from(selectedIds)[0];
            const sub = submissions.find(s => s.id === id);
            if (sub) setSelectedSubmission(sub);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSubmissions, selectedIds, selectedSubmission, submissions]);


  // --- HANDLERS ---

  const handleEventUpdate = (updatedEvent) => {
    setEvent(updatedEvent);
  };

  const handleSubmissionUpdate = (updatedSub) => {
    setSubmissions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
    if (selectedSubmission?.id === updatedSub.id) {
        setSelectedSubmission(updatedSub);
    }
  };

  const handleToggleFeature = async (e, submission) => {
    e.stopPropagation(); 
    const newState = !submission.is_featured;
    setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, is_featured: newState } : s));
    const res = await toggleFeatured(submission.id, newState);
    if (res.error) {
        setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, is_featured: !newState } : s));
        toast.error("Action Failed");
    }
  };

  const handleTogglePublic = async (e, submission) => {
    e.stopPropagation();
    const newState = !submission.is_public;
    
    setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, is_public: newState } : s));
    
    const res = await toggleSubmissionPublic(submission.id, newState);
    if (res.error) {
        setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, is_public: !newState } : s));
        toast.error("Action Failed");
    } else {
        toast.success(newState ? "Project is now Public" : "Project is now Hidden");
    }
  };

  const handleSelection = (e, id) => {
    const newSelected = new Set(selectedIds);

    if (e.metaKey || e.ctrlKey) {
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
    } else if (e.shiftKey && lastSelectedId) {
        const currentIndex = currentSubmissions.findIndex(s => s.id === id);
        const lastIndex = currentSubmissions.findIndex(s => s.id === lastSelectedId);
        if (currentIndex !== -1 && lastIndex !== -1) {
            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);
            // Add range to selection
            const slice = currentSubmissions.slice(start, end + 1);
            slice.forEach(s => newSelected.add(s.id));
        }
    } else {
        newSelected.clear();
        newSelected.add(id);
    }
    
    setSelectedIds(newSelected);
    setLastSelectedId(id);
  };

  const handleOpenCreateFolder = (parentId = null) => {
    setTargetParentId(parentId);
    setIsNewFolderOpen(true);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const newFolder = { id: tempId, name: newFolderName, event_id: event.id, parent_id: targetParentId, is_public: isNewFolderPublic };
    setFolders([...folders, newFolder]);
    setIsNewFolderOpen(false);
    setNewFolderName("");
    setIsNewFolderPublic(false);
    const { data } = await supabase.from('event_folders').insert({ event_id: event.id, name: newFolderName, parent_id: targetParentId, is_public: isNewFolderPublic }).select().single();
    if (data) setFolders(prev => prev.map(f => f.id === tempId ? data : f));
  };

  const handleDeleteFolder = async (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (['Inbox', 'Accepted', 'Rejected'].includes(folder.name)) return toast.error("System folder.");
    if (!confirm("Delete folder? Submissions move to Inbox.")) return;
    setSubmissions(prev => prev.map(s => s.folder_id === folderId ? { ...s, folder_id: inboxId } : s));
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (currentFolderId === folderId) setActiveFolderId(inboxId);
    await supabase.from('event_folders').delete().eq('id', folderId);
  };

  const handleToggleFolderPublic = async (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newStatus = !folder.is_public;

    // 1. Optimistic Update
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, is_public: newStatus } : f));
    
    toast.success(newStatus ? `Folder "${folder.name}" is now Public` : `Folder "${folder.name}" is now Private`);

    // 2. Database Update
    const { error } = await supabase
        .from('event_folders')
        .update({ is_public: newStatus })
        .eq('id', folderId);

    // 3. Revert on Error
    if (error) {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, is_public: !newStatus } : f));
        toast.error("Failed to update folder visibility");
    }
  };

  const handleDragStart = (e, submissionId) => {
    if (!selectedIds.has(submissionId)) {
        const newSet = new Set([submissionId]);
        setSelectedIds(newSet);
        e.dataTransfer.setData("submissionIds", JSON.stringify([submissionId]));
    } else {
        e.dataTransfer.setData("submissionIds", JSON.stringify(Array.from(selectedIds)));
    }
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    const rawData = e.dataTransfer.getData("submissionIds");
    if (!rawData) return;
    const idsToMove = JSON.parse(rawData);
    if (idsToMove.length === 0 || targetFolderId === currentFolderId) return;

    const originalSubmissions = [...submissions];
    const targetFolder = folders.find(f => f.id === targetFolderId);
    let nextStatus = targetFolder.name === 'Accepted' ? 'accepted' : targetFolder.name === 'Rejected' ? 'rejected' : 'pending';

    setSubmissions(prev => prev.map(s => idsToMove.includes(s.id) ? { ...s, folder_id: targetFolderId, status: nextStatus } : s));
    setSelectedIds(new Set());
    toast.success(`Moved ${idsToMove.length} items to ${targetFolder.name}`);
    
    const result = await bulkMoveSubmissions(idsToMove, targetFolderId);
    if (result.error) {
        setSubmissions(originalSubmissions);
        toast.error("Move Failed");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-secondary/5">
        <div className="p-4 border-b border-border">
            <Link href="/profile" className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ChevronLeft size={12} /> Back to Terminal
            </Link>
            <h1 className="font-bold text-sm uppercase tracking-tight truncate" title={event.title}>{event.title}</h1>
            
            {event.is_public && (
                <Link 
                    href={`/events/${event.id}`} 
                    target="_blank"
                    className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-accent hover:underline uppercase"
                >
                    View Live Page <ExternalLink size={10} />
                </Link>
            )}

            <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: event.accent_color }} />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Console Active</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
            <div className="px-2 py-2 text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1 flex justify-between items-center">
                Directory
                <button onClick={() => handleOpenCreateFolder(null)} className="hover:text-accent"><Plus size={12}/></button>
            </div>
            
            {rootFolders.map(folder => (
                <FolderTreeItem 
                    key={folder.id} 
                    folder={folder} 
                    allFolders={folders} 
                    submissions={submissions}
                    activeId={currentFolderId} 
                    onSelect={(id) => { setActiveFolderId(id); setIsMobileMenuOpen(false); }}
                    onDrop={handleDrop} 
                    onCreateSubfolder={handleOpenCreateFolder} 
                    onDelete={handleDeleteFolder}
                    onTogglePublic={handleToggleFolderPublic}
                />
            ))}
        </div>

        <div className="p-4 border-t border-border mt-auto">
            <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="w-full h-8 text-[10px] font-mono uppercase rounded-none border-dashed">
                <Settings size={12} className="mr-2" /> Event Settings
            </Button>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      
      {/* SIDEBARS */}
      <aside className="hidden md:flex w-64 border-r border-border flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col bg-background relative overflow-hidden" onClick={() => setSelectedIds(new Set())}>
        
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/50 backdrop-blur-md z-30">
            <div className="flex items-center gap-4">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden"><Menu size={20} /></Button></SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 border-r border-border rounded-none gap-0"><SidebarContent /></SheetContent>
                </Sheet>
                <h2 className="text-sm font-bold uppercase truncate max-w-[150px] md:max-w-none flex items-center gap-2">
                    {folders.find(f => f.id === currentFolderId)?.name || "Inbox"}
                    <span className="text-muted-foreground/30">/</span>
                    {selectedIds.size > 0 && <span className="bg-accent text-white px-2 py-0.5 text-[9px] rounded-full">{selectedIds.size} SELECTED</span>}
                </h2>
            </div>

            <div className="flex items-center gap-3">
                
                {/* SORTING DROPDOWN (NEW) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground mr-2">
                            <ArrowUpDown size={12} /> {sortBy}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border bg-background">
                        <DropdownMenuItem onClick={() => setSortBy('newest')} className="text-xs font-mono uppercase cursor-pointer">Newest</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('oldest')} className="text-xs font-mono uppercase cursor-pointer">Oldest</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('featured')} className="text-xs font-mono uppercase cursor-pointer">Featured</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="relative hidden md:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                    <input className="h-8 w-48 bg-secondary/10 border border-border pl-8 text-xs font-mono focus:border-accent outline-none transition-colors" placeholder="Search..." />
                </div>
                <div className="h-4 w-px bg-border mx-1 hidden md:block" />
                <button onClick={() => setViewMode('grid')} className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'text-accent' : 'text-muted-foreground'}`}><LayoutGrid size={14}/></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 transition-colors ${viewMode === 'list' ? 'text-accent' : 'text-muted-foreground'}`}><List size={14}/></button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/5 custom-scrollbar">
            {currentSubmissions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                    <Inbox size={48} className="opacity-20 mb-4" />
                    <p className="text-xs font-mono uppercase tracking-widest">Directory Empty</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-2"}>
                    {currentSubmissions.map(sub => {
                        const thumb = getSmartThumbnail(sub.project.thumbnail_url);
                        const isSelected = selectedIds.has(sub.id);
                        return (
                            <div 
                                key={sub.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, sub.id)}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    // Use metaKey for multi-select, otherwise single select
                                    if (e.metaKey || e.ctrlKey || e.shiftKey) {
                                        handleSelection(e, sub.id);
                                    } else {
                                        if (isSelected) setSelectedSubmission(sub);
                                        else {
                                            setSelectedIds(new Set([sub.id]));
                                            setLastSelectedId(sub.id);
                                        }
                                    }
                                }}
                                onDoubleClick={() => setSelectedSubmission(sub)}
                                className={`
                                    bg-card border transition-all cursor-pointer group relative overflow-hidden select-none
                                    ${viewMode === 'grid' ? 'aspect-square flex flex-col' : 'flex items-center h-16 px-4 gap-4'}
                                    ${isSelected ? 'border-accent ring-1 ring-accent bg-accent/5' : 'border-border hover:border-foreground/30'}
                                `}
                            >
                                {isSelected && <div className="absolute top-2 left-2 z-30 text-accent bg-black p-0.5 rounded-sm"><CheckSquare size={14} fill="currentColor" /></div>}
                                <div className={`absolute left-0 top-0 h-full w-1 ${sub.status === 'accepted' ? 'bg-green-500' : sub.status === 'rejected' ? 'bg-red-500' : 'bg-transparent'}`} />

                                <div className={viewMode === 'grid' ? "flex-1 relative bg-secondary overflow-hidden" : "w-12 h-12 relative bg-secondary flex-shrink-0"}>
                                    {thumb ? <Image src={thumb} alt="t" fill className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-bold uppercase text-[9px]">Empty</div>}
                                    
                                    {/* VISIBILITY TOGGLE */}
                                    <button 
                                        onClick={(e) => handleTogglePublic(e, sub)} 
                                        className={`absolute top-2 left-2 p-1 rounded-full backdrop-blur-md transition-all z-20 ${sub.is_public ? 'bg-green-500 text-white' : 'bg-black/50 text-white/50 hover:text-white'}`}
                                        title={sub.is_public ? "Publicly Visible" : "Hidden"}
                                    >
                                        {sub.is_public ? <Eye size={10} /> : <EyeOff size={10} />}
                                    </button>

                                    {/* FEATURE TOGGLE */}
                                    <button onClick={(e) => handleToggleFeature(e, sub)} className={`absolute top-2 right-2 p-1 rounded-full backdrop-blur-md transition-all z-20 ${sub.is_featured ? 'bg-yellow-500 text-black' : 'bg-black/50 text-white/50 hover:text-yellow-400 opacity-0 group-hover:opacity-100'}`}><Star size={10} fill={sub.is_featured ? "currentColor" : "none"} /></button>
                                </div>

                                <div className={viewMode === 'grid' ? "p-3 border-t border-border bg-card" : "flex-1 min-w-0"}>
                                    <h4 className="font-bold text-xs truncate uppercase">{sub.project.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden bg-secondary border border-border">
                                            <Image src={sub.project.author.avatar_url || "/placeholder.jpg"} alt="a" fill className="object-cover" />
                                        </div>
                                        <p className="text-[10px] font-mono text-muted-foreground truncate">@{sub.project.author.username}</p>
                                    </div>
                                </div>
                                {viewMode === 'list' && (
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${sub.status === 'accepted' ? 'text-green-500 border-green-500/30' : sub.status === 'rejected' ? 'text-red-500 border-red-500/30' : 'text-zinc-500 border-border'}`}>{sub.status}</span>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedSubmission(sub); }} className="p-2 hover:bg-secondary"><MoreHorizontal size={14}/></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </main>

      <EventSettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} event={event} onUpdate={handleEventUpdate} />
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="max-w-sm bg-background border border-border p-0 gap-0"><DialogHeader className="p-4 border-b border-border bg-secondary/5"><DialogTitle className="text-sm font-bold uppercase">{targetParentId ? "New Subfolder" : "New Root Directory"}</DialogTitle></DialogHeader><div className="p-4 space-y-4"><Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder Name..." className="h-10 rounded-none bg-background border-border text-xs font-mono" autoFocus /><div className="flex items-center justify-between"><label className="text-[10px] font-mono uppercase text-muted-foreground">Public Access</label><Switch checked={isNewFolderPublic} onCheckedChange={setIsNewFolderPublic} /></div></div><DialogFooter className="p-4 border-t border-border bg-secondary/5"><Button onClick={() => setIsNewFolderOpen(false)} variant="ghost" size="sm" className="rounded-none h-8 text-xs uppercase">Cancel</Button><Button onClick={handleCreateFolder} size="sm" className="bg-accent text-white rounded-none h-8 text-xs uppercase">Create</Button></DialogFooter></DialogContent>
      </Dialog>
      <SubmissionInspector submission={selectedSubmission} isOpen={!!selectedSubmission} onClose={() => setSelectedSubmission(null)} onUpdate={handleSubmissionUpdate} />
    </div>
  );
}