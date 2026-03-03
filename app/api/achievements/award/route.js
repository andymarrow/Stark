import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
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

    // Attempt to insert (the unique constraint in the DB will prevent duplicates)
    const { error } = await supabase
        .from('user_achievements')
        .insert({
            user_id: user.id,
            achievement_id: badgeId,
            is_public: true
        });

    if (error && error.code !== '23505') {
        throw error;
    }

    return NextResponse.json({ success: true, message: "Protocol executed." });

  } catch (error) {
    console.error("Easter Egg Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}