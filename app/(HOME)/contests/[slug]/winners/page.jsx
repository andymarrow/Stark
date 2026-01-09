import { createClient } from "@/utils/supabase/server";
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

  // 2. Fetch Entries + Judge Scores + Metadata
  // We need to fetch everything to calculate the final leaderboard
  const { data: submissions } = await supabase
    .from('contest_submissions')
    .select(`
        *,
        project:projects!inner (
            id, title, slug, thumbnail_url, likes_count, views,
            owner:profiles!projects_owner_id_fkey(username, full_name, avatar_url),
            collaborators:collaborations(role, profile:profiles(username, avatar_url), invite_email)
        )
    `)
    .eq('contest_id', contest.id);

  const { data: rawScores } = await supabase
    .from('contest_scores')
    .select('*')
    .eq('contest_id', contest.id);

  // 3. CALCULATION ENGINE (Mirror of Matrix Logic)
  const maxLikes = Math.max(...(submissions || []).map(s => s.project.likes_count), 1);
  const maxViews = Math.max(...(submissions || []).map(s => s.project.views), 1);

  const finalRankings = (submissions || []).map(sub => {
    const projectScores = (rawScores || []).filter(s => s.project_id === sub.project.id);
    const metricAverages = {};
    
    contest.metrics_config.forEach(metric => {
        if (metric.type === 'manual') {
            const valid = projectScores.map(ps => ps.scores[metric.name]).filter(v => v != null);
            metricAverages[metric.name] = valid.length > 0 ? valid.reduce((a,b)=>a+b,0)/valid.length : 0;
        } else if (metric.type === 'likes') {
            metricAverages[metric.name] = (sub.project.likes_count / maxLikes) * 10;
        } else if (metric.type === 'views') {
            metricAverages[metric.name] = (sub.project.views / maxViews) * 10;
        }
    });

    let total = 0;
    contest.metrics_config.forEach(m => total += (metricAverages[m.name] || 0) * (m.weight / 100));

    return { ...sub, metricAverages,projectScores, finalTotal: total };
  }).sort((a, b) => b.finalTotal - a.finalTotal);

  return (
    <div className="min-h-screen bg-black text-white pb-32">
        {/* 🎉 The Reveal Stage */}
        <WinnersHero 
            contest={contest} 
            winners={finalRankings.slice(0, 3)} 
        />

        {/* 📊 Detailed Audit Table */}
        <div className="container mx-auto px-4 max-w-6xl mt-20">
            <div className="flex items-center gap-3 mb-8">
                <Trophy className="text-accent" size={24} />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Protocol: Final_Rankings</h2>
            </div>
            <FullRankingsTable 
                rankings={finalRankings} 
                metrics={contest.metrics_config} 
            />
        </div>
    </div>
  );
}