import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ContestClient from "./_components/ContestClient";

/**
 * SERVER-SIDE PAGE COMPONENT
 * Handles all high-performance data fetching for SEO and Speed.
 */
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

  // 4. RENDER CLIENT SHELL
  return (
    <ContestClient 
      contest={contest} 
      userEntry={userEntry} 
      judges={judges || []} 
    />
  );
}