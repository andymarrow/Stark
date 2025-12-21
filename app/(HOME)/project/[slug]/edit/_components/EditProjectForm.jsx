"use client";
import { useState } from "react";
import { Save, X, UploadCloud, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming standard shadcn textarea or use standard HTML
import Link from "next/link";
import Image from "next/image";

export default function EditProjectForm({ project }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(project);

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        setIsLoading(false);
        alert("System Updated: Project configurations saved.");
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* 1. Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Link href={`/profile/miheret_dev`}>
                <Button variant="ghost" className="h-10 w-10 p-0 rounded-none border border-border text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={18} />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
                <p className="text-xs font-mono text-muted-foreground">ID: {project.id} // REV: 1.4.0</p>
            </div>
        </div>
        <div className="flex gap-3">
            <Link href={`/project/${project.slug}`}>
                <Button variant="outline" className="h-12 rounded-none border-border font-mono text-xs uppercase hidden sm:flex">
                    Cancel
                </Button>
            </Link>
            <Button 
                onClick={handleSave}
                disabled={isLoading}
                className="h-12 px-8 bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest min-w-[140px]"
            >
                {isLoading ? "Saving..." : "Save Changes"}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN: Main Content --- */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* Section: General */}
            <section className="bg-background border border-border p-6 space-y-6">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    General Configuration
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold">Project Title</label>
                        <Input 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="h-12 rounded-none bg-secondary/5 border-border focus:border-accent font-bold"
                        />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold">Description / Readme.md</label>
                        <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="min-h-[200px] w-full rounded-none bg-secondary/5 border border-border p-4 text-sm focus:border-accent focus:outline-none resize-y font-mono leading-relaxed"
                        />
                    </div>
                </div>
            </section>

            {/* Section: Media */}
            <section className="bg-background border border-border p-6 space-y-6">
                <div className="flex justify-between items-end border-b border-border pb-2">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        Visual Assets
                    </h3>
                    <button className="text-xs text-accent hover:underline font-bold">+ UPLOAD NEW</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((img, i) => (
                        <div key={i} className="group relative aspect-video bg-secondary border border-border">
                            <Image src={img} alt="Asset" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 bg-destructive text-white hover:bg-red-700 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/50 text-white text-[9px] font-mono px-1">IMG_0{i+1}</span>
                            </div>
                        </div>
                    ))}
                    {/* Upload Placeholder */}
                    <div className="border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-secondary/5 h-full min-h-[100px]">
                        <UploadCloud size={24} className="text-muted-foreground" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">Drop File</span>
                    </div>
                </div>
            </section>

        </div>

        {/* --- RIGHT COLUMN: Metadata & Settings --- */}
        <div className="lg:col-span-4 space-y-8">
            
            {/* Links */}
            <section className="bg-background border border-border p-6 space-y-6">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    Source Links
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Repository URL</label>
                        <Input 
                            value={formData.links.repo}
                            onChange={(e) => setFormData({...formData, links: { ...formData.links, repo: e.target.value }})}
                            className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Live Demo URL</label>
                        <Input 
                            value={formData.links.demo}
                            onChange={(e) => setFormData({...formData, links: { ...formData.links, demo: e.target.value }})}
                            className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs"
                        />
                    </div>
                </div>
            </section>

            {/* Tags */}
            <section className="bg-background border border-border p-6 space-y-6">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    Classifications
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Tech Stack (Comma sep)</label>
                        <Input 
                            defaultValue={formData.techStack.map(t => t.name).join(", ")}
                            className="h-10 rounded-none bg-secondary/5 border-border font-mono text-xs"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.techStack.map((t, i) => (
                            <span key={i} className="px-2 py-1 bg-secondary text-[10px] font-mono border border-border">
                                {t.name}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="border border-destructive/20 bg-destructive/5 p-6 space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle size={16} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Danger Zone</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                    Deleting this project is irreversible. It will be removed from the global index immediately.
                </p>
                <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-white rounded-none h-10 text-xs font-mono uppercase">
                    Delete Project
                </Button>
            </section>

        </div>

      </div>
    </div>
  );
}