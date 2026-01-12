"use client";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

export default function StepReview({ data }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      
      <div className="bg-secondary/10 border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 text-accent border-b border-border pb-4">
            <AlertTriangle size={20} />
            <h3 className="font-mono font-bold uppercase tracking-widest text-sm">Pre-Flight Check</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Project Title</span>
                <p className="font-bold text-foreground">{data.title || "Untitled Project"}</p>
            </div>
            <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Source Type</span>
                <p className="font-bold text-foreground uppercase">{data.type}</p>
            </div>
            <div className="md:col-span-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Repository / Link</span>
                <p className="font-mono text-muted-foreground bg-background p-2 border border-border truncate">{data.link || "No link provided"}</p>
            </div>
            <div className="md:col-span-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Tags</span>
                <div className="flex gap-2">
                    {data.tags ? data.tags.split(',').map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-mono border border-accent/20">
                            {t}
                        </span>
                    )) : "No tags"}
                </div>
            </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground font-mono space-y-1">
        <p className="flex items-center justify-center gap-1">
            By clicking Submit, you agree to the 
            <Link 
                href="/legal/terms" 
                target="_blank" 
                className="text-foreground hover:text-accent underline underline-offset-4 flex items-center gap-0.5 group"
            >
                Open Source Contribution Guidelines
                <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
            </Link>
        </p>
        <p>Your project will be indexed immediately.</p>
      </div>

    </div>
  );
}