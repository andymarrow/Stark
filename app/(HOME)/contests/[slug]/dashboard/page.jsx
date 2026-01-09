import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import DashboardClient from "./_components/DashboardClient";

export default async function ContestDashboardPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Get Contest
  const { data: contest, error } = await supabase
    .from('contests')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !contest) notFound();

  // 3. Security Check: Only Creator can access dashboard
  // (Judges have a different view/portal usually, or restricted access here)
  if (contest.creator_id !== user.id) {
    // If user is a judge, maybe redirect to judging interface?
    // For now, simple block.
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-mono">
            ACCESS_DENIED // CREATOR_ONLY
        </div>
    );
  }

  return <DashboardClient contest={contest} currentUser={user} />;
}