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
  Trophy,
  Terminal
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

// Renamed 'REPORTS' to 'BLOGS'
const TABS = [
  { id: "all", label: "ALL" },
  { id: "users", label: "USERS" },
  { id: "projects", label: "PROJECTS" },
  { id: "contests", label: "CONTESTS" },
  { id: "blogs", label: "BLOGS" }, 
];

// Reusable class for the CommandItem to override the default solid red focus state
const starkItemClass = "cursor-pointer transition-all border-l-2 border-transparent data-[selected='true']:bg-secondary/40 data-[selected='true']:border-accent data-[selected='true']:text-foreground";

export function GlobalCommandMenu({ open, setOpen }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState({ users: [], projects: [], contests: [], blogs: [] });
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveTab("all");
      setResults({ users: [], projects: [], contests: [], blogs: [] });
    }
  }, [open]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
        setResults({ users: [], projects: [], contests: [], blogs: [] });
        return;
    }

    const delayDebounceFn = setTimeout(async () => {
        setLoading(true);
        const limit = activeTab === "all" ? 3 : 10;
        const searchTerm = `%${trimmedQuery}%`;

        try {
            const promises = [];

            if (activeTab === "all" || activeTab === "users") {
                promises.push(
                    supabase.from('profiles').select('id, username, full_name, avatar_url')
                        .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
                        .limit(limit)
                        .then(({ data }) => ({ type: 'users', data: data || [] }))
                );
            }

            if (activeTab === "all" || activeTab === "projects") {
                promises.push(
                    supabase.from('projects').select('id, title, slug, type')
                        .ilike('title', searchTerm).eq('status', 'published')
                        .limit(limit)
                        .then(({ data }) => ({ type: 'projects', data: data || [] }))
                );
            }

            if (activeTab === "all" || activeTab === "contests") {
                promises.push(
                    supabase.from('contests').select('id, title, slug, is_public')
                        .ilike('title', searchTerm).eq('is_public', true)
                        .limit(limit)
                        .then(({ data }) => ({ type: 'contests', data: data || [] }))
                );
            }

            if (activeTab === "all" || activeTab === "blogs") {
                promises.push(
                    supabase.from('blogs').select('id, title, slug, author:profiles!author_id(username)')
                        .ilike('title', searchTerm).eq('status', 'published')
                        .limit(limit)
                        .then(({ data }) => ({ type: 'blogs', data: data || [] }))
                );
            }

            const resultsArray = await Promise.all(promises);
            const newResults = { users: [], projects: [], contests: [], blogs: [] };
            resultsArray.forEach(r => { if(r?.type) newResults[r.type] = r.data; });

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

  const hasResults = results.users?.length > 0 || results.projects?.length > 0 || results.contests?.length > 0 || results.blogs?.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      
      <CommandInput 
        placeholder="Type a command or search..." 
        value={query}
        onValueChange={setQuery}
      />

      {query && (
        <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-secondary/5 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        px-3 py-1 text-[10px] font-mono font-bold transition-all border shrink-0
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
        
        {loading && (
            <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="animate-spin w-5 h-5 text-accent" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Querying_Database...</span>
            </div>
        )}

        {!loading && query && (
            <>
                {/* 1. USERS */}
                {results.users.length > 0 && (
                    <CommandGroup heading={activeTab === 'all' ? "Users" : `Users (${results.users.length})`}>
                        {results.users.map((user) => (
                            <CommandItem 
                                key={user.id} 
                                value={`user-${user.username}`} 
                                onSelect={() => run(() => router.push(`/profile/${user.username}`))}
                                className={starkItemClass}
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

                {/* 2. BLOGS */}
                {results.blogs?.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading={activeTab === 'all' ? "Intelligence Reports" : `Blogs (${results.blogs.length})`}>
                            {results.blogs.map((blog) => (
                                <CommandItem 
                                    key={blog.id} 
                                    value={`blog-${blog.slug}`}
                                    onSelect={() => run(() => router.push(`/${blog.author.username}/blog/${blog.slug}`))}
                                    className={starkItemClass}
                                >
                                    <div className="w-6 h-6 mr-3 flex items-center justify-center bg-accent/10 border border-accent/20 text-accent shrink-0">
                                        <Terminal size={12} />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="truncate">{blog.title}</span>
                                        <span className="text-[9px] font-mono text-muted-foreground uppercase truncate">
                                            Author: @{blog.author.username}
                                        </span>
                                    </div>
                                    <span className="ml-2 text-[9px] font-mono text-accent bg-accent/5 px-1.5 py-0.5 uppercase tracking-widest border border-accent/20 shrink-0">
                                        View
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* 3. CONTESTS */}
                {results.contests.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading={activeTab === 'all' ? "Contests" : `Contests (${results.contests.length})`}>
                            {results.contests.map((contest) => (
                                <CommandItem 
                                    key={contest.id} 
                                    value={`contest-${contest.slug}`}
                                    onSelect={() => run(() => router.push(`/contests/${contest.slug}`))}
                                    className={starkItemClass}
                                >
                                    <div className="w-6 h-6 mr-3 flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 shrink-0">
                                        <Trophy size={12} />
                                    </div>
                                    <span className="truncate">{contest.title}</span>
                                    <span className="ml-auto text-[9px] font-mono text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 uppercase shrink-0">
                                        Active
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* 4. PROJECTS */}
                {results.projects.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading={activeTab === 'all' ? "Projects" : `Projects (${results.projects.length})`}>
                            {results.projects.map((project) => (
                                <CommandItem 
                                    key={project.id} 
                                    value={`project-${project.slug}`}
                                    onSelect={() => run(() => router.push(`/project/${project.slug}`))}
                                    className={starkItemClass}
                                >
                                    <div className="w-6 h-6 mr-3 flex items-center justify-center bg-secondary border border-border text-muted-foreground shrink-0">
                                        <FileCode size={12} />
                                    </div>
                                    <span className="truncate">{project.title}</span>
                                    <span className="ml-auto text-[9px] uppercase font-mono text-muted-foreground border border-border px-1.5 py-0.5 shrink-0">
                                        {project.type}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

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

        {/* --- DEFAULT STATIC MENU --- */}
        {!query && (
            <>
                <CommandGroup heading="Navigation">
                  <CommandItem value="nav-explore" onSelect={() => run(() => router.push('/explore'))} className={starkItemClass}>
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    <span>Explore</span>
                    <CommandShortcut>G E</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="nav-trending" onSelect={() => run(() => router.push('/trending'))} className={starkItemClass}>
                    <Zap className="mr-2 h-4 w-4" />
                    <span>Trending</span>
                    <CommandShortcut>G T</CommandShortcut>
                  </CommandItem>
                  
                  <CommandItem value="nav-blog" onSelect={() => run(() => router.push('/blog'))} className={starkItemClass}>
                    <Terminal className="mr-2 h-4 w-4 text-accent" />
                    <span>Intelligence Reports</span>
                    <CommandShortcut>G I</CommandShortcut>
                  </CommandItem>

                  <CommandItem value="nav-create" onSelect={() => run(() => router.push('/create'))} className={starkItemClass}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create Project</span>
                    <CommandShortcut>C P</CommandShortcut>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Settings">
                  <CommandItem value="set-profile" onSelect={() => run(() => router.push('/profile'))} className={starkItemClass}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <CommandShortcut>⌘ P</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="set-billing" onSelect={() => run(() => router.push('/profile?view=settings'))} className={starkItemClass}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                    <CommandShortcut>⌘ B</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="set-config" onSelect={() => run(() => router.push('/profile?view=settings'))} className={starkItemClass}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <CommandShortcut>⌘ S</CommandShortcut>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Theme">
                  <CommandItem value="theme-light" onSelect={() => run(() => setTheme("light"))} className={starkItemClass}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light Mode</span>
                  </CommandItem>
                  <CommandItem value="theme-dark" onSelect={() => run(() => setTheme("dark"))} className={starkItemClass}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark Mode</span>
                  </CommandItem>
                  <CommandItem value="theme-system" onSelect={() => run(() => setTheme("system"))} className={starkItemClass}>
                    <Laptop className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="System">
                    <CommandItem value="sys-logout" onSelect={() => run(() => router.push('/login'))} className={starkItemClass}>
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