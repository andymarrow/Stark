export default function LegalViewer({ title, date, children }) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar flex">
      
      {/* 1. Line Numbers */}
      <div className="w-12 py-6 text-right pr-3 bg-zinc-950/50 border-r border-border text-[10px] font-mono text-muted-foreground/30 select-none hidden sm:block">
        {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="leading-relaxed">{i + 1}</div>
        ))}
      </div>

      {/* 2. The Code/Text */}
      <div className="flex-1 p-6 sm:p-8 font-mono text-sm leading-relaxed text-muted-foreground">
        <div className="mb-8 border-b border-border pb-4">
            <h1 className="text-xl font-bold text-foreground mb-1">{title}</h1>
            <span className="text-xs text-accent">Last Commit: {date}</span>
        </div>
        
        <article className="prose prose-zinc dark:prose-invert max-w-none prose-p:my-4 prose-headings:font-bold prose-headings:text-foreground prose-a:text-accent prose-code:bg-secondary/20 prose-code:px-1 prose-code:text-xs prose-strong:text-foreground">
            {children}
        </article>

        {/* End of File Marker */}
        <div className="mt-12 text-muted-foreground/20 select-none">~</div>
        <div className="text-muted-foreground/20 select-none">~</div>
        <div className="text-muted-foreground/20 select-none">~ END_OF_FILE</div>
      </div>

    </div>
  );
}