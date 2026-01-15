"use client";
import { useState } from "react";
import { FileText, Layers, Megaphone, Grid, List } from "lucide-react"; // Added Icons
import ContestHero from "./ContestHero";
import EntriesGrid from "./EntriesGrid";
import ContestFeed from "./ContestFeed"; // <--- NEW COMPONENT
import RulesTab from "./RulesTab";
import UpdatesTab from "./UpdatesTab";

export default function ContestClient({ contest, userEntry, judges }) {
  const [activeTab, setActiveTab] = useState("details");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'feed'

  return (
    <div className="min-h-screen bg-background pb-20">
      
      <ContestHero contest={contest} userEntry={userEntry} />

      <div className="container mx-auto px-4 max-w-6xl mt-8">
        
        {/* Tab Nav & View Switcher */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-border mb-8 gap-4">
            <div className="flex overflow-x-auto scrollbar-hide w-full md:w-auto">
                <button onClick={() => setActiveTab("details")} className={`px-6 py-3 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "details" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    <FileText size={14} /> Description & Rules
                </button>
                <button onClick={() => setActiveTab("entries")} className={`px-6 py-3 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "entries" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    <Layers size={14} /> Entries
                </button>
                <button onClick={() => setActiveTab("updates")} className={`px-6 py-3 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "updates" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    <Megaphone size={14} /> Announcements
                </button>
            </div>

            {/* View Switcher (Only visible on Entries tab) */}
            {activeTab === 'entries' && (
                <div className="flex items-center bg-secondary/10 border border-border p-1 mb-2">
                    <button onClick={() => setViewMode('grid')} className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Grid size={14} />
                    </button>
                    <button onClick={() => setViewMode('feed')} className={`p-2 transition-all ${viewMode === 'feed' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        <List size={14} />
                    </button>
                </div>
            )}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
            {activeTab === "details" && <RulesTab contest={contest} judges={judges} />}
            
            {activeTab === "entries" && (
                viewMode === 'grid' ? (
                    <EntriesGrid contestId={contest.id} />
                ) : (
                    <ContestFeed contestId={contest.id} /> 
                )
            )}
            
            {activeTab === "updates" && <UpdatesTab announcements={contest.announcements} />}
        </div>

      </div>
    </div>
  );
}