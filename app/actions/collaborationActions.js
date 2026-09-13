"use server";
/**
 * Accept/decline a collaboration invite, server-side.
 * ------------------------------------------------------
 * The client-side version of this (an anon-key UPDATE/DELETE with
 * `.select()` tacked on to verify a row actually changed) broke real
 * accepts: Postgres requires the same RLS SELECT policy for a write's
 * RETURNING data as for a plain SELECT, and `collaborations` apparently
 * doesn't grant the invited user SELECT on their own row (only the project
 * owner). So the UPDATE/DELETE succeeded, but the follow-up `.select()`
 * came back empty — read as "0 rows changed" and reported as "already
 * resolved or removed" even though the invite was still very much pending.
 *
 * Fixing this by moving the write server-side with the service role (which
 * bypasses RLS entirely) removes that whole class of false negative. It's
 * still safe: the acting user comes from their own session cookie (can't
 * be spoofed), and every write is scoped to `user_id = that user's id`, so
 * this can only ever touch the caller's own invite.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveProjectId(admin, slug) {
  const { data: project, error } = await admin.from("projects").select("id").eq("slug", slug).single();
  if (error || !project) return { error: "Project Node not found." };
  return { projectId: project.id };
}

export async function acceptCollabInvite(projectSlug) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const admin = getAdmin();
  const { projectId, error: resolveError } = await resolveProjectId(admin, projectSlug);
  if (resolveError) return { error: resolveError };

  const { data, error } = await admin
    .from("collaborations")
    .update({ status: "accepted" })
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .select("id");

  if (error) return { error: error.message };
  if (!data?.length) return { error: "Invite was already resolved or removed." };
  return { success: true };
}

export async function declineCollabInvite(projectSlug) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const admin = getAdmin();
  const { projectId, error: resolveError } = await resolveProjectId(admin, projectSlug);
  if (resolveError) return { error: resolveError };

  const { data, error } = await admin
    .from("collaborations")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .select("id");

  if (error) return { error: error.message };
  if (!data?.length) return { error: "Invite was already resolved or removed." };
  return { success: true };
}
