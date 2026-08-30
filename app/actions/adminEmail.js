'use server'
import { Resend } from 'resend';
import { renderEmail } from '@/lib/emailTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdminEmail(toEmail, subject, message) {
  try {
    const { error } = await resend.emails.send({
      from: 'Stark Admin <admin@stark.et>',
      to: [toEmail],
      subject: `[SYSTEM NOTICE] ${subject}`,
      html: renderEmail({
        tag: "ADMIN",
        intro: message,
        footerNote: "Secure channel — do not reply.",
      }),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}