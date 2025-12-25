"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import PersonalHeader from "./_components/PersonalHeader";
import DashboardStats from "./_components/DashboardStats";
import MyProjectsManager from "./_components/MyProjectsManager";
import SettingsForm from "./_components/SettingsForm";
import NotificationsView from "./_components/NotificationsView";
import { Settings, Grid, Bell, Shield, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PersonalProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [activeView, setActiveView] = useState("projects");
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
   * REALTME AGGREGATION LOGIC
   * Fetches real counts for everything from the DB
   */
  const fetchProfileAndStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // 1. Fetch Profile Base Data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // 2. Fetch ALL projects to calculate global traffic and star counts
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('views, likes_count')
        .eq('owner_id', user.id);

      if (projectsError) throw projectsError;

      // 3. Fetch Real Follower Count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      // 4. Fetch Unread Notifications Count
      const { count: unread } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      // --- CALCULATIONS ---
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
      toast.error("SECURITY_SYNC_FAILURE", { description: "Link to database unstable." });
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

      // --- REALTIME NOTIFICATION LISTENER ---
      // This listens for any new notifications sent to the user
      const channel = supabase
        .channel(`realtime-notifs-${user.id}`)
        .on(
          'postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `receiver_id=eq.${user.id}` 
          }, 
          () => {
            // Increment unread badge and show a toast
            setUnreadCount(prev => prev + 1);
            toast("New System Signal", { 
                icon: <Bell className="text-accent" size={14} />,
                description: "New activity detected in your feed."
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, authLoading, router, fetchProfileAndStats]);

  // When switching to notifications view, we can assume the user will see them
  // You might want to add mark-as-read logic here or inside the component
  useEffect(() => {
    if (activeView === 'notifications') {
        // Reset local badge count when entering view
        // setUnreadCount(0); 
    }
  }, [activeView]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.info("SESSION_TERMINATED");
    } catch (error) {
      toast.error("LOGOUT_ERROR");
    }
  };

  if (authLoading || loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <Loader2 size={32} className="animate-spin text-accent" />
          <span className="font-mono text-xs uppercase tracking-widest">Accessing Personal Data...</span>
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
                            active={activeView === "projects"} 
                            onClick={() => setActiveView("projects")}
                        />
                        
                        <NavButton 
                            icon={Bell} 
                            label="Notifications" 
                            badge={unreadCount > 0 ? unreadCount.toString() : null} 
                            active={activeView === "notifications"} 
                            onClick={() => setActiveView("notifications")}
                        />
                        
                        <NavButton 
                            icon={Settings} 
                            label="Settings" 
                            active={activeView === "settings"} 
                            onClick={() => setActiveView("settings")}
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
                    
                    <div className="p-4 bg-secondary/10 border border-border mt-4">
                        <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Stark Protocol</h4>
                        <p className="text-[10px] text-muted-foreground mb-3 font-mono uppercase">
                            STATUS: {profile.role || 'CREATOR'}
                        </p>
                        <button className="text-[10px] font-mono text-accent hover:underline uppercase font-bold">Access Logs</button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9">
                <div className="bg-background min-h-[500px]">
                    {activeView === 'projects' && (
                      <MyProjectsManager user={user} onRefresh={fetchProfileAndStats} />
                    )}
                    {activeView === 'settings' && (
                      <SettingsForm user={profile} onUpdate={fetchProfileAndStats} />
                    )}
                    {activeView === 'notifications' && (
                      <NotificationsView />
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
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