import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import DashboardGuard from "./_components/DashboardGuard";

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

  // 3. Delegate Security Check to Client Guard for UI/UX
  return <DashboardGuard contest={contest} currentUser={user} />;
}