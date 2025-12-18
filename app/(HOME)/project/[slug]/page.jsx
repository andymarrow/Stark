"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Home, Share2, Flag } from "lucide-react";
import ProjectGallery from "./_components/ProjectGallery";
import ProjectSidebar from "./_components/ProjectSidebar";
import ProjectReadme from "./_components/ProjectReadme";

// --- MOCK DATA (Simulating a DB Fetch) ---
const PROJECT = {
  id: "1",
  title: "Neural Dashboard",
  description: "A high-performance analytics dashboard built for monitoring machine learning pipelines in real-time. Features WebGL data visualization and WebSocket streams.",
  category: "Code",
  createdAt: "2024-03-15",
  qualityScore: 94,
  images: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop", // Main
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop", // Placeholder for variety
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
  ],
  techStack: [
    { name: "React", type: "Framework" },
    { name: "TypeScript", type: "Language" },
    { name: "Go", type: "Backend" },
    { name: "TimescaleDB", type: "Database" },
    { name: "Redis", type: "Cache" },
    { name: "Docker", type: "DevOps" },
  ],
  stats: {
    stars: 2847,
    views: 18420,
    forks: 342,
  },
  links: {
    demo: "https://demo.vercel.app",
    repo: "https://github.com/user/repo",
  },
  author: {
    name: "Alex Chen",
    username: "alexc",
    role: "Full Stack Engineer",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100",
    isForHire: true,
  }
};

export default function ProjectDetailPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      
      {/* 1. Navigation Breadcrumb (Technical Style) */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 md:top-16 z-40">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-accent transition-colors"><Home size={14} /></Link>
            <ChevronRight size={12} />
            <Link href="/explore" className="hover:text-foreground transition-colors">Projects</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold">{PROJECT.title}</span>
          </div>
          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
             </button>
             <button className="flex items-center gap-2 hover:text-destructive transition-colors">
                <Flag size={14} />
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {/* 2. The Gallery (Hero of this page) */}
        <div className="mb-12">
           <ProjectGallery images={PROJECT.images} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* 3. Left Content: Title & Readme */}
            <div className="lg:col-span-8 space-y-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                        {PROJECT.title}
                    </h1>
                    <p className="text-lg text-muted-foreground font-light leading-relaxed">
                        {PROJECT.description}
                    </p>
                </div>
                
                {/* The Readme Component */}
                <ProjectReadme />
            </div>

            {/* 4. Right Content: Sticky Sidebar (Control Panel) */}
            <div className="lg:col-span-4">
                <div className="sticky top-32">
                    <ProjectSidebar project={PROJECT} />
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}