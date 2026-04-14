// app/actions/getFinancialTelemetry.js
"use server";
import { createClient } from "@/utils/supabase/server";

export async function getFinancialTelemetry(userId) {
  const supabase = await createClient();

  try {
    // 1. Fetch all transactions for this creator
    const { data: transactions, error: txError } = await supabase
      .from('support_transactions')
      .select(`
        id, amount, currency, net_amount, fee_amount, provider_id, created_at, asset_type, asset_id, status,
        supporter:profiles!support_transactions_supporter_id_fkey(id, username, avatar_url, full_name)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (txError) throw txError;

    // 2. Fetch Asset Titles (Since asset_id can be a project OR a blog)
    // To make the UI fast, we will grab the titles of the assets that were supported
    const projectIds = transactions.filter(t => t.asset_type === 'project').map(t => t.asset_id);
    const blogIds = transactions.filter(t => t.asset_type === 'blog').map(t => t.asset_id);

    let projects = [];
    let blogs = [];

    if (projectIds.length > 0) {
      const { data } = await supabase.from('projects').select('id, title, slug').in('id', projectIds);
      projects = data || [];
    }
    if (blogIds.length > 0) {
      const { data } = await supabase.from('blogs').select('id, title, slug').in('id', blogIds);
      blogs = data || [];
    }

    // 3. Map the titles back into the transactions for easy frontend rendering
    const enrichedTransactions = transactions.map(tx => {
      let assetTitle = "Unknown Asset";
      let assetSlug = "";
      if (tx.asset_type === 'project') {
        const p = projects.find(p => p.id === tx.asset_id);
        if (p) { assetTitle = p.title; assetSlug = p.slug; }
      } else if (tx.asset_type === 'blog') {
        const b = blogs.find(b => b.id === tx.asset_id);
        if (b) { assetTitle = b.title; assetSlug = b.slug; }
      }
      return { ...tx, assetTitle, assetSlug };
    });

    return { success: true, data: enrichedTransactions };
  } catch (error) {
    console.error("Telemetry Fetch Error:", error);
    return { success: false, error: error.message };
  }
}