"use server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendJudgeInvite(email, contestTitle, contestSlug, accessCode, inviterName) {
  try {
    // 🔗 Construct the deep link to the Judging Portal
    const judgeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contests/${contestSlug}/judge`;

    const { data, error } = await resend.emails.send({
      from: 'Stark <invites@stark.wip.et>', 
      to: [email],
      subject: `Judge Invitation: ${contestTitle}`,
      html: `
        <div style="font-family: monospace; background: #000; color: #fff; padding: 40px; border: 1px solid #333;">
          <h1 style="color: #ff0000; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 30px;">STARK // JURY</h1>
          
          <p style="color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Protocol Initiated By</p>
          <p style="font-size: 18px; font-weight: bold; margin-bottom: 30px;">${inviterName}</p>

          <p style="color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Assignment</p>
          <h2 style="border-bottom: 1px solid #222; padding-bottom: 15px; margin-bottom: 30px;">${contestTitle}</h2>
          
          <div style="margin: 30px 0; padding: 25px; border: 1px dashed #ff0000; background: #110000;">
            <p style="margin: 0; color: #ff0000; font-size: 10px; text-transform: uppercase; font-weight: bold;">Secure Access Code</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #fff;">${accessCode}</p>
          </div>

          <p style="color: #666; font-size: 11px; margin-bottom: 30px; line-height: 1.6;">
            WARNING: This code is a single-node entry key. Do not share this credential. 
            By entering the system, you agree to evaluate submissions with technical precision.
          </p>
          
          <a href="${judgeUrl}" style="display: inline-block; background: #fff; color: #000; padding: 15px 35px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">
            Open Judging Console
          </a>

          <div style="margin-top: 50px; border-top: 1px solid #222; pt-20; color: #444; font-size: 10px; text-transform: uppercase;">
            Stark Network // Decentralized Portfolio Intelligence
          </div>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}