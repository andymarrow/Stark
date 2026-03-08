"use server";
import { createClient } from "@/utils/supabase/server";

export async function updateEvent(eventId, formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  try {
    // 1. Update Event (RLS policy "Hosts manage own events" handles the security check)
    // We update all potential fields at once
    const { data, error } = await supabase
      .from("events")
      .update({
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        is_public: formData.is_public,
        allow_multiple: formData.allow_multiple,
        is_closed: formData.is_closed,
        accent_color: formData.accent_color,
        // settings: formData.settings // Reserved for advanced JSON configs later
      })
      .eq("id", eventId)
      .eq("host_id", user.id) // Double check ownership
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };

  } catch (error) {
    console.error("Update Error:", error);
    return { error: error.message };
  }
}