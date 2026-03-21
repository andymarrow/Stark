import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ProfileClient from "./_components/ProfileClient";
import JsonLd from "@/components/JsonLd";
import { supabase } from "@/lib/supabaseClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stark.et";

export async function generateMetadata({ params }) {
  const { username } = await params;

  const { data: user } = await supabase
    .from("profiles")
    .select("full_name, bio, avatar_url")
    .eq("username", username)
    .single();

  if (!user) return { title: "Profile Not Found | Stark" };

  const canonicalUrl = `${BASE_URL}/profile/${username}`;
  const ogUrl = `${BASE_URL}/api/og/profile?username=${encodeURIComponent(username)}`;
  const displayName = user.full_name || username;
  const title = `${displayName} (@${username}) | Creator profile | Stark`;
  const description =
    user.bio ||
    `View ${displayName}'s profile on Stark – portfolio, projects, and bio.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${displayName} | Stark`,
      description: user.bio || `Creator profile on Stark.`,
      url: canonicalUrl,
      siteName: "Stark",
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${username}'s profile`,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} | Stark`,
      description: user.bio || `Creator profile on Stark.`,
      images: [ogUrl],
    },
  };
}

export default async function ProfilePage({ params }) {
  const { username } = await params;
  const supabaseServer = await createClient();

  // A. Get Authenticated User (for view counting logic)
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser();

  // B. Fetch Profile Data
  const { data: profileData, error: profileError } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError || !profileData) return notFound();

  // C. Fetch Projects, Follower Stats, Contest Data, Events, and BLOGS in Parallel
  const [
    projectsRes,
    likedRes,
    followersCount,
    followingCount,
    contestEntriesRes,
    judgingRes,
    achievementsCountRes,
    hostedEventsRes, 
    attendedEventsRes,
    publishedBlogsRes // <-- NEW: Fetch Blogs
  ] = await Promise.all([
    // 1. Work Projects
    supabaseServer
      .from('projects')
      .select('*, author:profiles!owner_id(*)')
      .eq('owner_id', profileData.id)
      .eq('status', 'published')
      .eq('is_contest_entry', false),

    // 2. Saved/Liked Projects
    supabaseServer
      .from('project_likes')
      .select('projects(*, author:profiles!owner_id(*))')
      .eq('user_id', profileData.id),

    // 3. Followers
    supabaseServer
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profileData.id),

    // 4. Following
    supabaseServer
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileData.id),

    // 5. Contest Entries
    supabaseServer
      .from('contest_submissions')
      .select(`
          id, final_score, rank, submitted_at,
          contest:contests(id, title, slug, cover_image),
          project:projects!inner(id, title, slug, thumbnail_url, owner_id)
      `)
      .eq('project.owner_id', profileData.id),

    // 6. Judging History
    supabaseServer
      .from('contest_judges')
      .select(`
          id, status, created_at,
          contest:contests(id, title, slug, cover_image)
      `)
      .eq('user_id', profileData.id),

    // 7. Achievement Count
    supabaseServer
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileData.id)
      .eq('is_public', true),

    // 8. Hosted Events
    supabaseServer
      .from('events')
      .select('*')
      .eq('host_id', profileData.id)
      .order('created_at', { ascending: false }),

    // 9. Attended/Submitted Events
    supabaseServer
      .from('event_submissions')
      .select(`
        id, status, submitted_at,
        event:events(*),
        project:projects!inner(*)
      `)
      .eq('project.owner_id', profileData.id)
      .order('submitted_at', { ascending: false }),
      
    // 10. Published Blogs (NEW)
    supabaseServer
      .from('blogs')
      .select('*')
      .eq('author_id', profileData.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
  ]);

  const workProjects = projectsRes.data || [];
  const likedProjects = likedRes.data?.map(item => item.projects).filter(Boolean) || [];
  const contestEntries = contestEntriesRes.data || [];
  const judgingHistory = judgingRes.data || [];
  const hostedEvents = hostedEventsRes.data || [];
  const attendedEvents = attendedEventsRes.data || [];
  const publishedBlogs = publishedBlogsRes.data || []; // <-- NEW

  const profileUrl = `${BASE_URL}/profile/${username}`;
  const sameAs = [];
  const s = profileData.socials || {};
  if (s.github) sameAs.push(s.github);
  if (s.twitter) sameAs.push(s.twitter);
  if (s.linkedin) sameAs.push(s.linkedin);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          name: profileData.full_name || username,
          url: profileUrl,
          image: profileData.avatar_url,
          description: (profileData.bio || "").substring(0, 500),
          identifier: profileUrl,
          ...(sameAs.length > 0 && { sameAs }),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Stark", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Creators", item: `${BASE_URL}/explore` },
          { "@type": "ListItem", position: 3, name: profileData.full_name || username, item: profileUrl },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <JsonLd data={jsonLd} strict />
      <ProfileClient
        username={username}
        currentUser={currentUser}
        initialProfile={profileData}
        initialWork={workProjects}
        initialSaved={likedProjects}
        contestEntries={contestEntries}
        judgingHistory={judgingHistory}
        hostedEvents={hostedEvents}
        attendedEvents={attendedEvents}
        initialBlogs={publishedBlogs} // <-- NEW: Pass blogs to client
        achievementCount={achievementsCountRes.count || 0}
        initialFollowerStats={{
          followers: followersCount.count || 0,
          following: followingCount.count || 0
        }}
      />
    </div>
  );
}