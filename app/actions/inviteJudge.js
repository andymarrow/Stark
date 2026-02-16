"use server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendJudgeInvite(email, contestTitle, contestSlug, accessCode, inviterName) {
  try {
    const judgeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contests/${contestSlug}/judge`;

    const { data, error } = await resend.emails.send({
      from: 'Stark <invites@stark.wip.et>', 
      to: [email],
      subject: `Judge Access: ${contestTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Courier New', Courier, monospace; background-color: #000000; color: #ffffff; padding: 40px; margin: 0;">
          
          <!-- BRAND -->
          <div style="margin-bottom: 40px;">
            <h1 style="color: #ff0000; font-size: 24px; margin: 0; letter-spacing: 2px;">STARK // JURY</h1>
          </div>

          <!-- MESSAGE -->
          <p style="font-size: 14px; color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            <strong>${inviterName}</strong> has selected you to evaluate submissions for the following event:
          </p>
          
          <h2 style="font-size: 20px; color: #ffffff; border-left: 2px solid #ff0000; padding-left: 15px; margin-bottom: 40px;">
            ${contestTitle}
          </h2>

          <!-- ACCESS CODE BOX -->
          <div style="background-color: #111111; border: 1px solid #333333; padding: 30px; text-align: center; margin-bottom: 40px;">
            <p style="color: #666666; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Your Secure Access Code</p>
            <p style="font-size: 36px; font-weight: 900; letter-spacing: 6px; margin: 0; color: #ff0000; user-select: all;">
              ${accessCode}
            </p>
            <p style="color: #444444; font-size: 10px; margin-top: 10px;">(Select & Copy)</p>
          </div>

          <!-- ACTION BUTTON -->
          <div style="text-align: center; margin-bottom: 40px;">
            <a href="${judgeUrl}" style="background-color: #ffffff; color: #000000; padding: 14px 40px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
              Enter Judging Console
            </a>
          </div>

          <!-- FOOTER -->
          <p style="font-size: 10px; color: #444444; text-align: center; border-top: 1px solid #222222; padding-top: 20px;">
            Use the code above to authenticate. Do not share this credential.<br>
            Stark Network © 2026
          </p>

        </body>
        </html>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}