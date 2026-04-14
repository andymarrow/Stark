// app/actions/getFinancialTelemetry.js
"use server";
import { createClient } from "@/utils/supabase/server";

export async function getFinancialTelemetry(userId) {
  try {
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "No ID", data: [] };
    }

    // 1. Fetch raw transactions
    const { data: transactions, error: txError } = await supabase
      .from('support_transactions')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (txError) {
      console.error("DB Error:", txError.message);
      return { success: false, error: txError.message, data: [] };
    }

    if (!transactions || transactions.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Fetch unique supporter IDs and Asset IDs to get their info separately
    // This avoids complex joins that often cause 500 errors
    const supporterIds = [...new Set(transactions.map(t => t.supporter_id).filter(Boolean))];
    const projectIds = [...new Set(transactions.filter(t => t.asset_type === 'project').map(t => t.asset_id))];
    const blogIds = [...new Set(transactions.filter(t => t.asset_type === 'blog').map(t => t.asset_id))];

    const [profilesRes, projectsRes, blogsRes] = await Promise.all([
      supabase.from('profiles').select('id, username, avatar_url, full_name').in('id', supporterIds),
      projectIds.length > 0 ? supabase.from('projects').select('id, title, slug').in('id', projectIds) : { data: [] },
      blogIds.length > 0 ? supabase.from('blogs').select('id, title, slug').in('id', blogIds) : { data: [] }
    ]);

    // 3. Manually map the data into a PLAIN JSON OBJECT
    // This ensures NO hidden properties or complex types reach the frontend
    const enriched = transactions.map(tx => {
      const supporter = profilesRes.data?.find(p => p.id === tx.supporter_id);
      
      let assetTitle = "Unknown Asset";
      let assetSlug = "";
      
      if (tx.asset_type === 'project') {
        const p = projectsRes.data?.find(item => item.id === tx.asset_id);
        if (p) { assetTitle = p.title; assetSlug = p.slug; }
      } else {
        const b = blogsRes.data?.find(item => item.id === tx.asset_id);
        if (b) { assetTitle = b.title; assetSlug = b.slug; }
      }

      return {
        id: String(tx.id),
        amount: Number(tx.amount),
        currency: String(tx.currency),
        net_amount: Number(tx.net_amount),
        fee_amount: Number(tx.fee_amount),
        provider_id: String(tx.provider_id),
        created_at: String(tx.created_at),
        asset_type: String(tx.asset_type),
        assetTitle: String(assetTitle),
        assetSlug: String(assetSlug),
        supporter: supporter ? {
          username: String(supporter.username),
          avatar_url: supporter.avatar_url ? String(supporter.avatar_url) : null,
          full_name: supporter.full_name ? String(supporter.full_name) : null
        } : null
      };
    });

    return { success: true, data: enriched };

  } catch (error) {
    console.error("Critical Telemetry Crash:", error);
    return { success: false, error: "Critical system failure", data: [] };
  }
}