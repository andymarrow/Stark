"use client";
import { Github, Globe, Youtube, Figma, Search, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchRepositoryData } from "@/lib/githubLoader"; // Import the helper
import { toast } from "sonner";

export default function StepSource({ data, updateData }) {
  const [status, setStatus] = useState("idle"); // idle, analyzing, success, error
  const [errorMsg, setErrorMsg] = useState("");

  // Debounce logic for fetching
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (data.link && data.type === 'code' && data.link.includes('github.com')) {
            await analyzeRepo();
        }
    }, 800); // Wait 800ms after typing stops

    return () => clearTimeout(timer);
  }, [data.link]);

  const analyzeRepo = async () => {
    setStatus("analyzing");
    setErrorMsg("");

    const result = await fetchRepositoryData(data.link);

    if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
        toast.error("Analysis Failed", { description: result.error });
        return;
    }

    if (result.success) {
        const repo = result.data;
        
        // AUTO-POPULATE PARENT STATE
        // We carefully only update fields that are empty, or override if desired
        updateData("title", formatTitle(repo.title));
        updateData("description", repo.description || "");
        updateData("tags", [repo.language, ...repo.tags].filter(Boolean).join(", "));
        updateData("demo_link", repo.homepage || "");
        
        // We pass hidden stats back to parent too
        updateData("stats", { stars: repo.stars, forks: repo.forks });
        updateData("readme", repo.readme); // We will need a place to store this in parent

        setStatus("success");
        toast.success("Repository Synced", { description: "Metadata and Readme extracted." });
    }
  };

  const formatTitle = (str) => {
    return str.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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
            {status === "analyzing" ? <Loader2 className="animate-spin text-accent" size={18} /> : 
             status === "success" ? <CheckCircle2 className="text-green-500" size={18} /> :
             status === "error" ? <AlertTriangle className="text-red-500" size={18} /> :
             <Globe size={18} />}
        </div>
        <input 
            type="text" 
            value={data.link}
            onChange={(e) => updateData("link", e.target.value)}
            placeholder={data.type === 'code' ? "https://github.com/username/repo" : "https://..."}
            className={`
                w-full h-16 pl-12 pr-4 bg-background border outline-none font-mono text-sm transition-all placeholder:text-muted-foreground/30
                ${status === 'error' ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent'}
            `}
        />
        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent opacity-0 group-focus-within:opacity-100 transition-opacity" />
      </div>

      {/* Analysis Feedback */}
      {status === "success" && (
        <div className="bg-green-500/10 border border-green-500/20 p-3 flex items-center gap-3 text-xs font-mono text-green-500 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            REPO_SYNC_COMPLETE: Metadata extracted from GitHub.
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-3 text-xs font-mono text-red-500 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={14} />
            ERROR: {errorMsg}
        </div>
      )}

    </div>
  );
}