"use server";
/**
 * Who is actually taking part in a contest, team by team.
 * -------------------------------------------------------
 * Headcount for a contest isn't the entry count — most entries are teams,
 * and a teammate who was invited but hasn't pressed Accept yet is still a
 * real person who turned up. The organiser needs both numbers: who is
 * confirmed, and who is in the building but not yet counted.
 *
 * Organiser-only. Pending invites are not public information — they say
 * who someone tried to recruit — so this refuses anyone who isn't the
 * contest creator, and is deliberately not exposed to the jury panel.
 *
 * Service role for the usual reason (collaborations SELECT is restricted
 * to each project's owner, so the contest organiser can't read other
 * people's teams with the anon key), with the organiser check done here
 * in code instead.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { checkContestAccess } from "@/app/actions/contestAccess";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getContestParticipation(contestId) {
  try {
    if (!contestId) return { error: "Missing contest." };

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();

    // Creator or a moderator — same gate as the dashboard itself, so a
    // co-organiser isn't shown a tab that then refuses them.
    const access = await checkContestAccess(contestId);
    if (!access.canManage) {
      return { error: "Only the contest organisers can see participation details." };
    }

    const { data: subs } = await admin
      .from("contest_submissions")
      .select("project_id, submitted_at, project:projects!inner(id, title, slug, owner_id)")
      .eq("contest_id", contestId)
      .order("submitted_at", { ascending: true });

    const entries = (subs || []).filter((s) => s.project);
    if (entries.length === 0) {
      return { totals: { entries: 0, owners: 0, accepted: 0, pending: 0, confirmed: 0, withPending: 0 }, teams: [] };
    }

    const projectIds = entries.map((e) => e.project.id);

    const { data: collabs } = await admin
      .from("collaborations")
      .select("project_id, user_id, status, invite_email")
      .in("project_id", projectIds)
      .in("status", ["accepted", "pending"]);

    // Resolve every person we need to name in one go.
    const userIds = [
      ...new Set([
        ...entries.map((e) => e.project.owner_id),
        ...(collabs || []).map((c) => c.user_id).filter(Boolean),
      ]),
    ];
    const profiles = [];
    for (let i = 0; i < userIds.length; i += 200) {
      const { data } = await admin
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds.slice(i, i + 200));
      profiles.push(...(data || []));
    }
    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
    const asPerson = (id, status) => {
      const p = profileMap[id];
      return {
        id,
        username: p?.username || "unknown",
        name: p?.full_name || p?.username || "Unknown",
        avatar: p?.avatar_url || null,
        status,
      };
    };

    const byProject = {};
    for (const c of collabs || []) (byProject[c.project_id] ||= []).push(c);

    const acceptedUsers = new Set();
    const pendingUsers = new Set();
    const ownerUsers = new Set();

    const teams = entries.map((entry) => {
      const p = entry.project;
      ownerUsers.add(p.owner_id);

      const rows = byProject[p.id] || [];
      const members = [];
      for (const row of rows) {
        if (row.user_id) {
          if (row.status === "accepted") acceptedUsers.add(row.user_id);
          else pendingUsers.add(row.user_id);
          members.push(asPerson(row.user_id, row.status));
        } else if (row.invite_email) {
          // Invited by email, no account yet — still someone who was asked.
          members.push({
            id: `email:${row.invite_email}`,
            username: row.invite_email,
            name: row.invite_email,
            avatar: null,
            status: row.status,
            emailOnly: true,
          });
        }
      }

      const acceptedCount = members.filter((m) => m.status === "accepted").length;
      const pendingCount = members.filter((m) => m.status === "pending").length;

      return {
        projectId: p.id,
        title: p.title,
        slug: p.slug,
        submittedAt: entry.submitted_at,
        owner: asPerson(p.owner_id, "owner"),
        members,
        counts: {
          accepted: acceptedCount,
          pending: pendingCount,
          // Owner always counts as one person on the team.
          confirmed: 1 + acceptedCount,
          withPending: 1 + acceptedCount + pendingCount,
        },
      };
    });

    // People, not rows: someone on two entries is still one human.
    const confirmedPeople = new Set([...ownerUsers, ...acceptedUsers]);
    const pendingOnlyPeople = [...pendingUsers].filter((u) => !confirmedPeople.has(u));

    return {
      totals: {
        entries: entries.length,
        owners: ownerUsers.size,
        accepted: acceptedUsers.size,
        pending: pendingOnlyPeople.length,
        confirmed: confirmedPeople.size,
        withPending: confirmedPeople.size + pendingOnlyPeople.length,
      },
      teams,
    };
  } catch (err) {
    console.error("[getContestParticipation]", err);
    return { error: err.message || "Could not load participation." };
  }
}
