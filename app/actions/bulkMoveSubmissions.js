"use server";
import { supabase } from "@/lib/supabaseClient";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function broadcastNewBlog(blogId, authorId, authorUsername, blogTitle, blogSlug) {
    try {
        // 1. Fetch all followers AND their profile data (for email and preferences)
        const { data: followers, error: fetchError } = await supabase
            .from('follows')
            .select(`
              follower_id,
              profile:profiles!follows_follower_id_fkey (
                email,
                settings
              )
            `)
            .eq('following_id', authorId);

        if (fetchError || !followers.length) return { success: true, count: 0 };

        const notifications = [];
        const emailRecipients = [];

        // 2. Sort into in-app notifications and email recipients
        followers.forEach(f => {
            // A. Prepare In-App Notification
            notifications.push({
                receiver_id: f.follower_id,
                sender_id: authorId,
                type: 'system',
                message: `deployed a new intelligence report: ${blogTitle}`,
                link: `/${authorUsername}/blog/${blogSlug}`,
                is_read: false
            });

            // B. Prepare Email Dispatch
            // Check if user has explicitly turned off emails in their JSONB settings
            const userSettings = f.profile?.settings || {};
            const wantsEmails = userSettings.email_notifications !== false; // Defaults to true
            const userEmail = f.profile?.email;

            if (wantsEmails && userEmail) {
                emailRecipients.push(userEmail);
            }
        });

        // 3. Bulk Insert In-App Notifications
        if (notifications.length > 0) {
            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (insertError) throw insertError;
        }

        // 4. Dispatch Emails via Resend (Using Batch API for high-volume)
        if (emailRecipients.length > 0 && process.env.RESEND_API_KEY) {
            
            // The Stark-Themed HTML Email Template
            const emailHtml = `
              <div style="font-family: 'Courier New', Courier, monospace; background-color: #050505; color: #e4e4e7; padding: 40px 20px; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #09090b; border: 1px solid #27272a; padding: 40px; text-align: left;">
                  
                  <div style="border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 30px;">
                    <span style="color: #ef4444; font-weight: bold; font-size: 16px; letter-spacing: 2px;">STARK_NETWORK //</span>
                  </div>
                  
                  <h2 style="color: #ffffff; font-size: 22px; text-transform: uppercase; margin-top: 0; letter-spacing: -0.5px;">New Intelligence Report</h2>
                  
                  <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                    Node operator <strong style="color: #ffffff;">@${authorUsername}</strong> has deployed a new report to the global network.
                  </p>
                  
                  <div style="background-color: #18181b; border-left: 3px solid #ef4444; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #ffffff; margin: 0; text-transform: uppercase; font-size: 18px; letter-spacing: -0.5px;">${blogTitle}</h3>
                  </div>
                  
                  <a href="${BASE_URL}/${authorUsername}/blog/${blogSlug}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                    Access Report Payload
                  </a>
                  
                  <div style="margin-top: 50px; padding-top: 20px; border-top: 1px dashed #27272a; text-align: center;">
                    <p style="color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; line-height: 1.5;">
                      Transmission established via mutual handshake with @${authorUsername}.<br/>
                      To sever this link, adjust your communication protocols in your Stark Node Settings.
                    </p>
                  </div>

                </div>
              </div>
            `;

            // Map emails to Resend Batch Payload
            const batchPayload = emailRecipients.map(email => ({
              from: 'Stark Intel <transmission@stark.et>', // NOTE: Change to your verified Resend domain before prod (e.g. hello@yourdomain.com)
              to: [email],
              subject: `[STARK] New Report from @${authorUsername}`,
              html: emailHtml,
            }));

            // Resend allows max 100 emails per batch request, so we chunk them
            for (let i = 0; i < batchPayload.length; i += 100) {
              const batch = batchPayload.slice(i, i + 100);
              await resend.batch.send(batch);
            }
        }

        return { success: true, count: notifications.length };
    } catch (err) {
        console.error("Broadcast Failure:", err);
        return { success: false, error: err.message };
    }
}