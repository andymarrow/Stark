"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Layers, Trophy, ArrowRight, Share2, 
  LayoutGrid, FolderOpen, Star, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProjectCard from "@/app/(HOME)/_components/ProjectCard";
import { toast } from "sonner"; // IMPORTED SONNER

export default function EventShowcaseClient({ event, folders, submissions }) {
  // "All" is the default view, or the first folder if preferred.
  const [activeTab, setActiveTab] = useState("all");

  // Filter Logic
  const displayedItems = activeTab === "all" 
    ? submissions 
    : submissions.filter(s => s.folder_id === activeTab);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // UPDATED: Senior UX Toast Feedback
    toast.success("Protocol Link Copied", { 
        description: "Event URL has been saved to your clipboard." 
    }); 
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      
      {/* 1. CINEMATIC HERO */}
      <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden bg-black">
        {/* Cover Art */}
        {event.cover_image ? (
            <Image 
                src={event.cover_image} 
                alt={event.title} 
                fill 
                className="object-cover opacity-60" 
                priority
            />
        ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col justify-end container mx-auto px-4 pb-12">
            
            {/* Host Badge */}
            <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                    <Avatar className="w-5 h-5 border border-white/20">
                        <AvatarImage src={event.host.avatar_url} />
                        <AvatarFallback>H</AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest">
                        Hosted by {event.host.username}
                    </span>
                </div>
                {/* Status Badge */}
                {/* <div className={`px-2 py-1.5 rounded-full border text-[10px] font-mono uppercase font-bold tracking-widest ${event.is_closed ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-green-500/20 text-green-500 border-green-500/30'}`}>
                    {event.is_closed ? "Archived" : "Live Protocol"}
                </div> */}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-4 max-w-4xl leading-none">
                {event.title}
            </h1>

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <p className="text-sm md:text-base text-muted-foreground font-mono max-w-2xl leading-relaxed line-clamp-3 md:line-clamp-none">
                    {event.description || "A curated collection of projects."}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleShare} className="h-12 w-12 p-0 rounded-none border-border bg-background/50 backdrop-blur-sm">
                        <Share2 size={18} />
                    </Button>
                    {!event.is_closed && (
                        <Link href={`/events/join/${event.access_token}`}>
                            <Button 
                                className="h-12 px-8 rounded-none text-xs font-mono uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(var(--accent),0.3)] hover:shadow-[0_0_30px_rgba(var(--accent),0.5)] transition-all"
                                style={{ backgroundColor: event.accent_color, color: '#fff' }}
                            >
                                Submit Entry <ArrowRight size={14} className="ml-2" />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* 2. NAVIGATION TRACKS (Folders) */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-8 h-16">
                <NavTab 
                    label="All Exhibits" 
                    icon={LayoutGrid} 
                    isActive={activeTab === 'all'} 
                    count={submissions.length}
                    onClick={() => setActiveTab('all')} 
                />
                
                <div className="w-px h-6 bg-border mx-2" />

                {folders.map(folder => {
                    const count = submissions.filter(s => s.folder_id === folder.id).length;
                    return (
                        <NavTab 
                            key={folder.id}
                            label={folder.name} 
                            icon={FolderOpen} 
                            isActive={activeTab === folder.id} 
                            count={count}
                            onClick={() => setActiveTab(folder.id)} 
                        />
                    )
                })}
            </div>
        </div>
      </div>

      {/* 3. THE GALLERY GRID */}
      <div className="container mx-auto px-4 py-12 min-h-[500px]">
        {displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-border bg-secondary/5">
                <Layers size={48} className="text-muted-foreground/20 mb-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sector Empty</h3>
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">No public exhibits in this track yet.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedItems.map((submission) => (
                    <div key={submission.id} className="relative group">
                        {/* Feature Badge */}
                        {submission.is_featured && (
                            <div className="absolute -top-3 -right-3 z-20 bg-yellow-500 text-black p-2 shadow-lg rotate-12 group-hover:rotate-0 transition-transform">
                                <Star size={16} fill="currentColor" />
                            </div>
                        )}
                        
                        {/* Reusing your existing ProjectCard but wrapping it */}
                        <ProjectCard project={submission.project} />
                        
                        {/* Optional: Host Note or Badge could go here below the card */}
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}

function NavTab({ label, icon: Icon, isActive, count, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 h-full border-b-2 transition-all px-2 ${isActive ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
            <Icon size={14} />
            <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">{label}</span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm ${isActive ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>
                {count}
            </span>
        </button>
    )
}