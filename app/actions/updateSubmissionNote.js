"use server";
import { createClient } from "@/utils/supabase/server";

export async function updateSubmissionNote(submissionId, note) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  try {
    // 1. Verify Host Ownership via Join
    const { data: sub } = await supabase
      .from("event_submissions")
      .select("events!inner(host_id)")
      .eq("id", submissionId)
      .single();

    if (!sub || sub.events.host_id !== user.id) throw new Error("Access Denied.");

    // 2. Update Note
    const { error } = await supabase
      .from("event_submissions")
      .update({ internal_notes: note })
      .eq("id", submissionId);

    if (error) throw error;
    return { success: true };

  } catch (error) {
    return { error: error.message };
  }
}