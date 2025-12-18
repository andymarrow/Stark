import ProjectCard from "./ProjectCard";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

// MOCK DATA - Replicating your database schema
const PROJECTS = [
  {
    id: 1,
    slug: "neural-dashboard",
    title: "Neural Dashboard",
    category: "Code",
    description: "A real-time analytics dashboard for monitoring machine learning pipelines with high-frequency data updates.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
    tags: ["Next.js", "D3.js", "Python", "Redis"],
    stats: { stars: 1240, views: 8500 },
    author: { name: "Alex Chen", username: "alexc", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100" }
  },
  {
    id: 2,
    slug: "zenith-commerce",
    title: "Zenith Commerce",
    category: "Code",
    description: "Headless e-commerce starter kit built for extreme performance and SEO optimization.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    tags: ["React", "Shopify", "Tailwind", "TypeScript"],
    stats: { stars: 89, views: 1200 },
    author: { name: "Sarah Jones", username: "sarah_builds", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100" }
  },
  {
    id: 3,
    slug: "framer-motion-kit",
    title: "Motion UI Kit",
    category: "Design",
    description: "A comprehensive library of drag-and-drop animation components for modern marketing sites.",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop",
    tags: ["Framer", "React", "Motion"],
    stats: { stars: 3400, views: 45000 },
    author: { name: "Mike Ross", username: "mikeross", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100" }
  },
  {
    id: 4,
    slug: "terminal-portfolio",
    title: "Terminal.me",
    category: "Code",
    description: "An interactive CLI-based portfolio website that lets visitors run commands to see your work.",
    thumbnail: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=2574&auto=format&fit=crop",
    tags: ["Vue", "Node.js", "WebSockets"],
    stats: { stars: 567, views: 3200 },
    author: { name: "David Kim", username: "dkim_dev", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100" }
  },
  {
    id: 5,
    slug: "crypto-wallet-ui",
    title: "Defi Wallet UI",
    category: "Design",
    description: "Mobile-first crypto wallet design system focused on clarity and trust.",
    thumbnail: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=2574&auto=format&fit=crop",
    tags: ["Figma", "UI/UX", "Mobile"],
    stats: { stars: 230, views: 1500 },
    author: { name: "Emma Wilson", username: "emma_ui", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&h=100" }
  },
  {
    id: 6,
    slug: "task-flow",
    title: "TaskFlow SaaS",
    category: "Code",
    description: "Project management tool with real-time collaboration and kanban boards.",
    thumbnail: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?q=80&w=2676&auto=format&fit=crop",
    tags: ["Angular", "Firebase", "RxJS"],
    stats: { stars: 12, views: 400 },
    author: { name: "Lucas P", username: "lucas_code", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&h=100" }
  },
];

export default function FeaturedProjects() {
  return (
    <section className="py-20 bg-background relative z-10">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Trending This Week
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Hand-picked projects that push the boundaries of UI and performance.
            </p>
          </div>
          
          <Link href="/explore" className="group flex items-center gap-2 text-sm font-mono text-accent hover:text-foreground transition-colors">
            <span>View all projects</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* Loading / End of List Indicator */}
        <div className="mt-16 flex justify-center">
            <button className="px-8 py-3 border border-border bg-secondary/20 hover:bg-secondary hover:border-accent transition-all text-sm font-mono tracking-wide">
                LOAD_MORE()
            </button>
        </div>

      </div>
    </section>
  );
}