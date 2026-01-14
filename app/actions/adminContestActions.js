"use server";
import { Resend } from 'resend';
import { createClient } from "@/utils/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = 'Stark Admin <admin@stark.wip.et>';

export async function deleteContestAsAdmin(contestId, reason) {
  const supabase = await createClient();
  console.log(" [Admin] Starting deletion protocol for:", contestId);
  
  // 1. Fetch Contest & Creator
  const { data: contest, error: fetchError } = await supabase
    .from('contests')
    .select('title, creator:profiles!creator_id(email)') // Explicit FK name usually helps
    .eq('id', contestId)
    .single();

  if (fetchError || !contest) {
      console.error(" [Admin] Contest Fetch Error:", fetchError);
      return { error: "Contest not found" };
  }

  // 2. Fetch Participants (Revised Strategy)
  // Step A: Get all project IDs
  const { data: submissions } = await supabase
    .from('contest_submissions')
    .select('project_id')
    .eq('contest_id', contestId);
    
  const projectIds = submissions?.map(s => s.project_id) || [];
  
  // Step B: Get owners of those projects
  let participantEmails = [];
  if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('owner:profiles(email)')
        .in('id', projectIds);
        
      participantEmails = [...new Set(projects?.map(p => p.owner?.email).filter(Boolean))];
  }

  console.log(` [Admin] Found ${participantEmails.length} participants:`, participantEmails);

  // 3. SEND EMAILS
  try {
      // A. Notify Creator
      const creatorEmail = contest.creator?.email;
      if (creatorEmail) {
        console.log(" [Admin] Attempting to email creator:", creatorEmail);
        const { error: resendError } = await resend.emails.send({
          from: SENDER_EMAIL,
          to: [creatorEmail],
          subject: `Notice: Contest Deletion (${contest.title})`,
          html: `
            <div style="font-family: monospace; color: #000;">
              <h1>ADMINISTRATIVE ACTION</h1>
              <p>Your contest <strong>${contest.title}</strong> has been removed from Stark.</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <hr />
              <p>If you believe this is an error, reply to this email.</p>
            </div>
          `
        });
        if (resendError) console.error(" [Admin] Creator Email Failed:", resendError);
        else console.log(" [Admin] Creator Email Sent.");
      }

      // B. Notify Participants
      if (participantEmails.length > 0) {
          console.log(" [Admin] Emailing participants...");
          await Promise.all(participantEmails.map(async (email) => {
              const { error } = await resend.emails.send({
                  from: SENDER_EMAIL,
                  to: [email],
                  subject: `Notice: Contest Cancelled (${contest.title})`,
                  html: `
                    <div style="font-family: monospace; color: #000;">
                      <h2>CONTEST TERMINATED</h2>
                      <p>The contest <strong>${contest.title}</strong> you submitted to has been removed by our moderation team.</p>
                      <p><strong>Reason:</strong> ${reason}</p>
                      <p>Your project submission has been delinked. You can make it public from your dashboard.</p>
                    </div>
                  `
              });
              if (error) console.error(` [Admin] Failed to email ${email}:`, error);
          }));
      }

  } catch (emailError) {
      console.error(" [Admin] Email System Critical Failure:", emailError);
  }

  // 4. DELETE CONTEST
  console.log(" [Admin] Deleting from DB...");
  const { error: deleteError } = await supabase
    .from('contests')
    .delete()
    .eq('id', contestId);

  if (deleteError) {
      console.error(" [Admin] DB Delete Failed:", deleteError);
      return { error: deleteError.message };
  }

  console.log(" [Admin] Deletion Complete.");
  return { success: true };
}
// ... (Rest of the file remains unchanged)
export async function removeJudgeAsAdmin(judgeId, reason, contestTitle, creatorEmail) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('contest_judges').delete().eq('id', judgeId);
  if (error) return { error: error.message };

  if (creatorEmail) {
    await resend.emails.send({
        from: SENDER_EMAIL,
        to: [creatorEmail],
        subject: `Admin Action: Judge Removed`,
        html: `
            <div style="font-family: monospace;">
                <p>A judge was removed from your contest <strong>${contestTitle}</strong> by an administrator.</p>
                <p><strong>Reason:</strong> ${reason}</p>
            </div>
        `
    });
  }
  return { success: true };
}

export async function removeSponsorAsAdmin(contestId, sponsorName, reason, contestTitle, creatorEmail) {
  const supabase = await createClient();
  
  const { data: contest } = await supabase.from('contests').select('sponsors').eq('id', contestId).single();
  if (!contest) return { error: "Contest not found" };

  const updatedSponsors = (contest.sponsors || []).filter(s => s.name !== sponsorName);

  const { error } = await supabase.from('contests').update({ sponsors: updatedSponsors }).eq('id', contestId);
  if (error) return { error: error.message };

  if (creatorEmail) {
    await resend.emails.send({
        from: SENDER_EMAIL,
        to: [creatorEmail],
        subject: `Admin Action: Sponsor Removed (${contestTitle})`,
        html: `
            <div style="font-family: monospace;">
                <h1>MODERATION ALERT</h1>
                <p>The sponsor <strong>${sponsorName}</strong> was removed from your contest <strong>${contestTitle}</strong> by an administrator.</p>
                <p><strong>Reason:</strong> ${reason}</p>
            </div>
        `
    });
  }
  return { success: true };
}