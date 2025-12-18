"use client";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import TechMap from "./TechMap";
import ExploreFilters from "./ExploreFilters";
import { useState } from "react";

export default function FilterSheet({ region, setRegion }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* 1. The Trigger Button (Visible on Mobile) */}
      <SheetTrigger asChild>
        <Button 
          className="w-full h-12 bg-background border border-border hover:border-accent text-foreground hover:bg-secondary/10 flex items-center justify-between px-4 lg:hidden group transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground group-hover:text-accent" />
            <span className="text-sm font-mono font-bold tracking-wider">FILTERS_&_MAP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5">
                {region ? "1 ACTIVE" : "DEFAULT"}
            </span>
          </div>
        </Button>
      </SheetTrigger>

      {/* 2. The Slide-Out Panel */}
      <SheetContent side="left" className="w-[90vw] sm:w-[400px] p-0 border-r border-border bg-background flex flex-col gap-0">
        
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border bg-secondary/5">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-mono font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-accent" />
              Configuration
            </SheetTitle>
            {/* Custom Close Button for Vibe */}
            <SheetClose asChild>
                <button className="text-muted-foreground hover:text-destructive transition-colors">
                    <X size={20} />
                </button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <ScrollArea className="flex-1 px-6 py-6">
            <div className="space-y-8">
                
                {/* A. The Map Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                         <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                            Target Region
                         </label>
                         {region && (
                            <button 
                                onClick={() => setRegion(null)}
                                className="text-[10px] text-accent hover:underline font-mono"
                            >
                                RESET_MAP
                            </button>
                         )}
                    </div>
                    {/* Reuse the Hologram Map */}
                    <TechMap selectedRegion={region} onSelect={setRegion} />
                </div>

                <div className="w-full h-[1px] bg-border border-t border-dashed" />

                {/* B. The Detailed Accordion Filters */}
                <ExploreFilters />
            </div>
        </ScrollArea>

        {/* Footer Actions */}
        <SheetFooter className="p-4 border-t border-border bg-secondary/5">
            <div className="flex gap-3 w-full">
                <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-none border-border font-mono text-xs hover:text-destructive hover:border-destructive"
                    onClick={() => setRegion(null)}
                >
                    RESET
                </Button>
                <SheetClose asChild>
                    <Button className="flex-[2] h-12 rounded-none bg-accent hover:bg-accent/90 text-white font-mono text-xs font-bold tracking-widest">
                        APPLY CONFIGURATION
                    </Button>
                </SheetClose>
            </div>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}