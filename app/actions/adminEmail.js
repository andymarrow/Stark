'use server'
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdminEmail(toEmail, subject, message) {
  try {
    const { error } = await resend.emails.send({
      from: 'Stark Admin <admin@stark.et>',
      to: [toEmail],
      subject: `[SYSTEM NOTICE] ${subject}`,
      html: `
        <div style="font-family: monospace; background: #000; color: #fff; padding: 20px;">
          <h2 style="border-bottom: 1px solid #333; padding-bottom: 10px;">// ADMIN_TRANSMISSION</h2>
          <p>${message}</p>
          <br/>
          <p style="color: #666; font-size: 10px;">SECURE CHANNEL // DO NOT REPLY</p>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}