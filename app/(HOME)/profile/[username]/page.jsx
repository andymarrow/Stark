"use client";
import { useEffect, useState, use, useRef } from "react"; // Added useRef
import { supabase } from "@/lib/supabaseClient";
import { useAuth  } from "@/app/_context/AuthContext";
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

  // Ref to prevent double counting in React Strict Mode during development
  const hasCountedRef = useRef(false);

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Profile by Username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError || !profileData) throw new Error("Creator not found");
        setProfile(profileData);

        // --- NEW: NODE REACH LOGIC (INCREMENT VIEW) ---
        // Only count if it's not the owner viewing their own public profile
        if (!hasCountedRef.current && currentUser?.id !== profileData.id) {
            await supabase.rpc('increment_profile_view', { target_user_id: profileData.id });
            hasCountedRef.current = true;
        }

        // 2. Fetch Creator's Projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*, author:profiles!owner_id(*)')
          .eq('owner_id', profileData.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        
        setWorkProjects(projectsData || []);

        // 3. Fetch Saved Projects
        const { data: likedData } = await supabase
          .from('project_likes')
          .select('projects(*, author:profiles!owner_id(*))')
          .eq('user_id', profileData.id);
        
        const likedProjects = likedData?.map(item => item.projects).filter(Boolean) || [];
        setSavedProjects(likedProjects);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchCreatorData();
  }, [username, currentUser?.id]);

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

  // Aggregated Stats for the public view
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