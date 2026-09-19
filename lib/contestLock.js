import { supabase } from "@/lib/supabaseClient";

/**
 * A project submitted to a contest freezes at that contest's real closing
 * point (end_date) — NOT the moment new submissions stop being accepted
 * (submission_deadline). Those are deliberately different: submission_deadline
 * only cuts off new entries so organizers can get a final headcount and let
 * judges start reviewing, but everyone who got in before it can keep fully
 * editing their project and posting changelogs right up until end_date,
 * when the contest actually ends and judging needs a frozen target. Used to
 * gate project edit/delete and changelog create/edit/delete everywhere
 * those actions are exposed.
 *
 * end_date is nullable — contests created before it existed only have
 * submission_deadline, so they fall back to the old single-deadline
 * behavior (locks the instant submissions close) unchanged. Selecting
 * `contests(*)` rather than naming end_date explicitly means this also
 * keeps working before the migration adding that column has been applied.
 *
 * Returns { locked: false } or { locked: true, contestTitle, deadline }
 * for the first (soonest-closed) contest that locks it, so callers can
 * show a specific reason.
 */
export async function getContestLockInfo(projectId) {
  if (!projectId) return { locked: false };

  const { data, error } = await supabase
    .from("contest_submissions")
    .select("contest:contests(*)")
    .eq("project_id", projectId);

  if (error || !data?.length) return { locked: false };

  const now = Date.now();
  const closed = data
    .map((row) => row.contest)
    .map((c) => c && { title: c.title, lockDate: c.end_date || c.submission_deadline })
    .filter((c) => c?.lockDate && new Date(c.lockDate).getTime() < now)
    .sort((a, b) => new Date(a.lockDate) - new Date(b.lockDate));

  if (!closed.length) return { locked: false };
  return { locked: true, contestTitle: closed[0].title, deadline: closed[0].lockDate };
}
