"use server";
import { createClient } from "@/utils/supabase/server";

export async function getEventsHubData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // 1. My Submissions (Transmissions)
    // We explicitly select the project slug here
    const { data: mySubmissions } = await supabase
      .from('event_submissions')
      .select(`
        id, status, submitted_at,
        event:events(id, title, accent_color, is_closed, deadline),
        project:projects!inner(title, slug)
      `)
      .eq('project.owner_id', user.id) 
      .order('submitted_at', { ascending: false });

    // 2. Global Radar
    const { data: globalRadar } = await supabase
      .from('events')
      .select(`
        *,
        host:profiles!host_id(username, avatar_url)
      `)
      .eq('is_public', true)
      .neq('host_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      success: true,
      data: {
        submissions: (mySubmissions || []).map(s => ({
            ...s,
            eventTitle: s.event?.title,
            projectTitle: s.project?.title,
            projectSlug: s.project?.slug // FIXED: Ensure this is correctly mapped
        })),
        radar: globalRadar || []
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}