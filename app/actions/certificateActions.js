"use server";
/**
 * Participation certificates — admin console, Contest Control → Certificates.
 * --------------------------------------------------------------------------
 * An admin uploads a design for a contest, sets where the name goes, and
 * once the contest has ended sends every participant their own PDF by
 * email. Who counts as a participant: the owner of each submitted project,
 * plus collaborators who ACCEPTED the invite. Pending invites are left out
 * on purpose — that was the call for the official hackathon, and it keeps
 * the list to people who actually confirmed they were on a team.
 *
 * Platform admins only (profiles.role = 'admin'), checked in every action.
 * Service role for the reads and writes, because collaborations, profile
 * emails and the private template bucket aren't readable with the anon key.
 *
 * Sending is driven from the browser in small batches (sendCertificates
 * takes a handful of user ids at a time) so no single request runs long,
 * and contest_certificate_deliveries records every send, so a batch run
 * that gets interrupted can be resumed without anyone getting it twice.
 */
import { Resend } from "resend";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { renderEmail } from "@/lib/emailTemplate";
import {
  normaliseLayout,
  preparePrintedName,
  readTemplatePageSize,
  renderCertificatePdf,
} from "@/lib/certificate/renderCertificate";

const BUCKET = "certificate-templates";
const SENDER_EMAIL = "Stark <certificates@stark.et>";
const MAX_TEMPLATE_BYTES = 15 * 1024 * 1024;
const MAX_BATCH = 10;
// Resend's default limit is a couple of requests a second; stay under it.
const SEND_GAP_MS = 600;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://stark.et";

const getResend = () => new Resend(process.env.RESEND_API_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server is missing Supabase service credentials.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Returns { admin, user } for a platform admin, or { error }.
async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, email, full_name, username")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Admins only." };

  return { admin, user, profile };
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contestEndsAt(contest) {
  return contest?.end_date || contest?.submission_deadline || null;
}

function hasEnded(contest) {
  const end = contestEndsAt(contest);
  return !!end && new Date(end).getTime() <= Date.now();
}

async function loadContest(admin, contestId) {
  const { data } = await admin
    .from("contests")
    .select("id, title, slug, end_date, submission_deadline")
    .eq("id", contestId)
    .single();
  return data;
}

async function loadTemplate(admin, contestId) {
  const { data } = await admin
    .from("contest_certificates")
    .select("*")
    .eq("contest_id", contestId)
    .maybeSingle();
  return data;
}

async function downloadTemplate(admin, templatePath) {
  const { data, error } = await admin.storage.from(BUCKET).download(templatePath);
  if (error || !data) throw new Error("Couldn't read the certificate template from storage.");
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Everyone who gets a certificate: owners of submitted projects plus their
 * accepted collaborators, one entry per person however many teams they're
 * on, merged with any per-person name edits and send history.
 */
async function resolveRecipients(admin, contestId) {
  const { data: subs } = await admin
    .from("contest_submissions")
    .select("project:projects!inner(id, title, owner_id)")
    .eq("contest_id", contestId);

  const projects = (subs || []).map((s) => s.project).filter(Boolean);
  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);
  const { data: collabs } = await admin
    .from("collaborations")
    .select("project_id, user_id")
    .in("project_id", projectIds)
    .eq("status", "accepted")
    .not("user_id", "is", null);

  const titleById = Object.fromEntries(projects.map((p) => [p.id, p.title]));
  const people = new Map(); // userId -> { role, projects: Set }
  const add = (userId, projectId, role) => {
    if (!userId) return;
    const entry = people.get(userId) || { role, projects: new Set() };
    if (role === "owner") entry.role = "owner";
    entry.projects.add(titleById[projectId]);
    people.set(userId, entry);
  };
  for (const p of projects) add(p.owner_id, p.id, "owner");
  for (const c of collabs || []) add(c.user_id, c.project_id, "collaborator");

  const userIds = [...people.keys()];
  const profiles = [];
  for (let i = 0; i < userIds.length; i += 200) {
    const { data } = await admin
      .from("profiles")
      .select("id, username, full_name, email")
      .in("id", userIds.slice(i, i + 200));
    profiles.push(...(data || []));
  }
  const profileById = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const { data: deliveries } = await admin
    .from("contest_certificate_deliveries")
    .select("user_id, name_override, status, email, printed_name, error, sent_at")
    .eq("contest_id", contestId);
  const deliveryByUser = Object.fromEntries((deliveries || []).map((d) => [d.user_id, d]));

  const recipients = await Promise.all(
    userIds.map(async (userId) => {
      const profile = profileById[userId] || {};
      const delivery = deliveryByUser[userId] || null;
      const profileName = (profile.full_name || "").trim() || profile.username || "";
      const sourceName = delivery?.name_override ?? profileName;
      const { text, dropped } = await preparePrintedName(sourceName);
      return {
        userId,
        username: profile.username || null,
        email: profile.email || null,
        profileName,
        nameOverride: delivery?.name_override ?? null,
        printedName: text,
        droppedChars: dropped,
        role: people.get(userId).role,
        projects: [...people.get(userId).projects].filter(Boolean),
        status: delivery?.status || null,
        sentAt: delivery?.sent_at || null,
        sentTo: delivery?.email || null,
        error: delivery?.error || null,
      };
    })
  );

  return recipients.sort((a, b) => a.printedName.localeCompare(b.printedName));
}

