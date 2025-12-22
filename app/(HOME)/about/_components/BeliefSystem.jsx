"use client";
import { Code2, Layers, Cpu, GitCommit } from "lucide-react";
import { useState } from "react";

const BELIEFS = [
  {
    id: "01",
    icon: Layers,
    title: "Context is King",
    desc: "A screenshot tells 10% of the story. The component hierarchy, the state management, and the API calls tell the rest.",
    code: "const truth = (design) => design.hasCode ? true : false;"
  },
  {
    id: "02",
    icon: Code2,
    title: "Open Source First",
    desc: "Knowledge should be forked, not hoarded. We build on the shoulders of giants. Share your learnings.",
    code: "git commit -m 'feat: shared knowledge'"
  },
  {
    id: "03",
    icon: Cpu,
    title: "Function > Aesthetic",
    desc: "A pretty button that doesn't work is just a rectangle. We celebrate creators who make things that actually run.",
    code: "<Button onClick={ship} />"
  },
  {
    id: "04",
    icon: GitCommit,
    title: "Ship to Learn",
    desc: "Perfection is the enemy of done. Deploy early, break things, fix them, and deploy again.",
    code: "while(alive) { build(); ship(); learn(); }"
  }
];

export default function BeliefSystem() {
  return (
    <section className="py-24 container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {BELIEFS.map((item) => (
            <BeliefCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function BeliefCard({ item }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div 
            className="h-80 border border-border bg-background relative overflow-hidden group cursor-crosshair"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Standard View */}
            <div className={`absolute inset-0 p-8 flex flex-col justify-between transition-all duration-500 ${hovered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <div className="flex justify-between items-start">
                    <item.icon size={32} className="text-accent" />
                    <span className="font-mono text-4xl font-black text-muted-foreground/20">{item.id}</span>
                </div>
                <div>
                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
            </div>

            {/* "Code" View (Revealed on Hover) */}
            <div className={`absolute inset-0 bg-zinc-950 p-8 flex items-center justify-center transition-all duration-500 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="font-mono text-green-400 text-sm md:text-base">
                    <span className="text-purple-400">root@stark</span>
                    <span className="text-white">:</span>
                    <span className="text-blue-400">~</span>
                    <span className="text-white">$</span> {item.code}
                    <span className="animate-pulse block w-2 h-4 bg-green-400 inline-block ml-1 align-middle" />
                </div>
                {/* Decoration Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
            </div>
        </div>
    )
}