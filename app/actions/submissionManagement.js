"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Withdraws (Deletes) a submission.
 * Security: Ensures the User owns the Project linked to the submission.
 */
export async function withdrawSubmission(submissionId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // 1. Verify Ownership
  const { data: submission, error: fetchError } = await supabase
    .from("event_submissions")
    .select("project_id, projects!inner(owner_id)")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) return { error: "Submission not found" };

  if (submission.projects.owner_id !== user.id) {
    return { error: "Unauthorized: You do not own this project." };
  }

  // 2. Perform Delete
  const { error: deleteError } = await supabase
    .from("event_submissions")
    .delete()
    .eq("id", submissionId);

  if (deleteError) return { error: "Failed to withdraw submission" };

  revalidatePath("/profile");
  return { success: true };
}

/**
 * Updates the internal note for a submission.
 */
export async function updateSubmissionNote(submissionId, note) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // 1. Verify Ownership
  const { data: submission, error: fetchError } = await supabase
    .from("event_submissions")
    .select("project_id, projects!inner(owner_id)")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) return { error: "Submission not found" };

  if (submission.projects.owner_id !== user.id) {
    return { error: "Unauthorized" };
  }

  // 2. Update
  const { error: updateError } = await supabase
    .from("event_submissions")
    .update({ internal_notes: note })
    .eq("id", submissionId);

  if (updateError) return { error: "Failed to update note" };

  revalidatePath("/profile");
  return { success: true };
}