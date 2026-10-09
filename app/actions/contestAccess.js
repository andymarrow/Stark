"use server";
/**
 * Who is allowed to run a contest.
 * --------------------------------
 * One definition, used by the dashboard guard and by every server action
 * that manages a contest, so access can't say yes in one place and no in
 * another.
 *
 * Two levels, on purpose:
 *   canManage — the creator or a moderator. Day-to-day running: judges,
 *               announcements, submissions, settings.
 *   isCreator — the creator alone. Deleting the contest, and deciding who
 *               the moderators are, so a seat you hand out can always be
 *               taken back by the person who handed it over.
 *
 * If contest_moderators doesn't exist yet (the migration hasn't been run),
 * this quietly falls back to creator-only rather than throwing, so
 * deploying ahead of the migration doesn't lock anyone out of a live
 * dashboard.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const DENIED = { canManage: false, isCreator: false, isModerator: false, userId: null };

export async function checkContestAccess(contestId) {
  try {
    if (!contestId) return DENIED;

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DENIED;

    const admin = getAdmin();

    const { data: contest } = await admin
      .from("contests")
      .select("creator_id")
      .eq("id", contestId)
      .single();
    if (!contest) return { ...DENIED, userId: user.id };

    if (contest.creator_id === user.id) {
      return { canManage: true, isCreator: true, isModerator: false, userId: user.id };
    }

    const { data: mod, error } = await admin
      .from("contest_moderators")
      .select("id")
      .eq("contest_id", contestId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      // Table not there yet — treat as "no moderators exist".
      console.error("[checkContestAccess] moderator lookup failed:", error.message);
      return { ...DENIED, userId: user.id };
    }

    const isModerator = !!mod;
    return { canManage: isModerator, isCreator: false, isModerator, userId: user.id };
  } catch (err) {
    console.error("[checkContestAccess]", err);
    return DENIED;
  }
}
