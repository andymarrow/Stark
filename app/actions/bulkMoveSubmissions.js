"use server";
import { supabase } from "@/lib/supabaseClient";
import { Resend } from "resend";
import { renderEmail } from "@/lib/emailTemplate";

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
            const emailHtml = renderEmail({
              tag: "INTEL",
              intro: `Node operator <strong style="color: #ffffff;">@${authorUsername}</strong> has deployed a new report to the global network.`,
              highlight: { variant: "title", value: blogTitle },
              cta: { label: "Access Report Payload", url: `${BASE_URL}/${authorUsername}/blog/${blogSlug}` },
              footerNote: `Transmission established via mutual handshake with @${authorUsername}. To sever this link, adjust your communication protocols in your Stark Node Settings.`,
            });

            // Map emails to Resend Batch Payload
            const batchPayload = emailRecipients.map(email => ({
              from: 'Stark Intel <transmission@stark.et>',
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