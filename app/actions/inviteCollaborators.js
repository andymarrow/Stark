"use server";
/**
 * Insert pending collaboration rows and their in-app collab_invite
 * notifications, atomically, server-side with the service role.
 * ---------------------------------------------------------------
 * This used to run client-side with the anon key: insert into
 * `collaborations`, then .select() the rows back to build the matching
 * notifications. Confirmed live on a real 3-person invite batch (Course
 * Vault, three collaboration rows inserted in one statement, same
 * millisecond timestamp): the .select() right after that insert silently
 * came back with fewer rows than were actually written — one collaborator
 * got no notification at all, while another got theirs fine, even though
 * both collaboration rows existed in the table. Same class of bug as the
 * one documented in collaborationActions.js (RLS not reliably granting the
 * SELECT half of an insert...select() round-trip back to the anon client)
 * — the fix there was moving server-side with the service role, so that's
 * the fix here too.
 *
 * Also fixes a second bug found in the same investigation: nothing stopped
 * the project owner from adding themselves as their own collaborator via
 * the picker (their own account showed up in the search results), leaving
 * a permanently-pending, self-referential invite. Filtered out here.
 *
 * And a third: something outside this codebase — never found in this
 * repo's history, presumably a database trigger set up directly in
 * Supabase — was independently creating its own collab_invite
 * notification for some invites, without the ?invite= id this app relies
 * on to survive a project rename (see collaborationActions.js). Left
 * alone, that produces a confusing duplicate. Cleaned up here: after
 * inserting our own correct notification, any other still-open
 * collab_invite notification for the same receiver+project that's missing
 * our ?invite= id gets removed.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// collaborators: [{ type: 'user'|'ghost', id, user_id?, email? }]
export async function inviteCollaborators(projectId, collaborators) {
  try {
    if (!projectId || !Array.isArray(collaborators) || collaborators.length === 0) {
      return { success: true, inserted: [] };
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();

    const { data: project } = await admin
      .from("projects")
      .select("owner_id, title, slug")
      .eq("id", projectId)
      .single();
    if (!project) return { error: "Project not found." };
    if (project.owner_id !== user.id) {
      return { error: "Only the project owner can manage the team." };
    }

    // Never let the owner add themselves as their own collaborator.
    const filtered = collaborators.filter((c) => {
      const uid = c.type === "user" ? (c.user_id || c.id) : null;
      return uid !== user.id;
    });
    if (filtered.length === 0) return { success: true, inserted: [] };

    const collabRows = filtered.map((c) => ({
      project_id: projectId,
      user_id: c.type === "user" ? (c.user_id || c.id) : null,
      invite_email: c.type === "ghost" ? c.email : null,
      status: "pending",
    }));

    const { data: inserted, error: insertErr } = await admin
      .from("collaborations")
      .insert(collabRows)
      .select("id, user_id");
    if (insertErr) return { error: insertErr.message };

    const registeredInviteNotifs = (inserted || [])
      .filter((row) => row.user_id)
      .map((row) => ({
        receiver_id: row.user_id,
        sender_id: user.id,
        type: "collab_invite",
        message: `invited you to collaborate on ${project.title}`,
        link: `/project/${project.slug}?invite=${row.id}`,
      }));

    if (registeredInviteNotifs.length > 0) {
      const { error: notifErr } = await admin.from("notifications").insert(registeredInviteNotifs);
      if (notifErr) console.error("[inviteCollaborators] notification insert failed", notifErr);

      // Best-effort cleanup of any duplicate from elsewhere — never undo a
      // successful invite over this failing.
      await Promise.all(
        registeredInviteNotifs.map((n) =>
          admin
            .from("notifications")
            .delete()
            .eq("receiver_id", n.receiver_id)
            .eq("type", "collab_invite")
            .like("link", `/project/${project.slug}%`)
            .not("link", "like", "%?invite=%")
            .then(({ error }) => {
              if (error) console.error("[inviteCollaborators] dedupe cleanup failed", error);
            })
        )
      );
    }

    return { success: true, inserted: inserted || [] };
  } catch (err) {
    console.error("[inviteCollaborators]", err);
    return { error: err.message || "Something went wrong sending these invites." };
  }
}
