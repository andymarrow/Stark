"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TrendingHero from "./_components/TrendingHero";
import LeaderboardRow from "./_components/LeaderboardRow";
import TrendingToggle from "./_components/TrendingToggle";
import CreatorCard from "./_components/CreatorCard";
import ProjectCard from "../_components/ProjectCard";
import { Activity } from "lucide-react";

// --- MOCK DATA: PROJECTS ---
const TRENDING_PROJECTS = [
    {
        id: 1,
        slug: "neon-db",
        title: "Neon Database",
        description: "Serverless Postgres. Separate storage and compute. Branch your database like code.",
        category: "Infrastructure",
        thumbnail: "https://images.unsplash.com/photo-1558494949-ef526b0042a0?q=80&w=2600&auto=format&fit=crop",
        tags: ["Rust", "Postgres", "Cloud"],
        stats: { stars: 12500, views: 45000 },
        author: { name: "Neon Team", username: "neon", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&h=100" }
    },
    {
        id: 2,
        slug: "shader-park",
        title: "Shader Park",
        description: "Create interactive 2D & 3D shaders with a simple JavaScript interface.",
        category: "Creative Coding",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        tags: ["WebGL", "GLSL", "JS"],
        stats: { stars: 8900, views: 22000 },
        author: { name: "Torin", username: "torin_blank", avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=100&h=100" }
    },
    // ... Add 6 more items for the grid
    { id: 3, slug: "project-3", title: "Hyper UI", category: "Design System", description: "Tailwind components.", thumbnail: "https://images.unsplash.com/photo-1756224470421-12d866062da2?w=500&auto=format&fit=crop&w=800", tags: ["React"], stats: { stars: 500, views: 1000 }, author: { name: "Mark", username: "mark", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100" }},
    { id: 4, slug: "project-4", title: "Rust Desk", category: "App", description: "Remote desktop software.", thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800", tags: ["Rust"], stats: { stars: 500, views: 1000 }, author: { name: "Jane", username: "jane", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100" }},
    { id: 5, slug: "project-5", title: "Godot Engine", category: "Game Dev", description: "Open source game engine.", thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800", tags: ["C++"], stats: { stars: 500, views: 1000 }, author: { name: "Juan", username: "juan", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100" }},
    { id: 6, slug: "project-6", title: "Bun", category: "Runtime", description: "Fast JS runtime.", thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=800", tags: ["Zig"], stats: { stars: 500, views: 1000 }, author: { name: "Jarred", username: "jarred", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100" }},
];

// --- MOCK DATA: CREATORS ---
const TRENDING_CREATORS = [
    {
        id: 1,
        name: "Sarah Drasner",
        username: "sarah_edo",
        role: "Engineering Director",
        bio: "Author of SVG Animations. Speaker. Engineering Director at Google.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300",
        coverImage: "https://images.unsplash.com/photo-1550645614-8339a3e89fca?auto=format&fit=crop&w=2000",
        isForHire: false,
        stats: { followers: "125k", likes: "500k" },
        topProjects: ["https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=200", "https://images.unsplash.com/photo-1550439062-609e1531270e?w=200", "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=200"]
    },
    {
        id: 2,
        name: "Anthony Fu",
        username: "antfu",
        role: "Open Source Wizard",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100",
        isForHire: true,
        stats: { followers: "80k", likes: "320k" },
        topProjects: ["https://images.unsplash.com/photo-1607705703571-c5a8695f18f6?w=200", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200", "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200"]
    },
    // ... more creators
    { id: 3, name: "Josh Comeau", username: "josh", role: "Educator", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100", isForHire: false, stats: { followers: "60k", likes: "200k" }, topProjects: ["https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=200", "https://images.unsplash.com/photo-1607705703571-c5a8695f18f6?w=200", "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=200"] },
    { id: 4, name: "Cassie Evans", username: "cassie", role: "Animator", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100", isForHire: true, stats: { followers: "45k", likes: "150k" }, topProjects: ["https://images.unsplash.com/photo-1550439062-609e1531270e?w=200", "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200", "https://images.unsplash.com/photo-1607705703571-c5a8695f18f6?w=200"] },
    { id: 5, name: "Lee Robinson", username: "leerob", role: "VP Product", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", isForHire: false, stats: { followers: "90k", likes: "400k" }, topProjects: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200", "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=200", "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=200"] },
];

export default function TrendingPage() {
  const [view, setView] = useState("projects");
  
  const currentData = view === "projects" ? TRENDING_PROJECTS : TRENDING_CREATORS;
  const topItem = currentData[0];
  const leaderBoard = currentData.slice(1, 5);
  const gridItems = currentData.slice(1); // Usually you'd fetch more for the grid

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Header with Live Status */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2">
                    Global <span className="text-accent">Trending</span>
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    // REAL_TIME_METRICS: ACTIVE
                </p>
            </div>
            
        </div>

        {/* 1. The Switch */}
        <TrendingToggle view={view} setView={setView} />

        {/* Content Animation Wrapper */}
        <AnimatePresence mode="wait">
            <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                {/* 2. Top Section: Hero + Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                    {/* Hero (Rank 1) */}
                    <div className="lg:col-span-8">
                        <TrendingHero item={topItem} type={view} />
                    </div>
                    
                    {/* Leaderboard (Rank 2-5) */}
                    <div className="lg:col-span-4 flex flex-col gap-3">
                        <div className="flex justify-between items-end mb-2 border-b border-border pb-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Top Movers</span>
                            <span className="text-[10px] font-mono text-accent">Last 24h</span>
                        </div>
                        {leaderBoard.map((item, index) => (
                            <LeaderboardRow 
                                key={item.id} 
                                item={item} 
                                rank={index + 2} 
                                type={view} 
                            />
                        ))}
                    </div>
                </div>

                {/* 3. The Grid */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-[1px] bg-border flex-1" />
                    <span className="text-xs font-mono uppercase text-muted-foreground">Rising Stars</span>
                    <div className="h-[1px] bg-border flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gridItems.map((item) => (
                        view === "projects" ? (
                            <ProjectCard key={item.id} project={item} />
                        ) : (
                            <CreatorCard key={item.id} creator={item} />
                        )
                    ))}
                </div>

            </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}