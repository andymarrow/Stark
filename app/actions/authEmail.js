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
import { renderEmail } from "@/lib/emailTemplate";

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

// Create the account (unconfirmed) and email the verification link via Resend.
export async function signUpWithEmail({ email, password, username, origin }) {
  if (!email || !password) {
    return { status: "error", message: "Email and password are required." };
  }

  try {
    const admin = getAdminClient();
    const redirectTo = `${origin}/auth/callback?next=/onboarding`;
    const metadata = {
      full_name: username,
      username: String(username || "").toLowerCase().replace(/\s+/g, "_"),
    };

    let { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { data: metadata, redirectTo },
    });

    if (error) {
      if (!/already.*(registered|exists)/i.test(error.message)) {
        return { status: "error", message: error.message };
      }

      // The account already exists — that's only a real dead end if it's
      // already verified. For a still-unverified account (the common case:
      // their first confirmation email never arrived), fall through and
      // resend a fresh link instead of blocking them here. A magiclink
      // works for existing users (unlike the signup type) and its response
      // tells us whether the email is confirmed.
      const retryLink = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

      if (retryLink.error || !retryLink.data?.properties?.action_link) {
        return { status: "error", message: "An account with that email already exists." };
      }

      if (retryLink.data.user?.email_confirmed_at) {
        return {
          status: "error",
          message: "An account with that email already exists. Try logging in instead.",
        };
      }

      // Still unverified — keep whatever password/username they just typed,
      // in case they're retrying signup because they forgot the originals.
      if (retryLink.data.user?.id) {
        await admin.auth.admin.updateUserById(retryLink.data.user.id, {
          password,
          user_metadata: metadata,
        });
      }

      data = retryLink.data;
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return { status: "error", message: "Could not generate a verification link." };
    }

    const { error: sendError } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: "Verify your Stark account",
      html: renderEmail({
        tag: "VERIFY",
        intro: `One step left. Confirm <strong style="color: #ffffff;">${email}</strong> to activate your Stark account.`,
        cta: { label: "Verify Email", url: actionLink },
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
      html: renderEmail({
        tag: "RECOVERY",
        intro: `A password reset was requested for <strong style="color: #ffffff;">${email}</strong>.`,
        cta: { label: "Reset Password", url: data.properties.action_link },
      }),
    });

    if (sendError) return { status: "error", message: "The reset email failed to send. Please try again." };

    return { status: "sent" };
  } catch (err) {
    return { status: "error", message: err.message || "Something went wrong." };
  }
}
