"use server";
import { createClient } from "@/utils/supabase/server";

export async function submitToEvent(token, projectId, targetFolderId = null) {
  const supabase = await createClient();
  
  // 1. Get Event details via Token (Secure RPC)
  const { data: event, error: eventError } = await supabase
    .rpc('get_event_by_token', { token_input: token });

  if (eventError || !event) throw new Error("Invalid Event Token");

  let finalFolderId = null;

  // 2. Validate Target Folder (if provided)
  if (targetFolderId) {
      const { data: folder } = await supabase
        .from('event_folders')
        .select('id')
        .eq('id', targetFolderId)
        .eq('event_id', event.id)
        .eq('is_public', true) // Security: Can only submit directly to PUBLIC folders
        .single();
      
      if (folder) finalFolderId = folder.id;
  }

  // 3. Fallback to Inbox if no valid target
  if (!finalFolderId) {
      const { data: inboxId } = await supabase
        .rpc('get_inbox_id', { target_event_id: event.id });
      finalFolderId = inboxId;
  }

  // 4. Insert Submission
  const { error } = await supabase
    .from('event_submissions')
    .insert({
        event_id: event.id,
        project_id: projectId,
        folder_id: finalFolderId,
        status: 'pending'
    });

  if (error) {
      if (error.code === '23505') throw new Error("Already submitted.");
      console.error("Submission Error:", error);
      throw error;
  }

  return { success: true, eventId: event.id };
}