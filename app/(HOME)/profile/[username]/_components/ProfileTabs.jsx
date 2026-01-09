"use client";
import { useState } from "react";
import {
  Layers,
  Heart,
  Grid,
  List,
  Clock,
  History,
  Flame,
  Eye,
  ThumbsUp,
  Zap,
  Trophy,
  Award,
  Gavel,
  Medal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Helper: Extract YouTube Thumbnail
const getThumbnail = (url) => {
  if (!url) return "/placeholder.jpg";
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1];

    if (videoId) {
      // Strip query params
      const cleanId = videoId.split("?")[0].split("/")[0];
      return `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`;
    }
  }
  return url;
};

export default function ProfileTabs({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  workCount = 0,
  savedCount = 0,
  sortOrder,
  setSortOrder,
  popularMetric,
  setPopularMetric,
  contestEntries = [],
  judgingHistory = [],
}) {
  const [compFilter, setCompFilter] = useState("all");

  const wins = contestEntries.filter((e) => e.rank !== null && e.rank > 0);
  const participated = contestEntries.filter(
    (e) => e.rank === null || e.rank === 0
  );
  const totalContestActivity = contestEntries.length + judgingHistory.length;

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* TOP ROW: Main Sections */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-0 gap-4">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
          <TabButton
            active={activeTab === "work"}
            onClick={() => setActiveTab("work")}
            icon={Layers}
            label="Submissions"
            count={workCount}
          />
          <TabButton
            active={activeTab === "competitions"}
            onClick={() => setActiveTab("competitions")}
            icon={Trophy}
            label="Competitions"
            count={totalContestActivity}
          />
          <TabButton
            active={activeTab === "saved"}
            onClick={() => setActiveTab("saved")}
            icon={Heart}
            label="Starred"
            count={savedCount}
          />
        </div>

        {activeTab !== "competitions" && (
          <div className="hidden md:flex items-center gap-1 pb-2">
            <ViewToggleButton
              active={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              icon={Grid}
            />
            <ViewToggleButton
              active={viewMode === "list"}
              onClick={() => setViewMode("list")}
              icon={List}
            />
          </div>
        )}
      </div>

      {/* BOTTOM ROW: Filters */}
      {activeTab === "competitions" ? (
        <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 overflow-x-auto scrollbar-hide pb-2">
          <FilterPill
            label="All History"
            active={compFilter === "all"}
            onClick={() => setCompFilter("all")}
          />
          <FilterPill
            label="Awards Won"
            count={wins.length}
            active={compFilter === "wins"}
            onClick={() => setCompFilter("wins")}
            icon={Award}
          />
          <FilterPill
            label="Participated"
            count={participated.length}
            active={compFilter === "participated"}
            onClick={() => setCompFilter("participated")}
            icon={Medal}
          />
          <FilterPill
            label="Jury Duty"
            count={judgingHistory.length}
            active={compFilter === "judging"}
            onClick={() => setCompFilter("judging")}
            icon={Gavel}
          />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-2">
          <div className="flex items-center gap-2 bg-secondary/10 p-1 border border-border w-fit">
            <FilterButton
              active={sortOrder === "latest"}
              onClick={() => setSortOrder("latest")}
              label="LATEST"
              icon={Clock}
            />
            <FilterButton
              active={sortOrder === "oldest"}
              onClick={() => setSortOrder("oldest")}
              label="OLDEST"
              icon={History}
            />
            <FilterButton
              active={sortOrder === "popular"}
              onClick={() => setSortOrder("popular")}
              label="POPULAR"
              icon={Flame}
            />
          </div>
          <AnimatePresence mode="wait">
            {sortOrder === "popular" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 pl-2 border-l-2 border-accent/50"
              >
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
                  Metric:
                </span>
                <div className="flex gap-1">
                  <MetricToggle
                    active={popularMetric === "views"}
                    onClick={() => setPopularMetric("views")}
                    icon={Eye}
                    label="Traffic"
                  />
                  <MetricToggle
                    active={popularMetric === "likes"}
                    onClick={() => setPopularMetric("likes")}
                    icon={ThumbsUp}
                    label="Stars"
                  />
                  <MetricToggle
                    active={popularMetric === "hype"}
                    onClick={() => setPopularMetric("hype")}
                    icon={Zap}
                    label="Hype (Both)"
                    isSpecial
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- COMPETITIONS GRID CONTENT --- */}
      {activeTab === "competitions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {(compFilter === "all" || compFilter === "wins") &&
            wins.map((entry) => (
              <ContestCard
                key={entry.id}
                type="winner"
                rank={entry.rank}
                contest={entry.contest}
                project={entry.project}
                score={entry.final_score}
              />
            ))}
          {(compFilter === "all" || compFilter === "participated") &&
            participated.map((entry) => (
              <ContestCard
                key={entry.id}
                type="participant"
                contest={entry.contest}
                project={entry.project}
                score={entry.final_score}
              />
            ))}
          {(compFilter === "all" || compFilter === "judging") &&
            judgingHistory.map((judge) => (
              <ContestCard
                key={judge.id}
                type="judge"
                contest={judge.contest}
              />
            ))}

          {((compFilter === "wins" && wins.length === 0) ||
            (compFilter === "participated" && participated.length === 0) ||
            (compFilter === "judging" && judgingHistory.length === 0) ||
            (compFilter === "all" && totalContestActivity === 0)) && (
            <div className="col-span-2 py-12 text-center border border-dashed border-border bg-secondary/5 text-muted-foreground text-xs font-mono uppercase">
              No records found in this sector.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-4 border-b-[3px] transition-all duration-200 group whitespace-nowrap ${
        active
          ? "border-accent text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon
        size={16}
        className={`transition-colors ${
          active ? "text-accent" : "group-hover:text-accent"
        }`}
      />
      <span className="text-xs font-mono font-bold uppercase tracking-widest">
        {label}
      </span>
      <span
        className={`text-[10px] px-1.5 py-0.5 border font-mono transition-colors ${
          active
            ? "border-accent text-accent bg-accent/5"
            : "border-border text-muted-foreground group-hover:border-foreground group-hover:text-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function FilterPill({ label, count, active, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono border transition-all flex items-center gap-2 whitespace-nowrap ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background border-border text-muted-foreground hover:border-foreground"
      }`}
    >
      {Icon && <Icon size={12} />}
      {label}
      {count !== undefined && (
        <span className="opacity-50 ml-1">({count})</span>
      )}
    </button>
  );
}

function ContestCard({ type, rank, contest, project, score }) {
  const isWinner = type === "winner";
  const isJudge = type === "judge";

  // Handle Thumbnail Logic
  // If it's a project entry, check project thumb. If judge, check contest cover.
  const rawUrl =
    project?.thumbnail_url || contest?.cover_image || "/placeholder.jpg";
  const thumb = getThumbnail(rawUrl);

  return (
    <div
      className={`relative flex gap-4 p-4 border transition-all bg-card ${
        isWinner
          ? "border-yellow-500/50 bg-yellow-500/5"
          : isJudge
          ? "border-purple-500/50 bg-purple-500/5"
          : "border-border hover:border-accent"
      }`}
    >
      <div
        className={`absolute top-0 right-0 px-2 py-1 text-[8px] font-mono uppercase font-bold text-white ${
          isWinner ? "bg-yellow-600" : isJudge ? "bg-purple-600" : "bg-zinc-700"
        }`}
      >
        {isWinner ? `Rank #${rank}` : isJudge ? "Jury Panel" : "Participant"}
      </div>

      <div className="relative w-20 h-20 bg-black border border-border flex-shrink-0 overflow-hidden">
        <Image src={thumb} alt="thumb" fill className="object-cover" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <h4 className="font-bold text-sm truncate">{contest?.title}</h4>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5 line-clamp-1">
            {isJudge ? "Evaluation Role" : `Entry: ${project?.title}`}
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {project && (
            <Link
              href={`/project/${project.slug}`}
              className="text-[9px] uppercase border px-2 py-1 hover:bg-white hover:text-black transition-colors"
            >
              View Project
            </Link>
          )}
          <Link
            href={`/contests/${contest.slug}`}
            className="text-[9px] uppercase border px-2 py-1 hover:bg-white hover:text-black transition-colors"
          >
            Contest Page
          </Link>
        </div>
      </div>
      {score && (
        <div className="absolute bottom-4 right-4 text-right">
          <div className="text-lg font-black font-mono text-zinc-700 leading-none">
            {Number(score).toFixed(1)}
          </div>
          <div className="text-[7px] uppercase text-zinc-500">Score</div>
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, label, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
        active
          ? "bg-foreground text-background font-bold shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
      }`}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function MetricToggle({ active, onClick, icon: Icon, label, isSpecial }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all text-[10px] font-mono uppercase ${
        active
          ? isSpecial
            ? "border-accent bg-accent text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]"
            : "border-foreground bg-secondary text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      <Icon size={12} fill={active && !isSpecial ? "currentColor" : "none"} />{" "}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ViewToggleButton({ active, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 transition-all duration-200 border ${
        active
          ? "text-foreground bg-secondary/30 border-border"
          : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/10"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}
