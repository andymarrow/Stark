"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Shield, Scale, FolderOpen, BookOpen } from "lucide-react";

// Updated File List
const FILES = [
  { name: "TERMS_OF_SERVICE.md", href: "/legal/terms", icon: Scale },
  { name: "PRIVACY_POLICY.json", href: "/legal/privacy", icon: Shield },
  { name: "CONTRIBUTING.md", href: "/legal/guidelines", icon: BookOpen }, // Added
];

export default function LegalLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto border border-border bg-black/5 flex flex-col md:flex-row h-[80vh] overflow-hidden">
        
        {/* 1. Sidebar (File Explorer) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-zinc-950 flex-shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-widest">
                <FolderOpen size={14} />
                <span>Project_Legal</span>
            </div>
            <nav className="p-2 space-y-1">
                {FILES.map((file) => {
                    const isActive = pathname === file.href;
                    return (
                        <Link 
                            key={file.name} 
                            href={file.href}
                            className={`
                                flex items-center gap-2 px-3 py-2 text-xs font-mono transition-colors
                                ${isActive ? "bg-accent/10 text-accent border-l-2 border-accent" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border-l-2 border-transparent"}
                            `}
                        >
                            <file.icon size={14} />
                            {file.name}
                        </Link>
                    )
                })}
            </nav>
        </aside>

        {/* 2. Editor Window */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
            {/* Tab Bar */}
            <div className="flex bg-zinc-950 border-b border-border overflow-x-auto scrollbar-hide">
                {FILES.map((file) => (
                    <Link 
                        key={file.name}
                        href={file.href} 
                        className={`
                            px-4 py-2.5 text-xs font-mono border-r border-border flex items-center gap-2 min-w-fit
                            ${pathname === file.href ? "bg-background text-foreground border-t-2 border-t-accent" : "text-muted-foreground bg-black/20 hover:bg-black/10"}
                        `}
                    >
                        <FileText size={12} />
                        {file.name}
                    </Link>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {children}
            </div>
        </div>

      </div>
    </div>
  );
}