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
 *
 * Every step below is wrapped in try/catch and always returns
 * { error: message } rather than throwing — an uncaught throw from a
 * Server Action gets redacted by Next.js in production ("An error
 * occurred in the Server Components render... The specific message is
 * omitted"), which is exactly the unhelpful wall the client saw before
 * this. Whatever the failure is (missing service-role credentials, a
 * network blip, anything), it now surfaces as a real, readable message.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Server is missing Supabase service credentials (SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveProjectId(admin, slug) {
  const { data: project, error } = await admin.from("projects").select("id").eq("slug", slug).single();
  if (error || !project) return { error: "Project Node not found." };
  return { projectId: project.id };
}

export async function acceptCollabInvite(projectSlug) {
  try {
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
  } catch (err) {
    console.error("[acceptCollabInvite]", err);
    return { error: err.message || "Something went wrong accepting this invite." };
  }
}

export async function declineCollabInvite(projectSlug) {
  try {
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
  } catch (err) {
    console.error("[declineCollabInvite]", err);
    return { error: err.message || "Something went wrong declining this invite." };
  }
}
