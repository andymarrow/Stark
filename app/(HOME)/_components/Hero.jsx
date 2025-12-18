"use client";
import { Search, ChevronDown, ChevronUp, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Filter Data
const FILTERS = {
  TECH: ["React", "Vue", "Next.js", "TypeScript", "Python", "Rust", "Go", "Figma", "Blender"],
  CATEGORY: ["SaaS", "E-commerce", "Portfolio", "Mobile App", "Design System", "Motion Graphics"],
  COUNTRY: ["United States", "Germany", "Brazil", "Japan", "Nigeria", "India", "UK"]
};

export default function Hero() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("TECH"); 
  const [selectedTags, setSelectedTags] = useState(["TypeScript"]); 

  const toggleFilter = (filterName) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <section className="relative w-full min-h-[90vh] flex flex-col justify-center items-center overflow-hidden pt-20">
      
      {/* --- BACKGROUND: Custom Schematic/Blueprint --- */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {/* 1. Large Circular Guides (Engineering vibe) */}
        <div className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full border border-border/30 border-dashed opacity-50" />
        <div className="absolute top-[30%] -left-[10%] w-[30vw] h-[30vw] rounded-full border border-border/20 opacity-30" />
        
        {/* 2. Horizon Line with Measurements */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border/20" />
        <div className="absolute top-1/2 left-[20%] w-[1px] h-4 bg-border/40" />
        <div className="absolute top-1/2 left-[40%] w-[1px] h-4 bg-border/40" />
        <div className="absolute top-1/2 left-[60%] w-[1px] h-4 bg-border/40" />
        <div className="absolute top-1/2 left-[80%] w-[1px] h-4 bg-border/40" />

       
      </div>

      <div className="container relative z-10 px-4 flex flex-col items-center">
        
        {/* --- HEADLINE --- */}
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16"
        >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-foreground leading-[0.9]">
              Build. Share. <br className="md:hidden" />
              <span className="text-accent relative inline-block">
                Inspire
                <span className="text-foreground">.</span>
              </span>
            </h1>
            
            <p className="mt-8 text-lg md:text-xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
               The definitive portfolio network for <span className="text-foreground font-medium">Developers, Designers, and Motion Creators</span>. 
               <br className="hidden md:block" />
               Stop searching for inspiration in static images. <span className="border-b border-accent/50 text-foreground">See the source.</span>
            </p>
        </motion.div>

        {/* --- INTERACTIVE SEARCH TOOLBAR --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-3xl flex flex-col gap-2"
        >
          {/* Main Bar */}
          <div className={`
            flex flex-col md:flex-row items-stretch bg-background/80 backdrop-blur-sm 
            border transition-all duration-300
            ${activeFilter ? 'border-accent shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 'border-border hover:border-accent/50'}
          `}>
            
            {/* Input Area */}
            <div className="flex-1 flex items-center h-14 px-4 border-b md:border-b-0 md:border-r border-border/50">
              <span className="text-muted-foreground mr-3 font-mono text-lg">{`>`}</span>
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input 
                type="text"
                placeholder="search projects..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-sm placeholder:text-muted-foreground/50 h-full text-foreground"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="hidden md:flex items-center gap-1.5 opacity-50">
                <Command size={12} />
                <span className="text-[10px] font-mono">K</span>
              </div>
            </div>

            {/* Filter Buttons (Tech | Category | Country) */}
            <div className="flex items-center justify-between md:justify-start">
                {Object.keys(FILTERS).map((key, index) => (
                    <div key={key} className="h-full flex items-center flex-1 md:flex-none">
                         <button 
                            onClick={() => toggleFilter(key)}
                            className={`
                                h-full w-full md:w-auto px-4 md:px-5 flex items-center justify-center gap-2 text-[10px] md:text-xs font-mono uppercase tracking-wider transition-colors py-3 md:py-0
                                ${activeFilter === key ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}
                            `}
                        >
                            {key}
                            {activeFilter === key ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        {/* Divider */}
                        {index < Object.keys(FILTERS).length - 1 && (
                            <div className="w-[1px] h-6 bg-border/50" />
                        )}
                    </div>
                ))}
            </div>
          </div>

          {/* Collapsible Filter Tags Row */}
          <AnimatePresence>
            {activeFilter && (
                <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className="flex flex-wrap gap-2 p-1">
                        {FILTERS[activeFilter].map((tag) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`
                                        px-4 py-2 text-xs font-mono border transition-all duration-200
                                        ${isSelected 
                                            ? 'bg-background border-accent text-accent shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]' 
                                            : 'bg-background/50 border-border text-muted-foreground hover:border-foreground hover:text-foreground'}
                                    `}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

        {/* --- FOOTER STATS (Data Line) --- */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-x-6 md:gap-x-12 gap-y-4 text-[10px] md:text-xs font-mono text-muted-foreground uppercase tracking-widest opacity-80"
        >
            <StatItem value="2,847" label="projects" />
            <span className="hidden md:inline text-accent/50 text-[8px]">■</span>
            <StatItem value="1,203" label="creators" />
            <span className="hidden md:inline text-accent/50 text-[8px]">■</span>
            <StatItem value="56" label="countries" />
        </motion.div>

      </div>
    </section>
  );
}

// --- Sub Components ---

function StatItem({ value, label }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-foreground font-bold">{value}</span>
            <span>{label}</span>
        </div>
    )
}
