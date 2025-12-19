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

// Update props to receive the full filters object
export default function FilterSheet({ filters, setFilters }) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper for map selection inside the sheet
  const handleRegionSelect = (id) => {
    setFilters(prev => ({ ...prev, region: id }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          className="w-full h-12 bg-background border border-border hover:border-accent text-foreground hover:bg-secondary/10 flex items-center justify-between px-4 lg:hidden group"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground group-hover:text-accent" />
            <span className="text-sm font-mono font-bold tracking-wider">FILTERS_&_MAP</span>
          </div>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5">
            {filters.region ? "REGION ACTIVE" : "DEFAULT"}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[90vw] sm:w-[400px] p-0 border-r border-border bg-background flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border bg-secondary/5">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-mono font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-accent" />
              Configuration
            </SheetTitle>
            {/* <SheetClose asChild>
                <button className="text-muted-foreground hover:text-destructive transition-colors">
                    <X size={20} />
                </button>
            </SheetClose> */}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-6">
            <div className="space-y-8">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                         <label className="text-[10px] font-mono text-muted-foreground uppercase">Target Region</label>
                         {filters.region && (
                            <button 
                                onClick={() => handleRegionSelect(null)}
                                className="text-[10px] text-accent hover:underline font-mono"
                            >
                                RESET_MAP
                            </button>
                         )}
                    </div>
                    {/* Pass logic to Map */}
                    <TechMap selectedRegion={filters.region} onSelect={handleRegionSelect} />
                </div>

                <div className="w-full h-[1px] bg-border border-t border-dashed" />

                {/* CRITICAL FIX: Pass filters and setFilters here! */}
                <ExploreFilters filters={filters} setFilters={setFilters} />
            </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t border-border bg-secondary/5">
            <div className="flex gap-3 w-full">
                <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-none border-border font-mono text-xs"
                    onClick={() => setFilters({ region: null, stack: [], category: [], search: "", minQuality: 0, forHire: false })}
                >
                    RESET_ALL
                </Button>
                <SheetClose asChild>
                    <Button className="flex-[2] h-12 rounded-none bg-accent hover:bg-accent/90 text-white font-mono text-xs font-bold">
                        APPLY CONFIGURATION
                    </Button>
                </SheetClose>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}