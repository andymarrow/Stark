"use client";
import { Switch } from "@/components/ui/switch"; 
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";
import { TECH_STACKS } from "@/constants/options";
export default function ExploreFilters({ filters, setFilters }) {
  
  // Generic handler for array-based filters (Stack, Category)
  const handleCheckbox = (type, value) => {
    const currentList = filters[type];
    const newList = currentList.includes(value)
      ? currentList.filter(item => item !== value) // Remove
      : [...currentList, value]; // Add
    
    setFilters({ ...filters, [type]: newList });
  };

  // Combine all stacks for the filter view, or you could keep them separate
  const ALL_STACKS = [...TECH_STACKS.code, ...TECH_STACKS.design, ...TECH_STACKS.video];
  // Sort alphabetically to make it easier to scan
  const SORTED_STACKS = [...new Set(ALL_STACKS)].sort();

  return (
    <aside className="w-full space-y-6">
      
      {/* Search within filters */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Filter keywords..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full h-10 pl-9 bg-background border border-border focus:border-accent outline-none text-sm font-mono placeholder:text-muted-foreground/50 transition-colors"
        />
      </div>

      <Accordion type="multiple" defaultValue={["stack", "category", "quality"]} className="w-full">

         {/* CATEGORY */}
        <AccordionItem value="category" className="border-border">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline hover:text-accent">
            // Category
          </AccordionTrigger>
          <AccordionContent>
             <div className="flex flex-wrap gap-2 pt-2">
                {["Code", "Design", "Video", "SaaS", "Mobile", "Crypto", "E-commerce"].map(cat => {
                   const isActive = filters.category.includes(cat);
                   return (
                    <button 
                        key={cat} 
                        onClick={() => handleCheckbox("category", cat)}
                        className={`px-3 py-1 text-[10px] font-mono border transition-colors uppercase ${
                            isActive 
                            ? "bg-accent text-white border-accent" 
                            : "border-border hover:border-accent hover:text-accent"
                        }`}
                    >
                        {cat}
                    </button>
                   )
                })}
             </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* TECH STACK */}
        <AccordionItem value="stack" className="border-border">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline hover:text-accent">
            // Tech Stack
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {SORTED_STACKS.map((tech) => (
                <div key={tech} className="flex items-center space-x-3 group">
                  <Checkbox 
                    id={tech} 
                    checked={filters.stack.includes(tech)}
                    onCheckedChange={() => handleCheckbox("stack", tech)}
                    className="rounded-none border-muted-foreground data-[state=checked]:bg-accent data-[state=checked]:border-accent" 
                  />
                  <label htmlFor={tech} className="text-sm font-light text-muted-foreground group-hover:text-foreground cursor-pointer select-none">
                    {tech}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

       

        {/* QUALITY SCORE */}
        <AccordionItem value="quality" className="border-border">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline hover:text-accent">
            // Min Quality
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 px-1">
                <div className="flex justify-between text-[10px] font-mono mb-4 text-muted-foreground">
                    <span>ANY</span>
                    <span>ELITE ({filters.minQuality}+)</span>
                </div>
                <input 
                    type="range" 
                    min="0" max="99" 
                    value={filters.minQuality}
                    onChange={(e) => setFilters({...filters, minQuality: parseInt(e.target.value) })}
                    className="w-full accent-accent h-1 bg-secondary rounded-none appearance-none cursor-pointer" 
                />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* FOR HIRE */}
        <AccordionItem value="availability" className="border-border border-b-0">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline hover:text-accent">
            // Availability
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Available for Hire</span>
                <Switch 
                    checked={filters.forHire}
                    onCheckedChange={(v) => setFilters({...filters, forHire: v})}
                    className="data-[state=checked]:bg-accent" 
                />
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </aside>
  );
}