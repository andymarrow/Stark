// app/actions/getFinancialTelemetry.js
"use server";
import { createClient } from "@/utils/supabase/server";

export async function getFinancialTelemetry(userId) {
  try {
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "No User ID provided", data: [] };
    }

    // 1. Fetch transactions safely
    const { data: transactions, error: txError } = await supabase
      .from('support_transactions')
      .select(`
        id, amount, currency, net_amount, fee_amount, provider_id, created_at, asset_type, asset_id, status,
        supporter:profiles!supporter_id(username, avatar_url, full_name)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Catch missing table or syntax errors
    if (txError) {
      console.error("Supabase Telemetry Error:", txError.message);
      return { success: false, error: txError.message, data: [] };
    }

    const safeTransactions = transactions || [];

    // If no transactions, return early
    if (safeTransactions.length === 0) {
        return { success: true, data: [] };
    }

    // 2. Fetch Asset Titles
    const projectIds = safeTransactions.filter(t => t.asset_type === 'project' && t.asset_id).map(t => t.asset_id);
    const blogIds = safeTransactions.filter(t => t.asset_type === 'blog' && t.asset_id).map(t => t.asset_id);

    let projects = [];
    let blogs = [];

    if (projectIds.length > 0) {
      const { data: pData } = await supabase.from('projects').select('id, title, slug').in('id', projectIds);
      if (pData) projects = pData;
    }
    
    if (blogIds.length > 0) {
      const { data: bData } = await supabase.from('blogs').select('id, title, slug').in('id', blogIds);
      if (bData) blogs = bData;
    }

    // 3. Map titles and ensure strict JSON serialization
    const enrichedTransactions = safeTransactions.map(tx => {
      let assetTitle = "Unknown Asset";
      let assetSlug = "";
      
      if (tx.asset_type === 'project') {
        const p = projects.find(p => p.id === tx.asset_id);
        if (p) { assetTitle = p.title; assetSlug = p.slug; }
      } else if (tx.asset_type === 'blog') {
        const b = blogs.find(b => b.id === tx.asset_id);
        if (b) { assetTitle = b.title; assetSlug = b.slug; }
      }

      // Return a clean, plain object to avoid Next.js serialization errors
      return {
        id: tx.id,
        amount: Number(tx.amount || 0),
        currency: tx.currency || 'USD',
        net_amount: Number(tx.net_amount || 0),
        fee_amount: Number(tx.fee_amount || 0),
        provider_id: tx.provider_id || 'unknown',
        created_at: tx.created_at,
        asset_type: tx.asset_type,
        assetTitle,
        assetSlug,
        supporter: tx.supporter ? {
            username: tx.supporter.username || 'Anonymous',
            avatar_url: tx.supporter.avatar_url || null,
            full_name: tx.supporter.full_name || null
        } : null
      };
    });

    return { success: true, data: enrichedTransactions };

  } catch (error) {
    console.error("Telemetry Fatal Error:", error);
    return { success: false, error: "Internal Server Error", data: [] };
  }
}