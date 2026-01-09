"use client";
import { Megaphone } from "lucide-react";

export default function UpdatesTab({ announcements }) {
  if (!announcements || announcements.length === 0) {
    return (
        <div className="py-20 text-center border border-dashed border-border bg-secondary/5">
            <Megaphone size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm font-mono text-muted-foreground uppercase">No announcements yet.</p>
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50 hidden md:block" />
        
        {announcements.map((update, i) => (
            <div key={update.id} className="relative pl-0 md:pl-8 group">
                {/* Timeline Dot (Desktop) */}
                <div className="absolute left-[-4px] top-6 w-2 h-2 rounded-full bg-accent hidden md:block ring-4 ring-background" />
                
                <div className="border border-border bg-card p-6 relative">
                    <div className="flex items-center gap-2 mb-3 text-xs font-mono text-accent uppercase tracking-widest">
                        <Megaphone size={12} />
                        <span>Update #{announcements.length - i}</span>
                    </div>
                    
                    <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed">{update.content}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 text-[10px] font-mono text-muted-foreground">
                        Posted on {new Date(update.date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>
                </div>
            </div>
        ))}
    </div>
  );
}