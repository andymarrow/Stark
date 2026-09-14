'use server'
import { Resend } from 'resend';
import { renderEmail } from '@/lib/emailTemplate';

// Lazy — `new Resend(undefined)` throws immediately, and since this ran at
// module scope, merely importing this file (even without ever calling a
// function in it) crashed every page whose server bundle happened to pull
// it in, in any environment missing RESEND_API_KEY.
const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function sendCollaboratorInvite(email, projectTitle, inviterName) {
  try {
    const { data, error } = await getResend().emails.send({
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