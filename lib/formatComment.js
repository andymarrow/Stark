/**
 * Comment text -> HTML with @mentions linked. The ONLY way comment text
 * should reach dangerouslySetInnerHTML.
 * -------------------------------------------------------------------
 * The old copies of this in the blog components ran the mention regex on
 * the raw comment and injected the result, so any HTML someone typed into
 * a comment executed for every reader of the post (stored XSS — a
 * `<details open ontoggle=…>` payload was used to post visitors' cookies,
 * and with them their Supabase session, to an outside server).
 *
 * Order matters: escape EVERYTHING first, then add the one tag we create
 * ourselves. The mention id ends up in an href, so it's limited to
 * username characters — anything else is left as plain (escaped) text.
 */
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

// Runs on already-escaped text, so `display` can't contain markup; the
// `[^\]]` / `[^)]` classes still match the escaped forms harmlessly.
const MENTION_RE = /@\[([^\]]+)\]\(([A-Za-z0-9_.-]+)\)/g;

export function formatCommentHtml(text) {
  if (!text) return "";
  return escapeHtml(text).replace(
    MENTION_RE,
    (_, display, id) =>
      `<a href="/profile/${encodeURIComponent(id)}" class="text-accent font-bold hover:underline decoration-dotted underline-offset-2 transition-colors">@${display}</a>`
  );
}
