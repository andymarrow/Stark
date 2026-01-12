"use client";

export default function LegalViewer({ title, date, children }) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar flex">
      
      {/* 1. Line Numbers (The Developer Aesthetic) */}
      <div className="w-12 py-6 text-right pr-3 bg-zinc-950/50 border-r border-border text-[10px] font-mono text-muted-foreground/30 select-none hidden sm:block">
        {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="leading-relaxed">{i + 1}</div>
        ))}
      </div>

      {/* 2. The Code/Text Content */}
      <div className="flex-1 p-6 sm:p-8 font-mono text-sm leading-relaxed text-muted-foreground">
        
        {/* Document Header */}
        <div className="mb-8 border-b border-border pb-4">
            <h1 className="text-xl font-bold text-foreground mb-1 uppercase tracking-wider">{title}</h1>
            <span className="text-xs text-accent">Last Commit: {date}</span>
        </div>
        
        {/* Main Prose Content */}
        <article className="prose prose-zinc dark:prose-invert max-w-none 
            prose-p:my-4 prose-p:leading-7 
            prose-headings:font-bold prose-headings:text-foreground prose-headings:uppercase prose-headings:text-sm prose-headings:mt-8
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-code:bg-secondary/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:rounded-none prose-code:font-mono prose-code:text-accent
            prose-strong:text-foreground
            prose-ul:list-disc prose-ul:pl-4
            prose-li:marker:text-zinc-600
        ">
            {children}
        </article>

        {/* End of File Marker (Vim Style) */}
        <div className="mt-12 text-muted-foreground/20 select-none space-y-1">
            <div>~</div>
            <div>~</div>
            <div>~ END_OF_FILE</div>
        </div>
      </div>

    </div>
  );
}