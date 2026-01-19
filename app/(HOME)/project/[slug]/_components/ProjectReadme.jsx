"use client";
import { useState, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import remarkGfm from "remark-gfm"; // Import this to handle standard markdown features well

export default function ProjectReadme({ content }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If content is short (less than ~500 characters), show it all without buttons.
  const isShortContent = !content || content.length < 500;

  // --- PARSE MENTIONS ---
  const parsedContent = useMemo(() => {
    if (!content) return "No documentation provided.";
    
    // Replace @[display](id) with Markdown Link: [@display](/profile/id)
    return content.replace(
       /@\[([^\]]+)\]\(([^)]+)\)/g, 
       '[@$1](/profile/$2)'
    );
  }, [content]);

  return (
    <article className="border-t border-border pt-8 relative">
      
      {/* Header Label */}
      <div className="flex items-center gap-2 mb-6 text-muted-foreground">
        <Terminal size={16} className="text-accent" />
        <h3 className="font-bold text-lg font-mono uppercase tracking-widest">Documentation</h3>
      </div>

      <div className={`relative transition-all duration-500 ease-in-out ${isExpanded ? 'h-auto' : 'max-h-[300px] overflow-hidden'}`}>
        
        {/* Markdown Content */}
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
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
                // Custom link renderer to force internal links (mentions) to behave correctly
                a: ({node, ...props}) => (
                    <a {...props} className="text-accent hover:underline decoration-dotted cursor-pointer" />
                )
            }}
          >
              {parsedContent}
          </ReactMarkdown>
        </div>

        {/* Gradient Fade Overlay (Only visible when collapsed) */}
        {!isExpanded && !isShortContent && (
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
        )}
      </div>

      {/* Toggle Button Area */}
      {!isShortContent && (
        <div className="mt-4 flex justify-start">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="group flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                        Collapse_Log
                    </>
                ) : (
                    <>
                        <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                        Expand_Full_Readme
                    </>
                )}
            </button>
        </div>
      )}

      {/* System Note Footer */}
      {isExpanded && (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 border border-border bg-secondary/5 rounded-none flex items-start gap-3"
        >
            <div className="w-1 h-full bg-accent min-h-[24px]" />
            <div>
                <h4 className="font-mono text-sm font-bold mb-1">System Note</h4>
                <p className="text-xs text-muted-foreground font-mono">
                    This documentation is rendered directly from the source repository or creator input.
                </p>
            </div>
        </motion.div>
      )}

    </article>
  );
}