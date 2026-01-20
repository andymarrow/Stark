"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Search, 
  MessageSquare, 
  Plus, 
  User, 
  Bell, 
  Settings, 
  LogOut,
  Megaphone // Added for Announcements
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper for consistent avatar fetching logic
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
const getAvatar = (profile) => {
    return profile?.avatar_url || profile?.user_metadata?.avatar_url || DEFAULT_AVATAR;
};

export default function DesktopNavbar() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg">
            S
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white group-hover:text-red-600 transition-colors">
            Stark
          </span>
        </Link>

        {/* Center: Search Trigger */}
        <div className="hidden lg:flex items-center">
            <div 
                className="relative group w-[300px] cursor-pointer"
                onClick={() => setOpen(true)}
            >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-hover:text-red-600 transition-colors pointer-events-none" />
                <div className="w-full h-10 pl-10 pr-12 
                             bg-zinc-100 dark:bg-zinc-900 
                             border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700
                             flex items-center text-sm font-mono text-zinc-500 dark:text-zinc-400 
                             transition-all rounded-none uppercase tracking-tighter">
                    search_index...
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <kbd className="inline-flex h-5 select-none items-center gap-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-500">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium mr-4 uppercase font-mono tracking-tighter">
            <Link href="/explore" className={`transition-colors ${pathname === '/explore' ? 'text-red-600 font-bold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>Explore</Link>
            <Link href="/contests" className={`transition-colors ${pathname.startsWith('/contests') ? 'text-red-600 font-bold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>Contests</Link>
            <Link href="/trending" className={`transition-colors ${pathname === '/trending' ? 'text-red-600 font-bold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>Trending</Link>
          </nav>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/chat">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white relative">
                    <MessageSquare size={18} />
                </Button>
            </Link>
            
            <Link href="/create">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-red-600 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <Plus size={20} />
                </Button>
            </Link>
          </div>
          
          <div className="hidden md:block h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2" />
          
          <ThemeToggle />
          
          {/* --- DYNAMIC AUTH SECTION --- */}
          {loading ? (
             <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 animate-pulse ml-2" />
          ) : user ? (
            /* LOGGED IN: Profile Dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative ml-2 cursor-pointer group">
                  <Avatar className="h-9 w-9 rounded-none border border-zinc-200 dark:border-zinc-800 group-hover:border-red-600 transition-colors">
                    <AvatarImage 
                        src={getAvatar(userProfile || user)} 
                        className="object-cover" 
                    />
                    <AvatarFallback className="rounded-none bg-zinc-100 dark:bg-zinc-800 p-0 overflow-hidden">
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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                  )}
                </div>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-60 rounded-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-0 mt-2 shadow-2xl">
                
                {/* Header Label */}
                <DropdownMenuLabel className="font-mono text-[10px] uppercase text-zinc-500 dark:text-zinc-400 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  User_Node: {user.user_metadata?.username || 'STARK_USER'}
                </DropdownMenuLabel>
                
                {/* Menu Items */}
                <div className="p-1">
                    <DropdownMenuItem asChild className="rounded-none px-4 py-2.5 focus:bg-zinc-100 dark:focus:bg-zinc-900 cursor-pointer text-zinc-600 dark:text-zinc-300 focus:text-black dark:focus:text-white transition-colors">
                      <Link href="/profile" className="flex items-center w-full font-mono text-xs uppercase tracking-widest">
                        <User className="mr-3 h-4 w-4 opacity-70" />
                        My Dossier
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-none px-4 py-2.5 focus:bg-zinc-100 dark:focus:bg-zinc-900 cursor-pointer text-zinc-600 dark:text-zinc-300 focus:text-black dark:focus:text-white transition-colors">
                      <Link href="/profile?view=notifications" className="flex items-center justify-between w-full font-mono text-xs uppercase tracking-widest">
                        <div className="flex items-center">
                            <Bell className="mr-3 h-4 w-4 opacity-70" />
                            Signal_Inbox
                        </div>
                        {unreadCount > 0 && (
                            <span className="bg-red-600 text-white px-1.5 py-0.5 text-[9px] font-bold">
                                {unreadCount}
                            </span>
                        )}
                      </Link>
                    </DropdownMenuItem>

                    {/* NEW: System Broadcasts Link */}
                    <DropdownMenuItem asChild className="rounded-none px-4 py-2.5 focus:bg-zinc-100 dark:focus:bg-zinc-900 cursor-pointer text-zinc-600 dark:text-zinc-300 focus:text-black dark:focus:text-white transition-colors">
                      <Link href="/announcements" className="flex items-center w-full font-mono text-xs uppercase tracking-widest">
                        <Megaphone className="mr-3 h-4 w-4 opacity-70" />
                        System Broadcasts
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-none px-4 py-2.5 focus:bg-zinc-100 dark:focus:bg-zinc-900 cursor-pointer text-zinc-600 dark:text-zinc-300 focus:text-black dark:focus:text-white transition-colors">
                      <Link href="/profile?view=settings" className="flex items-center w-full font-mono text-xs uppercase tracking-widest">
                        <Settings className="mr-3 h-4 w-4 opacity-70" />
                        Configuration
                      </Link>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="m-0 bg-zinc-200 dark:bg-zinc-800" />
                
                {/* Logout */}
                <div className="p-1">
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="rounded-none px-4 py-2.5 focus:bg-red-50 dark:focus:bg-red-950/30 text-red-600 focus:text-red-700 dark:focus:text-red-500 cursor-pointer font-mono text-xs uppercase tracking-widest"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Terminate Session
                    </DropdownMenuItem>
                </div>

              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* LOGGED OUT: Login Button */
            <Link href="/login">
              <Button className="bg-zinc-900 dark:bg-red-600 hover:bg-zinc-800 dark:hover:bg-red-700 text-white font-mono text-xs uppercase tracking-widest h-9 px-6 rounded-none ml-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
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