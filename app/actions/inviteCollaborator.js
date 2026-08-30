'use server'
import { Resend } from 'resend';
import { renderEmail } from '@/lib/emailTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCollaboratorInvite(email, projectTitle, inviterName) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Stark <invites@stark.et>',
      to: [email],
      subject: `Collaboration Invite: ${projectTitle}`,
      html: renderEmail({
        tag: "COLLAB",
        intro: `<strong style="color: #ffffff;">${inviterName}</strong> added you as a collaborator on:`,
        highlight: { variant: "title", value: projectTitle },
        cta: { label: "Initialize Account", url: `${process.env.NEXT_PUBLIC_APP_URL}/login` },
        footerNote: "Join to claim your credit.",
      }),
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