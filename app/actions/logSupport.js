// app/actions/logSupport.js
"use server";
import { createClient } from "@supabase/supabase-js"; 
import { revalidatePath } from "next/cache";

// Initialize with Service Role to bypass RLS for secure logging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function logSupportTransaction(data) {
  try {
    console.log("ATTEMPTING_LEDGER_SYNC:", data);

    // 1. Ensure we have valid data
    if (!data.receiverId || !data.transactionId) {
        throw new Error("Missing critical telemetry data.");
    }

    const rawAmount = parseFloat(data.amount) || 0;

    // 2. Prepare the payload
    const payload = {
      supporter_id: data.supporterId || null, // Null if guest
      receiver_id: data.receiverId,
      asset_type: data.assetType || 'profile',
      asset_id: data.assetId || null,
      provider_id: data.provider,
      amount: rawAmount,
      currency: data.currency || 'ETB',
      net_amount: rawAmount, // Gursha 0% tax
      fee_amount: 0,
      status: 'completed',
      external_transaction_id: data.transactionId // NEW: Unique ID from provider
    };

    // 3. Insert the transaction
    // If the external_transaction_id already exists, this will fail safely (preventing duplicates)
    const { data: inserted, error } = await supabaseAdmin
      .from('support_transactions')
      .insert(payload)
      .select();

    if (error) {
        // Check if it's a duplicate key error (code 23505)
        if (error.code === '23505') {
             console.log("DUPLICATE_TRANSACTION_PREVENTED:", data.transactionId);
             return { success: true, message: "Transaction already logged." };
        }
        console.error("SUPABASE_INSERT_ERROR:", error);
        return { success: false, error: error.message };
    }

    // 4. Notify the Creator (System Signal)
    await supabaseAdmin.from('notifications').insert({
      receiver_id: data.receiverId,
      sender_id: data.supporterId || data.receiverId, // Fallback to self if guest
      type: 'system',
      message: `System Alert: Credit Injection detected via ${data.provider.toUpperCase()}.`,
      link: '/profile?view=finances' // Link directly to their new telemetry dashboard
    });

    console.log("LEDGER_SYNC_SUCCESS:", inserted);
    
    // 5. Clear the cache so the dashboard and profile stats update immediately
    revalidatePath('/profile');
    
    return { success: true };

  } catch (error) {
    console.error("LOG_SUPPORT_CRASH:", error);
    return { success: false, error: error.message };
  }
}