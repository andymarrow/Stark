"use client";
import { FileText, ArrowDown } from "lucide-react";
import CollaboratorManager from "./CollaboratorManager"; 
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TECH_STACKS } from "@/constants/options";

export default function StepDetails({ data, updateData }) {
  
  const handleImportReadme = () => {
    if (!data.readme) {
        toast.error("No Readme Found", { description: "The source repository doesn't have a readme file." });
        return;
    }
    // Append Readme to current description
    const newDesc = (data.description ? data.description + "\n\n" : "") + data.readme;
    updateData("description", newDesc);
    toast.success("Readme Imported", { description: "Content appended. You can now edit/trim it." });
  };

  const addTag = (tag) => {
    // Basic comma separation logic
    const currentTags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
        const newTags = [...currentTags, tag].join(', ');
        updateData("tags", newTags);
    }
  };

  // Determine suggestions list based on the project type (code, design, video)
  // Default to 'code' if type is somehow missing or different
  const suggestions = TECH_STACKS[data.type] || TECH_STACKS.code;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase text-muted-foreground">Project Title</label>
        <input 
            type="text" 
            value={data.title}
            onChange={(e) => updateData("title", e.target.value)}
            className="w-full p-4 bg-secondary/5 border border-border focus:border-accent outline-none font-bold text-lg transition-colors"
            placeholder="e.g. Neural Dashboard"
        />
      </div>

      {/* NEW: Collaborator Manager */}
      <CollaboratorManager 
        collaborators={data.collaborators || []} 
        setCollaborators={(newVal) => {
            // Handle both functional updates and direct values
            const val = typeof newVal === 'function' ? newVal(data.collaborators || []) : newVal;
            updateData("collaborators", val);
        }}
      />

      <div className="space-y-1">
        <div className="flex justify-between items-center">
            <label className="text-xs font-mono uppercase text-muted-foreground">Description / Documentation</label>
            
            {/* NEW: Import Button */}
            {data.readme && (
                <button 
                    onClick={handleImportReadme}
                    className="flex items-center gap-1 text-[10px] font-mono text-accent hover:underline uppercase"
                >
                    <FileText size={12} /> Import GitHub Readme
                </button>
            )}
        </div>
        
        <textarea 
            value={data.description}
            onChange={(e) => updateData("description", e.target.value)}
            className="w-full p-4 h-64 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-mono resize-none transition-colors leading-relaxed"
            placeholder="Describe the architecture, features, and stack..."
        />
        <p className="text-[10px] text-muted-foreground">
            * Markdown is supported. Feel free to remove installation steps or license text.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-mono uppercase text-muted-foreground">Tech Stack (Comma separated)</label>
        <input 
            type="text" 
            value={data.tags}
            onChange={(e) => updateData("tags", e.target.value)}
            className="w-full p-4 bg-secondary/5 border border-border focus:border-accent outline-none font-mono text-sm transition-colors"
            placeholder={data.type === 'design' ? "Figma, Photoshop..." : "React, Supabase..."}
        />
        
        {/* QUICK SELECT SUGGESTIONS */}
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

      {/* Live Demo Field (Ensuring you have this from previous steps) */}
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase text-muted-foreground">Live Demo URL (Optional)</label>
        <input 
            type="url" 
            value={data.demo_link}
            onChange={(e) => updateData("demo_link", e.target.value)}
            className="w-full p-4 bg-secondary/5 border border-border focus:border-accent outline-none font-mono text-sm transition-colors"
            placeholder="https://..."
        />
      </div>

    </div>
  );
}