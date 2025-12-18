"use client";
import { useState } from "react";
import ProfileHeader from "./_components/ProfileHeader";
import ProfileStats from "./_components/ProfileStats";
import ActivityGraph from "./_components/ActivityGraph";
import ProfileTabs from "./_components/ProfileTabs";
import ProjectCard from "../../_components/ProjectCard";

// --- MOCK USER DATA ---
const USER = {
  name: "Alex Chen",
  username: "alexc",
  bio: "Full Stack Engineer obsessed with performance and clean UI. Building next-gen dev tools. Specialized in React, Go, and high-scale systems. Previously at Vercel.",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&h=300",
  location: "San Francisco, CA",
  website: "https://alexchen.dev",
  joinedDate: "Mar 2023",
  isForHire: true,
  socials: {
    github: "https://github.com",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com"
  },
  stats: {
    projects: 14,
    followers: 1240,
    following: 85,
    likes: 4500
  }
};

// --- MOCK PROJECT DATA ---
const WORK_PROJECTS = [
    {
        id: 1,
        slug: "neural-dashboard",
        title: "Neural Dashboard",
        category: "Code",
        description: "A real-time analytics dashboard.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
        tags: ["Next.js", "Python"],
        stats: { stars: 1240, views: 8500 },
        author: USER
    },
    {
        id: 2,
        slug: "zenith-commerce",
        title: "Zenith Commerce",
        category: "Code",
        description: "Headless e-commerce starter kit.",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
        tags: ["React", "Shopify"],
        stats: { stars: 89, views: 1200 },
        author: USER
    }
];

const SAVED_PROJECTS = [
     {
        id: 3,
        slug: "framer-motion-kit",
        title: "Motion UI Kit",
        category: "Design",
        description: "Library of drag-and-drop animation components.",
        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop",
        tags: ["Framer", "React"],
        stats: { stars: 3400, views: 45000 },
        author: { name: "Mike Ross", username: "mikeross", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100" }
    },
];

export default function ProfilePage({ params }) {
  const [activeTab, setActiveTab] = useState("work");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Filter projects based on tab
  const displayProjects = activeTab === "work" ? WORK_PROJECTS 
                        : activeTab === "saved" ? SAVED_PROJECTS 
                        : []; 

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* 1. Header Section */}
        <div className="mb-6">
            <ProfileHeader user={USER} />
        </div>

        {/* 2. Stats & Graph Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2">
                <ProfileStats stats={USER.stats} />
            </div>
            <div className="lg:col-span-1">
                <ActivityGraph />
            </div>
        </div>

        {/* 3. Content Tabs with View Toggle */}
        <ProfileTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            viewMode={viewMode}
            setViewMode={setViewMode}
        />

        {/* 4. Projects Grid */}
        {displayProjects.length > 0 ? (
            <div className={`
                ${viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "flex flex-col gap-4 max-w-3xl mx-auto"} 
                animate-in fade-in slide-in-from-bottom-4 duration-500
            `}>
                {displayProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                 {/* Duplicating for demo */}
                {activeTab === 'work' && displayProjects.map((project) => (
                    <ProjectCard key={project.id + "d"} project={project} />
                ))}
            </div>
        ) : (
            <div className="h-64 border border-dashed border-border flex items-center justify-center text-muted-foreground font-mono text-sm">
                NO_ITEMS_FOUND_IN_COLLECTION
            </div>
        )}
        
      </div>
    </div>
  );
}