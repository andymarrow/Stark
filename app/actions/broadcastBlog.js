"use client";
import { supabase } from "@/lib/supabaseClient";

export async function broadcastNewBlog(blogId, authorId, authorUsername, blogTitle, blogSlug) {
    try {
        // 1. Fetch all followers
        const { data: followers, error: fetchError } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', authorId);

        if (fetchError || !followers.length) return { success: true, count: 0 };

        // 2. Prepare bulk notifications
        const notifications = followers.map(f => ({
            receiver_id: f.follower_id,
            sender_id: authorId,
            type: 'system',
            message: `deployed a new intelligence report: ${blogTitle}`,
            link: `/${authorUsername}/blog/${blogSlug}`,
            is_read: false
        }));

        // 3. Bulk insert
        const { error: insertError } = await supabase
            .from('notifications')
            .insert(notifications);

        if (insertError) throw insertError;

        return { success: true, count: notifications.length };
    } catch (err) {
        console.error("Broadcast Failure:", err);
        return { success: false, error: err.message };
    }
}