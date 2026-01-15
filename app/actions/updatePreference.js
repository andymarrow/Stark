"use server";
import { createClient } from "@/utils/supabase/server";

export async function updateUserPreference(tags = []) {
  if (!tags || tags.length === 0) return;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // 1. Fetch current preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single();

    let prefs = profile?.preferences || {}; // { "react": 5, "design": 2 }

    // 2. Increment weights for incoming tags
    tags.forEach(tag => {
        // Normalize tag (lowercase)
        const t = typeof tag === 'string' ? tag.toLowerCase() : tag.name.toLowerCase();
        prefs[t] = (prefs[t] || 0) + 1;
    });

    // 3. Save back (Debounced on client side, but direct update here)
    await supabase.from("profiles").update({ preferences: prefs }).eq("id", user.id);

  } catch (err) {
    console.error("Pref Update Error:", err);
  }
}