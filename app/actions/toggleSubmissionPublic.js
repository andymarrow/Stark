"use server";
import { createClient } from "@/utils/supabase/server";

export async function toggleSubmissionPublic(submissionId, isPublic) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  try {
    // 1. Verify Host Ownership & Get Project ID
    const { data: sub } = await supabase
      .from("event_submissions")
      .select("project_id, events!inner(host_id)")
      .eq("id", submissionId)
      .single();

    if (!sub || sub.events.host_id !== user.id) throw new Error("Access Denied.");

    // 2. Update Submission Visibility
    const { error: subError } = await supabase
      .from("event_submissions")
      .update({ is_public: isPublic })
      .eq("id", submissionId);

    if (subError) throw subError;

    // 3. Update Project Status (Fixes Explore Leak)
    // If Public -> 'published'. If Hidden -> 'event_hidden'.
    const newStatus = isPublic ? 'published' : 'event_hidden';
    
    const { error: projError } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", sub.project_id);

    if (projError) throw projError;

    return { success: true };

  } catch (error) {
    return { error: error.message };
  }
}