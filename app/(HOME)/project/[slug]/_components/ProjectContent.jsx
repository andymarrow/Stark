"use client";
import { useState } from "react";
import Link from "next/link";
import { Layers, FileText, GitCommit, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProjectReadme from "./ProjectReadme";
import ChangelogTimeline from "./ChangelogTimeline";
import ProjectComments from "./ProjectComments";

export default function ProjectContent({ project, isOwner }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-8">
      
      {/* 1. Header Section */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {project.title}
        </h1>
        
        <div className="flex flex-wrap gap-2">
            {project.techStack.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-secondary/30 border border-border text-[10px] font-mono text-muted-foreground uppercase">
                    {tag.name}
                </span>
            ))}
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-6">
            <TabButton 
                label="Overview" 
                icon={FileText} 
                isActive={activeTab === "overview"} 
                onClick={() => setActiveTab("overview")} 
            />
            <TabButton 
                label="Changelog" 
                icon={Layers} 
                isActive={activeTab === "changelog"} 
                onClick={() => setActiveTab("changelog")} 
                badge={null} 
            />
        </div>

        {/* Owner Action: Push Update */}
        {isOwner && activeTab === "changelog" && (
            <Link href={`/project/${project.slug}/changelog/create`}>
                <Button 
                    size="sm" 
                    className="h-8 rounded-none bg-accent hover:bg-accent/90 text-white font-mono text-[10px] uppercase tracking-widest mb-2"
                >
                    <Plus size={12} className="mr-2" /> Push Update
                </Button>
            </Link>
        )}
      </div>

      {/* 3. Tab Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
            {activeTab === "overview" ? (
                <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <ProjectReadme content={project.description} />
                </motion.div>
            ) : (
                <motion.div
                    key="changelog"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* FIX: Added projectSlug prop here */}
                    <ChangelogTimeline 
                        projectId={project.id} 
                        isOwner={isOwner} 
                        projectSlug={project.slug} 
                    />
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* 4. Comments */}
      <div className="pt-8">
         <ProjectComments projectId={project.id} />
      </div>

    </div>
  );
}

function TabButton({ label, icon: Icon, isActive, onClick, badge }) {
    return (
        <button 
            onClick={onClick}
            className={`
                flex items-center gap-2 pb-3 text-sm font-medium transition-all relative
                ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
            `}
        >
            <Icon size={16} />
            <span className="font-mono uppercase tracking-wide text-xs">{label}</span>
            
            {/* Active Line Indicator */}
            {isActive && (
                <motion.div 
                    layoutId="active-project-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                />
            )}
        </button>
    )
}