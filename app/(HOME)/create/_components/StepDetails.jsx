"use client";

export default function StepDetails({ data, updateData }) {
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
        <label className="text-xs font-mono uppercase text-muted-foreground">Description / Readme</label>
        <textarea 
            value={data.description}
            onChange={(e) => updateData("description", e.target.value)}
            className="w-full p-4 h-40 bg-secondary/5 border border-border focus:border-accent outline-none text-sm font-sans resize-none transition-colors"
            placeholder="Describe the architecture, features, and stack..."
        />
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

    </div>
  );
}