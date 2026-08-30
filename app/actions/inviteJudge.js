"use server";
import { Resend } from 'resend';
import { renderEmail } from '@/lib/emailTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendJudgeInvite(email, contestTitle, contestSlug, accessCode, inviterName) {
  try {
    const judgeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contests/${contestSlug}/judge`;

    const { data, error } = await resend.emails.send({
      from: 'Stark <invites@stark.et>',
      to: [email],
      subject: `Judge Access: ${contestTitle}`,
      html: renderEmail({
        tag: "JURY",
        intro: `<strong style="color: #ffffff;">${inviterName}</strong> has selected you to evaluate submissions for the following event:`,
        highlight: [
          { variant: "title", value: contestTitle },
          { variant: "code", label: "Your Secure Access Code", value: accessCode },
        ],
        cta: { label: "Enter Judging Console", url: judgeUrl },
        footerNote: "Use the code above to authenticate. Do not share this credential.",
      }),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}