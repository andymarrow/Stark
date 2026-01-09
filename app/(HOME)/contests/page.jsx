import { createClient } from "@/utils/supabase/server";
import ArenaClient from "./_components/ArenaClient";

export default async function ContestsPage() {
  const supabase = await createClient();

  // 1. Fetch Active Contests + Submissions Count + Likes Data
  // We join submissions -> projects(likes) to calculate hype score dynamically
  const { data: contestsRaw } = await supabase
    .from('contests')
    .select(`
        *, 
        creator:profiles!creator_id(username),
        submissions:contest_submissions(
            id,
            project:projects(likes_count)
        )
    `)
    .eq('status', 'open');

  // 2. Process Data for "Hype Sorting" (Likes + Activity)
  const contestsWithStats = (contestsRaw || []).map(c => {
      const entryCount = c.submissions.length;
      // Sum likes of all submissions in this contest
      const totalLikes = c.submissions.reduce((sum, sub) => sum + (sub.project?.likes_count || 0), 0);
      
      // Calculate real days remaining
      const now = new Date();
      const deadline = new Date(c.submission_deadline);
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      return {
          ...c,
          participant_count: entryCount,
          hype_score: totalLikes, // This is our "Heat" metric
          days_left: daysLeft > 0 ? daysLeft : 0
      };
  });

  // Sort by Hype (Most Likes) -> Then Newest
  contestsWithStats.sort((a, b) => b.hype_score - a.hype_score || new Date(b.created_at) - new Date(a.created_at));

  // The Winner becomes the Hero (Most Hype Active Contest)
  const featuredContest = contestsWithStats[0];

  // 3. Fetch Hall of Fame (Top Ranked Submissions of All Time)
  const { data: topRanked } = await supabase
    .from('contest_submissions')
    .select(`
        id, final_score, rank,
        project:projects!inner(title, slug, thumbnail_url, likes_count, views, owner:profiles!projects_owner_id_fkey(username)),
        contest:contests!inner(title)
    `)
    .not('rank', 'is', null) // Only actual ranked winners
    .order('rank', { ascending: true }) // Rank 1 first
    .limit(10);

  // 4. Fetch Feed (Latest Submissions)
  const { data: feed } = await supabase
    .from('contest_submissions')
    .select(`
        id, final_score, rank,
        project:projects!inner(title, slug, thumbnail_url, likes_count, views, owner:profiles!projects_owner_id_fkey(username)),
        contest:contests!inner(title)
    `)
    .order('submitted_at', { ascending: false })
    .limit(20);

  return (
    <ArenaClient 
        initialContests={contestsWithStats} 
        activeContest={featuredContest} // Pass the calculated hero
        hallOfFame={topRanked || []}
        initialFeed={feed || []}
    />
  );
}