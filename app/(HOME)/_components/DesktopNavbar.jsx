"use client";
import Link from "next/link";
import { Search } from "lucide-react";
import ThemeToggle from "@/components/Themetoggle"; 
import { Button } from "@/components/ui/button";

export default function DesktopNavbar() {
  return (
    <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-foreground text-background flex items-center justify-center font-bold text-lg">
            S
          </div>
          <span className="font-bold text-xl tracking-tight group-hover:text-accent transition-colors">
            Stark
          </span>
        </Link>

        {/* Center: Search Input (Now clickable & typable) */}
        <div className="hidden lg:flex items-center">
            <div className="relative group w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors pointer-events-none" />
                
                <input 
                    type="text"
                    placeholder="search projects..."
                    className="w-full h-10 pl-10 pr-12 bg-secondary/50 border border-transparent 
                             hover:border-accent/30 focus:border-accent focus:bg-background 
                             text-sm font-mono text-foreground placeholder:text-muted-foreground 
                             transition-all outline-none rounded-none"
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <kbd className="inline-flex h-5 select-none items-center gap-1 bg-background border border-border px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/explore" className="hover:text-accent transition-colors">Explore</Link>
            <Link href="/trending" className="hover:text-accent transition-colors">Trending</Link>
          </nav>
          
          <div className="h-4 w-[1px] bg-border mx-2" />
          
          <ThemeToggle />
          
          <Button className="bg-accent hover:bg-red-600 text-white font-medium px-6 h-9 rounded-none">
            Connect
          </Button>
        </div>
      </div>
    </header>
  );
}