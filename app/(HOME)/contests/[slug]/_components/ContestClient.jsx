"use client";
import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FileText, Layers, Megaphone, Grid, List, Handshake, Gavel } from "lucide-react"; // Added Icons
import ContestHero from "./ContestHero";
import EntriesGrid from "./EntriesGrid";
import ContestFeed from "./ContestFeed"; // <--- NEW COMPONENT
import RulesTab from "./RulesTab";
import UpdatesTab from "./UpdatesTab";
import SponsorsShowcase from "./SponsorsShowcase";
import JudgesShowcase from "./JudgesShowcase";

const VALID_TABS = ["details", "entries", "updates", "sponsors", "judges"];

export default function ContestClient({ contest, userEntry, judges }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sponsors only earn a tab when there's something to show in it.
  const sponsors = (Array.isArray(contest.sponsors) ? contest.sponsors : []).filter(
    (s) => typeof s === "object" && s?.name
  );
  const hasJudges = Array.isArray(judges) && judges.length > 0;

  // Tab and view live in the URL, not in component state, so opening an entry
  // and hitting back returns you to the tab you were actually on instead of
  // dumping you on Description & Rules every time.
  const requestedTab = searchParams.get("tab");
  const tabExists =
    VALID_TABS.includes(requestedTab) &&
    !(requestedTab === "sponsors" && sponsors.length === 0) &&
    !(requestedTab === "judges" && !hasJudges);
  const activeTab = tabExists ? requestedTab : "details";
  const viewMode = searchParams.get("view") === "feed" ? "feed" : "grid"; // 'grid' | 'feed'

  // replace, not push: tab clicks shouldn't stack history entries you then
  // have to press back through to leave the page. Replacing still updates the
  // entry the browser returns to.
  const setParam = useCallback(
    (key, value, defaultValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultValue) params.delete(key);
      else params.set(key, value);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setActiveTab = (tab) => setParam("tab", tab, "details");
  const setViewMode = (mode) => setParam("view", mode, "grid");

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
                {sponsors.length > 0 && (
                    <button onClick={() => setActiveTab("sponsors")} className={`px-6 py-3 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "sponsors" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        <Handshake size={14} /> Sponsors
                    </button>
                )}
                {hasJudges && (
                    <button onClick={() => setActiveTab("judges")} className={`px-6 py-3 text-xs font-mono uppercase border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "judges" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        <Gavel size={14} /> Judges
                    </button>
                )}
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
            {activeTab === "details" && (
                <RulesTab
                    contest={contest}
                    judges={judges}
                    onViewSponsors={sponsors.length > 0 ? () => setActiveTab("sponsors") : undefined}
                    onViewJudges={hasJudges ? () => setActiveTab("judges") : undefined}
                />
            )}

            {activeTab === "entries" && (
                viewMode === 'grid' ? (
                    <EntriesGrid contestId={contest.id} />
                ) : (
                    <ContestFeed contestId={contest.id} />
                )
            )}

            {activeTab === "updates" && <UpdatesTab announcements={contest.announcements} />}

            {activeTab === "sponsors" && <SponsorsShowcase sponsors={sponsors} />}

            {activeTab === "judges" && <JudgesShowcase judges={judges} contestMetrics={contest.metrics_config} />}
        </div>

      </div>
    </div>
  );
}