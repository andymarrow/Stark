"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal, Eye, Star, Edit3, Trash2,
  ExternalLink, Search, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, BarChart3, Plus, Trophy, Globe, Lock, ShieldCheck,
  Send, ArrowRight, CheckCircle2, XCircle, Clock, EyeOff
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

// Server Actions
import { toggleSubmissionPublic } from "@/app/actions/toggleSubmissionPublic";
import { withdrawSubmission } from "@/app/actions/submissionManagement";

const ITEMS_PER_PAGE = 5;

const getThumbnail = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1];
        if (videoId) return `https://img.youtube.com/vi/${videoId.split("?")[0]}/mqdefault.jpg`;
    }
    return url;
};

export default function MyProjectsManager({ user, onRefresh }) {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalTraffic, setTotalTraffic] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("standard"); // standard | contest | hosting | event_submissions

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!itemToDelete) {
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
        document.body.style.overflow = "auto";
      }, 100);
    }
  }, [itemToDelete]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query;

      if (activeTab === 'standard' || activeTab === 'contest') {
          query = supabase
            .from('projects')
            .select(`*, contest_submissions(contest:contests(title, slug, status))`, { count: 'exact' })
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);

          if (activeTab === 'standard') {
            query = query.eq('is_contest_entry', false);
          } else {
            query = query.eq('is_contest_entry', true);
          }
          
          if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
      } 
      else if (activeTab === 'hosting') {
          query = supabase
            .from('contests')
            .select('*', { count: 'exact' })
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);

          if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
      }
      else if (activeTab === 'event_submissions') {
          query = supabase
            .from('event_submissions')
            .select(`
                *,
                project:projects!inner(*),
                event:events(*)
            `, { count: 'exact' })
            .eq('project.owner_id', user.id)
            .order('submitted_at', { ascending: false })
            .range(from, to);
      }

      const { data: resultData, error, count } = await query;
      if (error) throw error;

      if (activeTab === 'standard' || activeTab === 'contest') {
          const { data: trafficData } = await supabase
            .from('projects')
            .select('views')
            .eq('owner_id', user.id);
          const totalViews = trafficData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;
          setTotalTraffic(totalViews);
      } else {
          setTotalTraffic(0);
      }

      setData(resultData || []);
      setTotalCount(count || 0);
    } catch (error) {
        console.error(error);
        toast.error("Sync Failed");
    } finally {
        setLoading(false);
    }
  }, [user?.id, currentPage, searchQuery, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ACTIONS ---

  const handleToggleProjectPublic = async (project) => {
    const newVal = !project.is_contest_entry;
    try {
        const { error } = await supabase.from('projects').update({ is_contest_entry: newVal }).eq('id', project.id);
        if (error) throw error;
        toast.success(newVal ? "Project Hidden (Private)" : "Project Made Public");
        fetchData(); 
        if (onRefresh) onRefresh(); 
    } catch (err) {
        toast.error("Action Failed");
    }
  };

  const handleToggleSubmissionPublic = async (submission) => {
    const newVal = !submission.is_public;
    try {
        setData(prev => prev.map(s => s.id === submission.id ? { ...s, is_public: newVal } : s));
        const res = await toggleSubmissionPublic(submission.id, newVal);
        if (res.error) throw new Error(res.error);
        toast.success(newVal ? "Submission Public" : "Submission Hidden");
    } catch (err) {
        setData(prev => prev.map(s => s.id === submission.id ? { ...s, is_public: submission.is_public } : s));
        toast.error("Action Failed");
    }
  };

  const handleWithdrawSubmission = async (submission) => {
      if(!confirm("Withdraw this project from the event? This cannot be undone.")) return;
      try {
          setData(prev => prev.filter(s => s.id !== submission.id));
          const res = await withdrawSubmission(submission.id);
          if (res.error) throw new Error(res.error);
          toast.success("Submission Withdrawn");
          setTotalCount(prev => prev - 1);
      } catch (err) {
          toast.error("Withdraw Failed");
          fetchData();
      }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const table = activeTab === 'hosting' ? 'contests' : 'projects';
      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
      
      if (error) throw error;
      
      toast.success(activeTab === 'hosting' ? "Contest Deleted" : "Project Purged");
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      toast.error("Delete Failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-[100vw] overflow-hidden">
      
      <div className="flex flex-col gap-6 border-b border-border pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-foreground">Repository</h2>
                <div className="flex gap-4 mt-1 text-xs md:text-sm text-muted-foreground font-mono uppercase">
                    <span>Indexed: {totalCount}</span>
                    {(activeTab === 'standard' || activeTab === 'contest') && (
                        <>
                            <span>|</span>
                            <span className="flex items-center gap-1"><BarChart3 size={12} /> Traffic: {totalTraffic}</span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex gap-2">
                <Link href="/contests/create">
                    <Button variant="outline" className="bg-background border-border hover:bg-secondary text-foreground rounded-none font-mono text-xs uppercase h-10 px-4">
                        <Trophy size={14} className="mr-2" /> Host Contest
                    </Button>
                </Link>
                <Link href="/create">
                    <Button className="bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase h-10 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                        <Plus size={14} className="mr-2" /> New Deployment
                    </Button>
                </Link>
            </div>
        </div>

        {/* TABS */}
        <div className="flex items-end justify-between mt-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                <button 
                    onClick={() => { setActiveTab("standard"); setCurrentPage(1); }}
                    className={`px-4 py-2 text-xs font-mono uppercase border-b-2 transition-colors whitespace-nowrap ${activeTab === 'standard' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Standard Projects
                </button>
                <button 
                    onClick={() => { setActiveTab("contest"); setCurrentPage(1); }}
                    className={`px-4 py-2 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'contest' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <Trophy size={14} /> Contest Entries
                </button>
                
                {/* --- EVENT SUBMISSIONS TAB --- */}
                <button 
                    onClick={() => { setActiveTab("event_submissions"); setCurrentPage(1); }}
                    className={`px-4 py-2 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'event_submissions' ? 'border-blue-500 text-blue-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <Send size={14} /> Event Submissions
                </button>
                
                <button 
                    onClick={() => { setActiveTab("hosting"); setCurrentPage(1); }}
                    className={`px-4 py-2 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'hosting' ? 'border-purple-500 text-purple-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <ShieldCheck size={14} /> My Contests
                </button>
            </div>
            
            {activeTab !== 'event_submissions' && (
                <div className="relative group w-64 hidden md:block mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8 pl-9 bg-secondary/5 border border-border text-xs font-mono outline-none focus:border-accent text-foreground"
                    />
                </div>
            )}
        </div>
      </div>

      {/* TABLE HEADER & LIST */}
      <div className="border border-border bg-background min-h-[400px] flex flex-col relative shadow-sm">
        <div className="grid grid-cols-12 gap-2 p-3 border-b border-border bg-secondary/10 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <div className="col-span-8 md:col-span-5">Identity</div>
            
            {activeTab === 'event_submissions' ? (
                <>
                    <div className="col-span-3 hidden md:block text-center">Status</div>
                    <div className="col-span-3 hidden md:block text-right pr-4">Event</div>
                </>
            ) : (
                <>
                    <div className="col-span-3 hidden md:block">Stats</div>
                    <div className="col-span-3 hidden md:block">Status</div>
                </>
            )}
            
            <div className="col-span-4 md:col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-border flex-1">
            {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-accent" /></div>
            ) : data.length > 0 ? (
                data.map((item) => {
                    if (activeTab === 'hosting') {
                        return <ContestRow key={item.id} contest={item} onDeleteRequest={setItemToDelete} />;
                    } else if (activeTab === 'event_submissions') {
                        return (
                            <SubmissionRow 
                                key={item.id} 
                                submission={item} 
                                onTogglePublic={handleToggleSubmissionPublic}
                                onWithdraw={handleWithdrawSubmission}
                            />
                        );
                    } else {
                        return (
                            <ProjectRow 
                                key={item.id} 
                                project={item} 
                                isContestTab={activeTab === 'contest'}
                                onDeleteRequest={setItemToDelete}
                                onTogglePublic={handleToggleProjectPublic}
                            />
                        );
                    }
                })
            ) : (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border m-4 bg-secondary/5">
                    <p className="text-xs font-mono uppercase">NO_DATA_FOUND</p>
                </div>
            )}
        </div>

        {totalCount > 0 && (
            <div className="p-3 border-t border-border bg-secondary/5 flex justify-between items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-border" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-border" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></Button>
                </div>
            </div>
        )}
      </div>

      {/* DELETE MODAL (For Projects/Contests) */}
      <Dialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
        <DialogContent className="border-accent/50 bg-background rounded-none sm:max-w-[400px]">
            <DialogHeader className="p-6 border-b border-border bg-accent/5">
                <div className="flex items-center gap-2 text-accent mb-2">
                    <AlertTriangle size={20} />
                    <DialogTitle className="text-sm font-mono font-bold uppercase text-foreground">Confirm Purge</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-foreground">
                    Permanently delete <strong>{itemToDelete?.title}</strong>? This cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-4 bg-secondary/5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setItemToDelete(null)} className="h-9 rounded-none border-border text-xs uppercase text-foreground">Cancel</Button>
                <Button onClick={confirmDelete} disabled={isDeleting} className="h-9 bg-accent hover:bg-red-700 text-white rounded-none text-xs uppercase">
                    {isDeleting ? <Loader2 className="animate-spin size={14}" /> : "Delete"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- ROW COMPONENTS ---

function ProjectRow({ project, isContestTab, onDeleteRequest, onTogglePublic }) {
    const router = useRouter();
    const submission = project.contest_submissions?.[0];
    const contestData = submission?.contest;
    const contestTitle = contestData?.title;
    const contestSlug = contestData?.slug;
    
    const thumb = getThumbnail(project.thumbnail_url);
    const isHidden = project.is_contest_entry;

    return (
        <div onClick={() => router.push(`/project/${project.slug}`)} className="grid grid-cols-12 gap-2 md:gap-4 p-4 items-center group hover:bg-secondary/10 transition-all cursor-pointer">
            <div className="col-span-8 md:col-span-5 flex items-center gap-3">
                <Link href={`/project/${project.slug}`} onClick={(e) => e.stopPropagation()} className="relative w-12 h-12 bg-secondary border border-border flex-shrink-0 overflow-hidden block">
                    <Image src={thumb} alt={project.title} fill className="object-cover" />
                </Link>
                <div className="min-w-0">
                    <Link href={`/project/${project.slug}`} onClick={(e) => e.stopPropagation()} className="text-sm font-bold truncate text-foreground group-hover:text-accent transition-colors hover:underline">
                        {project.title}
                    </Link>
                    {contestTitle && (
                        <div className="flex items-center gap-2 mt-0.5">
                             <Link href={`/contests/${contestSlug}`} onClick={(e) => e.stopPropagation()} className="text-[9px] font-mono text-accent uppercase truncate flex items-center gap-1 hover:underline">
                                <Trophy size={10} /> {contestTitle}
                            </Link>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-mono uppercase border ${!isHidden ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                {!isHidden ? "PUBLIC" : "HIDDEN"}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <div className="col-span-3 hidden md:flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                <span className="flex gap-1"><Eye size={12} /> {project.views}</span>
                <span className="flex gap-1 text-accent"><Star size={12} className="fill-accent" /> {project.likes_count}</span>
            </div>
            <div className="col-span-3 hidden md:flex items-center">
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${project.status === 'published' ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-yellow-500/50 text-yellow-500'}`}>
                    {project.status}
                </span>
            </div>
            <div className="col-span-4 md:col-span-1 flex justify-end">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-background z-10 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border bg-background shadow-xl min-w-[150px] z-[50]">
                        <DropdownMenuItem asChild className="text-[10px] font-mono uppercase h-8 cursor-pointer text-foreground focus:bg-secondary">
                            <Link href={`/project/${project.slug}/edit`} onClick={(e) => e.stopPropagation()}><Edit3 size={12} className="mr-2" /> Edit</Link>
                        </DropdownMenuItem>
                        {contestTitle && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePublic(project); }} className={`text-[10px] font-mono uppercase h-8 cursor-pointer focus:text-white ${isHidden ? 'text-accent focus:bg-accent hover:bg-accent' : 'text-zinc-500 focus:bg-zinc-700 hover:bg-zinc-800'}`}>
                                {isHidden ? <><Globe size={12} className="mr-2" /> Make Public</> : <><Lock size={12} className="mr-2" /> Make Private</>}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteRequest(project); }} className="text-[10px] font-mono uppercase h-8 cursor-pointer text-red-500 focus:text-white focus:bg-red-600 hover:bg-red-600">
                            <Trash2 size={12} className="mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

function ContestRow({ contest, onDeleteRequest }) {
    const router = useRouter();
    return (
        <div onClick={() => router.push(`/contests/${contest.slug}`)} className="grid grid-cols-12 gap-2 md:gap-4 p-4 items-center group hover:bg-secondary/10 transition-all cursor-pointer border-l-2 border-purple-500/50 hover:border-purple-500">
            <div className="col-span-8 md:col-span-5 flex items-center gap-3">
                <div className="relative w-12 h-12 bg-secondary border border-border flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {contest.cover_image ? <Image src={contest.cover_image} alt={contest.title} fill className="object-cover" /> : <Trophy className="text-muted-foreground" size={20} />}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate text-foreground group-hover:text-purple-400 transition-colors">{contest.title}</h3>
                    <div className="text-[9px] font-mono text-muted-foreground uppercase truncate mt-0.5">{new Date(contest.submission_deadline).toLocaleDateString()} (Deadline)</div>
                </div>
            </div>
            <div className="col-span-3 hidden md:flex items-center gap-4 text-[10px] text-muted-foreground font-mono"></div>
            <div className="col-span-3 hidden md:flex items-center">
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${contest.status === 'open' ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-zinc-500/50 text-zinc-500'}`}>
                    {contest.status}
                </span>
            </div>
            <div className="col-span-4 md:col-span-1 flex justify-end">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-background z-10 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border bg-background shadow-xl min-w-[150px] z-[50]">
                        <DropdownMenuItem asChild className="text-[10px] font-mono uppercase h-8 cursor-pointer text-purple-500 focus:bg-purple-600 focus:text-white">
                            <Link href={`/contests/${contest.slug}/dashboard`} onClick={(e) => e.stopPropagation()}><ShieldCheck size={12} className="mr-2" /> Creator Mode</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-[10px] font-mono uppercase h-8 cursor-pointer text-foreground focus:bg-secondary focus:text-foreground">
                            <Link href={`/contests/${contest.slug}`} onClick={(e) => e.stopPropagation()}><ExternalLink size={12} className="mr-2" /> View Page</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteRequest(contest); }} className="text-[10px] font-mono uppercase h-8 cursor-pointer text-red-500 focus:text-white focus:bg-red-600 hover:bg-red-600">
                            <Trash2 size={12} className="mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

// --- SUBMISSION ROW (FIXED RLS NULL BEHAVIOR & REMOVED NOTES) ---
function SubmissionRow({ submission, onTogglePublic, onWithdraw }) {
    const { project, event, status } = submission;
    const router = useRouter();

    // SAFE FALLBACKS: If RLS blocks reading the event, event will be null.
    const isEventPublic = event?.is_public || false;
    const eventTitle = event?.title || "Classified/Private Event";
    
    const thumb = getThumbnail(project?.thumbnail_url);
    const eventThumb = getThumbnail(event?.cover_image);

    let statusColor = "text-yellow-500 border-yellow-500/30";
    let StatusIcon = Clock;
    if (status === 'accepted') { statusColor = "text-green-500 border-green-500/30 bg-green-500/5"; StatusIcon = CheckCircle2; }
    if (status === 'rejected') { statusColor = "text-red-500 border-red-500/30 bg-red-500/5"; StatusIcon = XCircle; }

    return (
        <div className="grid grid-cols-12 gap-2 md:gap-4 p-4 items-center group hover:bg-secondary/10 transition-all border-l-2 border-blue-500/50 hover:border-blue-500 relative">
            
            {/* Left: Project */}
            <div className="col-span-8 md:col-span-5 flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/project/${project?.slug}`)}>
                <div className="relative w-12 h-12 bg-secondary border border-border flex-shrink-0 overflow-hidden">
                    <Image src={thumb} alt={project?.title || "Project"} fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate text-foreground group-hover:text-blue-400 transition-colors">{project?.title || "Unknown Project"}</h3>
                    <div className="text-[9px] font-mono text-muted-foreground uppercase truncate mt-0.5 flex items-center gap-2">
                         <span>{submission.is_public ? "Public Visibility" : "Private Node"}</span>
                    </div>
                </div>
            </div>

            {/* Middle: Arrow & Status */}
            <div className="col-span-3 hidden md:flex items-center justify-center relative">
                <div className="h-[1px] w-full bg-border absolute top-1/2 left-0 -z-10 group-hover:bg-blue-500/30 transition-colors" />
                <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase bg-background z-10 ${statusColor}`}>
                    <StatusIcon size={10} /> {status}
                </div>
                <ArrowRight size={12} className="absolute right-0 text-border group-hover:text-blue-500/50 transition-colors" />
            </div>

            {/* Right: Event */}
            <div className="col-span-3 hidden md:flex items-center justify-end gap-3 pr-4">
                <div className="min-w-0 text-right">
                    <h3 className="text-xs font-bold truncate text-foreground">{eventTitle}</h3>
                    <span className={`text-[8px] font-mono uppercase ${isEventPublic ? 'text-green-500' : 'text-red-500'}`}>
                        {isEventPublic ? 'Public Event' : 'Private'}
                    </span>
                </div>
                <div className={`relative w-8 h-8 bg-secondary border border-border flex-shrink-0 overflow-hidden ${!isEventPublic && 'grayscale opacity-50'}`}>
                    {eventThumb && <Image src={eventThumb} alt={eventTitle} fill className="object-cover" />}
                </div>
            </div>

            {/* Actions */}
            <div className="col-span-4 md:col-span-1 flex justify-end">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-background z-10 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="rounded-none border border-border bg-background shadow-lg min-w-[160px] z-[50] p-1">
    
    {/* Only show View Event if event exists and is public */}
    {isEventPublic && event?.id && (
         <DropdownMenuItem asChild className="text-[10px] font-mono uppercase h-8 cursor-pointer text-foreground focus:bg-accent focus:text-white transition-colors">
            <Link href={`/events/${event.id}`} target="_blank" className="flex items-center w-full">
                <ExternalLink size={12} className="mr-2" /> View Event
            </Link>
        </DropdownMenuItem>
    )}

    <DropdownMenuItem 
        onClick={() => onTogglePublic(submission)} 
        className="text-[10px] font-mono uppercase h-8 cursor-pointer text-foreground focus:bg-accent focus:text-white transition-colors"
    >
        {submission.is_public ? <><EyeOff size={12} className="mr-2" /> Make Private</> : <><Eye size={12} className="mr-2" /> Make Public</>}
    </DropdownMenuItem>

    <DropdownMenuSeparator className="bg-border my-1" />
    
    <DropdownMenuItem 
        onClick={() => onWithdraw(submission)} 
        className="text-[10px] font-mono uppercase h-8 cursor-pointer text-red-600 dark:text-red-500 focus:bg-red-600 focus:text-white transition-colors"
    >
        <Trash2 size={12} className="mr-2" /> Withdraw
    </DropdownMenuItem>
    
</DropdownMenuContent>
                </DropdownMenu>
            </div>

        </div>
    );
}