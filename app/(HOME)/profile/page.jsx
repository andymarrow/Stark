"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";

// Icons
import { Settings, Grid, Bell, LogOut, Loader2, Scale, Shield } from "lucide-react"; 

// Components
import PersonalHeader from "./_components/PersonalHeader";
import DashboardStats from "./_components/DashboardStats";
import MyProjectsManager from "./_components/MyProjectsManager";
import SettingsForm from "./_components/SettingsForm";
import NotificationsView from "./_components/NotificationsView";
import LoginRequiredState from "@/components/LoginRequiredState";

// NEW: Import Refactored Legal Components
import TermsView from "./_components/legal/TermsView";
import PrivacyView from "./_components/legal/PrivacyView";

/**
 * The inner content component that handles search params
 */
function ProfileContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Get current view from URL (?view=settings), default to "projects"
  const currentView = searchParams.get("view") || "projects";
  
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalViews: 0,
    followers: 0,
    starsEarned: 0,
    nodeReach: 0
  });

  const handleViewChange = (viewName) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", viewName);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

 const fetchProfileAndStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('views, likes_count')
        .eq('owner_id', user.id);

      if (projectsError) throw projectsError;

      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: unread } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      const totalProjectViews = projectsData?.reduce((acc, p) => acc + (p.views || 0), 0) || 0;
      const totalStarsEarned = projectsData?.reduce((acc, p) => acc + (p.likes_count || 0), 0) || 0;

      setProfile(profileData);
      setUnreadCount(unread || 0);
      setStats({
        totalViews: totalProjectViews,
        followers: followersCount || 0,
        starsEarned: totalStarsEarned,
        nodeReach: profileData.views || 0 
      });

    } catch (error) {
      console.error("Critical Sync Error:", error);
      toast.error("SECURITY_SYNC_FAILURE");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchProfileAndStats();
    }
  }, [user?.id, fetchProfileAndStats]); 

  const handleLogout = async () => {
    try {
      await signOut();
      toast.info("SESSION_TERMINATED");
    } catch (error) {
      toast.error("LOGOUT_ERROR");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="min-h-screen bg-background pt-16">
            <LoginRequiredState 
                message="Dossier Restricted" 
                description="Your personal node profile is offline. Log in to view your stats, projects, and settings."
            />
        </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <Loader2 size={32} className="animate-spin text-accent" />
          <span className="font-mono text-xs uppercase tracking-widest">Accessing personal data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10 ">
      
      <PersonalHeader user={profile} onUpdate={fetchProfileAndStats} />
      <DashboardStats stats={stats} />

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="lg:col-span-3">
                <div className="sticky top-24 space-y-8">
                    
                    {/* Main Directories */}
                    <div className="space-y-1">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 pl-2">System_Directories</h3>
                        
                        <NavButton 
                            icon={Grid} 
                            label="My Projects" 
                            active={currentView === "projects"} 
                            onClick={() => handleViewChange("projects")}
                        />
                        
                        <NavButton 
                            icon={Bell} 
                            label="Notifications" 
                            badge={unreadCount > 0 ? unreadCount.toString() : null} 
                            active={currentView === "notifications"} 
                            onClick={() => handleViewChange("notifications")}
                        />
                        
                        <NavButton 
                            icon={Settings} 
                            label="Settings" 
                            active={currentView === "settings"} 
                            onClick={() => handleViewChange("settings")}
                        />
                    </div>

                    {/* Legal Protocols */}
                    <div className="space-y-1 pt-4 border-t border-border border-dashed">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 pl-2">Legal_Protocols</h3>
                        <NavButton 
                            icon={Scale} 
                            label="Terms of Service" 
                            active={currentView === "terms"} 
                            onClick={() => handleViewChange("terms")}
                        />
                        <NavButton 
                            icon={Shield} 
                            label="Privacy Policy" 
                            active={currentView === "privacy"} 
                            onClick={() => handleViewChange("privacy")}
                        />
                    </div>

                    {/* Security */}
                    <div className="space-y-1 pt-4 border-t border-border border-dashed">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 pl-2">Security</h3>
                        <NavButton 
                          icon={LogOut} 
                          label="Terminate Session" 
                          onClick={handleLogout} 
                        />
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-9">
                <div className="bg-background min-h-[500px]">
                    {currentView === 'projects' && (
                      <MyProjectsManager user={user} onRefresh={fetchProfileAndStats} />
                    )}
                    {currentView === 'settings' && (
                      <SettingsForm user={profile} onUpdate={fetchProfileAndStats} />
                    )}
                    {currentView === 'notifications' && (
                      <NotificationsView onNotificationRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />
                    )}
                    
                    {/* Legal Views Rendered Here */}
                    {currentView === 'terms' && <TermsView />}
                    {currentView === 'privacy' && <PrivacyView />}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function PersonalProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-accent" />
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}

// --- SUB COMPONENTS ---

function NavButton({ icon: Icon, label, badge, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center justify-between p-2 pl-3 text-sm font-medium transition-all group border-l-2
                ${active 
                    ? "border-accent text-foreground bg-accent/5" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10 hover:border-border"}
            `}
        >
            <div className="flex items-center gap-3">
                <Icon size={16} className={active ? "text-accent" : "group-hover:text-accent transition-colors"} />
                <span className="font-mono uppercase text-[10px] tracking-widest">{label}</span>
            </div>
            {badge && badge !== "0" && (
                <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-none font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in">
                  {badge}
                </span>
            )}
        </button>
    )
}