/**
 * Shared shell for every transactional email Stark sends via Resend.
 * --------------------------------------------------------------------
 * Every action file used to hand-roll its own inline HTML — some plain
 * black-on-white `<div>`s, some a full dark card — so the brand looked
 * different depending on which flow sent the mail. This is the one
 * "premium" look (black ground, hairline borders, red accent, monospace,
 * sharp corners) matching Stark's actual UI, so every email reads as the
 * same product. Call renderEmail() from a server action and pass the
 * result straight to resend.emails.send({ html: ... }).
 */

const RED = "#ff0000";
const FONT_STACK = "'JetBrains Mono', 'Courier New', Courier, monospace";

function escapeAttr(str) {
  return String(str ?? "").replace(/"/g, "&quot;");
}

// One or more lead paragraphs. Pass a string or an array of strings.
// Inline tags like <strong> are allowed through — every caller controls
// its own copy, none of it is untrusted user input rendered as markup.
function renderIntro(intro) {
  const paragraphs = Array.isArray(intro) ? intro : [intro];
  return paragraphs
    .filter(Boolean)
    .map(
      (p) => `
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.7; margin: 0 0 16px; font-family: ${FONT_STACK};">
          ${p}
        </p>`
    )
    .join("");
}

// Optional callout(s) beneath the intro — a boxed access code, or a
// title/quote card (project name, contest name, blog title, etc.). Pass one
// object or an array to stack several.
function renderOneHighlight({ variant = "title", label, value }) {
  if (variant === "code") {
    return `
      <div style="background-color: #141414; border: 1px solid #262626; padding: 28px; text-align: center; margin: 12px 0 28px;">
        ${label ? `<p style="color: #666666; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; font-family: ${FONT_STACK};">${label}</p>` : ""}
        <p style="font-size: 32px; font-weight: 900; letter-spacing: 6px; margin: 0; color: ${RED}; font-family: ${FONT_STACK};">${value}</p>
      </div>`;
  }

  return `
    <div style="background-color: #141414; border-left: 3px solid ${RED}; padding: 20px 24px; margin: 12px 0 28px;">
      ${label ? `<p style="color: #666666; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px; font-family: ${FONT_STACK};">${label}</p>` : ""}
      <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.3px; font-family: ${FONT_STACK};">${value}</p>
    </div>`;
}

function renderHighlight(highlight) {
  if (!highlight) return "";
  const items = Array.isArray(highlight) ? highlight : [highlight];
  return items.map(renderOneHighlight).join("");
}

function renderCta(cta) {
  if (!cta) return "";
  return `
    <div style="text-align: center; margin: 32px 0 8px;">
      <a href="${escapeAttr(cta.url)}" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 36px; text-decoration: none; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-family: ${FONT_STACK};">
        ${cta.label}
      </a>
    </div>`;
}

/**
 * @param {string} tag - Short section label shown as "STARK // {tag}" (e.g. "VERIFY", "JURY", "MODERATION").
 * @param {string|string[]} intro - Lead paragraph(s).
 * @param {{variant?: 'code'|'title', label?: string, value: string}|Array} [highlight] - Optional boxed callout(s); pass an array to stack more than one.
 * @param {{label: string, url: string}} [cta] - Optional call-to-action button.
 * @param {string} [footerNote] - Overrides the default footer line.
 */
export function renderEmail({ tag, intro, highlight, cta, footerNote }) {
  const year = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #000000;">
      <div style="font-family: ${FONT_STACK}; background-color: #000000; padding: 48px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #262626;">

          <div style="padding: 24px 32px; border-bottom: 1px solid #262626;">
            <span style="color: ${RED}; font-weight: 700; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; font-family: ${FONT_STACK};">STARK // ${tag}</span>
          </div>

          <div style="padding: 32px;">
            ${renderIntro(intro)}
            ${renderHighlight(highlight)}
            ${renderCta(cta)}
          </div>

          <div style="padding: 20px 32px; border-top: 1px solid #262626;">
            <p style="color: #52525b; font-size: 10px; letter-spacing: 0.5px; line-height: 1.6; margin: 0; font-family: ${FONT_STACK};">
              ${footerNote || "If you didn't request this, you can safely ignore this email."}<br/>
              STARK NETWORK © ${year}
            </p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
}
