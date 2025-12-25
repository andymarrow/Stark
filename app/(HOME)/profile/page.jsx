"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import PersonalHeader from "./_components/PersonalHeader";
import DashboardStats from "./_components/DashboardStats";
import MyProjectsManager from "./_components/MyProjectsManager";
import SettingsForm from "./_components/SettingsForm";
import NotificationsView from "./_components/NotificationsView";
import { Settings, Grid, Bell, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  /**
   * Helper to change the view and update the URL
   */
  const handleViewChange = (viewName) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", viewName);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const fetchProfileAndStats = useCallback(async () => {
    if (!user) return;
    
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
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchProfileAndStats();
    }
  }, [user, authLoading, router, fetchProfileAndStats]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.info("SESSION_TERMINATED");
    } catch (error) {
      toast.error("LOGOUT_ERROR");
    }
  };

  // Ensure we don't try to render sub-components if user is null
  if (authLoading || loading || !profile || !user) {
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
    <div className="min-h-screen bg-background pb-24 md:pb-10 pt-16 md:pt-0">
      
      <PersonalHeader user={profile} onUpdate={fetchProfileAndStats} />
      <DashboardStats stats={stats} />

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-3">
                <div className="sticky top-24 space-y-8">
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
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Page Component wrapped in Suspense for Next.js 15 useSearchParams
 */
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