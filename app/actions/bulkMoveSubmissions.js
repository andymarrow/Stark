"use server";
import { createClient } from "@/utils/supabase/server";

export async function bulkMoveSubmissions(submissionIds, targetFolderId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  try {
    // 1. Verify Host Ownership for the Event
    // We check just one submission to get the event_id, then verify host.
    // (Optimization: Assuming all selected items belong to the same view/event)
    const { data: sub } = await supabase
      .from("event_submissions")
      .select("events!inner(host_id)")
      .in("id", submissionIds)
      .limit(1)
      .single();

    if (!sub || sub.events.host_id !== user.id) throw new Error("Access Denied.");

    // 2. Determine New Status based on Folder Name
    const { data: folder } = await supabase
      .from("event_folders")
      .select("name")
      .eq("id", targetFolderId)
      .single();

    let newStatus = 'pending';
    if (folder.name === 'Accepted') newStatus = 'accepted';
    else if (folder.name === 'Rejected') newStatus = 'rejected';

    // 3. Bulk Update
    const { error } = await supabase
      .from("event_submissions")
      .update({ 
        folder_id: targetFolderId,
        status: newStatus 
      })
      .in("id", submissionIds);

    if (error) throw error;

    return { success: true, newStatus };

  } catch (error) {
    console.error("Bulk Move Error:", error);
    return { error: error.message };
  }
}