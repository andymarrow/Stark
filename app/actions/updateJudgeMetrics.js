"use server";
/**
 * Save one judge's scoring rubric.
 * --------------------------------
 * This used to be an anon-key UPDATE fired straight from the modal, with
 * no .select() on the end. RLS on contest_judges doesn't let the browser
 * client write that row, and a blocked UPDATE is not an error in Postgres
 * — it matches zero rows and reports success. So the modal saw error ===
 * null, said "Judge Rubric Updated", patched its own local state and
 * closed. The rubric looked saved until the next reload, when the old one
 * came back. Confirmed against production: of fifteen judges, the only
 * ones carrying a custom rubric were the rows written directly with the
 * service role. Not one save made through the UI ever landed.
 *
 * Service role, with the organiser check done here in code, matching how
 * every other write to these tables works. The .select() at the end is
 * the part that matters most: zero rows changed is now reported as a
 * failure instead of being mistaken for success.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function updateJudgeMetrics(judgeId, metrics) {
  try {
    if (!judgeId) return { error: "Missing judge." };
    if (!Array.isArray(metrics)) return { error: "Rubric must be a list of metrics." };

    const total = metrics.reduce((sum, m) => sum + (parseInt(m.weight) || 0), 0);
    if (total !== 100) {
      return { error: `Metrics must total exactly 100% (currently ${total}%).` };
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();

    const { data: judge } = await admin
      .from("contest_judges")
      .select("id, contest_id")
      .eq("id", judgeId)
      .single();
    if (!judge) return { error: "Judge not found." };

    const { data: contest } = await admin
      .from("contests")
      .select("creator_id")
      .eq("id", judge.contest_id)
      .single();
    if (!contest) return { error: "Contest not found." };
    if (contest.creator_id !== user.id) {
      return { error: "Only the contest organiser can change a judge's rubric." };
    }

    const { data, error } = await admin
      .from("contest_judges")
      .update({ metrics_config: metrics })
      .eq("id", judgeId)
      .select("id, metrics_config");

    if (error) return { error: error.message };
    if (!data?.length) return { error: "Nothing was saved — the judge row was not found." };

    return { success: true, judge: data[0] };
  } catch (err) {
    console.error("[updateJudgeMetrics]", err);
    return { error: err.message || "Could not save this rubric." };
  }
}
