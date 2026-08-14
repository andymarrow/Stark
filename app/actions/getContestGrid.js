"use server";
import { createClient } from "@/utils/supabase/server";

// Page size for the contest "GRID" view. The page renders the first page
// server-side; the "Load More" button fetches subsequent pages on demand so we
// never ship hundreds of entries up front.
const CONTEST_GRID_PAGE_SIZE = 9;

export async function getContestGrid({ page = 1, limit = CONTEST_GRID_PAGE_SIZE } = {}) {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Same raw shape ArenaClient's <CyberCard> expects: submission + project + contest.
  const { data, error } = await supabase
    .from("contest_submissions")
    .select(
      `
        id, final_score, rank,
        project:projects!inner(
            title, slug, thumbnail_url, likes_count, views,
            owner:profiles!projects_owner_id_fkey(username)
        ),
        contest:contests!inner(title)
    `
    )
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Contest grid fetch error:", error);
    return { data: [], hasMore: false };
  }

  return { data: data || [], hasMore: (data?.length || 0) === limit };
}
