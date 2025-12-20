"use client";
import { useState, useMemo } from "react";
import { MoreHorizontal, Eye, Star, Edit3, Trash2, ExternalLink, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Image from "next/image";
import Link from "next/link"; // Added Link
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- HIGH QUALITY UNSPLASH THUMBNAILS ---
const THUMBNAILS = [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=1000",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?q=80&w=2676&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000"
];

// --- GENERATE ABUNDANT MOCK DATA ---
const generateProjects = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i + 1,
    title: i === 0 ? "Neural Dashboard" : i === 1 ? "Zenith Commerce" : `Project Alpha ${i + 1}`,
    slug: `project-${i}`,
    thumbnail: THUMBNAILS[i % THUMBNAILS.length],
    status: i % 5 === 0 ? "draft" : i % 7 === 0 ? "archived" : "published",
    created: new Date(Date.now() - i * 86400000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    stats: { 
        views: Math.floor(Math.random() * 10000), 
        stars: Math.floor(Math.random() * 500), 
        forks: Math.floor(Math.random() * 50) 
    },
    quality: Math.floor(Math.random() * 100)
  }));
};

const ALL_PROJECTS = generateProjects(24); 
const ITEMS_PER_PAGE = 5;

export default function MyProjectsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredProjects = useMemo(() => {
    return ALL_PROJECTS.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const currentData = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold tracking-tight">My Projects</h2>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                    MANAGE_DEPLOYMENTS ({ALL_PROJECTS.length})
                </p>
            </div>
            
            {/* LINK TO CREATE PAGE */}
            <Link href="/create">
                <Button className="bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-wider h-10 px-6">
                    + New Project
                </Button>
            </Link>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search by title or status..." 
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full h-10 pl-10 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-mono placeholder:text-muted-foreground/50 transition-colors"
                />
            </div>
            <Button variant="outline" className="h-10 w-10 rounded-none border-border px-0 hover:bg-secondary">
                <Filter size={16} />
            </Button>
        </div>
      </div>

      {/* The List "Table" */}
      <div className="border border-border bg-background min-h-[400px] flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-border bg-secondary/10 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <div className="col-span-6 md:col-span-5">Project Details</div>
            <div className="col-span-3 hidden md:block">Statistics</div>
            <div className="col-span-3 hidden md:block">Status</div>
            <div className="col-span-6 md:col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border flex-1">
            {currentData.length > 0 ? (
                currentData.map((project) => (
                    <ProjectRow key={project.id} project={project} />
                ))
            ) : (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-sm font-bold">No projects found</p>
                    <p className="text-xs font-mono mt-1">Try adjusting your search query</p>
                </div>
            )}
        </div>

        {/* Pagination Footer */}
        {filteredProjects.length > 0 && (
            <div className="p-3 border-t border-border bg-secondary/5 flex justify-between items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of {filteredProjects.length}
                </span>
                
                <div className="flex gap-1">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-none border-border disabled:opacity-30"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={14} />
                    </Button>
                    <div className="h-8 px-3 flex items-center justify-center border border-border bg-background text-xs font-mono font-bold">
                        {currentPage} / {totalPages}
                    </div>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-none border-border disabled:opacity-30"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight size={14} />
                    </Button>
                </div>
            </div>
        )}
      </div>

    </div>
  );
}

function ProjectRow({ project }) {
    const isDraft = project.status === 'draft';
    const isArchived = project.status === 'archived';

    return (
        <div className="grid grid-cols-12 gap-4 p-4 items-center group hover:bg-secondary/5 transition-colors">
            
            {/* 1. Project Info */}
            <div className="col-span-6 md:col-span-5 flex items-center gap-4">
                <div className="relative w-16 h-10 bg-secondary border border-border flex-shrink-0 overflow-hidden">
                    <Image 
                        src={project.thumbnail} 
                        alt={project.title} 
                        fill 
                        className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isDraft ? 'grayscale opacity-50' : ''}`} 
                    />
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{project.title}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                        Created {project.created}
                    </p>
                </div>
            </div>

            {/* 2. Stats */}
            <div className="col-span-3 hidden md:flex items-center gap-4 text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-1" title="Views">
                    <Eye size={12} /> {project.stats.views}
                </div>
                <div className="flex items-center gap-1" title="Stars">
                    <Star size={12} /> {project.stats.stars}
                </div>
                <div className="flex items-center gap-1" title="Quality Score">
                    <span className={`w-2 h-2 rounded-full ${project.quality > 90 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    {project.quality}%
                </div>
            </div>

            {/* 3. Status Badge */}
            <div className="col-span-3 hidden md:flex items-center">
                <span className={`
                    text-[9px] uppercase font-bold px-2 py-0.5 border
                    ${isDraft ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5' : 
                      isArchived ? 'border-muted text-muted-foreground bg-muted/10' :
                      'border-green-500/50 text-green-500 bg-green-500/5'}
                `}>
                    {project.status}
                </span>
            </div>

            {/* 4. Actions */}
            <div className="col-span-6 md:col-span-1 flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-secondary border border-transparent hover:border-border">
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border bg-background">
                        <DropdownMenuItem className="text-xs font-mono cursor-pointer rounded-none focus:bg-secondary">
                            <Edit3 size={14} className="mr-2" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs font-mono cursor-pointer rounded-none focus:bg-secondary">
                            <ExternalLink size={14} className="mr-2" /> View Live
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs font-mono cursor-pointer text-destructive focus:text-destructive rounded-none focus:bg-destructive/10">
                            <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}