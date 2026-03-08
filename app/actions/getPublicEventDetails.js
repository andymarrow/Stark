"use server";
import { createClient } from "@/utils/supabase/server";

export async function getPublicEventDetails(eventId) {
  const supabase = await createClient();

  try {
    // 1. Fetch Event (Must be Public)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        host:profiles!host_id(username, full_name, avatar_url)
      `)
      .eq('id', eventId)
      .eq('is_public', true)
      .single();

    if (eventError || !event) return { success: false, error: "Event not found or private." };

    // 2. Fetch Public Folders (The Tracks)
    const { data: folders } = await supabase
      .from('event_folders')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_public', true)
      .order('created_at', { ascending: true });

    // 3. Fetch Public Submissions (The Exhibits)
    // We fetch ALL public submissions for this event, then filter by folder in UI
    const { data: submissions } = await supabase
      .from('event_submissions')
      .select(`
        id, folder_id, is_featured,
        project:projects!inner(
            id, title, slug, thumbnail_url, description, type,
            likes_count, views,
            author:profiles!projects_owner_id_fkey(username, full_name, avatar_url)
        )
      `)
      .eq('event_id', eventId)
      .eq('is_public', true) // CRITICAL: Only explicitly public submissions
      .order('is_featured', { ascending: false }); // Featured first

    return {
      success: true,
      data: {
        event,
        folders: folders || [],
        submissions: submissions || []
      }
    };

  } catch (error) {
    console.error("Gallery Fetch Error:", error);
    return { success: false, error: "System Malfunction" };
  }
}