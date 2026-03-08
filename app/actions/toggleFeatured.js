"use server";
import { createClient } from "@/utils/supabase/server";

export async function toggleFeatured(submissionId, isFeatured) {
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

    // 2. Update
    const { error } = await supabase
      .from("event_submissions")
      .update({ is_featured: isFeatured })
      .eq("id", submissionId);

    if (error) throw error;
    return { success: true };

  } catch (error) {
    return { error: error.message };
  }
}