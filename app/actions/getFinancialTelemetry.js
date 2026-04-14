// app/actions/getFinancialTelemetry.js
"use server";
import { createClient } from "@/utils/supabase/server";

export async function getFinancialTelemetry(userId) {
  try {
    // 1. Move client creation INSIDE the try-catch so it doesn't trigger a 500 if cookies fail
    const supabase = await createClient();

    if (!userId) {
        throw new Error("No User ID provided to telemetry engine.");
    }

    // 2. Fetch all transactions (Using safer Foreign Key syntax)
    const { data: transactions, error: txError } = await supabase
      .from('support_transactions')
      .select(`
        id, amount, currency, net_amount, fee_amount, provider_id, created_at, asset_type, asset_id, status,
        supporter:profiles!supporter_id(id, username, avatar_url, full_name)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Catch missing table errors gracefully
    if (txError) {
        console.error("Supabase Query Error:", txError);
        throw new Error(txError.message);
    }

    // Safely default to empty array
    const safeTransactions = transactions || [];

    // 3. Fetch Asset Titles 
    const projectIds = safeTransactions.filter(t => t.asset_type === 'project' && t.asset_id).map(t => t.asset_id);
    const blogIds = safeTransactions.filter(t => t.asset_type === 'blog' && t.asset_id).map(t => t.asset_id);

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

    // 4. Map the titles back
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
      return { ...tx, assetTitle, assetSlug };
    });

    return { success: true, data: enrichedTransactions };

  } catch (error) {
    // Return the error safely to the frontend instead of crashing the Next.js server
    console.error("Telemetry Fetch Fatal Error:", error);
    return { success: false, error: error.message, data: [] };
  }
}