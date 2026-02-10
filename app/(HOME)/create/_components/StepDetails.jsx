"use client";
import { FileText, ArrowDown, AlertTriangle } from "lucide-react";
import CollaboratorManager from "./CollaboratorManager"; 
import RichTextEditor from "./RichTextEditor"; 
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TECH_STACKS } from "@/constants/options";

export default function StepDetails({ data, updateData, errors }) {
  
  const handleImportReadme = () => {
    if (!data.readme) {
        toast.error("No Readme Found", { description: "The source repository doesn't have a readme file." });
        return;
    }
    const newDesc = (data.description ? data.description + "\n\n" : "") + data.readme;
    updateData("description", newDesc);
    toast.success("Readme Imported", { description: "Content appended to editor." });
  };

  const addTag = (tag) => {
    const currentTags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
        const newTags = [...currentTags, tag].join(', ');
        updateData("tags", newTags);
    }
  };

  const suggestions = TECH_STACKS[data.type] || TECH_STACKS.code;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      
      {/* 1. Title Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase text-muted-foreground">Project Title</label>
        <input 
            type="text" 
            value={data.title}
            onChange={(e) => updateData("title", e.target.value)}
            className={`w-full p-4 bg-secondary/5 border outline-none font-bold text-lg transition-all ${errors?.title ? 'border-red-500' : 'border-border focus:border-accent'}`}
            placeholder="e.g. Neural Dashboard"
        />
        {errors?.title && (
            <p className="text-[10px] font-mono text-red-500 uppercase flex items-center gap-1.5">
                <AlertTriangle size={10} /> {errors.title}
            </p>
        )}
      </div>

      {/* 2. Collaborator Manager (FIXED PROPS) */}
      <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase text-muted-foreground">Collaborators</label>
          <CollaboratorManager 
            collaborators={data.collaborators || []} 
            onAdd={(newCollab) => {
                const current = data.collaborators || [];
                updateData("collaborators", [...current, newCollab]);
            }}
            onRemove={(collabToRemove) => {
                const current = data.collaborators || [];
                const filtered = current.filter(c => c.id !== collabToRemove.id);
                updateData("collaborators", filtered);
            }}
          />
      </div>

      {/* 3. Rich Text Description */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-mono uppercase text-muted-foreground">Description / Documentation</label>
            {data.readme && (
                <button 
                    onClick={handleImportReadme}
                    className="flex items-center gap-1 text-[10px] font-mono text-accent hover:underline uppercase"
                >
                    <FileText size={12} /> Import GitHub Readme
                </button>
            )}
        </div>
        
        <div className={`transition-all ${errors?.description ? 'border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.05)]' : ''}`}>
            <RichTextEditor 
                value={data.description} 
                onChange={(val) => updateData("description", val)} 
            />
        </div>
        
        {errors?.description ? (
            <p className="text-[10px] font-mono text-red-500 uppercase flex items-center gap-1.5">
                <AlertTriangle size={10} /> {errors.description}
            </p>
        ) : (
            <p className="text-[10px] text-muted-foreground">
                * Supports Markdown. Use the toolbar to format headers, lists, and code blocks.
            </p>
        )}
      </div>

      {/* 4. Tech Stack */}
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase text-muted-foreground">Tech Stack (Comma separated)</label>
        <input 
            type="text" 
            value={data.tags}
            onChange={(e) => updateData("tags", e.target.value)}
            className="w-full p-4 bg-secondary/5 border border-border focus:border-accent outline-none font-mono text-sm transition-colors"
            placeholder={data.type === 'design' ? "Figma, Photoshop..." : "React, Supabase..."}
        />
        <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map((tech) => (
                <button
                    key={tech}
                    onClick={() => addTag(tech)}
                    className="px-2 py-1 text-[10px] font-mono border border-border hover:border-accent hover:text-accent bg-background transition-colors uppercase"
                >
                    + {tech}
                </button>
            ))}
        </div>
      </div>

      {/* 5. Live Demo */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase text-muted-foreground">Live Demo URL (Optional)</label>
        <input 
            type="url" 
            value={data.demo_link}
            onChange={(e) => updateData("demo_link", e.target.value)}
            className={`w-full p-4 bg-secondary/5 border outline-none font-mono text-sm transition-all ${errors?.demo_link ? 'border-red-500' : 'border-border focus:border-accent'}`}
            placeholder="https://..."
        />
        {errors?.demo_link && (
            <p className="text-[10px] font-mono text-red-500 uppercase flex items-center gap-1.5">
                <AlertTriangle size={10} /> {errors.demo_link}
            </p>
        )}
      </div>

    </div>
  );
}