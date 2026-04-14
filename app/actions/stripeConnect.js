// app/actions/stripeConnect.js
"use server";

import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Use latest stable API version
});

export async function createStripeConnectLink() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication Required" };

  try {
    // 1. Check if the user already has a Stripe account linked in our DB
    const { data: existingLink } = await supabase
      .from('creator_payment_links')
      .select('provider_handle')
      .eq('user_id', user.id)
      .eq('provider_id', 'stripe')
      .maybeSingle();

    let stripeAccountId = existingLink?.provider_handle;

    // 2. If no account exists, create a new Express account in Stripe
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      // Immediately save this ID to our database so we don't lose it
      const { error: dbError } = await supabase.from('creator_payment_links').insert({
        user_id: user.id,
        provider_id: 'stripe',
        provider_handle: stripeAccountId,
        is_primary: false
      });

      if (dbError) throw dbError;
    }

    // 3. Generate the Onboarding Link
    // Stripe needs to know where to send the user back to
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/profile?view=settings&stripe_refresh=true`,
      return_url: `${baseUrl}/profile?view=settings&stripe_return=true`,
      type: 'account_onboarding',
    });

    return { success: true, url: accountLink.url };

  } catch (error) {
    console.error("Stripe Uplink Error:", error);
    return { success: false, error: error.message };
  }
}