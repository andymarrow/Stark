"use client";
import { useState, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw"; // Required to render the <span> tags from Tiptap

export default function ProjectReadme({ content }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isShortContent = !content || content.length < 500;

  const parsedContent = useMemo(() => {
    if (!content) return "No documentation provided.";
    
    let processed = content;

    // 1. FIX HTML MENTIONS (The code seen in your screenshot)
    // Converts <span data-id="user">@user</span> into Markdown links: [@user](/profile/user)
    processed = processed.replace(
      /<span[^>]*data-id="([^"]+)"[^>]*>(@?[^<]+)<\/span>/g,
      '[$2](/profile/$1)'
    );

    // 2. FIX MARKDOWN MENTIONS (Standard Tiptap Markdown output)
    // Converts @[display](id) into [@display](/profile/id)
    processed = processed.replace(
       /@\[([^\]]+)\]\(([^)]+)\)/g, 
       '[@$1](/profile/$2)'
    );

    return processed;
  }, [content]);

  return (
    <article className="border-t border-border pt-8 relative">
      <div className="flex items-center gap-2 mb-6 text-muted-foreground">
        <Terminal size={16} className="text-accent" />
        <h3 className="font-bold text-lg font-mono uppercase tracking-widest">Documentation</h3>
      </div>

      <div className={`relative transition-all duration-500 ease-in-out ${isExpanded ? 'h-auto' : 'max-h-[400px] overflow-hidden'}`}>
        
        <div className="prose prose-zinc dark:prose-invert max-w-none 
          prose-headings:font-bold prose-headings:tracking-tight 
          prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
          prose-p:text-muted-foreground prose-p:font-light prose-p:leading-relaxed
          prose-a:text-accent prose-a:font-bold prose-a:no-underline hover:prose-a:underline
          prose-code:text-accent prose-code:bg-secondary/20 prose-code:px-1 prose-code:font-mono prose-code:text-xs
          prose-pre:bg-black prose-pre:border prose-pre:border-border prose-pre:rounded-none
          prose-img:rounded-none prose-img:border prose-img:border-border
          prose-hr:border-border
        ">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]} // This allows the <span> to be parsed before we convert it
            components={{
                a: ({node, ...props}) => {
                    // Check if this link is an internal profile mention
                    const isMention = props.href?.startsWith('/profile/');
                    return (
                        <a 
                          {...props} 
                          className={`${isMention ? 'bg-accent/10 px-1 border-b border-accent' : ''} text-accent hover:text-accent/80 transition-colors`}
                        />
                    );
                }
            }}
          >
              {parsedContent}
          </ReactMarkdown>
        </div>

        {!isExpanded && !isShortContent && (
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
        )}
      </div>

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
    </article>
  );
}