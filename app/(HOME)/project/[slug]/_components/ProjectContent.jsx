"use client";
import { useState, useEffect } from "react"; // Added useEffect
import Link from "next/link";
import { Layers, FileText, Plus, MessageSquare, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getChatClearance } from "@/app/actions/getChatClearance"; // Import clearance action

import ProjectReadme from "./ProjectReadme";
import ChangelogTimeline from "./ChangelogTimeline";
import ProjectComments from "./ProjectComments";
import ProjectChatTerminal from "./ProjectChatTerminal"; // We will build this next

export default function ProjectContent({ project, isOwner }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // --- CHAT PROTOCOL STATE ---
  const [clearance, setClearance] = useState({ authorized: false, loading: true });

  useEffect(() => {
    const checkAccess = async () => {
        const res = await getChatClearance(project.slug);
        if (res.success && res.hasEvent) {
            setClearance({ 
                authorized: true, 
                loading: false, 
                submissionId: res.submissionId,
                role: res.role 
            });
        } else {
            setClearance({ authorized: false, loading: false });
        }
    };
    checkAccess();
  }, [project.slug]);

  return (
    <div className="space-y-8">
      
      {/* 1. Header Section */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground uppercase">
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
      <div className="flex items-center justify-between border-b border-border overflow-x-auto no-scrollbar">
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
            />
            
            {/* DYNAMIC SECURE CHANNEL TAB */}
            {!clearance.loading && clearance.authorized && (
                <TabButton 
                    label="Secure_Channel" 
                    icon={ShieldCheck} 
                    isActive={activeTab === "chat"} 
                    onClick={() => setActiveTab("chat")}
                    isSpecial
                />
            )}
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
            {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ProjectReadme content={project.description} />
                </motion.div>
            )}
            
            {activeTab === "changelog" && (
                <motion.div key="changelog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ChangelogTimeline projectId={project.id} isOwner={isOwner} projectSlug={project.slug} />
                </motion.div>
            )}

            {activeTab === "chat" && clearance.authorized && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ProjectChatTerminal submissionId={clearance.submissionId} role={clearance.role} />
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* 4. Global Comments (Only if not in private chat) */}
      {activeTab !== "chat" && (
          <div className="pt-8">
             <ProjectComments projectId={project.id} />
          </div>
      )}

    </div>
  );
}

function TabButton({ label, icon: Icon, isActive, onClick, isSpecial }) {
    return (
        <button 
            onClick={onClick}
            className={`
                flex items-center gap-2 pb-3 text-sm font-medium transition-all relative whitespace-nowrap
                ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
                ${isSpecial && !isActive ? "text-accent/60" : ""}
                ${isSpecial && isActive ? "text-accent font-bold" : ""}
            `}
        >
            <Icon size={16} className={isSpecial && isActive ? "animate-pulse" : ""} />
            <span className="font-mono uppercase tracking-wide text-[10px] md:text-xs">
                {label}
            </span>
            
            {isActive && (
                <motion.div 
                    layoutId="active-project-tab"
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${isSpecial ? 'bg-accent' : 'bg-foreground'}`}
                />
            )}
        </button>
    )
}