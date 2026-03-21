// app/(HOME)/blog/page.jsx
import { createClient } from "@/utils/supabase/server";
import BlogFeedClient from "./_components/BlogFeedClient";

export const metadata = {
  title: "Intelligence Reports | Stark",
  description: "Explore technical deployments, architectural breakdowns, and engineering insights from the Stark network.",
};

export default async function GlobalBlogPage() {
  const supabase = await createClient();

  // 1. Get Current User
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch Initial Feed (Top 10 Latest Published)
  const { data: initialPosts } = await supabase
    .from('blogs')
    .select('*, author:profiles!author_id(id, username, full_name, avatar_url, role)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  // 3. Fetch Top 10 for Carousel (Weighted Algorithm)
  const { data: carouselPosts } = await supabase.rpc('get_trending_blogs_carousel');

  // 4. Fetch Recommended Nodes (Influence Algorithm)
  const { data: recommendedNodes } = await supabase.rpc('get_recommended_bloggers');

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-20 pb-32">
      <BlogFeedClient 
        currentUser={user} 
        initialPosts={initialPosts || []} 
        carouselPosts={carouselPosts || []}
        recommendedNodes={recommendedNodes || []}
      />
    </div>
  );
}