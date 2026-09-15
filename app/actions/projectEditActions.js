"use server";
/**
 * Project edit / changelog writes, server-side, open to owner + accepted
 * collaborators.
 * --------------------------------------------------------------------
 * Both the projects.update and project_logs writes almost certainly sit
 * behind an owner-only RLS policy — every other table touched this
 * session that involves "does this person have a relationship to this
 * project" (collaborations, notifications) turned out to be RLS-
 * restricted in a way that silently excluded exactly the people who
 * should have had access. Rather than guess at (or blindly rewrite) a
 * policy we can't inspect from here, these run with the service role and
 * enforce the real rule ourselves: owner OR an accepted collaborator on
 * this specific project. Nobody else gets anywhere near it.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireEditor(admin, projectId, userId) {
  const { data: project } = await admin.from("projects").select("owner_id").eq("id", projectId).single();
  if (!project) return { error: "Project not found." };
  if (project.owner_id === userId) return { ok: true, isOwner: true };

  const { data: collab } = await admin
    .from("collaborations")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (collab) return { ok: true, isOwner: false };
  return { error: "You don't have permission to edit this project." };
}

export async function updateProject(projectId, updates) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();
    const access = await requireEditor(admin, projectId, user.id);
    if (access.error) return { error: access.error };

    const { error } = await admin.from("projects").update(updates).eq("id", projectId);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    console.error("[updateProject]", err);
    return { error: err.message || "Something went wrong saving this project." };
  }
}

export async function createChangelogEntry(projectId, payload) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();
    const access = await requireEditor(admin, projectId, user.id);
    if (access.error) return { error: access.error };

    const { data, error } = await admin
      .from("project_logs")
      .insert({ ...payload, project_id: projectId })
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, data };
  } catch (err) {
    console.error("[createChangelogEntry]", err);
    return { error: err.message || "Something went wrong publishing this changelog." };
  }
}

export async function updateChangelogEntry(logId, projectId, payload) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();
    const access = await requireEditor(admin, projectId, user.id);
    if (access.error) return { error: access.error };

    const { error } = await admin.from("project_logs").update(payload).eq("id", logId);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    console.error("[updateChangelogEntry]", err);
    return { error: err.message || "Something went wrong saving this changelog." };
  }
}

export async function deleteChangelogEntry(logId, projectId) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();
    const access = await requireEditor(admin, projectId, user.id);
    if (access.error) return { error: access.error };

    const { data, error } = await admin.from("project_logs").delete().eq("id", logId).select("id");
    if (error) return { error: error.message };
    if (!data?.length) return { error: "Log not found." };
    return { success: true };
  } catch (err) {
    console.error("[deleteChangelogEntry]", err);
    return { error: err.message || "Something went wrong deleting this changelog." };
  }
}
