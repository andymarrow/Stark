"use server";
/**
 * Accept/decline a collaboration invite, server-side.
 * ------------------------------------------------------
 * The client-side version of this (an anon-key UPDATE/DELETE with
 * `.select()` tacked on to verify a row actually changed) broke real
 * accepts: Postgres requires the same RLS SELECT policy for a write's
 * RETURNING data as for a plain SELECT, and `collaborations` apparently
 * doesn't grant the invited user SELECT on their own row (only the project
 * owner). So the UPDATE/DELETE succeeded, but the follow-up `.select()`
 * came back empty — read as "0 rows changed" and reported as "already
 * resolved or removed" even though the invite was still very much pending.
 *
 * Fixing this by moving the write server-side with the service role (which
 * bypasses RLS entirely) removes that whole class of false negative. It's
 * still safe: the acting user comes from their own session cookie (can't
 * be spoofed), and every write is scoped to `user_id = that user's id`, so
 * this can only ever touch the caller's own invite.
 *
 * SECOND BUG (Accept button reappearing forever, even after a genuinely
 * successful accept): the notification's "resolved" state — the thing
 * that hides the Accept/Decline buttons — was only ever rewritten in local
 * React state (NotificationItem's onUpdateState), never persisted to the
 * notifications row itself. So the collaboration really was accepted, but
 * on the next page load / notification refetch, the notification's
 * message/type came back exactly as it originally was ("invited you to
 * collaborate..."), making the UI show Accept/Decline again — forever,
 * regardless of how many times someone clicked Accept, because each click
 * genuinely succeeded against an already-accepted row and had nothing new
 * to change. Fixed by having these actions also flip the *notification's*
 * type/message in the database, not just the collaboration row, so the
 * resolved state survives a reload. `notificationId` is optional so older
 * callers (or a stale client bundle) don't break — it just skips this
 * step if omitted.
 *
 * THIRD BUG (Accept permanently fails after the project is renamed):
 * NotificationItem used to resolve "which project" purely by parsing the
 * slug out of notification.link (e.g. /project/ifa-ai-395). That link text
 * is written once, at invite time, and never updated — so renaming a
 * project after inviting a collaborator (which changes its slug) leaves
 * every pending invite pointing at a slug that no longer resolves to
 * anything. Confirmed live: a project renamed from "IFA AI" (ifa-ai-395)
 * to "IFA +" (ifa-3908) left two collaborators' invites permanently stuck
 * — one had no in-app notification at all (see the collab_invite insert
 * now added alongside the collaborations insert in create/page.jsx and
 * EditProjectForm.jsx), the other's Accept kept failing with "Project Node
 * not found" against the dead slug, and collaborations.status never left
 * 'pending' no matter how many times they clicked Accept.
 *
 * Fixed by carrying the collaboration row's own immutable id through as an
 * `invite` query param on the notification's link (set once, at creation,
 * alongside the slug that's just for display/navigation) and resolving
 * directly by that id here — never by slug — whenever it's present.
 * `collaborationId` is optional so older notifications (created before
 * this fix, which only have the slug) still fall back to the old
 * slug-based lookup rather than breaking outright.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Server is missing Supabase service credentials (SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveProjectId(admin, slug) {
  const { data: project, error } = await admin.from("projects").select("id").eq("slug", slug).single();
  if (error || !project) return { error: "Project Node not found." };
  return { projectId: project.id };
}

// Best-effort — a failure here shouldn't undo an already-successful
// accept/decline, just log it so it's visible.
async function resolveNotification(admin, notificationId, userId, { type, message }) {
  if (!notificationId) return;
  const { error } = await admin
    .from("notifications")
    .update({ type, message, is_read: true })
    .eq("id", notificationId)
    .eq("receiver_id", userId);
  if (error) console.error("[resolveNotification]", error);
}

export async function acceptCollabInvite(projectSlug, notificationId, collaborationId) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();

    let query = admin.from("collaborations").update({ status: "accepted" }).eq("user_id", user.id);
    if (collaborationId) {
      query = query.eq("id", collaborationId);
    } else {
      const { projectId, error: resolveError } = await resolveProjectId(admin, projectSlug);
      if (resolveError) return { error: resolveError };
      query = query.eq("project_id", projectId);
    }
    const { data, error } = await query.select("id");

    if (error) return { error: error.message };
    if (!data?.length) return { error: "Invite was already resolved or removed." };

    await resolveNotification(admin, notificationId, user.id, {
      type: "request_accepted",
      message: "You accepted the collaboration invite.",
    });

    return { success: true };
  } catch (err) {
    console.error("[acceptCollabInvite]", err);
    return { error: err.message || "Something went wrong accepting this invite." };
  }
}

export async function declineCollabInvite(projectSlug, notificationId, collaborationId) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();

    let query = admin.from("collaborations").delete().eq("user_id", user.id);
    if (collaborationId) {
      query = query.eq("id", collaborationId);
    } else {
      const { projectId, error: resolveError } = await resolveProjectId(admin, projectSlug);
      if (resolveError) return { error: resolveError };
      query = query.eq("project_id", projectId);
    }
    const { data, error } = await query.select("id");

    if (error) return { error: error.message };
    if (!data?.length) return { error: "Invite was already resolved or removed." };

    await resolveNotification(admin, notificationId, user.id, {
      type: "collab_declined",
      message: "You declined the collaboration invite.",
    });

    return { success: true };
  } catch (err) {
    console.error("[declineCollabInvite]", err);
    return { error: err.message || "Something went wrong declining this invite." };
  }
}
