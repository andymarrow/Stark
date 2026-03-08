"use server";
import { createClient } from "@/utils/supabase/server";

export async function getChatClearance(projectSlug) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Call the Secure RPC
    const { data, error } = await supabase
      .rpc('check_chat_access', { 
        p_slug: projectSlug, 
        p_user_id: user.id 
      });

    if (error) throw error;

    // The RPC returns a JSON object with our data
    if (data.success) {
        return {
            success: true,
            hasEvent: true,
            submissionId: data.submission_id,
            role: data.role,
            userId: user.id
        };
    } else {
        return { success: false, hasEvent: false };
    }

  } catch (error) {
    console.error("Clearance Error:", error);
    return { success: false, error: error.message };
  }
}