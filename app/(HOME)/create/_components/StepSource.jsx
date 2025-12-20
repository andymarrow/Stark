"use client";
import { Github, Globe, Youtube, Figma, Search } from "lucide-react";
import { useState } from "react";

export default function StepSource({ data, updateData }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLinkChange = (e) => {
    const val = e.target.value;
    updateData("link", val);
    
    // Simulate "Analysis" when user types
    if (val.length > 5) {
        setIsAnalyzing(true);
        setTimeout(() => setIsAnalyzing(false), 1500);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-mono uppercase tracking-tight">Initialize Project</h2>
        <p className="text-muted-foreground font-light text-sm">Paste your repository, design file, or video link.</p>
      </div>

      {/* Type Selection */}
      <div className="grid grid-cols-3 gap-4">
        {['code', 'design', 'video'].map((type) => (
            <button
                key={type}
                onClick={() => updateData("type", type)}
                className={`
                    h-24 border flex flex-col items-center justify-center gap-2 transition-all duration-200 group
                    ${data.type === type 
                        ? "border-accent bg-accent/5" 
                        : "border-border hover:border-foreground/50"}
                `}
            >
                {type === 'code' && <Github className={data.type === type ? "text-accent" : "text-muted-foreground group-hover:text-foreground"} />}
                {type === 'design' && <Figma className={data.type === type ? "text-accent" : "text-muted-foreground group-hover:text-foreground"} />}
                {type === 'video' && <Youtube className={data.type === type ? "text-accent" : "text-muted-foreground group-hover:text-foreground"} />}
                <span className="text-xs font-mono uppercase tracking-widest">{type}</span>
            </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isAnalyzing ? <Search className="animate-spin" size={18} /> : <Globe size={18} />}
        </div>
        <input 
            type="text" 
            value={data.link}
            onChange={handleLinkChange}
            placeholder={data.type === 'code' ? "https://github.com/username/repo" : "https://..."}
            className="w-full h-16 pl-12 pr-4 bg-background border border-border focus:border-accent outline-none font-mono text-sm transition-all placeholder:text-muted-foreground/30"
        />
        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent opacity-0 group-focus-within:opacity-100 transition-opacity" />
      </div>

      {/* Mock Analysis Result */}
      {data.link.length > 10 && !isAnalyzing && (
        <div className="bg-green-500/10 border border-green-500/20 p-3 flex items-center gap-3 text-xs font-mono text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            VALID_SOURCE_DETECTED: {data.type.toUpperCase()}_REPOSITORY
        </div>
      )}

    </div>
  );
}