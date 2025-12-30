import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { createClient } from "@/utils/supabase/server"; 
import { notFound } from "next/navigation";

// Client Components
import ProjectGallery from "./_components/ProjectGallery";
import ProjectSidebar from "./_components/ProjectSidebar";
import ProjectReadme from "./_components/ProjectReadme";
import ProjectComments from "./_components/ProjectComments";
import ShareAction from "./_components/ShareAction"; 

/**
 * 1. DYNAMIC METADATA GENERATION
 */
export async function generateMetadata({ params }) {
  const { slug } = await params; // MUST AWAIT
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("projects")
    .select("title, description")
    .eq("slug", slug)
    .single();

  if (!p) return { title: "Project Not Found | Stark" };

  const domain = process.env.NEXT_PUBLIC_SITE_URL || "https://stark-01.vercel.app";
  const ogUrl = `${domain}/api/og/project?slug=${slug}&v=${Date.now()}`;

  return {
    title: `${p.title} | Stark`,
    description: p.description?.substring(0, 160),
    openGraph: {
      title: p.title,
      description: p.description?.substring(0, 160),
      url: `${domain}/project/${slug}`,
      siteName: "Stark Network",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      images: [ogUrl],
    },
  };
}

/**
 * 2. SERVER-SIDE DATA FETCHING
 */
export default async function ProjectDetailPage({ params }) {
  const { slug } = await params; // MUST AWAIT
  const supabase = await createClient();

  // --- A. FETCH PROJECT & OWNER ---
  // Simplified join to avoid potential fkey naming crashes
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      author:profiles(*) 
    `)
    .eq('slug', slug)
    .single();

  if (projectError || !projectData) {
    return notFound();
  }

  // --- B. FETCH COLLABORATORS ---
  const { data: collabData } = await supabase
    .from('collaborations')
    .select(`
      role,
      status,
      profile:profiles(*) 
    `)
    .eq('project_id', projectData.id)
    .not('user_id', 'is', null);

  // --- C. DATA FORMATTING (With Safety Checks) ---
  const collaborators = (collabData || [])
    .filter(c => c.profile) // Safety: ensure profile exists
    .map(c => ({
      id: c.profile.id,
      name: c.profile.full_name || c.profile.username || "Unknown",
      username: c.profile.username || "user",
      avatar: c.profile.avatar_url,
      isForHire: c.profile.is_for_hire,
      role: c.role || "Collaborator"
    }));

  const project = {
      ...projectData,
      images: projectData.images || [],
      techStack: projectData.tags ? projectData.tags.map(t => ({ name: t })) : [],
      collaborators: collaborators,
      author: {
          id: projectData.author?.id, 
          name: projectData.author?.full_name || projectData.author?.username || "Anonymous",
          username: projectData.author?.username || "user",
          avatar: projectData.author?.avatar_url,
          isForHire: projectData.author?.is_for_hire,
          role: projectData.author?.bio ? projectData.author.bio.split('.')[0] : "Creator"
      },
      stats: {
          stars: projectData.likes_count || 0,
          views: projectData.views || 0,
          forks: 0
      }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      
      {/* Navigation Breadcrumb */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 md:top-16 z-40">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-accent transition-colors">
                <Home size={14} />
            </Link>
            <ChevronRight size={12} />
            <Link href="/explore" className="hover:text-foreground transition-colors">Projects</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold truncate max-w-[150px]">{project.title}</span>
          </div>
          
          <div className="flex items-center gap-4">
             <ShareAction />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {/* The Gallery */}
        <div className="mb-12">
           <ProjectGallery images={project.images.length > 0 ? project.images : [project.thumbnail_url]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                        {project.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {project.techStack.map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-secondary/30 border border-border text-[10px] font-mono text-muted-foreground uppercase">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </div>
                
                <ProjectReadme content={project.description} />
                <ProjectComments projectId={project.id} />
            </div>

            {/* Right Content: Sticky Sidebar */}
            <div className="lg:col-span-4">
                <div className="sticky top-32">
                    <ProjectSidebar project={project} />
                </div>
            </div>

        </div>
      </main>

      
    </div>
  );
}