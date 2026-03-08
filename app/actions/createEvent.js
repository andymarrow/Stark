"use server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export async function createEvent(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized access." };
  }

  // 1. Verify Verification/Admin Status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_for_hire") // Note: Adjust 'is_for_hire' if you have a specific 'is_verified' col
    // If you don't have an 'is_verified' column yet, we rely on ROLE = 'admin'
    .eq("id", user.id)
    .single();

  if (profileError) {
      console.error("Profile Fetch Error:", profileError);
      return { error: "Could not verify identity." };
  }

  // DEBUG LOG (Check your server console to see what it prints)
  console.log("Create Event Check - User Role:", profile?.role);

  // Strict Access Control: 
  // 1. Admin Role
  // 2. OR 'verified' role (if you use roles for that)
  // 3. OR if you have a specific is_verified boolean column (add it to select above if so)
  const isAllowed = profile?.role === 'admin' || profile?.role === 'verified'; 
  
  if (!isAllowed) {
    return { error: `Access Denied. Current Role: ${profile?.role || 'None'}` };
  }

  try {
    // 2. Generate Secure Token
    const token = `ev_${crypto.randomBytes(16).toString("hex")}`;

    // 3. Insert Event
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

    // 4. Initialize Default File System
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