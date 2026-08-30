"use server";
/**
 * Auth transactional email — routed through Resend.
 * ---------------------------------------------------
 * Supabase's built-in mailer (used by supabase.auth.signUp /
 * resetPasswordForEmail directly) is what was silently swallowing signup
 * verification and password-reset emails — it's rate-limited and isn't
 * wired to our verified sending domain. Every other transactional email on
 * Stark (invites, admin notices) already goes through Resend on stark.et,
 * so auth emails should too.
 *
 * Fix: generate the confirmation/recovery link ourselves via the Supabase
 * Admin API (which does NOT auto-send anything) and deliver it with Resend,
 * same as the rest of the app. The link itself still points at Supabase's
 * verify endpoint, so /auth/callback's exchangeCodeForSession flow is
 * untouched — only who sends the email changes.
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = "Stark <verify@stark.et>";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Server is missing Supabase service credentials.");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Shared shell matching the rest of Stark's transactional emails (see
// inviteJudge.js / adminEmail.js) — black background, monospace, red accent.
function emailShell({ heading, bodyHtml, ctaLabel, ctaUrl }) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Courier New', Courier, monospace; background-color: #000000; color: #ffffff; padding: 40px; margin: 0;">

      <div style="margin-bottom: 40px;">
        <h1 style="color: #ff0000; font-size: 24px; margin: 0; letter-spacing: 2px;">STARK // ${heading}</h1>
      </div>

      ${bodyHtml}

      <div style="text-align: center; margin-bottom: 40px;">
        <a href="${ctaUrl}" style="background-color: #ffffff; color: #000000; padding: 14px 40px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
          ${ctaLabel}
        </a>
      </div>

      <p style="font-size: 10px; color: #444444; text-align: center; border-top: 1px solid #222222; padding-top: 20px;">
        If you didn't request this, you can safely ignore this email.<br>
        Stark Network © 2026
      </p>

    </body>
    </html>
  `;
}

// Create the account (unconfirmed) and email the verification link via Resend.
export async function signUpWithEmail({ email, password, username, origin }) {
  if (!email || !password) {
    return { status: "error", message: "Email and password are required." };
  }

  try {
    const admin = getAdminClient();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          full_name: username,
          username: String(username || "").toLowerCase().replace(/\s+/g, "_"),
        },
        redirectTo: `${origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      const message = /already registered|already exists/i.test(error.message)
        ? "An account with that email already exists."
        : error.message;
      return { status: "error", message };
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return { status: "error", message: "Could not generate a verification link." };
    }

    const { error: sendError } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: "Verify your Stark account",
      html: emailShell({
        heading: "VERIFY",
        bodyHtml: `
          <p style="font-size: 14px; color: #cccccc; line-height: 1.6; margin-bottom: 30px;">
            One step left. Confirm <strong>${email}</strong> to activate your Stark account.
          </p>
        `,
        ctaLabel: "Verify Email",
        ctaUrl: actionLink,
      }),
    });

    if (sendError) {
      return {
        status: "error",
        message: "Your account was created, but the verification email failed to send. Try signing up again in a moment.",
      };
    }

    return { status: "sent" };
  } catch (err) {
    return { status: "error", message: err.message || "Something went wrong." };
  }
}

// Email a password-reset link via Resend. Always reports "sent" so we don't
// leak whether an email is registered — same contract as
// supabase.auth.resetPasswordForEmail.
export async function sendPasswordReset({ email, origin }) {
  if (!email) return { status: "error", message: "Email is required." };

  try {
    const admin = getAdminClient();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
      },
    });

    if (error) {
      // No account with that email — stay silent so we don't leak which
      // addresses are registered. Anything else is a real failure worth
      // surfacing (bad service credentials, Resend down, etc.).
      if (/not.*found|no.*user/i.test(error.message)) return { status: "sent" };
      return { status: "error", message: error.message };
    }
    if (!data?.properties?.action_link) {
      return { status: "error", message: "Could not generate a reset link." };
    }

    const { error: sendError } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: "Reset your Stark password",
      html: emailShell({
        heading: "RECOVERY",
        bodyHtml: `
          <p style="font-size: 14px; color: #cccccc; line-height: 1.6; margin-bottom: 30px;">
            A password reset was requested for <strong>${email}</strong>.
          </p>
        `,
        ctaLabel: "Reset Password",
        ctaUrl: data.properties.action_link,
      }),
    });

    if (sendError) return { status: "error", message: "The reset email failed to send. Please try again." };

    return { status: "sent" };
  } catch (err) {
    return { status: "error", message: err.message || "Something went wrong." };
  }
}
