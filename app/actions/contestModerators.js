"use server";
/**
 * Managing a contest's moderator list. Creator only — a moderator can run
 * the contest but can't appoint more moderators or remove the ones above
 * them, so the creator never loses control of their own contest.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireCreator(admin, contestId) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: contest } = await admin
    .from("contests")
    .select("creator_id, title")
    .eq("id", contestId)
    .single();
  if (!contest) return { error: "Contest not found." };
  if (contest.creator_id !== user.id) {
    return { error: "Only the contest creator can manage moderators." };
  }
  return { user, contest };
}

export async function listContestModerators(contestId) {
  try {
    if (!contestId) return { moderators: [] };
    const admin = getAdmin();

    const gate = await requireCreator(admin, contestId);
    if (gate.error) return { error: gate.error };

    const { data, error } = await admin
      .from("contest_moderators")
      .select("id, created_at, user_id, profile:profiles!contest_moderators_user_id_fkey(id, username, full_name, avatar_url)")
      .eq("contest_id", contestId)
      .order("created_at", { ascending: true });

    if (error) {
      // Migration not applied yet — an empty list is the honest answer.
      return { moderators: [], notReady: true, error: error.message };
    }

    return {
      moderators: (data || []).map((m) => ({
        id: m.id,
        userId: m.user_id,
        username: m.profile?.username || "unknown",
        name: m.profile?.full_name || m.profile?.username || "Unknown",
        avatar: m.profile?.avatar_url || null,
        addedAt: m.created_at,
      })),
    };
  } catch (err) {
    console.error("[listContestModerators]", err);
    return { error: err.message || "Could not load moderators." };
  }
}

export async function addContestModerator(contestId, username) {
  try {
    if (!contestId || !username?.trim()) return { error: "Pick someone to add." };
    const admin = getAdmin();

    const gate = await requireCreator(admin, contestId);
    if (gate.error) return { error: gate.error };

    const handle = username.trim().replace(/^@/, "");
    const { data: profile } = await admin
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .ilike("username", handle)
      .maybeSingle();

    if (!profile) return { error: `No account found for @${handle}.` };
    if (profile.id === gate.user.id) {
      return { error: "You already run this contest." };
    }

    // Checked here as well as relying on the unique constraint. The same
    // person being added twice is exactly how collaborations ended up with
    // duplicate rows, and a pre-existing table may not carry the
    // constraint this migration declares.
    const { data: already } = await admin
      .from("contest_moderators")
      .select("id")
      .eq("contest_id", contestId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (already) return { error: `@${profile.username} is already a moderator.` };

    const { error } = await admin
      .from("contest_moderators")
      .insert({ contest_id: contestId, user_id: profile.id, added_by: gate.user.id });

    if (error) {
      // Unique (contest_id, user_id) — re-adding is a no-op, not a failure.
      if (error.code === "23505") return { error: `@${profile.username} is already a moderator.` };
      return { error: error.message };
    }

    // Tell them, otherwise they have no way of knowing they have access.
    await admin.from("notifications").insert({
      receiver_id: profile.id,
      sender_id: gate.user.id,
      type: "system",
      message: `made you a moderator of ${gate.contest.title}`,
      link: `/contests/${contestId}`,
    });

    return { success: true, moderator: { userId: profile.id, username: profile.username } };
  } catch (err) {
    console.error("[addContestModerator]", err);
    return { error: err.message || "Could not add that moderator." };
  }
}

export async function removeContestModerator(contestId, moderatorRowId) {
  try {
    if (!contestId || !moderatorRowId) return { error: "Missing moderator." };
    const admin = getAdmin();

    const gate = await requireCreator(admin, contestId);
    if (gate.error) return { error: gate.error };

    // Scoped to this contest as well as the row id, so a row id from
    // elsewhere can't be used to remove someone from another contest.
    const { data, error } = await admin
      .from("contest_moderators")
      .delete()
      .eq("id", moderatorRowId)
      .eq("contest_id", contestId)
      .select("id");

    if (error) return { error: error.message };
    if (!data?.length) return { error: "That moderator was already removed." };

    return { success: true };
  } catch (err) {
    console.error("[removeContestModerator]", err);
    return { error: err.message || "Could not remove that moderator." };
  }
}
