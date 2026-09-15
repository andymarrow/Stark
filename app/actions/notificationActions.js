"use server";
/**
 * Mark one notification read, server-side.
 * ------------------------------------------
 * The client-side version of this (a plain anon-key UPDATE relying
 * entirely on RLS to scope it to the caller's own notifications) fit the
 * exact shape of a bug already confirmed twice elsewhere in this app
 * (collaborations, contests): a write that looks like it succeeded client
 * side — no thrown error — but never actually changed the row, because
 * Postgres RLS silently matches zero rows instead of erroring. The
 * notification would look read for the rest of that session (optimistic
 * local state) and then revert to unread on the next load, which is
 * exactly "I accepted this and it's still there."
 *
 * Doing the write with the service role removes that whole failure class.
 * Still safe: the acting user comes from their own session cookie, and the
 * update is scoped to `receiver_id = that user's id`, so this can only
 * ever touch the caller's own notifications.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Server is missing Supabase service credentials.");
  }
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function markNotificationRead(notificationId) {
  try {
    if (!notificationId) return { error: "Missing notification id." };

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();
    const { data, error } = await admin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("receiver_id", user.id)
      .select("id");

    if (error) return { error: error.message };
    if (!data?.length) return { error: "Notification not found." };
    return { success: true };
  } catch (err) {
    console.error("[markNotificationRead]", err);
    return { error: err.message || "Something went wrong." };
  }
}
