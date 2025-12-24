"use client";
import { FileText, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
            placeholder="React, Tailwind, Supabase..."
        />
        <div className="flex gap-2 mt-2 flex-wrap">
            {data.tags.split(',').filter(t => t.trim() !== '').map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-secondary text-[10px] font-mono text-foreground border border-border">
                    {tag.trim()}
                </span>
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