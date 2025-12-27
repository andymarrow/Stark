'use server'
import nodemailer from 'nodemailer';

export async function sendAdminEmail(toEmail, subject, message) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Stark Admin Command" <${process.env.SMTP_EMAIL}>`,
      to: toEmail,
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

    return { success: true };
  } catch (error) {
    console.error("Admin Email Error:", error);
    return { success: false, error: error.message };
  }
}