import { createClient } from "@/utils/supabase/server";
import { buildContestRanking } from "@/lib/contestRanking";
import { notFound, redirect } from "next/navigation";
import WinnersHero  from "./_components/WinnersHero";
import FullRankingsTable from "./_components/FullRankingsTable";
import { Trophy } from "lucide-react";

export default async function WinnersRevealPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch Contest & Status
  const { data: contest, error } = await supabase
    .from('contests')
    .select(`*, creator:profiles!creator_id(*)`)
    .eq('slug', slug)
    .single();

  if (error || !contest) notFound();

  // SECURITY: If winners aren't revealed yet, only the creator can see this page
  const { data: { user } } = await supabase.auth.getUser();
  const isCreator = user?.id === contest.creator_id;

  if (!contest.winners_revealed && !isCreator) {
    redirect(`/contests/${slug}`);
  }

  // 2. Fetch Entries, Judge Scores, and the Judges themselves
  // We need the judges list to map names to the raw score packets
  const [submissionsRes, rawScoresRes, judgesRes] = await Promise.all([
    supabase
        .from('contest_submissions')
        .select(`
            *,
            project:projects!inner (
                id, title, slug, thumbnail_url, likes_count, views,
                owner:profiles!projects_owner_id_fkey(username, full_name, avatar_url),
                collaborators:collaborations(role, profile:profiles(username, avatar_url), invite_email)
            )
        `)
        .eq('contest_id', contest.id),
    
    supabase
        .from('contest_scores')
        .select('*')
        .eq('contest_id', contest.id),

    supabase
        .from('contest_judges')
        .select('id, email, metrics_config, profile:profiles(full_name, username, avatar_url)')
        .eq('contest_id', contest.id)
  ]);

  const submissions = submissionsRes.data || [];
  const rawScores = rawScoresRes.data || [];
  const judges = judgesRes.data || [];

  // 3. CALCULATION ENGINE
  // Shared with the organiser's Results Matrix (lib/contestRanking.js).
  // This page used to carry its own copy, which ranked differently and
  // assumed every judge used the contest's default rubric — so judges
  // with their own rubric had their scores looked up under names that
  // didn't exist, counted as zero, and shown as "-" in the breakdown.
  const { rows: finalRankings } = buildContestRanking({
    contest,
    judges,
    submissions,
    scores: rawScores,
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-32">
        {/* 🎉 The Reveal Stage */}
        <WinnersHero 
            contest={contest} 
            winners={finalRankings.slice(0, 3)} 
        />

        {/* 📊 Detailed Audit Table */}
        <div className="container mx-auto px-4 max-w-6xl mt-20">
            <div className="flex items-center gap-3 mb-8">
                <Trophy className="text-accent" size={24} />
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">
                    Protocol: Final_Rankings
                </h2>
            </div>
            <FullRankingsTable 
                rankings={finalRankings} 
                metrics={contest.metrics_config} 
                judges={judges}
            />
        </div>
    </div>
  );
}