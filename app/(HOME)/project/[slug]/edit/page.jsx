import EditProjectForm from "./_components/EditProjectForm";

// --- MOCK DATA (Ideally fetched by ID/Slug) ---
const PROJECT_DATA = {
  id: "1",
  title: "Neural Dashboard",
  description: "A high-performance analytics dashboard built for monitoring machine learning pipelines in real-time. Features WebGL data visualization and WebSocket streams.",
  category: "Code",
  images: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
  ],
  techStack: [
    { name: "React", type: "Framework" },
    { name: "TypeScript", type: "Language" },
    { name: "Go", type: "Backend" },
  ],
  links: {
    demo: "https://demo.vercel.app",
    repo: "https://github.com/user/repo",
  },
};

export default function EditProjectPage({ params }) {
  // In a real app: await fetchProject(params.slug)
  
  return (
    <div className="min-h-screen bg-background pt-8 px-4">
      <EditProjectForm project={PROJECT_DATA} />
    </div>
  );
}