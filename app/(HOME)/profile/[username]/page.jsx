import { createClient } from "@/utils/supabase/server";
import { supabase } from "@/lib/supabaseClient"; // Fallback for metadata
import ProfileClient from "./_components/ProfileClient";
import { notFound } from "next/navigation";

/**
 * 1. DYNAMIC METADATA (The Intelligence Preview)
 * Generates the preview for Telegram/Social Media with real-time stats
 */
export async function generateMetadata({ params }) {
  const { username } = await params;

  const { data: user } = await supabase
    .from('profiles')
    .select('full_name, bio, views')
    .eq('username', username)
    .single();

  if (!user) return { title: "Node Not Found | Stark" };

  // Points to our API OG route
  const ogUrl = `https://stark-01.vercel.app/api/og/profile?username=${username}&v=${Date.now()}`;

  return {
    title: `${user.full_name || username} (@${username}) | Stark`,
    description: user.bio || `Explore the technical dossier of ${username} on the Stark Network.`,
    openGraph: {
      title: `${user.full_name || username} // Stark`,
      description: user.bio,
      url: `https://stark-01.vercel.app/profile/${username}`,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${username}'s Dossier`,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.full_name || username} // Stark`,
      images: [ogUrl],
    },
  };
}

/**
 * 2. SERVER PAGE (Entry Point)
 * Fetches data on the server for speed and SEO
 */
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

  // C. Fetch Projects and Follower Stats in Parallel
  const [projectsRes, likedRes, followersCount, followingCount] = await Promise.all([
    // Work Projects
    supabaseServer
      .from('projects')
      .select('*, author:profiles!owner_id(*)')
      .eq('owner_id', profileData.id)
      .eq('status', 'published'),
    
    // Saved/Liked Projects
    supabaseServer
      .from('project_likes')
      .select('projects(*, author:profiles!owner_id(*))')
      .eq('user_id', profileData.id),

    // Followers
    supabaseServer
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profileData.id),

    // Following
    supabaseServer
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileData.id)
  ]);

  const workProjects = projectsRes.data || [];
  const likedProjects = likedRes.data?.map(item => item.projects).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
        <ProfileClient 
            username={username}
            currentUser={currentUser}
            initialProfile={profileData}
            initialWork={workProjects}
            initialSaved={likedProjects}
            initialFollowerStats={{
                followers: followersCount.count || 0,
                following: followingCount.count || 0
            }}
        />
        
        
    </div>
  );
}