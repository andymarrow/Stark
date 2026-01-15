"use server";
import { createClient } from "@/utils/supabase/server";

export async function getFeedContent({ 
  filter = "for_you", 
  page = 1, 
  limit = 10 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // We fetch a larger batch for "For You" to allow for shuffling/filtering
  // but we only return 'limit' items to the frontend.
  const fetchLimit = filter === "for_you" ? limit * 3 : limit;
  const from = (page - 1) * limit;
  const to = from + fetchLimit - 1;

  try {
    // 1. Get "Seen" IDs (Items viewed in last 7 days) to exclude from "For You"
    let seenIds = [];
    if (user && filter === "for_you") {
        const { data: seenLogs } = await supabase
            .from("analytics_logs")
            .select("entity_id")
            .eq("viewer_hash", user.id) // Assuming we log user_id as hash for auth users
            .gt("last_viewed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        seenIds = seenLogs?.map(l => l.entity_id) || [];
    }

    // 2. Determine Network Scope
    let ownerIds = [];
    if (filter === "network" && user) {
        const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
        ownerIds = follows?.map(f => f.following_id) || [];
        if (ownerIds.length === 0) return { data: [], hasMore: false };
    }

    // 3. Fetch Projects
    let projectQuery = supabase
        .from("projects")
        .select(`*, author:profiles!projects_owner_id_fkey(username, full_name, avatar_url, role)`)
        .eq("status", "published")
        .eq("is_contest_entry", false)
        .order("created_at", { ascending: false })
        .range(from, to);

    // Apply Filters
    if (filter === "network") projectQuery = projectQuery.in("owner_id", ownerIds);
    if (filter === "today") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        projectQuery = projectQuery.gte("created_at", yesterday.toISOString());
    }
    // Exclude seen items for "For You" (Smart Feed)
    if (filter === "for_you" && seenIds.length > 0) {
        projectQuery = projectQuery.not("id", "in", `(${seenIds.join(',')})`);
    }

    const { data: projects } = await projectQuery;

    // 4. Fetch Changelogs
    let logQuery = supabase
        .from("project_logs")
        .select(`*, project:projects!inner(slug, title, owner_id, status, is_contest_entry)`)
        .eq("project.status", "published")
        .eq("project.is_contest_entry", false)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (filter === "today") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        logQuery = logQuery.gte("created_at", yesterday.toISOString());
    }
    // Exclude seen logs
    if (filter === "for_you" && seenIds.length > 0) {
        logQuery = logQuery.not("id", "in", `(${seenIds.join(',')})`);
    }

    const { data: logsData } = await logQuery;

    // --- FALLBACK LOGIC ---
    // If "For You" returns nothing because you've seen everything, fetch again WITHOUT exclusion
    let finalProjects = projects || [];
    let finalLogs = logsData || [];

    if (filter === "for_you" && finalProjects.length === 0 && finalLogs.length === 0) {
        // Retry fetching projects without seen filter
        const { data: fallbackProjects } = await supabase
            .from("projects")
            .select(`*, author:profiles!projects_owner_id_fkey(username, full_name, avatar_url, role)`)
            .eq("status", "published")
            .eq("is_contest_entry", false)
            .order("created_at", { ascending: false })
            .range(from, from + limit - 1); // Normal limit
        
        if (fallbackProjects) finalProjects = fallbackProjects;
    }

    // 5. Post-Process Logs (Attach Authors)
    const logOwnerIds = [...new Set(finalLogs.map(l => l.project.owner_id))];
    let authorsMap = {};
    if (logOwnerIds.length > 0) {
        const { data: authors } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, role")
            .in("id", logOwnerIds);
        authors?.forEach(a => authorsMap[a.id] = a);
    }

    const formattedLogs = finalLogs.map(log => {
        if (filter === "network" && !ownerIds.includes(log.project.owner_id)) return null;
        return {
            type: "changelog",
            id: log.id,
            created_at: log.created_at,
            title: log.title,
            version: log.version,
            content: log.content,
            media: log.media_urls || [],
            likes: log.likes_count,
            project: { id: log.project_id, title: log.project.title, slug: log.project.slug },
            metadata: log.metadata, 
            author: authorsMap[log.project.owner_id]
        };
    }).filter(Boolean);

    const formattedProjects = finalProjects.map(p => ({
        type: "project",
        id: p.id,
        created_at: p.created_at,
        title: p.title,
        description: p.description,
        media: p.images || [],
        likes: p.likes_count,
        slug: p.slug,
        author: p.author,
        tech: p.tags,
        metadata: p.metadata
    }));

    // 6. Combine
    let combined = [...formattedProjects, ...formattedLogs];

    // 7. Sort / Shuffle
    if (filter === "for_you") {
        // Shuffle for randomness
        combined = combined.sort(() => Math.random() - 0.5);
    } else {
        // Strict chronological for others
        combined = combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // 8. Slice to requested limit (since we might have fetched extra for shuffling)
    const sliced = combined.slice(0, limit);

    return { 
        data: sliced,
        hasMore: combined.length > limit // Crude check, but works if we fetched extra
    };

  } catch (error) {
    console.error("Feed Error:", error);
    return { data: [], hasMore: false };
  }
}