/** Everything the Certificates tab needs in one round trip. */
export async function getCertificateSetup(contestId) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };
    const { admin } = auth;

    const contest = await loadContest(admin, contestId);
    if (!contest) return { error: "Contest not found." };

    const template = await loadTemplate(admin, contestId);
    const recipients = await resolveRecipients(admin, contestId);

    return {
      contest: {
        id: contest.id,
        title: contest.title,
        endsAt: contestEndsAt(contest),
        hasEnded: hasEnded(contest),
      },
      template: template && {
        sourceType: template.source_type,
        sourceFilename: template.source_filename,
        pageWidth: template.page_width,
        pageHeight: template.page_height,
        layout: normaliseLayout(template.name_layout, template.page_width, template.page_height),
        updatedAt: template.updated_at,
      },
      recipients,
    };
  } catch (err) {
    console.error("[getCertificateSetup]", err);
    return { error: err.message || "Couldn't load certificate settings." };
  }
}

/**
 * Signed upload URL into the private bucket, so the (possibly large)
 * template goes straight from the browser to storage instead of through
 * a server action body.
 */
export async function createCertificateUploadUrl(contestId) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const path = `${contestId}/${Date.now()}.pdf`;
    const { data, error } = await auth.admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) return { error: error.message };
    return { path: data.path, token: data.token };
  } catch (err) {
    console.error("[createCertificateUploadUrl]", err);
    return { error: err.message || "Couldn't start the upload." };
  }
}

/** Attach an uploaded template to the contest, replacing any previous one. */
export async function saveCertificateTemplate(contestId, { path, sourceType, sourceFilename, layout }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };
    const { admin, user } = auth;

    if (!path || !path.startsWith(`${contestId}/`)) return { error: "Upload path doesn't belong to this contest." };
    if (!["pdf", "svg"].includes(sourceType)) return { error: "Template must be a PDF or SVG." };

    const bytes = await downloadTemplate(admin, path);
    if (bytes.byteLength > MAX_TEMPLATE_BYTES) {
      await admin.storage.from(BUCKET).remove([path]);
      return { error: "Template is over 15 MB." };
    }

    let size;
    try {
      size = await readTemplatePageSize(bytes);
    } catch {
      await admin.storage.from(BUCKET).remove([path]);
      return { error: "That file isn't a readable PDF (encrypted or damaged PDFs can't be used)." };
    }

    const previous = await loadTemplate(admin, contestId);
    const nameLayout = normaliseLayout(layout, size.width, size.height);

    const { error } = await admin.from("contest_certificates").upsert({
      contest_id: contestId,
      template_path: path,
      source_type: sourceType,
      source_filename: sourceFilename?.slice(0, 200) || null,
      page_width: size.width,
      page_height: size.height,
      name_layout: nameLayout,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };

    if (previous?.template_path && previous.template_path !== path) {
      await admin.storage.from(BUCKET).remove([previous.template_path]);
    }

    return {
      success: true,
      pageCount: size.pageCount,
      template: {
        sourceType,
        sourceFilename,
        pageWidth: size.width,
        pageHeight: size.height,
        layout: nameLayout,
      },
    };
  } catch (err) {
    console.error("[saveCertificateTemplate]", err);
    return { error: err.message || "Couldn't save the template." };
  }
}

export async function saveCertificateLayout(contestId, layout) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const template = await loadTemplate(auth.admin, contestId);
    if (!template) return { error: "Upload a template first." };

    const nameLayout = normaliseLayout(layout, template.page_width, template.page_height);
    const { error } = await auth.admin
      .from("contest_certificates")
      .update({ name_layout: nameLayout, updated_by: auth.user.id, updated_at: new Date().toISOString() })
      .eq("contest_id", contestId);
    if (error) return { error: error.message };
    return { success: true, layout: nameLayout };
  } catch (err) {
    console.error("[saveCertificateLayout]", err);
    return { error: err.message || "Couldn't save the name position." };
  }
}

/**
 * Render one certificate and hand it back as base64 for the admin page to
 * show. `layout` is optional so the preview can follow unsaved edits.
 */
export async function previewCertificate(contestId, { name, layout } = {}) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const template = await loadTemplate(auth.admin, contestId);
    if (!template) return { error: "Upload a template first." };

    const bytes = await downloadTemplate(auth.admin, template.template_path);
    const { text, dropped } = await preparePrintedName(name || "Participant Name");
    const pdf = await renderCertificatePdf(bytes, layout || template.name_layout, text);
    return { pdf: Buffer.from(pdf).toString("base64"), printedName: text, droppedChars: dropped };
  } catch (err) {
    console.error("[previewCertificate]", err);
    return { error: err.message || "Couldn't render the preview." };
  }
}

