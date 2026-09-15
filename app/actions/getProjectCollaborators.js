"use server";
/**
 * Public, accepted-only collaborator list for a project.
 * ----------------------------------------------------------
 * Confirmed live: the anon-key query both the project page (server) and
 * ProjectSidebar (client) used to run against `collaborations` returns an
 * empty array for anyone who isn't the project owner — RLS on that table
 * apparently only grants SELECT to the owner (and maybe the collaborator
 * themselves), not the public. That's reasonable for pending invites
 * (nobody else's business), but collaborators who *accepted* are meant to
 * be shown off publicly on the project page — that's the whole point of
 * listing them — so a real, accepted collaborator was invisible to every
 * visitor, including the collaborator's own friends checking the page.
 *
 * Service role, but deliberately narrow: only rows with status='accepted'
 * for this one project, and only the public-safe profile fields. No
 * pending invites, no arbitrary table access.
 */
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getProjectCollaborators(projectId) {
  if (!projectId) return [];

  try {
    const admin = getAdmin();
    const { data, error } = await admin
      .from("collaborations")
      .select("role, profile:profiles(id, username, full_name, avatar_url, is_for_hire)")
      .eq("project_id", projectId)
      .eq("status", "accepted")
      .not("user_id", "is", null);

    if (error) {
      console.error("[getProjectCollaborators]", error);
      return [];
    }

    return (data || [])
      .filter((c) => c.profile)
      .map((c) => ({
        id: c.profile.id,
        name: c.profile.full_name || c.profile.username,
        username: c.profile.username,
        avatar: c.profile.avatar_url,
        isForHire: c.profile.is_for_hire,
        role: c.role || "Collaborator",
        collaborationStatus: "accepted",
      }));
  } catch (err) {
    console.error("[getProjectCollaborators]", err);
    return [];
  }
}
