import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

import ProjectGallery from "./_components/ProjectGallery";
import ProjectSidebar from "./_components/ProjectSidebar";
import ShareAction from "./_components/ShareAction";
import ProjectContent from "./_components/ProjectContent";
import JsonLd from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stark.et";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: p } = await supabase
    .from("projects")
    .select("title, description, thumbnail_url")
    .eq("slug", slug)
    .single();
  if (!p) return { title: "Project Not Found | Stark" };
  const canonicalUrl = `${BASE_URL}/project/${slug}`;
  const ogUrl = `${BASE_URL}/api/og/project?slug=${encodeURIComponent(slug)}`;
  const desc = p.description?.substring(0, 160) || "";
  const entityDescription = desc
    ? `${desc} View project on Stark.`
    : `${p.title} – project on Stark. View source, demo, and details.`;
  return {
    title: `${p.title} | Stark`,
    description: entityDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: p.title,
      description: entityDescription,
      url: canonicalUrl,
      siteName: "Stark",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: p.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: entityDescription,
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

  const profileUrl = `${BASE_URL}/profile/${project.author?.username || "user"}`;
  const projectUrl = `${BASE_URL}/project/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: project.title,
        description: (projectData.description || "").substring(0, 500),
        url: projectUrl,
        image: project.thumbnail_url || project.images?.[0],
        author: {
          "@type": "Person",
          name: project.author?.name || "Anonymous",
          url: profileUrl,
        },
        ...(projectData.created_at && {
          datePublished: projectData.created_at,
        }),
        ...(projectData.updated_at && {
          dateModified: projectData.updated_at,
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Stark", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Projects", item: `${BASE_URL}/explore` },
          { "@type": "ListItem", position: 3, name: project.title, item: projectUrl },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      <JsonLd data={jsonLd} strict />
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
            <div className="sticky top-32">
              <ProjectSidebar project={project} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
