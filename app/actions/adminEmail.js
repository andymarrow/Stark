'use server'
import { Resend } from 'resend';
import { renderEmail } from '@/lib/emailTemplate';

// Lazy — `new Resend(undefined)` throws immediately, and since this ran at
// module scope, merely importing this file (even without ever calling a
// function in it) crashed every page whose server bundle happened to pull
// it in, in any environment missing RESEND_API_KEY.
const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function sendAdminEmail(toEmail, subject, message) {
  try {
    const { error } = await getResend().emails.send({
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