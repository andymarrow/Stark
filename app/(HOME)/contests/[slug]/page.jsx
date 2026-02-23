import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ContestClient from "./_components/ContestClient";
import JsonLd from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stark.et";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("contests")
    .select("title, description, cover_image, submission_deadline, created_at")
    .eq("slug", slug)
    .single();
  if (!c) return { title: "Contest Not Found | Stark" };
  const canonicalUrl = `${BASE_URL}/contests/${slug}`;
  const title = `${c.title} | Contest | Stark`;
  const description =
    (c.description || "").substring(0, 155) ||
    `${c.title} – design contest on Stark. Submit your project, deadlines, and prizes.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${c.title} | Stark`,
      description,
      url: canonicalUrl,
      siteName: "Stark",
      images: c.cover_image
        ? [{ url: c.cover_image, width: 1200, height: 630, alt: c.title }]
        : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.title} | Stark`,
      description,
      images: c.cover_image ? [c.cover_image] : undefined,
    },
  };
}

export default async function PublicContestPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. FETCH CONTEST DATA
  // Includes a join with the creator's profile
  const { data: contest, error } = await supabase
    .from('contests')
    .select(`
        *,
        creator:profiles!creator_id(*)
    `)
    .eq('slug', slug)
    .single();

  if (error || !contest) return notFound();

  // 2. FETCH JUDGING PANEL
  // Fetches judges and their public profiles to show on the Rules Tab
  const { data: judges } = await supabase
    .from('contest_judges')
    .select(`
        id,
        status,
        profile:profiles(id, full_name, username, avatar_url, bio, socials)
    `)
    .eq('contest_id', contest.id);

  // 3. AUTH & ENTRY CHECK
  const { data: { user } } = await supabase.auth.getUser();
  let userEntry = null;

  if (user) {
    /**
     * Logic: We check contest_submissions for this contest, 
     * but we filter the joined 'project' by the owner_id (Current User).
     * This tells us if the current visitor has already submitted to this event.
     */
    const { data: submission } = await supabase
        .from('contest_submissions')
        .select('id, project:projects!inner(owner_id)')
        .eq('contest_id', contest.id)
        .eq('project.owner_id', user.id)
        .maybeSingle();
        
    userEntry = submission;
  }

  const contestUrl = `${BASE_URL}/contests/${slug}`;
  const creatorUsername = contest.creator?.username;
  const organizerUrl = creatorUsername
    ? `${BASE_URL}/profile/${creatorUsername}`
    : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Event",
        name: contest.title,
        description: (contest.description || "").substring(0, 500) || `${contest.title} – contest on Stark.`,
        url: contestUrl,
        startDate: contest.created_at,
        endDate: contest.submission_deadline || undefined,
        location: { "@type": "Place", name: "Online" },
        ...(organizerUrl && {
          organizer: {
            "@type": "Person",
            name: contest.creator?.full_name || "Stark",
            url: organizerUrl,
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Stark", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Contests", item: `${BASE_URL}/contests` },
          { "@type": "ListItem", position: 3, name: contest.title, item: contestUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} strict />
      <ContestClient
        contest={contest}
        userEntry={userEntry}
        judges={judges || []}
      />
    </>
  );
}