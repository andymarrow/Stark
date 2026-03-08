"use server";
import { createClient } from "@/utils/supabase/server";

export async function getTransmissions(submissionId) {
    const supabase = await createClient();
    
    // Performance optimized select
    const { data, error } = await supabase
        .from('event_chat_messages')
        .select(`
            id, text, created_at, sender_id,
            sender:profiles!sender_id(id, username, avatar_url)
        `)
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Fetch Error:", error);
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

export async function sendTransmission(submissionId, text) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
        .from('event_chat_messages')
        .insert({
            submission_id: submissionId,
            sender_id: user.id,
            text: text
        })
        .select(`
            *,
            sender:profiles!sender_id(id, username, avatar_url)
        `)
        .single();

    if (error) {
        console.error("Insert Error:", error);
        return { success: false, error: error.message };
    }
    return { success: true, data };
}