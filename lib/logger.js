import { supabase } from "@/lib/supabaseClient";

/**
 * Records an admin action to the database
 * @param {string} action - e.g. "USER_BAN"
 * @param {string} target - e.g. "user_123"
 * @param {string} actorId - UUID of the admin
 * @param {string} details - Optional description
 */
export const logAdminAction = async (action, target, actorId, details = "") => {
  try {
    await supabase.from('audit_logs').insert({
      action,
      target,
      actor_id: actorId,
      details,
      status: 'success'
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};