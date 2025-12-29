"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // Ensure Image is imported for the fallback
import { usePathname } from "next/navigation";
import { 
  Search, 
  MessageSquare, 
  Plus, 
  User, 
  Bell, 
  Settings, 
  LogOut, 
  ShieldCheck 
} from "lucide-react";
import ThemeToggle from "@/components/Themetoggle"; 
import { Button } from "@/components/ui/button";
import { GlobalCommandMenu } from "./GlobalCommandMenu";
import { useAuth } from "@/app/_context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatar, DEFAULT_AVATAR } from "@/constants/assets";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DesktopNavbar() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // NEW: Store real DB profile for consistent avatar
  const [userProfile, setUserProfile] = useState(null);
  const pathname = usePathname();

  // --- 1. FETCH REAL PROFILE (Avatar Sync) ---
  useEffect(() => {
    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
        
        if (data) setUserProfile(data);
    };
    fetchProfile();
  }, [user]);

  // --- 2. REALTIME NOTIFICATIONS LOGIC ---
  useEffect(() => {
    if (!user) return;

    // Initial Count Fetch
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnreadCount();

    // Realtime Listener
    const channel = supabase
      .channel(`navbar-notifs-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-foreground text-background flex items-center justify-center font-bold text-lg">
            S
          </div>
          <span className="font-bold text-xl tracking-tight group-hover:text-accent transition-colors">
            Stark
          </span>
        </Link>

        {/* Center: Search Trigger */}
        <div className="hidden lg:flex items-center">
            <div 
                className="relative group w-[300px] cursor-pointer"
                onClick={() => setOpen(true)}
            >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors pointer-events-none" />
                <div className="w-full h-10 pl-10 pr-12 bg-secondary/50 border border-transparent 
                             hover:border-accent/30 group-hover:bg-background
                             flex items-center text-sm font-mono text-muted-foreground 
                             transition-all rounded-none uppercase tracking-tighter">
                    search_index...
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <kbd className="inline-flex h-5 select-none items-center gap-1 bg-background border border-border px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium mr-4 uppercase font-mono tracking-tighter">
            <Link href="/explore" className={`transition-colors ${pathname === '/explore' ? 'text-accent' : 'hover:text-accent'}`}>Explore</Link>
            <Link href="/trending" className={`transition-colors ${pathname === '/trending' ? 'text-accent' : 'hover:text-accent'}`}>Trending</Link>
          </nav>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/chat">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-secondary text-muted-foreground hover:text-foreground relative">
                    <MessageSquare size={18} />
                </Button>
            </Link>
            
            <Link href="/create">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-secondary text-muted-foreground hover:text-accent border border-transparent hover:border-border">
                    <Plus size={20} />
                </Button>
            </Link>
          </div>
          
          <div className="hidden md:block h-4 w-[1px] bg-border mx-2" />
          
          <ThemeToggle />
          
          {/* --- DYNAMIC AUTH SECTION --- */}
          {loading ? (
             <div className="w-9 h-9 bg-secondary/50 animate-pulse ml-2" />
          ) : user ? (
            /* LOGGED IN: Profile Dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative ml-2 cursor-pointer group">
                  <Avatar className="h-9 w-9 rounded-none border border-border group-hover:border-accent transition-colors">
                    {/* UPDATED: Prioritize userProfile, fall back to auth user, then default */}
                    <AvatarImage 
                        src={getAvatar(userProfile || user)} 
                        className="object-cover" 
                    />
                    <AvatarFallback className="rounded-none bg-secondary p-0 overflow-hidden">
                       <Image 
                          src={DEFAULT_AVATAR} 
                          alt="Fallback" 
                          fill 
                          className="object-cover" 
                       />
                    </AvatarFallback>
                  </Avatar>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                    </span>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-none border-border bg-background p-0 mt-2 shadow-2xl">
                <DropdownMenuLabel className="font-mono text-[10px] uppercase text-muted-foreground px-4 py-3 bg-secondary/10">
                  User_Node: {user.user_metadata?.username || 'STARK_USER'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                
                <DropdownMenuItem asChild className="rounded-none px-4 py-2.5 focus:bg-secondary cursor-pointer">
                  <Link href="/profile" className="flex items-center w-full font-mono text-xs uppercase tracking-widest">
                    <User className="mr-3 h-4 w-4 text-muted-foreground" />
                    My Dossier
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-none px-4 py-2.5 focus:bg-secondary cursor-pointer">
                  <Link href="/profile?view=notifications" className="flex items-center justify-between w-full font-mono text-xs uppercase tracking-widest">
                    <div className="flex items-center">
                        <Bell className="mr-3 h-4 w-4 text-muted-foreground" />
                        Signal_Inbox
                    </div>
                    {unreadCount > 0 && (
                        <span className="bg-accent text-white px-1.5 py-0.5 text-[9px] font-bold">
                            {unreadCount}
                        </span>
                    )}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-none px-4 py-2.5 focus:bg-secondary cursor-pointer">
                  <Link href="/profile?view=settings" className="flex items-center w-full font-mono text-xs uppercase tracking-widest">
                    <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                    Configuration
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="rounded-none px-4 py-2.5 focus:bg-red-500/10 text-red-500 focus:text-red-500 cursor-pointer font-mono text-xs uppercase tracking-widest"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Terminate Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* LOGGED OUT: Login Button */
            <Link href="/login">
              <Button className="bg-accent hover:bg-red-700 text-white font-mono text-xs uppercase tracking-widest h-9 px-6 rounded-none ml-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
                  Login_Access
              </Button>
            </Link>
          )}
        </div>
      </div>

      <GlobalCommandMenu open={open} setOpen={setOpen} />
    </header>
  );
}