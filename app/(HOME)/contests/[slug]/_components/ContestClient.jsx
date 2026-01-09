"use client";
import { useState } from "react";
import { FileText, Layers, Megaphone } from "lucide-react";
import ContestHero from "./ContestHero";
import EntriesGrid from "./EntriesGrid";
import RulesTab from "./RulesTab";        // <--- NEW
import UpdatesTab from "./UpdatesTab";    // <--- NEW

export default function ContestClient({ contest, userEntry , judges }) {
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="min-h-screen bg-background pb-20">
      
      <ContestHero contest={contest} userEntry={userEntry} />

      <div className="container mx-auto px-4 max-w-6xl mt-8">
        
        {/* Tab Nav */}
        <div className="flex border-b border-border mb-8 overflow-x-auto scrollbar-hide">
            <button
                onClick={() => setActiveTab("details")}
                className={`px-6 py-3 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap
                    ${activeTab === "details" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}
                `}
            >
                <FileText size={14} /> Description & Rules
            </button>
            <button
                onClick={() => setActiveTab("entries")}
                className={`px-6 py-3 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap
                    ${activeTab === "entries" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}
                `}
            >
                <Layers size={14} /> Entries
            </button>
            <button
                onClick={() => setActiveTab("updates")}
                className={`px-6 py-3 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap
                    ${activeTab === "updates" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}
                `}
            >
                <Megaphone size={14} /> Announcements
                {contest.announcements?.length > 0 && (
                    <span className="bg-accent text-white px-1.5 rounded-full text-[9px]">{contest.announcements.length}</span>
                )}
            </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
            {activeTab === "details" && <RulesTab contest={contest} judges={judges} />}
            {activeTab === "entries" && <EntriesGrid contestId={contest.id} />}
            {activeTab === "updates" && <UpdatesTab announcements={contest.announcements} />}
        </div>

      </div>
    </div>
  );
}