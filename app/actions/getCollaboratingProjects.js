"use server";
/**
 * Projects the current user works on but doesn't own.
 * ---------------------------------------------------
 * Until now "My Projects" only ever queried owner_id = you, so a project
 * you were added to as a collaborator appeared nowhere in your own
 * dashboard. People kept reporting they'd accepted an invite and then
 * couldn't find anywhere to edit the project — there genuinely was no
 * entry point except scrolling to the sidebar on the public project page
 * and spotting "Edit Configuration" there.
 *
 * Service role, scoped to the caller's own accepted collaborations, for
 * the usual reason: `collaborations` SELECT under the anon key is not
 * reliably readable even for rows about yourself (see
 * collaborationActions.js and getProjectCollaborators.js).
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const EMPTY = { projects: [], count: 0 };

export async function getCollaboratingProjects({ page = 1, pageSize = 8, search = "" } = {}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return EMPTY;

    const admin = getAdmin();

    const { data: collabs, error: collabErr } = await admin
      .from("collaborations")
      .select("project_id")
      .eq("user_id", user.id)
      .eq("status", "accepted");
    if (collabErr) return EMPTY;

    // Same person can end up on a project twice (duplicate invites both
    // accepted) — dedupe so the project doesn't show up twice.
    const projectIds = [...new Set((collabs || []).map((c) => c.project_id).filter(Boolean))];
    if (projectIds.length === 0) return EMPTY;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin
      .from("projects")
      .select(
        `*, contest_submissions(contest:contests(title, slug, status)), owner:profiles!projects_owner_id_fkey(username, full_name)`,
        { count: "exact" }
      )
      .in("id", projectIds)
      // Your own projects already have their own tabs — and some accounts
      // ended up as an accepted "collaborator" on a project they own (the
      // self-invite bug fixed in inviteCollaborators.js), which would
      // otherwise list the project twice.
      .neq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error, count } = await query;
    if (error) return EMPTY;

    return { projects: data || [], count: count || 0 };
  } catch (err) {
    console.error("[getCollaboratingProjects]", err);
    return EMPTY;
  }
}
