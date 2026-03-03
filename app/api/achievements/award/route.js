import { createClient } from "@/utils/supabase/server"; // For User Auth
import { createClient as createAdminClient } from "@supabase/supabase-js"; // For Admin Write
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. Verify User Identity (Standard Client)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { badgeId } = await request.json();

    // Valid Easter Egg IDs
    const validEggs = ['konami_code', 'click_frenzy', 'self_love'];
    
    if (!validEggs.includes(badgeId)) {
        return NextResponse.json({ error: "Invalid protocol." }, { status: 400 });
    }

    // 2. Initialize Admin Client (Bypasses RLS)
    // We use this ONLY to check/insert the badge securely
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. Check if user ALREADY has this badge (using Admin Client)
    const { data: existing } = await adminSupabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('achievement_id', badgeId)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ success: true, message: "Protocol already active." });
    }

    // 4. Award the badge (using Admin Client)
    const { error } = await adminSupabase
        .from('user_achievements')
        .insert({
            user_id: user.id,
            achievement_id: badgeId,
            is_public: true,
            seen: false // Triggers celebration
        });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Protocol executed successfully." });

  } catch (error) {
    console.error("Easter Egg Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}