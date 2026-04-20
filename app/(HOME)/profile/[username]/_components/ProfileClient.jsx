// app/(HOME)/profile/[username]/_components/ProfileClient.jsx
"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import ActivityGraph from "./ActivityGraph";
import ProfileTabs from "./ProfileTabs";
import ProjectCard from "@/app/(HOME)/_components/ProjectCard";
import ProjectListItem from "./ProjectListItem";
import Pagination from "@/components/ui/Pagination";
import { registerView } from "@/app/actions/viewAnalytics";

import NetworkRegistry from "../../_components/NetworkRegistry";
import AchievementVault from "./AchievementVault";
import EventsTabContent from "./EventsTabContent"; 
import BlogsTabContent from "./BlogsTabContent"; 
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 6;

export default function ProfileClient({
  initialProfile,
  initialWork,
  initialSaved,
  initialFollowerStats,
  contestEntries = [],
  judgingHistory = [],
  hostedEvents = [], 
  attendedEvents = [], 
  initialBlogs = [], 
  achievementCount = 0, 
  currentUser,
  username,
  financialStats // <--- RECEIVED FINANCIAL STATS
}) {
  // UI State
  const [activeTab, setActiveTab] = useState("work");
  const [viewMode, setViewMode] = useState("grid");

  // CONNECTION STATES 
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [connectionType, setConnectionType] = useState("followers");
  const [connections, setConnections] = useState([]);
  const [connLoading, setConnLoading] = useState(false);

  // Filtering State
  const [sortOrder, setSortOrder] = useState("latest");
  const [popularMetric, setPopularMetric] = useState("hype");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const hasCountedRef = useRef(false);

  // 1. View Counting Logic
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

  // FETCH PUBLIC CONNECTIONS 
  const fetchConnectionsList = async (type) => {
    setConnLoading(true);
    setConnectionType(type);
    setIsConnectionsOpen(true);

    try {
        let query;
        if (type === 'followers') {
            query = supabase
                .from('follows')
                .select('profile:profiles!follows_follower_id_fkey(*)')
                .eq('following_id', initialProfile.id);
        } else {
            query = supabase
                .from('follows')
                .select('profile:profiles!follows_following_id_fkey(*)')
                .eq('follower_id', initialProfile.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setConnections(data.map(d => d.profile));
    } catch (err) {
        toast.error("NODE_REGISTRY_SYNC_FAILED");
    } finally {
        setConnLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortOrder, popularMetric]);

  const totalEventsActivity = hostedEvents.length + attendedEvents.length;

  // --- GENERAL SORTING ALGORITHM (Now includes Fuel Injections!) ---
  const getSortedItems = (list) => {
      return [...list].sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at);
        const dateB = new Date(b.published_at || b.created_at);

        if (sortOrder === 'latest') return dateB - dateA;
        if (sortOrder === 'oldest') return dateA - dateB;
        if (sortOrder === 'popular') {
          if (popularMetric === 'views') return (b.views || 0) - (a.views || 0);
          if (popularMetric === 'likes') return (b.likes_count || 0) - (a.likes_count || 0);
          if (popularMetric === 'hype') {
            // HYPE MATRIX: Views (1x) + Stars (5x) + Fuel Injections (50x)
            const scoreA = (a.views || 0) + ((a.likes_count || 0) * 5) + ((a.fuel_injections || 0) * 50);
            const scoreB = (b.views || 0) + ((b.likes_count || 0) * 5) + ((b.fuel_injections || 0) * 50);
            return scoreB - scoreA;
          }
        }
        return 0;
      });
  };

  const sortedProjects = useMemo(() => {
    if (activeTab === 'work') return getSortedItems(initialWork);
    if (activeTab === 'saved') return getSortedItems(initialSaved);
    return [];
  }, [initialWork, initialSaved, activeTab, sortOrder, popularMetric]);

  const sortedBlogs = useMemo(() => {
    if (activeTab === 'blogs') return getSortedItems(initialBlogs);
    return [];
  }, [initialBlogs, activeTab, sortOrder, popularMetric]);

  const publicStats = {
    projects: initialWork.length,
    followers: initialFollowerStats.followers,
    following: initialFollowerStats.following,
    likes: initialWork.reduce((acc, p) => acc + (p.likes_count || 0), 0),
    nodeReach: initialProfile.views || 0,
    projectTraffic: initialWork.reduce((acc, p) => acc + (p.views || 0), 0),
    financialStats: financialStats 
  };

  const currentListLength = activeTab === 'blogs' ? sortedBlogs.length : sortedProjects.length;
  const totalPages = Math.ceil(currentListLength / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  
  const currentProjects = sortedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const currentBlogs = sortedBlogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="mb-8">
          <ProfileHeader user={initialProfile} currentUser={currentUser} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2">
              <ProfileStats stats={publicStats} onStatClick={fetchConnectionsList} />
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
          achievementCount={achievementCount}
          eventsCount={totalEventsActivity} 
          blogCount={initialBlogs.length} 
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          popularMetric={popularMetric}
          setPopularMetric={setPopularMetric}
          contestEntries={contestEntries}
          judgingHistory={judgingHistory}
      />

      {activeTab === 'achievements' && (
          <AchievementVault userId={initialProfile.id} isOwner={currentUser?.id === initialProfile.id} />
      )}

      {activeTab === 'events' && (
        <EventsTabContent hostedEvents={hostedEvents} attendedEvents={attendedEvents} />
      )}

      {activeTab === 'blogs' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BlogsTabContent blogs={currentBlogs} viewMode={viewMode} author={initialProfile} />
              
              {totalPages > 1 && (
                  <div className="mt-12">
                      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 600, behavior: 'smooth' }); }} />
                  </div>
              )}
          </div>
      )}

      {(activeTab === 'work' || activeTab === 'saved') && (
          currentProjects.length > 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                  )}
                  {viewMode === 'list' && (
                    <div className="flex flex-col border-t border-border">
                       {currentProjects.map((project) => (
                         <ProjectListItem key={project.id} project={project} />
                       ))}
                    </div>
                  )}
                  {totalPages > 1 && (
                      <div className="mt-12">
                          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 600, behavior: 'smooth' }); }} />
                      </div>
                  )}
              </div>
          ) : (
              <div className="h-64 border border-dashed border-border flex items-center justify-center text-muted-foreground font-mono text-sm uppercase">
                  Empty_Sector
              </div>
          )
      )}

      <NetworkRegistry isOpen={isConnectionsOpen} onClose={() => setIsConnectionsOpen(false)} type={connectionType} connections={connections} loading={connLoading} />
    </div>
  );
}