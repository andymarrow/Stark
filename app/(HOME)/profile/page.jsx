"use client";
import { useState } from "react";
import PersonalHeader from "./_components/PersonalHeader";
import DashboardStats from "./_components/DashboardStats";
import MyProjectsManager from "./_components/MyProjectsManager";
import SettingsForm from "./_components/SettingsForm";
import NotificationsView from "./_components/NotificationsView";
import { Settings, Grid, Bell, Shield, LogOut } from "lucide-react";

// --- MOCK LOGGED IN USER DATA ---
const MY_PROFILE = {
  name: "Miheret T.",
  username: "miheret_dev",
  email: "miheret@stark.com",
  plan: "pro",
  avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop",
  bio: "Building digital cathedrals. Full Stack Developer & UI Enthusiast. Creating the Stark Platform.",
  location: "Addis Ababa, ET",
  website: "stark.network",
  joined: "Dec 2024",
  stats: {
    totalViews: "45.2k",
    followers: "1,204",
    likes: "8.5k",
    profileVisits: "342"
  }
};

export default function PersonalProfilePage() {
  const [activeView, setActiveView] = useState("projects"); // 'projects' | 'settings' | 'notifications'

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10  md:pt-0">
      
      {/* 1. Header & Stats */}
      <PersonalHeader user={MY_PROFILE} />
      <DashboardStats stats={MY_PROFILE.stats} />

      {/* 2. Main Control Area */}
      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Navigation / Settings */}
            <div className="lg:col-span-3">
                <div className="sticky top-24 space-y-8">
                    
                    {/* Navigation Menu */}
                    <div className="space-y-1">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 pl-2">Dashboard</h3>
                        
                        <NavButton 
                            icon={Grid} 
                            label="My Projects" 
                            active={activeView === "projects"} 
                            onClick={() => setActiveView("projects")}
                        />
                        <NavButton 
                            icon={Bell} 
                            label="Notifications" 
                            badge="4" 
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

                    <div className="space-y-1">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 pl-2">Account</h3>
                        <NavButton icon={LogOut} label="Log Out" />
                    </div>
                    
                    {/* Pro Badge */}
                    <div className="p-4 bg-secondary/10 border border-border mt-4">
                        <h4 className="font-bold text-sm mb-1">Stark Pro</h4>
                        <p className="text-xs text-muted-foreground mb-3">Your plan renews on Jan 1st.</p>
                        <button className="text-[10px] font-mono text-accent hover:underline uppercase">Manage Billing</button>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Dynamic Content */}
            <div className="lg:col-span-9">
                <div className="bg-background min-h-[500px]">
                    {activeView === 'projects' && <MyProjectsManager />}
                    {activeView === 'settings' && <SettingsForm user={MY_PROFILE} />}
                    {activeView === 'notifications' && <NotificationsView />}
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
                <Icon size={16} />
                <span>{label}</span>
            </div>
            {badge && (
                <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full font-mono">{badge}</span>
            )}
        </button>
    )
}