import ReactMarkdown from 'react-markdown';

export default function ProjectReadme({ content }) {
  return (
    <article className="border-t border-border pt-8">
      
      {/* Markdown Container with "Stark" Styling */}
      <div className="prose prose-zinc dark:prose-invert max-w-none 
        prose-headings:font-bold prose-headings:tracking-tight 
        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
        prose-p:text-muted-foreground prose-p:font-light prose-p:leading-relaxed
        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
        prose-code:text-accent prose-code:bg-secondary/20 prose-code:px-1 prose-code:font-mono prose-code:text-xs
        prose-pre:bg-black prose-pre:border prose-pre:border-border prose-pre:rounded-none
        prose-img:rounded-none prose-img:border prose-img:border-border
        prose-hr:border-border
      ">
        <ReactMarkdown>
            {content || "No documentation provided."}
        </ReactMarkdown>
      </div>

      <div className="mt-12 p-4 border border-border bg-secondary/5 rounded-none flex items-start gap-3">
        <div className="w-1 h-full bg-accent min-h-[24px]" />
        <div>
            <h4 className="font-mono text-sm font-bold mb-1">System Note</h4>
            <p className="text-xs text-muted-foreground font-mono">
                This documentation is rendered directly from the source repository.
            </p>
        </div>
      </div>

    </article>
  );
}