"use server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export async function createEvent(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized access." };
  }

  // 1. Fetch entire profile to check for role or is_verified flags
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) return { error: "Could not verify identity." };

  // 2. Fetch Achievements to check for badge
  const { data: badge } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("user_id", user.id)
    .in("achievement_id", ["verified", "verified_node", "verified_creator"]) 
    .limit(1)
    .maybeSingle();

  // 3. OMNI-CHECK: Allow if ANY of these conditions are true
  const isAllowed = 
    profile?.role === 'admin' || 
    profile?.role === 'verified' || 
    profile?.is_verified === true || 
    !!badge;

  if (!isAllowed) {
    return { error: "Access Denied. Verification badge required." };
  }

  try {
    // 4. Generate Secure Token
    const token = `ev_${crypto.randomBytes(16).toString("hex")}`;

    // 5. Insert Event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        host_id: user.id,
        title: formData.title,
        description: formData.description,
        cover_image: formData.cover_image,
        accent_color: formData.accent_color || "#FF0000",
        access_token: token,
        is_public: false,
        allow_multiple: formData.allow_multiple,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // 6. Initialize Default File System
    const defaultFolders = [
      { event_id: event.id, name: "Inbox", is_public: false },
      { event_id: event.id, name: "Accepted", is_public: false },
      { event_id: event.id, name: "Rejected", is_public: false }
    ];

    const { error: folderError } = await supabase
      .from("event_folders")
      .insert(defaultFolders);

    if (folderError) throw folderError;

    return { success: true, token: token, slug: event.id };

  } catch (error) {
    console.error("Event Creation Error:", error);
    return { error: error.message };
  }
}