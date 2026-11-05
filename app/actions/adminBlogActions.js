"use server";
/**
 * Admin moderation of blog comments.
 * ----------------------------------
 * The Blog Auditor used to delete with the browser's anon client, which
 * blog_comments' RLS only allows for the comment's own author — so an
 * admin's "Purge" either errored or quietly removed nothing and the
 * comment was back on the next load. That's how malicious comments ended
 * up undeletable from the admin page.
 *
 * Service role for the delete, with the admin check done here instead.
 * Replies go with the comment (they hang off parent_id and would be
 * orphaned otherwise), and the result is counted so "purged" is only
 * reported when rows really went.
 */
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function deleteBlogCommentAsAdmin(commentId) {
  try {
    if (!commentId) return { error: "Missing comment." };

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in." };

    const admin = getAdmin();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return { error: "Admins only." };

    const { data: replies, error: replyErr } = await admin
      .from("blog_comments")
      .delete()
      .eq("parent_id", commentId)
      .select("id");
    if (replyErr) return { error: replyErr.message };

    const { data: deleted, error } = await admin
      .from("blog_comments")
      .delete()
      .eq("id", commentId)
      .select("id");
    if (error) return { error: error.message };
    if (!deleted?.length) return { error: "Comment not found — it may already be gone." };

    return { success: true, deletedIds: [commentId, ...(replies || []).map((r) => r.id)] };
  } catch (err) {
    console.error("[deleteBlogCommentAsAdmin]", err);
    return { error: err.message || "Delete failed." };
  }
}