/** Correct the name printed for one person. Empty/null goes back to their profile name. */
export async function setCertificateName(contestId, userId, name) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const override = String(name ?? "").trim().slice(0, 120) || null;
    const { error } = await auth.admin
      .from("contest_certificate_deliveries")
      .upsert(
        { contest_id: contestId, user_id: userId, name_override: override, updated_at: new Date().toISOString() },
        { onConflict: "contest_id,user_id" }
      );
    if (error) return { error: error.message };

    const recipients = await resolveRecipients(auth.admin, contestId);
    return { success: true, recipient: recipients.find((r) => r.userId === userId) || null };
  } catch (err) {
    console.error("[setCertificateName]", err);
    return { error: err.message || "Couldn't save the name." };
  }
}

function fileNameFor(name) {
  const safe = name.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  return `Stark-Certificate${safe ? `-${safe}` : ""}.pdf`;
}

async function emailCertificate({ to, contest, printedName, pdf }) {
  const title = escapeHtml(contest.title);
  const { data, error } = await getResend().emails.send({
    from: SENDER_EMAIL,
    to: [to],
    subject: `Your certificate of participation — ${contest.title}`,
    html: renderEmail({
      tag: "CERTIFICATE",
      intro: [
        `Thank you for taking part in <strong style="color: #ffffff;">${title}</strong>.`,
        `Your certificate of participation is attached to this email as a PDF. Download it, print it, share it — you earned it.`,
      ],
      highlight: { label: "Awarded to", value: escapeHtml(printedName) },
      cta: contest.slug ? { label: "View the contest", url: `${BASE_URL}/contests/${contest.slug}` } : undefined,
      footerNote: `You're receiving this because you took part in ${title} on Stark.`,
    }),
    attachments: [{ filename: fileNameFor(printedName), content: Buffer.from(pdf) }],
  });
  if (error) throw new Error(error.message || "Email provider rejected the message.");
  return data;
}

/**
 * Send (or re-send) certificates to up to MAX_BATCH people. Only after the
 * contest has ended. Anyone already sent is skipped unless `resend` is set,
 * so the browser can safely call this again after an interruption.
 */
export async function sendCertificates(contestId, userIds, { resend = false } = {}) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };
    const { admin } = auth;

    if (!Array.isArray(userIds) || userIds.length === 0) return { results: [] };
    if (userIds.length > MAX_BATCH) return { error: `Send at most ${MAX_BATCH} at a time.` };

    const contest = await loadContest(admin, contestId);
    if (!contest) return { error: "Contest not found." };
    if (!hasEnded(contest)) return { error: "Certificates can only be sent after the contest has ended." };

    const template = await loadTemplate(admin, contestId);
    if (!template) return { error: "Upload a template first." };
    const templateBytes = await downloadTemplate(admin, template.template_path);

    const recipients = await resolveRecipients(admin, contestId);
    const byId = Object.fromEntries(recipients.map((r) => [r.userId, r]));

    const results = [];
    for (const userId of userIds) {
      const r = byId[userId];
      if (!r) {
        results.push({ userId, status: "skipped", error: "Not a participant of this contest." });
        continue;
      }
      if (r.status === "sent" && !resend) {
        results.push({ userId, status: "skipped", error: "Already sent." });
        continue;
      }

      let status = "sent";
      let error = null;
      try {
        if (!r.email) throw new Error("No email address on this account.");
        if (!r.printedName) throw new Error("No printable name — set one first.");
        const pdf = await renderCertificatePdf(templateBytes, template.name_layout, r.printedName);
        await emailCertificate({ to: r.email, contest, printedName: r.printedName, pdf });
      } catch (err) {
        status = "failed";
        error = err.message || "Send failed.";
      }

      const now = new Date().toISOString();
      await admin.from("contest_certificate_deliveries").upsert(
        {
          contest_id: contestId,
          user_id: userId,
          status,
          email: r.email,
          printed_name: r.printedName,
          error,
          sent_at: status === "sent" ? now : r.sentAt,
          updated_at: now,
        },
        { onConflict: "contest_id,user_id" }
      );

      results.push({ userId, status, error, sentAt: status === "sent" ? now : r.sentAt, sentTo: r.email });
      await sleep(SEND_GAP_MS);
    }

    return { results };
  } catch (err) {
    console.error("[sendCertificates]", err);
    return { error: err.message || "Sending failed." };
  }
}

/** Email one certificate to the signed-in admin. Works before the contest ends. */
export async function sendTestCertificate(contestId, name) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };
    const { admin, profile, user } = auth;

    const to = profile?.email || user.email;
    if (!to) return { error: "Your account has no email address." };

    const contest = await loadContest(admin, contestId);
    if (!contest) return { error: "Contest not found." };
    const template = await loadTemplate(admin, contestId);
    if (!template) return { error: "Upload a template first." };

    const { text } = await preparePrintedName(name || profile?.full_name || profile?.username || "Participant Name");
    const bytes = await downloadTemplate(admin, template.template_path);
    const pdf = await renderCertificatePdf(bytes, template.name_layout, text);
    await emailCertificate({ to, contest, printedName: text, pdf });
    return { success: true, sentTo: to };
  } catch (err) {
    console.error("[sendTestCertificate]", err);
    return { error: err.message || "Test send failed." };
  }
}
