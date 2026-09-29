"use server";
/**
 * Accepted collaborators for every entry in a contest, keyed by project id.
 * -----------------------------------------------------------------------
 * Judges search for people, not just project titles — "which one was
 * Abel's team on?" — and a team's work is usually filed under one
 * member's account, so searching the owner alone misses most of them.
 * Fetched in a single round trip for the whole contest rather than
 * per-card, since the entries grid renders the full list at once.
 *
 * Service role for the reason established in getProjectCollaborators.js:
 * `collaborations` SELECT is restricted to the project owner, so a judge
 * querying it with the anon key gets nothing back. Accepted rows only,
 * and only the name fields the search needs.
 */
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getContestEntryCollaborators(contestId) {
  try {
    if (!contestId) return {};

    const admin = getAdmin();

    const { data: subs } = await admin
      .from("contest_submissions")
      .select("project_id")
      .eq("contest_id", contestId);

    const projectIds = (subs || []).map((s) => s.project_id).filter(Boolean);
    if (projectIds.length === 0) return {};

    const { data: rows } = await admin
      .from("collaborations")
      .select("project_id, profile:profiles(username, full_name)")
      .in("project_id", projectIds)
      .eq("status", "accepted")
      .not("user_id", "is", null);

    const map = {};
    for (const row of rows || []) {
      if (!row.profile) continue;
      (map[row.project_id] ||= []).push({
        username: row.profile.username,
        name: row.profile.full_name,
      });
    }
    return map;
  } catch (err) {
    console.error("[getContestEntryCollaborators]", err);
    return {};
  }
}
