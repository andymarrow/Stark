'use server'
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCollaboratorInvite(email, projectTitle, inviterName) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Stark <invites@stark.wip.et>',
      to: [email],
      subject: `Collaboration Invite: ${projectTitle}`,
      html: `
        <div style="font-family: monospace; background: #000; color: #fff; padding: 40px;">
          <h1 style="color: #ff0000; text-transform: uppercase;">Stark Network</h1>
          <p><strong>${inviterName}</strong> added you as a collaborator on:</p>
          <h2 style="border-bottom: 1px solid #333; padding-bottom: 10px;">${projectTitle}</h2>
          <p style="color: #888; font-size: 12px;">Join to claim your credit.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; background: #fff; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; margin-top: 20px;">
            Initialize Account
          </a>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Action Error:", error);
    return { success: false, error: error.message };
  }
}