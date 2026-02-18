"use server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET_FEED_CONTENT
 * Fetches combined stream of Projects and Changelogs.
 * Enforces isolation of active contest entries.
 */
export async function getFeedContent({ 
  filter = "for_you", 
  page = 1, 
  limit = 10,
  mention = null 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Adjust fetch limits for merging/randomization strategies
  const fetchLimit = filter === "for_you" ? limit * 3 : limit;
  const from = (page - 1) * limit;
  const to = from + fetchLimit - 1;

  try {
    let finalProjects = [];
    let finalLogs = [];

    // --- STRATEGY A: PREFERENCE MIX (Only if NO specific mention is being filtered) ---
    if (filter === "for_you" && user && page === 1 && !mention) {
        const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", user.id).single();
        const prefs = profile?.preferences || {};
        const topTags = Object.entries(prefs).sort(([,a], [,b]) => b - a).slice(0, 3).map(([tag]) => tag);

        if (topTags.length > 0) {
             const { data: preferred } = await supabase
                .from("projects")
                .select(`*, author:profiles!projects_owner_id_fkey(username, full_name, avatar_url, role)`)
                .eq("status", "published")
                // --- ISOLATION: Filter out hidden contest work ---
                .eq("is_contest_entry", false) 
                .overlaps("tags", topTags)
                .order("quality_score", { ascending: false })
                .limit(5);
             if (preferred) finalProjects.push(...preferred);
        }
    }

    // --- STRATEGY B: NETWORK SCOPE ---
    let ownerIds = [];
    if (filter === "network" && user) {
        const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
        ownerIds = follows?.map(f => f.following_id) || [];
        // If filtering by network but no follows found, return early
        if (ownerIds.length === 0) return { data: [], hasMore: false };
    }

    // 1. PROJECTS QUERY
    let projectQuery = supabase
        .from("projects")
        .select(`*, author:profiles!projects_owner_id_fkey(username, full_name, avatar_url, role)`)
        .eq("status", "published")
        .eq("is_contest_entry", false);

    // --- MENTION FILTER LOGIC (FIXED) ---
    if (mention) {
        if (mention === '__COMMUNITY__') {
            projectQuery = projectQuery.ilike('description', '%data-type="mention"%');
        } else {
            const target = mention.toLowerCase();
            projectQuery = projectQuery.ilike('description', `%data-id="${target}"%`);
        }
    }

    if (filter === "network") projectQuery = projectQuery.in("owner_id", ownerIds);
    else if (filter === "today") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        projectQuery = projectQuery.gte("created_at", yesterday.toISOString());
    }

    const { data: standardProjects } = await projectQuery.order("created_at", { ascending: false }).range(from, to);
    
    if (standardProjects) {
        const existingIds = finalProjects.map(p => p.id);
        const newItems = standardProjects.filter(p => !existingIds.includes(p.id));
        finalProjects.push(...newItems);
    }

    // 2. CHANGELOGS QUERY
    let logQuery = supabase
        .from("project_logs")
        .select(`
            *,
            project:projects!inner(
                id,
                slug, 
                title, 
                owner_id, 
                status,
                is_contest_entry,
                views
            )
        `)
        .eq("project.status", "published")
        .eq("project.is_contest_entry", false);

    // --- MENTION FILTER LOGIC FOR LOGS (FIXED) ---
    if (mention) {
        if (mention === '__COMMUNITY__') {
            logQuery = logQuery.ilike('content', '%data-type="mention"%');
        } else {
            const target = mention.toLowerCase();
            logQuery = logQuery.ilike('content', `%data-id="${target}"%`);
        }
    }

    if (filter === "today") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        logQuery = logQuery.gte("created_at", yesterday.toISOString());
    }

    const { data: logsData } = await logQuery.order("created_at", { ascending: false }).range(from, to);
    finalLogs = logsData || [];

    // --- FORMATTING & AUTHOR MAPPING ---
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
            views: log.project.views, 
            project: {
                id: log.project.id,
                title: log.project.title,
                slug: log.project.slug
            },
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
        media: [...new Set([p.thumbnail_url, ...(p.images || [])])].filter(Boolean),
        likes: p.likes_count,
        views: p.views,
        slug: p.slug,
        author: p.author,
        tech: p.tags,
        metadata: p.metadata
    }));

    // --- MERGE & SORT ---
    let combined = [...formattedProjects, ...formattedLogs];

    if (filter === "for_you" && !mention) {
        combined = combined.sort(() => Math.random() - 0.5);
    } else {
        combined = combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const sliced = combined.slice(0, limit);

    return { 
        data: sliced,
        hasMore: combined.length >= limit 
    };

  } catch (error) {
    console.error("Feed System Error:", error);
    return { data: [], hasMore: false };
  }
}