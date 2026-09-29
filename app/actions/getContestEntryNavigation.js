"use server";
/**
 * Where this project sits in its contest's entry list, and what's either
 * side of it.
 * ------------------------------------------------------------------
 * Judges and mentors review entries one after another. Without this the
 * only way through 79 submissions is: open contest, open entry, read,
 * press back, find your place again, open the next one. This gives the
 * project page a prev/next pair so they can walk the list directly.
 *
 * Ordered by submitted_at ascending — the contest's own submission order,
 * stable for everyone, so "entry 12 of 79" means the same thing to every
 * reviewer and doesn't shift as likes and views move around.
 *
 * Service role because contest_submissions joins projects that may still
 * be event_hidden (contest entries are hidden until results), which the
 * anon key can't read — only public-safe fields are returned.
 */
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getContestEntryNavigation(projectId) {
  try {
    if (!projectId) return null;

    const admin = getAdmin();

    const { data: mine } = await admin
      .from("contest_submissions")
      .select("contest_id")
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: true })
      .limit(1);

    const contestId = mine?.[0]?.contest_id;
    if (!contestId) return null;

    const { data: contest } = await admin
      .from("contests")
      .select("title, slug")
      .eq("id", contestId)
      .single();
    if (!contest) return null;

    const { data: siblings } = await admin
      .from("contest_submissions")
      .select("project_id, submitted_at, project:projects!inner(slug, title)")
      .eq("contest_id", contestId)
      .order("submitted_at", { ascending: true });

    const entries = (siblings || []).filter((s) => s.project?.slug);
    const index = entries.findIndex((s) => s.project_id === projectId);
    if (index === -1) return null;

    const toLink = (entry) =>
      entry ? { slug: entry.project.slug, title: entry.project.title } : null;

    return {
      contestTitle: contest.title,
      contestSlug: contest.slug,
      position: index + 1,
      total: entries.length,
      prev: toLink(entries[index - 1]),
      next: toLink(entries[index + 1]),
    };
  } catch (err) {
    console.error("[getContestEntryNavigation]", err);
    return null;
  }
}
