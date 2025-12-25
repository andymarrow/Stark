"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"; 
import {
  MoreHorizontal, Eye, Star, Edit3, Trash2,
  ExternalLink, Search, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, BarChart3, Plus
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 5;

export default function MyProjectsManager({ user }) {
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalTraffic, setTotalTraffic] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    // GUARD: If user is null, stop immediately
    if (!user?.id) return; 
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // 1. Fetch Paginated Projects
      let query = supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // 2. Calculate Total Traffic
      const { data: trafficData, error: trafficError } = await supabase
        .from('projects')
        .select('views')
        .eq('owner_id', user.id);

      if (!trafficError && trafficData) {
        const totalViews = trafficData.reduce((sum, item) => sum + (item.views || 0), 0);
        setTotalTraffic(totalViews);
      }

      setProjects(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error(error);
      toast.error("DATA_FETCH_FAILURE", { description: "Connection to node lost." });
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentPage, searchQuery]);

  useEffect(() => {
    if (user?.id) { 
      fetchProjects();
    }
  }, [fetchProjects]);

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
      if (error) throw error;
      toast.success("PROJECT_PURGED", { description: "Resource removed from global index." });
      setProjectToDelete(null);
      fetchProjects();
    } catch (error) {
      toast.error("COMMAND_FAILED");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-[100vw] overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col gap-6 border-b border-border pb-6">
        
        {/* Top Row: Title & Action Button - Responsive Stack */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
          
          {/* Title Section */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase truncate">Local Repository</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <p className="text-xs md:text-sm text-muted-foreground font-mono uppercase whitespace-nowrap">
                INDEXED_FILES: <span className="text-foreground">{totalCount}</span>
              </p>
              <span className="hidden md:inline text-border">|</span>
              <p className="text-xs md:text-sm text-muted-foreground font-mono uppercase flex items-center gap-1 whitespace-nowrap">
                <BarChart3 size={12} /> NET_TRAFFIC: <span className="text-accent">{totalTraffic}</span>
              </p>
            </div>
          </div>

          {/* Action Button - Full width on mobile, auto on desktop */}
          <Link href="/create" className="w-full md:w-auto">
            <Button className="w-full md:w-auto bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase h-11 md:h-10 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
              <Plus size={14} className="md:hidden" />
              <span>New Deployment</span>
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Filter by title or metadata..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 pl-10 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-mono transition-colors rounded-none"
          />
        </div>
      </div>

      {/* The List Table */}
      <div className="border border-border bg-background min-h-[400px] flex flex-col relative shadow-sm">
        {/* Table Header - Hides non-essential columns on mobile */}
        <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 border-b border-border bg-secondary/10 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <div className="col-span-8 md:col-span-5">Identity_Hash</div>
          <div className="col-span-3 hidden md:block">Analytics</div>
          <div className="col-span-3 hidden md:block">State</div>
          <div className="col-span-4 md:col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-border flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-accent" />
            </div>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <ProjectRow key={project.id} project={project} onDeleteRequest={setProjectToDelete} />
            ))
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border m-4 bg-secondary/5">
              <p className="text-xs font-mono uppercase">NO_RECORDS_IN_SECTOR</p>
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        {totalCount > 0 && (
          <div className="p-3 border-t border-border bg-secondary/5 flex justify-between items-center">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              PAGE_{currentPage}_OF_{totalPages || 1}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-none border-border"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-none border-border"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="border-accent/50 bg-background rounded-none p-0 overflow-hidden sm:max-w-[400px] w-[95vw]">
           <DialogHeader className="p-6 border-b border-border bg-accent/5">
            <div className="flex items-center gap-2 text-accent mb-2">
              <AlertTriangle size={20} />
              <DialogTitle className="text-sm font-mono font-bold uppercase tracking-widest">Danger_Zone</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-foreground font-light">
              Are you sure you want to terminate <span className="font-bold text-accent font-mono">[{projectToDelete?.title?.toUpperCase()}]</span>? 
              This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-4 bg-secondary/5 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setProjectToDelete(null)} className="w-full sm:w-auto rounded-none border-border font-mono text-xs uppercase h-10 px-6">Cancel</Button>
            <Button onClick={confirmDelete} disabled={isDeleting} className="w-full sm:w-auto bg-accent hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase h-10 px-6">
              {isDeleting ? <Loader2 className="animate-spin size={14}" /> : "Confirm Purge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectRow({ project, onDeleteRequest }) {
  const router = useRouter();
  const isDraft = project.status === 'draft';

  // Handle row click for navigation
  const handleRowClick = (e) => {
    // Prevent navigation if the user clicks the Dropdown menu or buttons
    if (e.target.closest('button') || e.target.closest('[role="menuitem"]')) return;
    
    router.push(`/project/${project.slug}`);
  };

  return (
    <div 
      onClick={handleRowClick}
      className="grid grid-cols-12 gap-2 md:gap-4 p-4 items-center group hover:bg-secondary/10 transition-all border-l-2 border-transparent hover:border-accent cursor-pointer"
    >
      {/* Identity Column: 8 cols on mobile, 5 on desktop */}
      <div className="col-span-8 md:col-span-5 flex items-center gap-3 md:gap-4">
        <div className="relative w-12 h-12 md:w-16 md:h-10 bg-secondary border border-border flex-shrink-0 overflow-hidden">
          <Image
            src={project.thumbnail_url || "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=200"}
            alt={project.title}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isDraft ? 'grayscale opacity-50' : ''}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground truncate uppercase tracking-tight group-hover:text-accent transition-colors leading-tight mb-0.5">
            {project.title}
          </h3>
          <p className="text-[9px] text-muted-foreground font-mono truncate uppercase">UID: {project.slug}</p>
          
          {/* Mobile Only Metadata */}
          <div className="flex md:hidden items-center gap-2 mt-1.5 text-[9px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1"><Eye size={10} /> {project.views || 0}</span>
            <span className={`px-1 border ${isDraft ? 'border-yellow-600/50 text-yellow-500' : 'border-green-600/50 text-green-500'}`}>
                {isDraft ? 'DRAFT' : 'LIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Analytics */}
      <div className="col-span-3 hidden md:flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center gap-1.5" title="View Count">
          <Eye size={12} /> {project.views || 0}
        </div>
        <div className="flex items-center gap-1.5 text-accent" title="Star Count">
          <Star size={12} className="fill-accent" /> {project.likes_count || 0}
        </div>
      </div>

      {/* Desktop Status */}
      <div className="col-span-3 hidden md:flex items-center">
        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${isDraft ? 'border-yellow-600/50 text-yellow-500 bg-yellow-900/10' : 'border-green-600/50 text-green-500 bg-green-900/10'}`}>
          {project.status}
        </span>
      </div>

      {/* Action Column: 4 cols on mobile, 1 on desktop */}
      <div className="col-span-4 md:col-span-1 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border border-transparent hover:border-border hover:bg-background z-10 relative">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none border-border bg-background shadow-2xl min-w-[140px]">
            <DropdownMenuItem asChild className="text-[10px] font-mono cursor-pointer rounded-none focus:bg-secondary uppercase h-8">
              <Link href={`/project/${project.slug}/edit`}><Edit3 size={12} className="mr-2" /> Edit_Config</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-[10px] font-mono cursor-pointer rounded-none focus:bg-secondary uppercase h-8">
              <Link href={`/project/${project.slug}`}><ExternalLink size={12} className="mr-2" /> Live_View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDeleteRequest(project); }}
              className="text-[10px] font-mono cursor-pointer text-red-500 focus:text-red-400 rounded-none focus:bg-red-500/10 uppercase h-8"
            >
              <Trash2 size={12} className="mr-2" /> Purge_File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}