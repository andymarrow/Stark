"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";

// Icons
import { 
  Settings, Grid, Bell, LogOut, Loader2, 
  Scale, Shield, Users, UserPlus, X, Search, ArrowUpRight 
} from "lucide-react"; 

// Components
import PersonalHeader from "./_components/PersonalHeader";
import DashboardStats from "./_components/DashboardStats";
import MyProjectsManager from "./_components/MyProjectsManager";
import SettingsForm from "./_components/SettingsForm";
import NotificationsView from "./_components/NotificationsView";
import LoginRequiredState from "@/components/LoginRequiredState";
import TermsView from "./_components/legal/TermsView";
import PrivacyView from "./_components/legal/PrivacyView";
import NetworkRegistry from "./_components/NetworkRegistry";

// Shadcn UI (Assuming you have dialog)
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";

function ProfileContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentView = searchParams.get("view") || "projects";
  
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- NEW: CONNECTION STATES ---
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [connectionType, setConnectionType] = useState("followers"); // "followers" | "following"
  const [connections, setConnections] = useState([]);
  const [connLoading, setConnLoading] = useState(false);
  const [connSearch, setConnSearch] = useState("");

  const [stats, setStats] = useState({
    totalViews: 0,
    followers: 0,
    following: 0,
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

      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;

      // 2. Fetch Projects Data for Totals
      const { data: projectsData } = await supabase
        .from('projects')
        .select('views, likes_count')
        .eq('owner_id', user.id);

      // 3. Fetch Follower Count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      // 4. NEW: Fetch Following Count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      // 5. Unread Notifications
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
        following: followingCount || 0,
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

  // --- NEW: FETCH CONNECTIONS LIST ---
  const fetchConnectionsList = async (type) => {
    if (!user?.id) return;
    setConnLoading(true);
    setConnectionType(type);
    setIsConnectionsOpen(true);

    try {
        let query;
        if (type === 'followers') {
            // Get people who follow me
            query = supabase
                .from('follows')
                .select('profile:profiles!follows_follower_id_fkey(*)')
                .eq('following_id', user.id);
        } else {
            // Get people I follow
            query = supabase
                .from('follows')
                .select('profile:profiles!follows_following_id_fkey(*)')
                .eq('follower_id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setConnections(data.map(d => d.profile));
    } catch (err) {
        toast.error("REGISTRY_LOAD_ERROR");
    } finally {
        setConnLoading(false);
    }
  };

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

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 size={32} className="animate-spin text-accent" /></div>;
  if (!user) return <div className="min-h-screen bg-background pt-16"><LoginRequiredState message="Dossier Restricted" description="Your personal node profile is offline. Log in to view your stats." /></div>;
  if (loading || !profile) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse"><Loader2 size={32} className="animate-spin text-accent" /><span className="font-mono text-xs uppercase tracking-widest">Accessing personal data...</span></div></div>;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10 ">
      
      <PersonalHeader user={profile} onUpdate={fetchProfileAndStats} />
      
      {/* Updated DashboardStats with onClick handler */}
      <DashboardStats stats={stats} onStatClick={fetchConnectionsList} />

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-3">
                <div className="sticky top-24 space-y-8">
                    <div className="space-y-1">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 pl-2">System_Directories</h3>
                        <NavButton icon={Grid} label="My Projects" active={currentView === "projects"} onClick={() => handleViewChange("projects")} />
                        <NavButton icon={Bell} label="Notifications" badge={unreadCount > 0 ? unreadCount.toString() : null} active={currentView === "notifications"} onClick={() => handleViewChange("notifications")} />
                        <NavButton icon={Settings} label="Settings" active={currentView === "settings"} onClick={() => handleViewChange("settings")} />
                    </div>

                    <div className="space-y-1 pt-4 border-t border-border border-dashed">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 pl-2">Legal_Protocols</h3>
                        <NavButton icon={Scale} label="Terms of Service" active={currentView === "terms"} onClick={() => handleViewChange("terms")} />
                        <NavButton icon={Shield} label="Privacy Policy" active={currentView === "privacy"} onClick={() => handleViewChange("privacy")} />
                    </div>

                    <div className="space-y-1 pt-4 border-t border-border border-dashed">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 pl-2">Security</h3>
                        <NavButton icon={LogOut} label="Terminate Session" onClick={handleLogout} />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9">
                <div className="bg-background min-h-[500px]">
                    {currentView === 'projects' && <MyProjectsManager user={user} onRefresh={fetchProfileAndStats} />}
                    {currentView === 'settings' && <SettingsForm user={profile} onUpdate={fetchProfileAndStats} />}
                    {currentView === 'notifications' && <NotificationsView onNotificationRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />}
                    {currentView === 'terms' && <TermsView />}
                    {currentView === 'privacy' && <PrivacyView />}
                </div>
            </div>
        </div>
      </div>

      {/* --- NETWORK REGISTRY MODAL --- */}
      <Dialog open={isConnectionsOpen} onOpenChange={setIsConnectionsOpen}>
        <DialogContent className="max-w-2xl bg-background border border-border p-0 rounded-none overflow-hidden gap-0">
            <DialogHeader className="p-6 border-b border-border bg-secondary/10">
                <div className="flex justify-between items-center">
                    <div>
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                            {connectionType === 'followers' ? <Users size={20}/> : <UserPlus size={20}/>}
                            {connectionType === 'followers' ? "Node_Followers" : "Following_Registry"}
                        </DialogTitle>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                            Status: {connLoading ? "SYNCHRONIZING..." : "LINK_ESTABLISHED"}
                        </p>
                    </div>
                    <button onClick={() => setIsConnectionsOpen(false)} className="p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Registry Search */}
                <div className="relative mt-6 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search Registry..." 
                        value={connSearch}
                        onChange={(e) => setConnSearch(e.target.value)}
                        className="w-full h-10 pl-10 bg-background border border-border focus:border-accent outline-none text-xs font-mono uppercase transition-colors"
                    />
                </div>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                {connLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <Loader2 className="animate-spin text-accent" />
                        <span className="text-[10px] font-mono uppercase tracking-widest">Querying Node Database...</span>
                    </div>
                ) : connections.length > 0 ? (
                    <div className="grid grid-cols-1 gap-1">
                        {connections
                          .filter(c => c.username.toLowerCase().includes(connSearch.toLowerCase()) || c.full_name?.toLowerCase().includes(connSearch.toLowerCase()))
                          .map((conn) => (
                            <Link 
                                key={conn.id} 
                                href={`/profile/${conn.username}`}
                                className="group flex items-center justify-between p-3 hover:bg-secondary/10 border border-transparent hover:border-border transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative w-12 h-12 bg-secondary border border-border overflow-hidden">
                                        <Image 
                                            src={conn.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                                            alt={conn.username} 
                                            fill 
                                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm truncate uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
                                            {conn.full_name || conn.username}
                                        </h4>
                                        <p className="text-[10px] font-mono text-muted-foreground truncate uppercase">
                                            @{conn.username} • {conn.role || 'CREATOR'}
                                        </p>
                                    </div>
                                </div>
                                <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-accent transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center border border-dashed border-border m-2">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">No_Connections_Found</p>
                    </div>
                )}
            </div>
        </DialogContent>
      </Dialog>
     
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

export default function PersonalProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 size={32} className="animate-spin text-accent" /></div>}>
            <ProfileContent />
        </Suspense>
    );
}

function NavButton({ icon: Icon, label, badge, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-between p-2 pl-3 text-sm font-medium transition-all group border-l-2 ${active ? "border-accent text-foreground bg-accent/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10 hover:border-border"}`}>
            <div className="flex items-center gap-3">
                <Icon size={16} className={active ? "text-accent" : "group-hover:text-accent transition-colors"} />
                <span className="font-mono uppercase text-[10px] tracking-widest">{label}</span>
            </div>
            {badge && badge !== "0" && <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-none font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in">{badge}</span>}
        </button>
    )
}