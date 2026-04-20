// app/actions/getFinancialTelemetry.js
"use server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function getFinancialTelemetry(userId) {
  // Purge cache to ensure the dashboard always shows the freshest data
  revalidatePath('/profile');

  // Immediate guard
  if (!userId) return { success: false, error: "NODE_ID_MISSING", data: [] };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return { success: false, error: "ENV_VARS_MISSING", data: [] };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch raw transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('support_transactions')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (txError) return { success: false, error: txError.message, data: [] };
    if (!transactions || transactions.length === 0) return { success: true, data: [] };

    // 2. Fetch related data (Supporters, Projects, Blogs)
    const supporterIds = [...new Set(transactions.map(t => t.supporter_id).filter(Boolean))];
    const projectIds = [...new Set(transactions.filter(t => t.asset_type === 'project').map(t => t.asset_id).filter(Boolean))];
    const blogIds = [...new Set(transactions.filter(t => t.asset_type === 'blog').map(t => t.asset_id).filter(Boolean))];

    const [profilesRes, projectsRes, blogsRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, username, avatar_url, full_name').in('id', supporterIds),
      projectIds.length > 0 ? supabaseAdmin.from('projects').select('id, title, slug').in('id', projectIds) : { data: [] },
      blogIds.length > 0 ? supabaseAdmin.from('blogs').select('id, title, slug').in('id', blogIds) : { data: [] }
    ]);

    // 3. Map titles and ensure strict JSON serialization
    const enriched = [];
    for (const tx of transactions) {
        const supporter = profilesRes.data?.find(p => p.id === tx.supporter_id);
        
        let assetTitle = "General Profile Fuel";
        let assetSlug = "";
        
        if (tx.asset_type === 'project') {
          const p = projectsRes.data?.find(item => item.id === tx.asset_id);
          if (p) { assetTitle = p.title; assetSlug = p.slug; }
        } else if (tx.asset_type === 'blog') {
          const b = blogsRes.data?.find(item => item.id === tx.asset_id);
          if (b) { assetTitle = b.title; assetSlug = b.slug; }
        }

        enriched.push({
            id: String(tx.id),
            amount: Number(tx.amount || 0),
            currency: String(tx.currency || 'ETB'),
            net_amount: Number(tx.net_amount || 0),
            fee_amount: Number(tx.fee_amount || 0),
            provider_id: String(tx.provider_id || 'unknown'),
            created_at: String(tx.created_at),
            asset_type: String(tx.asset_type || 'profile'),
            assetTitle: String(assetTitle),
            assetSlug: String(assetSlug),
            supporter: supporter ? {
                username: String(supporter.username),
                avatar_url: supporter.avatar_url ? String(supporter.avatar_url) : null,
                full_name: supporter.full_name ? String(supporter.full_name) : null
            } : null
        });
    }

    return { success: true, data: JSON.parse(JSON.stringify(enriched)) };

  } catch (error) {
    console.error("Telemetry Fatal Error:", error);
    return { success: false, error: "CRITICAL_SYSTEM_CRASH", data: [] };
  }
}