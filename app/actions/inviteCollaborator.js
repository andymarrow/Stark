'use server'
import nodemailer from 'nodemailer';

export async function sendCollaboratorInvite(email, projectTitle, inviterName) {
  try {
    // 1. Configure the Transporter (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL, // Your Gmail
        pass: process.env.SMTP_PASSWORD, // Your App Password
      },
    });

    // 2. Define the email content
    const mailOptions = {
      from: `"Stark Network" <${process.env.SMTP_EMAIL}>`, // Shows as "Stark Network"
      to: email, // The Ghost User
      subject: `Collaboration Invite: ${projectTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; background-color: #09090b; color: #ffffff; padding: 40px; border: 1px solid #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h1 style="border-bottom: 2px solid #333; padding-bottom: 20px; font-size: 24px; letter-spacing: -1px;">// SYSTEM_SIGNAL</h1>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
              <strong style="color: #ef4444;">${inviterName}</strong> has listed you as a collaborator on the project:
            </p>
            
            <div style="background-color: #1a1a1a; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <span style="font-size: 18px; font-weight: bold;">"${projectTitle}"</span>
            </div>

            <p style="color: #a1a1aa; font-size: 14px;">
              Join the network to claim your credit, display this node on your dossier, and increase your reach.
            </p>
            
            <div style="margin-top: 40px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                 style="background-color: #ffffff; color: #000000; padding: 14px 28px; text-decoration: none; text-transform: uppercase; font-weight: bold; font-size: 12px; letter-spacing: 1px; display: inline-block;">
                Initialize Account
              </a>
            </div>

            <p style="margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; font-size: 10px; color: #555; text-align: center;">
              SECURE TRANSMISSION // STARK NETWORK // ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      `,
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent to ${email} via Gmail`);
    return { success: true };

  } catch (error) {
    console.error("❌ Nodemailer Error:", error);
    return { success: false, error: error.message };
  }
}