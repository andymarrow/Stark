import { supabase } from "@/lib/supabaseClient";

/**
 * A project submitted to a contest freezes the moment that contest's
 * submission window closes — not when winners are announced. Judging
 * starts right at the deadline, and a project that keeps changing under
 * live judges isn't being judged fairly. Used to gate project edit/delete
 * and changelog create/edit/delete everywhere those actions are exposed.
 *
 * Returns { locked: false } or { locked: true, contestTitle, deadline }
 * for the first (soonest-closed) contest that locks it, so callers can
 * show a specific reason.
 */
export async function getContestLockInfo(projectId) {
  if (!projectId) return { locked: false };

  const { data, error } = await supabase
    .from("contest_submissions")
    .select("contest:contests(title, submission_deadline)")
    .eq("project_id", projectId);

  if (error || !data?.length) return { locked: false };

  const now = Date.now();
  const closed = data
    .map((row) => row.contest)
    .filter((c) => c?.submission_deadline && new Date(c.submission_deadline).getTime() < now)
    .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline));

  if (!closed.length) return { locked: false };
  return { locked: true, contestTitle: closed[0].title, deadline: closed[0].submission_deadline };
}
