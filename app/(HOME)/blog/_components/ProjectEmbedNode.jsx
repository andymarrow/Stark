"use client";
import { NodeViewWrapper } from "@tiptap/react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Star, Eye, ExternalLink, Loader2, ImageOff, 
  ChevronLeft, ChevronRight, Maximize2, Activity,
  Cpu, Calendar
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectEmbedNode({ node, updateAttributes }) {
  const [project, setProject] = useState(node.attrs.projectData);
  const [loading, setLoading] = useState(!node.attrs.projectData);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync Data if only ID exists
  useEffect(() => {
    if (!project && node.attrs.projectId) {
      const fetchProject = async () => {
        const { data } = await supabase
          .from("projects")
          .select("id, title, slug, thumbnail_url, images, likes_count, views, tags, created_at")
          .eq("id", node.attrs.projectId)
          .single();
        if (data) {
          setProject(data);
          updateAttributes({ projectData: data });
        }
        setLoading(false);
      };
      fetchProject();
    }
  }, [node.attrs.projectId]);

  const allAssets = project?.images || (project?.thumbnail_url ? [project.thumbnail_url] : []);
  
  const nextAsset = (e) => {
    e.preventDefault();
    setActiveIndex((prev) => (prev + 1) % allAssets.length);
  };

  const prevAsset = (e) => {
    e.preventDefault();
    setActiveIndex((prev) => (prev - 1 + allAssets.length) % allAssets.length);
  };

  return (
    <NodeViewWrapper className="my-12 select-none" contentEditable={false}>
      <div className="border border-border bg-black group relative overflow-hidden transition-all hover:border-accent/50 max-w-3xl mx-auto shadow-2xl">
        
        {/* 1. TOP STATUS BAR (The "OS" Feel) */}
        <div className="bg-secondary/20 px-4 py-1.5 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                    Embedded_Dossier_Link // REV_4.0
                </span>
            </div>
            {project && (
                <div className="text-[9px] font-mono text-accent animate-pulse uppercase font-bold">
                    System_Live
                </div>
            )}
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-secondary/5">
            <Loader2 className="animate-spin text-accent" size={24} />
            <span className="font-mono text-[10px] uppercase tracking-[0.5em]">Establishing_Uplink...</span>
          </div>
        ) : project ? (
          <div className="flex flex-col md:flex-row min-h-[300px]">
            
            {/* 2. INTERACTIVE GALLERY COLUMN */}
            <div className="w-full md:w-1/2 relative bg-zinc-950 overflow-hidden border-b md:border-b-0 md:border-r border-border">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="relative w-full h-full aspect-square md:aspect-auto"
                    >
                        {allAssets.length > 0 ? (
                            <Image 
                                src={allAssets[activeIndex]} 
                                alt="" 
                                fill 
                                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/10"><ImageOff size={48}/></div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Gallery Controls */}
                {allAssets.length > 1 && (
                    <>
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={prevAsset} className="p-1 bg-black/60 border border-white/10 text-white hover:bg-accent transition-colors"><ChevronLeft size={16}/></button>
                            <button onClick={nextAsset} className="p-1 bg-black/60 border border-white/10 text-white hover:bg-accent transition-colors"><ChevronRight size={16}/></button>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-0.5 border border-white/10 text-[8px] font-mono text-white/70 z-20">
                            ASSET_0{activeIndex + 1} / 0{allAssets.length}
                        </div>
                    </>
                )}

                {/* Visual Glitch Decor */}
                <div className="absolute top-3 left-3 z-20">
                    <div className="bg-accent text-white text-[7px] font-mono px-1 py-0.5 uppercase tracking-tighter shadow-lg">
                        Visual_Verified
                    </div>
                </div>
            </div>

            {/* 3. DATA & INTEL COLUMN */}
            {/* Intel Column */}
<div className="flex-1 p-6 flex flex-col justify-between relative bg-secondary/5">
  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

  <div className="relative z-10">
    <div className="flex items-center gap-2 mb-4">
        <Cpu size={14} className="text-accent" />
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Target_Meta_Data</span>
    </div>

    <h4 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none mb-2">
      {project.title}
    </h4>
    
    <div className="flex flex-wrap gap-1.5 mb-6">
        {project.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-[8px] font-mono border border-border px-1.5 py-0.5 text-muted-foreground uppercase">#{tag}</span>
        ))}
    </div>

    <div className="space-y-3 border-l border-border pl-4">
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground uppercase">
            <span className="flex items-center gap-1.5"><Activity size={12} className="text-green-500"/> {project.views || 0} REACH</span>
            <span className="flex items-center gap-1.5"><Star size={12} className="text-accent fill-accent"/> {project.likes_count || 0} STARS</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase">
            <Calendar size={12} /> 
            {/* FIX: Ensure date is valid */}
            DEPLOYED: {project.created_at ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : 'INITIALIZING...'}
        </div>
    </div>
  </div>

  <div className="relative z-10 mt-8 pt-4 border-t border-dashed border-border flex justify-between items-center">
    <div className="text-[8px] font-mono text-muted-foreground uppercase leading-tight">
        Author_Signature:<br/>
        {/* FIX: Display actual author name or username */}
        <span className="text-foreground font-bold">
            {project.author?.full_name || project.author?.username || "STARK_OPERATOR"}
        </span>
    </div>
    <a 
        href={`/project/${project.slug}`} 
        target="_blank" 
        className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(var(--accent),0.2)]"
    >
        Expand Dossier <Maximize2 size={12} />
    </a>
  </div>
</div>
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-red-500 bg-red-500/5 font-mono text-xs uppercase border-y border-red-500/20">
            <ShieldAlert size={24} className="mb-2" />
            [ CRITICAL_ERROR: NODE_REDACTED_OR_OFFLINE ]
          </div>
        )}

        {/* 4. FOOTER SYSTEM LINE */}
        <div className="bg-secondary/10 px-4 py-1 border-t border-border flex justify-between items-center">
            <div className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest">
                Data_Integrity: Check_Sum_Passed
            </div>
            <div className="flex gap-2">
                 <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                 <div className="w-1 h-1 bg-accent rounded-full animate-pulse delay-75" />
                 <div className="w-1 h-1 bg-accent rounded-full animate-pulse delay-150" />
            </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}