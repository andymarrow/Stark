"use client";
import { useState } from "react";
import { 
  Radio, 
  ChevronRight, 
  ArrowUpRight, 
  Activity, 
  Globe, 
  Zap,
  Eye // Added Eye icon for the view button
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TABS = [
    { id: 'activity', label: 'My_Transmissions', icon: Activity },
    { id: 'radar', label: 'Global_Radar', icon: Globe },
];

export default function EventsHubClient({ initialSubmissions, initialRadar }) {
  // Default to 'activity' since 'hosted' is managed in the profile
  const [activeTab, setActiveTab] = useState("activity");

  return (
    <div className="min-h-screen bg-background pt-12 pb-24">
      
      {/* 1. MISSION CONTROL HEADER */}
      <header className="container mx-auto px-4 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8 relative">
            {/* Background Grid Accent */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 rounded-tl-full pointer-events-none -z-10" />
            
            <div>
                <div className="flex items-center gap-2 text-accent font-mono text-[10px] uppercase tracking-[0.3em] mb-2">
                    <Radio size={14} className="animate-pulse" /> Network_Status: Online
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                    Events <span className="text-accent">Hub</span>
                </h1>
            </div>

            {/* Quick Stats Dashboard */}
            <div className="flex gap-4">
                <StatMini 
                    label="Active_Links" 
                    value={initialSubmissions.length} 
                    color="text-foreground" 
                />
                <StatMini 
                    label="Radar_Nodes" 
                    value={initialRadar.length} 
                    color="text-accent" 
                />
            </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        
        {/* 2. NAVIGATION TABS */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            group relative flex items-center gap-3 px-8 py-3 transition-all duration-300
                            ${isActive ? 'bg-foreground text-background shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]' : 'bg-secondary/10 text-muted-foreground hover:bg-secondary/20 hover:text-foreground'}
                        `}
                    >
                        <Icon size={16} className={isActive ? 'text-accent' : 'group-hover:text-accent'} />
                        <span className="font-mono text-xs uppercase font-bold tracking-widest whitespace-nowrap">{tab.label}</span>
                        {isActive && <div className="absolute -bottom-1 left-0 w-full h-1 bg-accent" />}
                    </button>
                )
            })}
        </div>

        {/* 3. SECTOR CONTENT */}
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="min-h-[400px]"
            >
                {activeTab === 'activity' && <ActivitySector submissions={initialSubmissions} />}
                {activeTab === 'radar' && <RadarSector events={initialRadar} />}
            </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}

// --- SUB-SECTORS ---

function ActivitySector({ submissions }) {
    if (submissions.length === 0) return <EmptyState message="Zero active transmissions found." />;

    return (
        <div className="space-y-3">
            {submissions.map((sub) => (
                <div key={sub.id} className="bg-card border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-accent transition-all duration-300 shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.1)]">
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${sub.status === 'accepted' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : sub.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
                                {sub.projectTitle}
                            </h4>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase">
                                Target Sector: <span className="text-foreground">{sub.eventTitle}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className={`text-[10px] font-mono font-bold uppercase ${sub.status === 'accepted' ? 'text-green-500' : sub.status === 'rejected' ? 'text-red-500' : 'text-amber-500'}`}>
                                {sub.status}
                            </span>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase">
                                {new Date(sub.submitted_at).toLocaleDateString()}
                            </p>
                        </div>
                        {/* Uses projectSlug for the link */}
                        <Link href={`/project/${sub.projectSlug}`}>
                            <Button variant="outline" size="sm" className="rounded-none border-border h-10 text-[10px] uppercase font-mono group-hover:border-accent">
                                Open Dossier <ArrowUpRight size={14} className="ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}

function RadarSector({ events }) {
    if (events.length === 0) return <EmptyState message="Global radar is clear. No active public sectors." />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
                <div key={event.id} className="relative aspect-[2.4/1] border border-border group overflow-hidden bg-black">
                    {event.cover_image && (
                        <Image 
                            src={event.cover_image} 
                            alt="e" 
                            fill 
                            className="object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-2">
                             <Avatar className="w-5 h-5 border border-white/20">
                                <AvatarImage src={event.host.avatar_url} />
                                <AvatarFallback>H</AvatarFallback>
                             </Avatar>
                             <span className="text-[10px] font-mono text-white/70 uppercase">
                                @{event.host.username}
                             </span>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">
                            {event.title}
                        </h3>
                        
                        {/* UPDATED: Link to Public Event Page */}
                        <Link href={`/events/${event.id}`}>
                            <Button size="sm" className="rounded-none bg-white text-black hover:bg-accent hover:text-white font-mono text-[10px] uppercase tracking-widest h-10 px-8 transition-all">
                                <Eye size={14} className="mr-2" /> Enter Sector
                            </Button>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}

// --- HELPERS ---

function StatMini({ label, value, color }) {
    return (
        <div className="bg-secondary/10 border border-border px-4 py-2 flex flex-col min-w-[100px]">
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                {label}
            </span>
            <span className={`text-xl font-black font-mono leading-none ${color}`}>
                {value.toString().padStart(2, '0')}
            </span>
        </div>
    )
}

function EmptyState({ message }) {
    return (
        <div className="py-24 border border-dashed border-border flex flex-col items-center justify-center text-center px-6 bg-secondary/5">
            <Zap size={32} className="text-muted-foreground/20 mb-4" />
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{message}</p>
        </div>
    )
}