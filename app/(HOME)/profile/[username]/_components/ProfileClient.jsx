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

// NEW: Network Registry Imports
import NetworkRegistry from "../../_components/NetworkRegistry";
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
  currentUser,
  username 
}) {
  // UI State
  const [activeTab, setActiveTab] = useState("work");
  const [viewMode, setViewMode] = useState("grid");
  
  // --- NEW: CONNECTION STATES ---
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

  // --- NEW: FETCH PUBLIC CONNECTIONS ---
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

  const sortedProjects = useMemo(() => {
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

  const publicStats = {
    projects: initialWork.length,
    followers: initialFollowerStats.followers,
    following: initialFollowerStats.following,
    likes: initialWork.reduce((acc, p) => acc + (p.likes_count || 0), 0),
    nodeReach: initialProfile.views || 0,
    projectTraffic: initialWork.reduce((acc, p) => acc + (p.views || 0), 0)
  };

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
              {/* Updated ProfileStats with Click Handler */}
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
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          popularMetric={popularMetric}
          setPopularMetric={setPopularMetric}
          contestEntries={contestEntries}
          judgingHistory={judgingHistory}
      />

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

      {/* --- SHARED NETWORK REGISTRY MODAL --- */}
      <NetworkRegistry 
          isOpen={isConnectionsOpen}
          onClose={() => setIsConnectionsOpen(false)}
          type={connectionType}
          connections={connections}
          loading={connLoading}
      />
    </div>
  );
}