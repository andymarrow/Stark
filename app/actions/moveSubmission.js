"use server";
import { createClient } from "@/utils/supabase/server";

export async function moveSubmission(submissionId, targetFolderId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  try {
    // 1. Verify Host Ownership via Join
    // We check if the submission belongs to an event hosted by the user
    const { data: sub, error: fetchError } = await supabase
      .from("event_submissions")
      .select("event_id, events!inner(host_id)")
      .eq("id", submissionId)
      .single();

    if (fetchError || !sub) throw new Error("Submission not found.");
    if (sub.events.host_id !== user.id) throw new Error("Access Denied.");

    // 2. Determine New Status based on Folder Name
    // We fetch the folder name to automatically set status (Accepted/Rejected)
    const { data: folder } = await supabase
      .from("event_folders")
      .select("name")
      .eq("id", targetFolderId)
      .single();

    let newStatus = 'pending';
    if (folder.name === 'Accepted') newStatus = 'accepted';
    else if (folder.name === 'Rejected') newStatus = 'rejected';

    // 3. Update Submission
    const { error: updateError } = await supabase
      .from("event_submissions")
      .update({ 
        folder_id: targetFolderId,
        status: newStatus
      })
      .eq("id", submissionId);

    if (updateError) throw updateError;

    return { success: true, newStatus };

  } catch (error) {
    console.error("Move Error:", error);
    return { error: error.message };
  }
}