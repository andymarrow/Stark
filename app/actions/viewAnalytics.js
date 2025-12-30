"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import crypto from "crypto";

// Initialize admin client to bypass RLS for logging (safe because logic is in the RPC)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function registerView(entityType, entityId) {
  try {
    const headersList = await headers();
    
    // 1. Get IP Address (Works on Vercel/Netlify/Local)
    let ip = headersList.get("x-forwarded-for") || "127.0.0.1";
    if (ip.includes(",")) ip = ip.split(",")[0].trim();

    // 2. Get User Agent (To differentiate devices on same IP)
    const userAgent = headersList.get("user-agent") || "unknown";

    // 3. Create a Privacy Hash (We don't store the raw IP)
    // Salt + IP + UserAgent
    const viewerHash = crypto
      .createHash("sha256")
      .update(`${ip}-${userAgent}-${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
      .digest("hex");

    // 4. Call the Database Function
    const { error } = await supabase.rpc("register_view", {
      p_entity_type: entityType, // 'project' or 'profile'
      p_entity_id: entityId,
      p_viewer_hash: viewerHash,
    });

    if (error) {
      console.error("[Analytics] Error:", error);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error("[Analytics] Fatal:", err);
    return { success: false };
  }
}