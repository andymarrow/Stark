"use client";
import { useEffect, useState, use, useRef } from "react"; 
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import ProfileHeader from "./_components/ProfileHeader";
import ProfileStats from "./_components/ProfileStats";
import ActivityGraph from "./_components/ActivityGraph";
import ProfileTabs from "./_components/ProfileTabs";
import ProjectCard from "../../_components/ProjectCard";
import { Loader2 } from "lucide-react";

export default function ProfilePage({ params }) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState("work");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [workProjects, setWorkProjects] = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);

  // Ref to prevent double counting
  const hasCountedRef = useRef(false);

  // 1. FETCH DATA EFFECT
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true);

        // A. Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError || !profileData) throw new Error("Creator not found");
        setProfile(profileData);

        // B. Fetch Projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*, author:profiles!owner_id(*)')
          .eq('owner_id', profileData.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        
        setWorkProjects(projectsData || []);

        // C. Fetch Saved
        const { data: likedData } = await supabase
          .from('project_likes')
          .select('projects(*, author:profiles!owner_id(*))')
          .eq('user_id', profileData.id);
        
        const likedProjects = likedData?.map(item => item.projects).filter(Boolean) || [];
        setSavedProjects(likedProjects);

      } catch (err) {
        console.error("Profile Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchCreatorData();
  }, [username]);

  // 2. VIEW COUNTING EFFECT (Separated for reliability)
  useEffect(() => {
    // Wait until profile is loaded
    if (!profile?.id) return;
    
    // Prevent double counting
    if (hasCountedRef.current) return;

    // Logic: If user is logged out (anon) OR logged in but not the owner -> Count View
    const isOwner = currentUser?.id === profile.id;

    if (!isOwner) {
        hasCountedRef.current = true; // Mark as counted immediately
        
        const incrementView = async () => {
            const { error } = await supabase.rpc('increment_profile_view', { 
                target_user_id: profile.id 
            });
            
            if (error) {
                console.error("Node Reach Increment Failed:", error);
                hasCountedRef.current = false; // Reset if failed so it might try again? Or keep true to prevent spam.
            } else {
                console.log("Node Reach Incremented");
            }
        };
        incrementView();
    }
  }, [profile, currentUser]); // Depends on profile loading and auth resolving

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground font-mono">
        <p>404 // NODE_NOT_FOUND</p>
      </div>
    );
  }

  // Aggregated Stats
  const publicStats = {
    projects: workProjects.length,
    followers: 0, 
    following: 0,
    likes: workProjects.reduce((acc, p) => acc + (p.likes_count || 0), 0)
  };

  const displayProjects = activeTab === "work" ? workProjects 
                        : activeTab === "saved" ? savedProjects 
                        : [];

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
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

        <ProfileTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            viewMode={viewMode}
            setViewMode={setViewMode}
            workCount={workProjects.length}
            savedCount={savedProjects.length}
        />

        {displayProjects.length > 0 ? (
            <div className={`
                ${viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "flex flex-col gap-4 max-w-4xl mx-auto"} 
                animate-in fade-in slide-in-from-bottom-4 duration-500
            `}>
                {displayProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        ) : (
            <div className="h-64 border border-dashed border-border flex items-center justify-center text-muted-foreground font-mono text-sm uppercase">
                Empty_Collection
            </div>
        )}
      </div>
    </div>
  );
}