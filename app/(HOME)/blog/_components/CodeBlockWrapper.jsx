// app/(HOME)/blog/_components/CodeBlockWrapper.jsx
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Copy, Check, Terminal } from 'lucide-react'
import { useState } from 'react'

export default function CodeBlockWrapper({ node, updateAttributes, extension }) {
  const [copied, setCopied] = useState(false);

  // Extract the language (e.g., 'jsx', 'bash', 'python')
  const language = node.attrs.language || 'text';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="relative my-8 border border-border bg-black group rounded-none overflow-hidden font-mono shadow-xl">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border select-none">
        <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground tracking-widest font-bold">
          <Terminal size={14} className="text-accent" />
          {language}
        </div>
        
        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors ${
            copied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied_Payload' : 'Copy_Code'}
        </button>
      </div>

      {/* CODE CONTENT */}
      {/* The NodeViewContent component tells Tiptap where to inject the actual text */}
      <pre className="p-4 m-0 bg-transparent text-[13px] leading-relaxed overflow-x-auto custom-scrollbar text-zinc-300">
        <NodeViewContent as="code" className={`language-${language}`} />
      </pre>
    </NodeViewWrapper>
  );
}