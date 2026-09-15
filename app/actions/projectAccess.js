"use server";
/**
 * Can the current user edit this project?
 * ------------------------------------------
 * Collaborators are people actually working on the project — they should
 * be able to edit it and post changelogs just like the owner. Uses the
 * service role rather than a plain client query because `collaborations`
 * SELECT is RLS-restricted to the project owner (confirmed live — see
 * getProjectCollaborators.js), so a collaborator checking their own
 * accepted status via the anon key would get nothing back.
 *
 * isOwner is returned separately so callers can still gate owner-only
 * actions (deleting the whole project, managing the team) — this doesn't
 * extend those, only edit + changelog.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const DENIED = { canEdit: false, isOwner: false, isCollaborator: false, userId: null };

export async function checkProjectAccess(projectId) {
  try {
    if (!projectId) return DENIED;

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DENIED;

    const admin = getAdmin();
    const { data: project } = await admin.from("projects").select("owner_id").eq("id", projectId).single();
    if (!project) return { ...DENIED, userId: user.id };

    if (project.owner_id === user.id) {
      return { canEdit: true, isOwner: true, isCollaborator: false, userId: user.id };
    }

    const { data: collab } = await admin
      .from("collaborations")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();

    const isCollaborator = !!collab;
    return { canEdit: isCollaborator, isOwner: false, isCollaborator, userId: user.id };
  } catch (err) {
    console.error("[checkProjectAccess]", err);
    return DENIED;
  }
}
