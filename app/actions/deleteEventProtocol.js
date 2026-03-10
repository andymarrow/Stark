"use server";
import { createClient } from "@/utils/supabase/server";

export async function deleteEventProtocol(eventId, isCancel = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // 1. Fetch Event and verify Host
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('host_id, title')
      .eq('id', eventId)
      .single();

    if (eventError || event.host_id !== user.id) throw new Error("Access Denied.");

    // 2. Fetch all submissions to notify them of the change
    const { data: subs } = await supabase
      .from('event_submissions')
      .select('project_id, project:projects(owner_id, title)')
      .eq('event_id', eventId);

    if (isCancel) {
        // --- RESTORATION LOGIC ---
        if (subs && subs.length > 0) {
            const notifications = subs.map(s => ({
                receiver_id: s.project.owner_id,
                sender_id: user.id,
                type: 'system', // General system alert
                message: `Protocol Restored: Your project '${s.project.title}' is back in the '${event.title}' sector.`,
                link: `/project/${s.project.id}`
            }));
            await supabase.from('notifications').insert(notifications);

            // Relink projects to the event logic
            const projectIds = subs.map(s => s.project_id);
            await supabase
              .from('projects')
              .update({ is_contest_entry: true }) 
              .in('id', projectIds);
        }

        // Reset Event status
        const { error: restoreError } = await supabase
          .from('events')
          .update({ 
              is_closed: false,
              description: event.title // Revert description to title
          })
          .eq('id', eventId);

        if (restoreError) throw restoreError;
        return { success: true, mode: 'restored' };

    } else {
        // --- TAKEDOWN LOGIC ---
        if (subs && subs.length > 0) {
            const notifications = subs.map(s => ({
                receiver_id: s.project.owner_id,
                sender_id: user.id,
                type: 'event_closed',
                message: `Event Closed: Your project '${s.project.title}' is now independent from '${event.title}'.`,
                link: `/profile`
            }));
            await supabase.from('notifications').insert(notifications);

            // Decouple projects
            const projectIds = subs.map(s => s.project_id);
            await supabase
              .from('projects')
              .update({ is_contest_entry: false }) 
              .in('id', projectIds);
        }

        // Soft-Delete Event
        const { error: deleteError } = await supabase
          .from('events')
          .update({ 
              is_closed: true,
              description: `TERMINATED: ${new Date().toISOString()}` 
          })
          .eq('id', eventId);

        if (deleteError) throw deleteError;
        return { success: true, mode: 'terminated' };
    }
  } catch (error) {
    console.error("Protocol Error:", error);
    return { success: false, error: error.message };
  }
}