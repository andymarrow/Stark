"use server";
import { createClient } from "@/utils/supabase/server";

export async function getPublicFolders(token) {
  const supabase = await createClient();
  
  // 1. Get Event ID
  const { data: event } = await supabase.rpc('get_event_by_token', { token_input: token });
  if (!event) return [];

  // 2. Fetch Public Folders
  const { data: folders } = await supabase
    .from("event_folders")
    .select("id, name")
    .eq("event_id", event.id)
    .eq("is_public", true);

  // 3. JS Filter (Safest way to exclude system folders)
  // We explicitly remove 'Inbox', 'Accepted', and 'Rejected' regardless of their DB public status
  const systemFolders = ['Inbox', 'Accepted', 'Rejected'];
  
  const cleanFolders = (folders || []).filter(f => !systemFolders.includes(f.name));

  return cleanFolders;
}