"use server";
import { createClient } from "@/utils/supabase/server";

export async function logSupportTransaction(data) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    // 1. Insert the transaction into the ledger
    const payload = {
      supporter_id: user ? user.id : null, // Null if guest (if Gursha allows guests)
      receiver_id: data.receiverId,
      asset_type: data.assetType, // 'project' or 'blog'
      asset_id: data.assetId,
      provider_id: data.provider,
      amount: data.amount || 0, // Gursha callback might not give exact amount, default to 0 if missing
      currency: data.currency || 'ETB',
      net_amount: data.amount || 0, 
      fee_amount: 0, // Gursha is 0% tax
      status: 'completed'
    };

    const { error: txError } = await supabase.from('support_transactions').insert(payload);
    if (txError) throw txError;

    // 2. Notify the Creator (System Signal)
    const { error: notifError } = await supabase.from('notifications').insert({
      receiver_id: data.receiverId,
      sender_id: user ? user.id : data.receiverId, // Fallback to self if guest
      type: 'system',
      message: `System Alert: Credit Injection detected via ${data.provider.toUpperCase()}.`,
      link: '/profile?view=settings' // Link to their telemetry dashboard
    });

    return { success: true };
  } catch (error) {
    console.error("Support Logging Error:", error);
    return { success: false, error: error.message };
  }
}