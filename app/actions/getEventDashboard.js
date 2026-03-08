"use server";
import { createClient } from "@/utils/supabase/server";

export async function getEventDashboard(eventId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // 1. Fetch Event and Check Identity
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) throw new Error("Event not found.");

    // SENIOR LOGIC: Allow if user is Host OR Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';
    const isHost = event.host_id === user.id;

    if (!isHost && !isAdmin) throw new Error("Access Denied. Insufficient clearance.");

    // 2. Fetch Folders
    const { data: folders } = await supabase
      .from("event_folders")
      .select("*")
      .eq("event_id", eventId)
      .order('created_at', { ascending: true });

    // 3. Fetch Submissions (Including is_public flag)
    const { data: submissions, error: subError } = await supabase
      .from("event_submissions")
      .select(`
        id, status, is_featured, internal_notes, folder_id, submitted_at, is_public,
        project:projects(
            id, title, slug, thumbnail_url, description,
            author:profiles!projects_owner_id_fkey(username, avatar_url)
        )
      `)
      .eq("event_id", eventId)
      .order('submitted_at', { ascending: false });

    if (subError) throw subError;

    return { 
      success: true, 
      data: {
        event,
        folders: folders || [],
        submissions: submissions || [],
        asAdmin: isAdmin && !isHost // Pass a flag to UI to show "Admin Mode"
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}