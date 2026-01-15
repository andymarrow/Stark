"use server";
import { createClient } from "@/utils/supabase/server";

export async function getArenaFeed({ filter = "for_you", page = 1, limit = 8 }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    // 1. Base Query for Contest Submissions
    let query = supabase
        .from('contest_submissions')
        .select(`
            id, final_score, rank, submitted_at,
            project:projects!inner (
                id, title, slug, description, thumbnail_url, images, likes_count, views, created_at, tags, source_link, demo_link,
                owner:profiles!projects_owner_id_fkey (id, username, full_name, avatar_url, role)
            ),
            contest:contests!inner (id, title, slug)
        `)
        .order('submitted_at', { ascending: false });

    // 2. Apply Filters
    if (filter === "today") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query = query.gte('submitted_at', yesterday.toISOString());
    }

    if (filter === "network" && user) {
        const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
        const ownerIds = follows?.map(f => f.following_id) || [];
        if (ownerIds.length === 0) return { data: [], hasMore: false };
        query = query.in('project.owner_id', ownerIds);
    }

    const { data, error } = await query.range(from, to);
    if (error) throw error;

    // 3. Format to match FeedItem expectations
    const formatted = data.map(sub => ({
        id: sub.project.id,
        slug: sub.project.slug,
        title: sub.project.title,
        description: sub.project.description,
        created_at: sub.submitted_at,
        author: sub.project.owner,
        likes: sub.project.likes_count,
        views: sub.project.views,
        // Deduplicate thumbnail and images
        media: [...new Set([sub.project.thumbnail_url, ...(sub.project.images || [])])].filter(Boolean),
        tech: sub.project.tags,
        source_link: sub.project.source_link,
        demo_link: sub.project.demo_link,
        type: 'project',
        // Additional Arena Context
        contest: sub.contest,
        rank: sub.rank
    }));

    // Randomize for "For You"
    if (filter === "for_you") {
        formatted.sort(() => Math.random() - 0.5);
    }

    return { 
        data: formatted, 
        hasMore: formatted.length === limit 
    };

  } catch (err) {
    console.error("Arena Feed Error:", err);
    return { data: [], hasMore: false };
  }
}