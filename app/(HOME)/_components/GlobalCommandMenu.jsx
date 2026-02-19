"use client";
import * as React from "react";
import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabaseClient";
import {
  CreditCard,
  Settings,
  User,
  LayoutGrid,
  Zap,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Plus,
  FileCode,
  Loader2,
  Trophy
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TABS = [
  { id: "all", label: "ALL" },
  { id: "users", label: "USERS" },
  { id: "projects", label: "PROJECTS" },
  { id: "contests", label: "CONTESTS" },
];

export function GlobalCommandMenu({ open, setOpen }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  
  // --- STATE ---
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState({ users: [], projects: [], contests: [] });
  const [loading, setLoading] = useState(false);

  // Keyboard Shortcut (Cmd+K)
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  // Reset tab when closing
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveTab("all");
      setResults({ users: [], projects: [], contests: [] });
    }
  }, [open]);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
        setResults({ users: [], projects: [], contests: [] });
        return;
    }

    const delayDebounceFn = setTimeout(async () => {
        setLoading(true);
        
        // Limits: 3 items per category for 'all', 10 items for specific tabs
        const limit = activeTab === "all" ? 3 : 10;
        const searchTerm = `%${trimmedQuery}%`; // SQL Wildcards

        try {
            const promises = [];

            // 1. Users Query
            if (activeTab === "all" || activeTab === "users") {
                promises.push(
                    supabase
                        .from('profiles')
                        .select('id, username, full_name, avatar_url')
                        // Correct PostgREST syntax for OR with ILIKE
                        .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
                        .limit(limit)
                        .then(({ data, error }) => {
                            if (error) console.error("Users Search Error:", error);
                            return { type: 'users', data: data || [] };
                        })
                );
            }

            // 2. Projects Query
            if (activeTab === "all" || activeTab === "projects") {
                promises.push(
                    supabase
                        .from('projects')
                        .select('id, title, slug, type')
                        .ilike('title', searchTerm)
                        .eq('status', 'published')
                        .limit(limit)
                        .then(({ data, error }) => {
                            if (error) console.error("Projects Search Error:", error);
                            return { type: 'projects', data: data || [] };
                        })
                );
            }

            // 3. Contests Query
            if (activeTab === "all" || activeTab === "contests") {
                promises.push(
                    supabase
                        .from('contests')
                        .select('id, title, slug, is_public')
                        .ilike('title', searchTerm)
                        .eq('is_public', true)
                        .limit(limit)
                        .then(({ data, error }) => {
                            if (error) console.error("Contests Search Error:", error);
                            return { type: 'contests', data: data || [] };
                        })
                );
            }

            // Execute in parallel
            const resultsArray = await Promise.all(promises);
            
            // Reconstruct State
            const newResults = { users: [], projects: [], contests: [] };
            resultsArray.forEach(r => {
                if(r?.type) newResults[r.type] = r.data;
            });

            // console.log("Search Results:", newResults); // Debugging
            setResults(newResults);

        } catch (err) {
            console.error("Global Search Exception:", err);
        } finally {
            setLoading(false);
        }
    }, 300); 

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeTab]);

  const run = (command) => {
    setOpen(false);
    command();
  };

  const hasResults = results.users.length > 0 || results.projects.length > 0 || results.contests.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      
      <CommandInput 
        placeholder="Type a command or search..." 
        value={query}
        onValueChange={setQuery}
      />

      {/* --- SEARCH FILTER TABS (Telegram Style) --- */}
      {query && (
        <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-secondary/5">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        px-3 py-1 text-[10px] font-mono font-bold transition-all border
                        ${activeTab === tab.id 
                            ? "bg-foreground text-background border-foreground" 
                            : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"}
                    `}
                >
                    {tab.label}
                </button>
            ))}
        </div>
      )}

      <CommandList className="max-h-[400px] overflow-y-auto custom-scrollbar">
        
        {/* --- LOADING STATE --- */}
        {loading && (
            <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="animate-spin w-5 h-5 text-accent" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Querying_Database...</span>
            </div>
        )}

        {/* --- RESULTS --- */}
        {!loading && query && (
            <>
                {/* 1. USERS */}
                {results.users.length > 0 && (
                    <CommandGroup heading={activeTab === 'all' ? "Users" : `Users (${results.users.length})`}>
                        {results.users.map((user) => (
                            <CommandItem 
                                key={user.id} 
                                value={`user-${user.username}`} // Unique value for cmdk
                                onSelect={() => run(() => router.push(`/profile/${user.username}`))}
                                className="cursor-pointer"
                            >
                                <Avatar className="h-6 w-6 mr-2 rounded-none border border-border">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="rounded-none text-[9px] bg-secondary">{user.username?.[0]}</AvatarFallback>
                                </Avatar>
                                <span>{user.full_name || user.username}</span>
                                <span className="ml-auto text-[10px] font-mono text-muted-foreground">@{user.username}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {/* 2. CONTESTS */}
                {results.contests.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading={activeTab === 'all' ? "Contests" : `Contests (${results.contests.length})`}>
                            {results.contests.map((contest) => (
                                <CommandItem 
                                    key={contest.id} 
                                    value={`contest-${contest.slug}`}
                                    onSelect={() => run(() => router.push(`/contests/${contest.slug}`))}
                                    className="cursor-pointer"
                                >
                                    <div className="w-6 h-6 mr-2 flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                                        <Trophy size={12} />
                                    </div>
                                    <span>{contest.title}</span>
                                    <span className="ml-auto text-[9px] font-mono text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 uppercase">
                                        Active
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* 3. PROJECTS */}
                {results.projects.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading={activeTab === 'all' ? "Projects" : `Projects (${results.projects.length})`}>
                            {results.projects.map((project) => (
                                <CommandItem 
                                    key={project.id} 
                                    value={`project-${project.slug}`}
                                    onSelect={() => run(() => router.push(`/project/${project.slug}`))}
                                    className="cursor-pointer"
                                >
                                    <div className="w-6 h-6 mr-2 flex items-center justify-center bg-secondary border border-border text-muted-foreground">
                                        <FileCode size={12} />
                                    </div>
                                    <span>{project.title}</span>
                                    <span className="ml-auto text-[9px] uppercase font-mono text-muted-foreground border border-border px-1.5 py-0.5">
                                        {project.type}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* Empty State */}
                {!hasResults && (
                    <div className="py-8 text-center text-muted-foreground">
                        <p className="text-sm font-mono">No results found for "{query}".</p>
                        {activeTab !== 'all' && (
                            <button 
                                className="text-xs mt-2 text-accent cursor-pointer hover:underline font-mono uppercase tracking-wide" 
                                onClick={() => setActiveTab('all')}
                            >
                                Switch to Global Search
                            </button>
                        )}
                    </div>
                )}
            </>
        )}

        {/* --- DEFAULT STATIC MENU (Only when no query) --- */}
        {!query && (
            <>
                <CommandGroup heading="Navigation">
                  <CommandItem value="nav-explore" onSelect={() => run(() => router.push('/explore'))}>
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    <span>Explore</span>
                    <CommandShortcut>G E</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="nav-trending" onSelect={() => run(() => router.push('/trending'))}>
                    <Zap className="mr-2 h-4 w-4" />
                    <span>Trending</span>
                    <CommandShortcut>G T</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="nav-create" onSelect={() => run(() => router.push('/create'))}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create Project</span>
                    <CommandShortcut>C P</CommandShortcut>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Settings">
                  <CommandItem value="set-profile" onSelect={() => run(() => router.push('/profile'))}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <CommandShortcut>⌘ P</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="set-billing" onSelect={() => run(() => router.push('/profile?view=settings'))}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                    <CommandShortcut>⌘ B</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="set-config" onSelect={() => run(() => router.push('/profile?view=settings'))}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <CommandShortcut>⌘ S</CommandShortcut>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Theme">
                  <CommandItem value="theme-light" onSelect={() => run(() => setTheme("light"))}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light Mode</span>
                  </CommandItem>
                  <CommandItem value="theme-dark" onSelect={() => run(() => setTheme("dark"))}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark Mode</span>
                  </CommandItem>
                  <CommandItem value="theme-system" onSelect={() => run(() => setTheme("system"))}>
                    <Laptop className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="System">
                    <CommandItem value="sys-logout" onSelect={() => run(() => router.push('/login'))}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log Out</span>
                    </CommandItem>
                </CommandGroup>
            </>
        )}

      </CommandList>
    </CommandDialog>
  );
}