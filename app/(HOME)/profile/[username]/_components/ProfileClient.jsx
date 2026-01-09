"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import ActivityGraph from "./ActivityGraph";
import ProfileTabs from "./ProfileTabs";
import ProjectCard from "@/app/(HOME)/_components/ProjectCard";
import Pagination from "@/components/ui/Pagination";
import { registerView } from "@/app/actions/viewAnalytics";

const ITEMS_PER_PAGE = 6;

export default function ProfileClient({ 
  initialProfile, 
  initialWork, 
  initialSaved, 
  initialFollowerStats, 
  contestEntries = [], // Default to empty array
  judgingHistory = [], // Default to empty array
  currentUser,
  username 
}) {
  // UI State
  const [activeTab, setActiveTab] = useState("work");
  const [viewMode, setViewMode] = useState("grid");
  
  // Filtering State
  const [sortOrder, setSortOrder] = useState("latest");
  const [popularMetric, setPopularMetric] = useState("hype");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const hasCountedRef = useRef(false);

  // 1. Increment View Count (Server Action logic with 24h debounce)
  useEffect(() => {
    if (!initialProfile?.id) return;
    if (hasCountedRef.current) return;
    if (currentUser?.id === initialProfile.id) return;

    hasCountedRef.current = true;
    const increment = async () => {
        await registerView('profile', initialProfile.id);
    };
    increment();
  }, [initialProfile.id, currentUser]);

  // 2. Reset pagination when tab/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortOrder, popularMetric]);

  // 3. SORTING LOGIC (Only applies to Work/Saved tabs)
  const sortedProjects = useMemo(() => {
    // If we are in the Competitions tab, this list isn't used directly
    if (activeTab === 'competitions') return [];

    let list = activeTab === "work" ? [...initialWork] : [...initialSaved];

    return list.sort((a, b) => {
        if (sortOrder === 'latest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortOrder === 'popular') {
            if (popularMetric === 'views') return (b.views || 0) - (a.views || 0);
            if (popularMetric === 'likes') return (b.likes_count || 0) - (a.likes_count || 0);
            if (popularMetric === 'hype') {
                const scoreA = (a.views || 0) + ((a.likes_count || 0) * 5);
                const scoreB = (b.views || 0) + ((b.likes_count || 0) * 5);
                return scoreB - scoreA;
            }
        }
        return 0;
    });
  }, [initialWork, initialSaved, activeTab, sortOrder, popularMetric]);

  // 4. STATS AGGREGATION
  const publicStats = {
    projects: initialWork.length,
    followers: initialFollowerStats.followers,
    following: initialFollowerStats.following,
    likes: initialWork.reduce((acc, p) => acc + (p.likes_count || 0), 0),
    nodeReach: initialProfile.views || 0,
    projectTraffic: initialWork.reduce((acc, p) => acc + (p.views || 0), 0)
  };

  // 5. PAGINATION CALCULATION (For Work/Saved)
  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProjects = sortedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="mb-8">
          <ProfileHeader user={initialProfile} currentUser={currentUser} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2">
              <ProfileStats stats={publicStats} />
          </div>
          <div className="lg:col-span-1">
              <ActivityGraph projects={initialWork} />
          </div>
      </div>

      <ProfileTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          viewMode={viewMode}
          setViewMode={setViewMode}
          workCount={initialWork.length}
          savedCount={initialSaved.length}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          popularMetric={popularMetric}
          setPopularMetric={setPopularMetric}
          // New Data
          contestEntries={contestEntries}
          judgingHistory={judgingHistory}
      />

      {/* Conditional Rendering: Work/Saved Grid OR Competition View is handled inside ProfileTabs */}
      {(activeTab === 'work' || activeTab === 'saved') && (
          currentProjects.length > 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={viewMode === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                      : "flex flex-col gap-4 max-w-4xl mx-auto"
                  }>
                      {currentProjects.map((project) => (
                          <ProjectCard key={project.id} project={project} />
                      ))}
                  </div>
                  
                  {totalPages > 1 && (
                      <div className="mt-12">
                          <Pagination 
                              currentPage={currentPage}
                              totalPages={totalPages}
                              onPageChange={(p) => {
                                  setCurrentPage(p);
                                  window.scrollTo({ top: 600, behavior: 'smooth' });
                              }}
                          />
                      </div>
                  )}
              </div>
          ) : (
              <div className="h-64 border border-dashed border-border flex items-center justify-center text-muted-foreground font-mono text-sm uppercase">
                  Empty_Sector
              </div>
          )
      )}
    </div>
  );
}