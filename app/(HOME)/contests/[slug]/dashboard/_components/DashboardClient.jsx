"use client";
import { useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Users, Megaphone, Settings, 
  ArrowLeft, ExternalLink, Award, Menu, Layers, BarChart3,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// Import all tabs
import OverviewTab from "./OverviewTab";
import JudgesTab from "./JudgesTab";
import SponsorsTab from "./SponsorsTab";
import AnnouncementsTab from "./AnnouncementsTab";
import SubmissionsTab from "./SubmissionsTab";
import SettingsTab from "./SettingsTab";
import ResultsMatrix from "./ResultsMatrix";

export default function DashboardClient({ contest, currentUser }) {
  const [activeTab, setActiveTab] = useState("overview");

  const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "submissions", label: "Entries", icon: Layers }, 
    { id: "matrix", label: "Results Matrix", icon: BarChart3 },
    { id: "judges", label: "Jury Panel", icon: Users },
    { id: "sponsors", label: "Sponsors", icon: Award },
    { id: "announcements", label: "Updates", icon: Megaphone },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-40">
        <div className="flex items-center gap-3">
            <Link href="/explore" className="text-muted-foreground">
                <ArrowLeft size={20} />
            </Link>
            <h1 className="font-bold text-sm truncate max-w-[200px]">{contest.title}</h1>
        </div>
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu size={20} /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] bg-background border-r border-border p-0">
                <div className="p-6 border-b border-border">
                    <h2 className="font-bold uppercase tracking-widest text-sm">Dashboard Menu</h2>
                </div>
                <nav className="flex flex-col p-4 space-y-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-none
                                ${activeTab === tab.id ? "bg-secondary text-foreground" : "text-muted-foreground"}
                            `}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
      </header>

      <div className="flex flex-1">
          {/* DESKTOP SIDEBAR */}
          <aside className="w-64 border-r border-border hidden md:flex flex-col fixed h-full top-16 bg-background/50 backdrop-blur-sm z-30">
            <div className="p-6 border-b border-border">
                <Link href="/explore" className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
                    <ArrowLeft size={12} /> Exit Dashboard
                </Link>
                <h1 className="font-bold text-lg leading-tight line-clamp-2">{contest.title}</h1>
                <Link href={`/contests/${contest.slug}`} className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1 mt-2">
                    View Public Page <ExternalLink size={10} />
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                            ${activeTab === tab.id 
                                ? "bg-secondary text-foreground border-r-2 border-accent" 
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border-r-2 border-transparent"}
                        `}
                    >
                        <tab.icon size={16} />
                        <span className="font-mono uppercase text-xs tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </nav>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 md:ml-64 p-4 md:p-8 pt-6 md:pt-24 w-full max-w-[100vw] overflow-x-hidden">
            <div className="max-w-5xl mx-auto">
                
                {activeTab === 'overview' && <OverviewTab contest={contest} />}
                
                {activeTab === 'submissions' && <SubmissionsTab contest={contest} />}

                {activeTab === 'matrix' && <ResultsMatrix contest={contest} />}

                {activeTab === 'judges' && (
                    <JudgesTab 
                        contestId={contest.id} 
                        contestTitle={contest.title}
                        contestSlug={contest.slug}
                        creatorName={currentUser?.user_metadata?.full_name || currentUser?.email}
                    />
                )}
                
                {activeTab === 'sponsors' && <SponsorsTab contest={contest} />}
                
                {activeTab === 'announcements' && <AnnouncementsTab contest={contest} />}

                {activeTab === 'settings' && <SettingsTab contest={contest} />}

                {activeTab === 'settings' && (
                    <div className="p-12 text-center text-muted-foreground border border-dashed border-border bg-secondary/5 rounded-none text-xs font-mono uppercase">
                        Configuration Locked (Active Contest)
                    </div>
                )}

            </div>
          </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-2 z-50">
         {TABS.slice(0, 4).map((tab) => ( // Show first 4 tabs only to fit
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === tab.id ? "text-accent" : "text-muted-foreground"}`}
             >
                 <tab.icon size={20} />
                 <span className="text-[9px] font-mono uppercase">{tab.label}</span>
             </button>
         ))}
      </div>

    </div>
  );
}