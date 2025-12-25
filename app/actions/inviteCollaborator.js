'use server'
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCollaboratorInvite(email, projectTitle, inviterName) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Stark <onboarding@resend.dev>', // Use 'onboarding@resend.dev' for testing if you don't have a domain yet
      to: [email],
      subject: `Collaboration Invite: ${projectTitle}`,
      html: `
        <div style="font-family: monospace; background: #09090b; color: #fff; padding: 40px;">
          <h1 style="border-bottom: 1px solid #333; padding-bottom: 20px;">// SYSTEM_SIGNAL</h1>
          <p style="font-size: 16px;"><strong>${inviterName}</strong> has listed you as a collaborator on the project <strong>"${projectTitle}"</strong>.</p>
          <p style="color: #888;">Join the network to claim your credit and add this node to your portfolio.</p>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
             style="background: #fff; color: #000; padding: 12px 24px; text-decoration: none; text-transform: uppercase; font-weight: bold; display: inline-block;">
            Initialize Account
          </a>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Server Action Error:", error);
    return { success: false, error };
  }
}