"use client";
import { useEffect, useState, use, useRef, useMemo } from "react"; 
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import ProfileHeader from "./_components/ProfileHeader";
import ProfileStats from "./_components/ProfileStats";
import ActivityGraph from "./_components/ActivityGraph";
import ProfileTabs from "./_components/ProfileTabs";
import ProjectCard from "../../_components/ProjectCard";
import Pagination from "@/components/ui/Pagination";
import { Loader2 } from "lucide-react";
import { registerView } from "@/app/actions/viewAnalytics";

const ITEMS_PER_PAGE = 6;

export default function ProfilePage({ params }) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  
  // UI State
  const [activeTab, setActiveTab] = useState("work");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  
  // Filtering State
  const [sortOrder, setSortOrder] = useState("latest"); // 'latest' | 'oldest' | 'popular'
  const [popularMetric, setPopularMetric] = useState("hype"); // 'views' | 'likes' | 'hype'

  // Data State
  const [profile, setProfile] = useState(null);
  const [workProjects, setWorkProjects] = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);
  const [followerStats, setFollowerStats] = useState({ followers: 0, following: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const hasCountedRef = useRef(false);

  // 1. Fetch Data
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true);
        // A. Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('*').eq('username', username).single();
        if (profileError || !profileData) throw new Error("Creator not found");
        setProfile(profileData);

        // B. Work
        const { data: projectsData } = await supabase
          .from('projects').select('*, author:profiles!owner_id(*)')
          .eq('owner_id', profileData.id).eq('status', 'published'); // Sort handled locally
        setWorkProjects(projectsData || []);

        // C. Saved
        const { data: likedData } = await supabase
          .from('project_likes').select('projects(*, author:profiles!owner_id(*))')
          .eq('user_id', profileData.id);
        const likedProjects = likedData?.map(item => item.projects).filter(Boolean) || [];
        setSavedProjects(likedProjects);

        // D. Followers
        const { count: followersCount } = await supabase
          .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id);
        const { count: followingCount } = await supabase
          .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id);
        setFollowerStats({ followers: followersCount || 0, following: followingCount || 0 });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (username) fetchCreatorData();
  }, [username]);

  // 2. Increment View Count (Server Action Logic)
  useEffect(() => {
    if (!profile?.id) return;
    if (hasCountedRef.current) return;
    if (currentUser?.id === profile.id) return;

    hasCountedRef.current = true;
    
    const increment = async () => {
        // Updated to use Server Action for 24h debounce logic
        await registerView('profile', profile.id);
    };
    increment();
  }, [profile, currentUser]);

  // 3. Reset pagination when tab/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortOrder, popularMetric]);

  // 4. SORTING LOGIC
  const sortedProjects = useMemo(() => {
    let list = activeTab === "work" ? [...workProjects] : [...savedProjects];

    return list.sort((a, b) => {
        if (sortOrder === 'latest') {
            return new Date(b.created_at) - new Date(a.created_at);
        }
        if (sortOrder === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        }
        if (sortOrder === 'popular') {
            if (popularMetric === 'views') return (b.views || 0) - (a.views || 0);
            if (popularMetric === 'likes') return (b.likes_count || 0) - (a.likes_count || 0);
            if (popularMetric === 'hype') {
                // Hype Score: Views + (Likes * 5)
                const scoreA = (a.views || 0) + ((a.likes_count || 0) * 5);
                const scoreB = (b.views || 0) + ((b.likes_count || 0) * 5);
                return scoreB - scoreA;
            }
        }
        return 0;
    });
  }, [workProjects, savedProjects, activeTab, sortOrder, popularMetric]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground font-mono">
        <p>404 // NODE_NOT_FOUND</p>
    </div>
  );

  // --- UPDATED STATS CALCULATION ---
  const publicStats = {
    projects: workProjects.length,
    followers: followerStats.followers,
    following: followerStats.following,
    likes: workProjects.reduce((acc, p) => acc + (p.likes_count || 0), 0),
    // 1. Node Reach: Direct from profile table
    nodeReach: profile.views || 0,
    // 2. Project Traffic: Sum of all project views
    projectTraffic: workProjects.reduce((acc, p) => acc + (p.views || 0), 0)
  };

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProjects = sortedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
            <ProfileHeader user={profile} currentUser={currentUser} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2">
                <ProfileStats stats={publicStats} />
            </div>
            <div className="lg:col-span-1">
                <ActivityGraph projects={workProjects} />
            </div>
        </div>

        {/* Updated Tabs with Sorting Props */}
        <ProfileTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            viewMode={viewMode}
            setViewMode={setViewMode}
            workCount={workProjects.length}
            savedCount={savedProjects.length}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            popularMetric={popularMetric}
            setPopularMetric={setPopularMetric}
        />

        {currentProjects.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "flex flex-col gap-4 max-w-4xl mx-auto"
                }>
                    {currentProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
                
                {/* --- PAGINATION COMPONENT --- */}
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
        )}
      </div>
    </div>
  );
}