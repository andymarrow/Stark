import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

// Import components
import ProjectGallery from "./_components/ProjectGallery";
import ProjectSidebar from "./_components/ProjectSidebar";
import ShareAction from "./_components/ShareAction";
import ProjectContent from "./_components/ProjectContent";

// ... (Keep generateMetadata function exactly as is) ...
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: p } = await supabase
    .from("projects")
    .select("title, description, thumbnail_url")
    .eq("slug", slug)
    .single();
  if (!p) return { title: "Project Not Found | Stark" };
  const ogUrl = `https://stark-01.vercel.app/api/og/project?slug=${slug}&v=${Date.now()}`;
  return {
    title: `${p.title} | Stark`,
    description: p.description?.substring(0, 160),
    openGraph: {
      title: p.title,
      description: p.description?.substring(0, 160),
      url: `https://stark-01.vercel.app/project/${slug}`,
      siteName: "Stark Network",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: p.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description?.substring(0, 160),
      images: [ogUrl],
    },
  };
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;

  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // --- FETCH DATA ---
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select(`*, author:profiles!projects_owner_id_fkey(*)`)
    .eq("slug", slug)
    .single();

  if (projectError || !projectData) return notFound();

  const { data: collabData } = await supabase
    .from("collaborations")
    .select(`role, status, profile:profiles(*)`)
    .eq("project_id", projectData.id)
    .not("user_id", "is", null);

  // --- FORMAT DATA ---
  const collaborators = (collabData || []).map((c) => ({
    id: c.profile.id,
    name: c.profile.full_name || c.profile.username,
    username: c.profile.username,
    avatar: c.profile.avatar_url,
    isForHire: c.profile.is_for_hire,
    role: c.role || "Collaborator",
  }));

  const project = {
    ...projectData,
    images: projectData.images || [],
    techStack: projectData.tags
      ? projectData.tags.map((t) => ({ name: t }))
      : [],
    collaborators: collaborators,
    author: {
      id: projectData.author?.id,
      name: projectData.author?.full_name || "Anonymous",
      username: projectData.author?.username || "user",
      avatar: projectData.author?.avatar_url,
      isForHire: projectData.author?.is_for_hire,
      role: projectData.author?.bio
        ? projectData.author.bio.split(".")[0]
        : "Creator",
    },
    stats: {
      stars: projectData.likes_count || 0,
      views: projectData.views || 0,
      forks: 0,
    },
  };

  const isOwner = user?.id === projectData.owner_id;

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
            <Link
              href="/explore"
              className="hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold truncate max-w-[150px]">
              {project.title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ShareAction />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* CHANGED: Grid starts immediately. Gallery is now inside Left Column. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* --- LEFT COLUMN (Title + Gallery + Content) --- */}
          <div className="lg:col-span-8 space-y-8">
            

            {/* 2. Gallery (Now fits within the 8 columns) */}
            <ProjectGallery
              images={
                project.images.length > 0
                  ? project.images
                  : [project.thumbnail_url]
              }
            />

            {/* 3. Tabbed Content (Readme/Changelog) */}
            <ProjectContent project={project} isOwner={isOwner} />
          </div>

          {/* --- RIGHT COLUMN (Sticky Sidebar) --- */}
          <div className="lg:col-span-4">
            {/* top-24 accounts for the sticky header + some breathing room */}
            <div className="sticky top-24">
              <ProjectSidebar project={project} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
