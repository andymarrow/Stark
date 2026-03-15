"use server";
import { createClient } from "@/utils/supabase/server";

export async function uplinkExistingProject(projectId, tokenInput, targetFolderId = null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized Node." };

  try {
    // 1. EXTRACT TOKEN (Smart Parsing)
    // If the user pasted a full URL, extract just the ev_... part
    let token = tokenInput.trim();
    if (token.includes('/events/join/')) {
        token = token.split('/events/join/')[1].split('/')[0].split('?')[0];
    }

    // 2. FETCH EVENT DATA
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, title, host_id, is_closed, deadline, allow_multiple')
        .eq('access_token', token)
        .single();

    if (eventError || !event) throw new Error("Invalid or Expired Protocol Token.");

    // 3. CHECK EVENT STATUS
    if (event.is_closed) throw new Error("This sector is currently offline (Closed).");
    if (event.deadline && new Date(event.deadline) < new Date()) {
        throw new Error("The deadline for this event has passed.");
    }

    // 4. VERIFY PROJECT OWNERSHIP & STATUS
    const { data: project, error: projError } = await supabase
        .from('projects')
        .select('id, owner_id, status')
        .eq('id', projectId)
        .single();

    if (projError || !project) throw new Error("Project dossier not found.");
    if (project.owner_id !== user.id) throw new Error("Security Breach: You do not own this project.");

    // 5. CHECK SUBMISSION RULES
    // A. Has this exact project been submitted already?
    const { count: duplicateCount } = await supabase
        .from('event_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('project_id', project.id);
    
    if (duplicateCount > 0) throw new Error("This specific project is already linked to this event.");

    // B. If single submission only, has the user submitted ANY project?
    if (!event.allow_multiple) {
        const { data: existingSubs } = await supabase
            .from('event_submissions')
            .select('project:projects!inner(owner_id)')
            .eq('event_id', event.id)
            .eq('project.owner_id', user.id)
            .limit(1);

        if (existingSubs && existingSubs.length > 0) {
            throw new Error("Protocol Violation: This event allows only 1 submission per creator.");
        }
    }

    // 6. RESOLVE TARGET FOLDER
    let finalFolderId = targetFolderId;
    if (!finalFolderId) {
        const { data: inboxId } = await supabase.rpc('get_inbox_id', { target_event_id: event.id });
        finalFolderId = inboxId;
    }

    // 7. INITIATE UPLINK (Insert Submission)
    // Since the user explicitly wanted this public project submitted, we carry over its public visibility 
    // to the event submission level automatically.
    const isPublic = project.status === 'published';

    const { error: insertError } = await supabase
        .from('event_submissions')
        .insert({
            event_id: event.id,
            project_id: project.id,
            folder_id: finalFolderId,
            status: 'pending',
            is_public: isPublic 
        });

    if (insertError) throw insertError;

    // 8. NOTIFY HOST
    await supabase.from('notifications').insert({
        receiver_id: event.host_id,
        sender_id: user.id,
        type: 'system',
        message: `New transmission received for '${event.title}'.`,
        link: `/events/${event.id}/dashboard`
    });

    return { success: true, eventTitle: event.title };

  } catch (error) {
    console.error("Uplink Error:", error.message);
    return { success: false, error: error.message };
  }
}