"use client";
import { useState, useEffect, useCallback } from "react";
import { MoreHorizontal, Eye, Star, Edit3, Trash2, ExternalLink, Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 5;

export default function MyProjectsManager({ user, onRefresh }) {
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // State for Delete Modal
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetches projects specifically for the logged in owner
   */
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

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
      setProjects(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error(error);
      toast.error("DIRECTORY_ACCESS_FAILED");
    } finally {
      setLoading(false);
    }
  }, [user.id, currentPage, searchQuery]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /**
   * Terminate Project logic
   */
  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
      if (error) throw error;
      
      toast.success("PROJECT_PURGED", { description: "Resource wiped from system memory." });
      setProjectToDelete(null);
      fetchProjects();
      if (onRefresh) onRefresh(); // Update total counts in parent dashboard
    } catch (error) {
      toast.error("PURGE_FAILED");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Header & Search */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight uppercase">My Deployments</h2>
            <p className="text-sm text-muted-foreground font-mono mt-1 uppercase">
              ACTIVE_PROJECTS: {totalCount}
            </p>
          </div>
          <Link href="/create">
            <Button className="bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase h-10 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
              + New Deployment
            </Button>
          </Link>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search system directory..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 pl-10 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-mono transition-colors"
          />
        </div>
      </div>

      {/* The List Table */}
      <div className="border border-border bg-background min-h-[400px] flex flex-col relative">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-border bg-secondary/10 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <div className="col-span-6 md:col-span-5">Identity_Label</div>
          <div className="col-span-3 hidden md:block">Realtime_Telemetry</div>
          <div className="col-span-3 hidden md:block">Process_State</div>
          <div className="col-span-6 md:col-span-1 text-right">Ops</div>
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
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border m-4">
              <p className="text-xs font-mono uppercase tracking-widest opacity-50">NULL_RECORDS_DETECTED</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <div className="p-3 border-t border-border bg-secondary/5 flex justify-between items-center">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              SECTOR_{currentPage}_OF_{totalPages || 1}
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

      {/* --- STARK TERMINATION MODAL --- */}
      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="border-accent/50 bg-background rounded-none p-0 overflow-hidden sm:max-w-[400px]">
          <DialogHeader className="p-6 border-b border-border bg-accent/5">
            <div className="flex items-center gap-2 text-accent mb-2">
              <AlertTriangle size={20} />
              <DialogTitle className="text-sm font-mono font-bold uppercase tracking-widest">Termination_Warning</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-foreground font-light leading-relaxed">
              Confirm purge of project: <span className="font-bold text-accent font-mono">[{projectToDelete?.title?.toUpperCase()}]</span>. 
              This action is destructive and irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-4 bg-secondary/5 flex gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setProjectToDelete(null)}
              className="rounded-none border-border font-mono text-xs uppercase h-10 px-6"
            >
              Abort
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-accent hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase h-10 px-6"
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : "Initiate Purge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Individual Row Component
 * Navigates to project on click
 */
function ProjectRow({ project, onDeleteRequest }) {
  const isDraft = project.status === 'draft';

  return (
    <div className="grid grid-cols-12 gap-4 p-4 items-center group hover:bg-secondary/5 transition-all border-l-2 border-transparent hover:border-accent">
      
      {/* 1. Identity & Info Area (Linkable) */}
      <div className="col-span-6 md:col-span-5 relative">
        <Link href={`/project/${project.slug}`} className="flex items-center gap-4 group/info">
            <div className="relative w-16 h-10 bg-secondary border border-border flex-shrink-0 overflow-hidden">
                <Image 
                    src={project.thumbnail_url || "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=200"} 
                    alt={project.title} 
                    fill 
                    className={`object-cover transition-transform duration-500 group-hover/info:scale-110 ${isDraft ? 'grayscale opacity-50' : ''}`} 
                />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate uppercase tracking-tight group-hover/info:text-accent transition-colors">
                    {project.title}
                </h3>
                <p className="text-[9px] text-muted-foreground font-mono truncate uppercase">UID: {project.slug}</p>
            </div>
        </Link>
      </div>

      {/* 2. REAL ANALYTICS (Live views/likes) */}
      <div className="col-span-3 hidden md:flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center gap-1.5" title="Live System Views">
          <Eye size={12} className="text-muted-foreground" /> {project.views || 0}
        </div>
        <div className="flex items-center gap-1.5 text-accent" title="Global Stars Received">
          <Star size={12} className="fill-accent" /> {project.likes_count || 0}
        </div>
      </div>

      {/* 3. Status Badge */}
      <div className="col-span-3 hidden md:flex items-center">
        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${isDraft ? 'border-yellow-600/50 text-yellow-500 bg-yellow-900/10' : 'border-green-600/50 text-green-500 bg-green-900/10'}`}>
          {project.status}
        </span>
      </div>

      {/* 4. Operations Menu */}
      <div className="col-span-6 md:col-span-1 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border border-transparent hover:border-border hover:bg-background">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none border-border bg-background shadow-2xl min-w-[120px]">
            <DropdownMenuItem asChild className="text-[10px] font-mono cursor-pointer rounded-none focus:bg-secondary uppercase">
              <Link href={`/project/${project.slug}/edit`}><Edit3 size={12} className="mr-2" /> Edit_Config</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-[10px] font-mono cursor-pointer rounded-none focus:bg-secondary uppercase">
              <Link href={`/project/${project.slug}`}><ExternalLink size={12} className="mr-2" /> Live_View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteRequest(project)} 
              className="text-[10px] font-mono cursor-pointer text-red-500 focus:text-red-400 rounded-none focus:bg-red-500/10 uppercase"
            >
              <Trash2 size={12} className="mr-2" /> Purge_File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
}