/**
 * Stamp a participant's name onto a certificate template.
 * --------------------------------------------------------
 * The template is always a one-page PDF (SVG uploads are flattened to one
 * in the admin's browser before they get here — see svgTemplate.js). The
 * page is embedded as-is, so a vector PDF stays vector, and the name is
 * drawn on top with a font we ship, so it looks the same whoever opens it.
 *
 * Names are real people's profile names, so they aren't all Latin: Inter
 * draws Latin/Cyrillic/Greek, and anything Inter lacks falls back to Noto
 * Sans Ethiopic for Amharic names. Characters neither font has (emoji,
 * scripts that need shaping like Arabic) are dropped, and reported back so
 * the admin page can flag the name for a manual edit before sending.
 *
 * Server-only — reads the bundled fonts from disk.
 */
import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const FONT_DIR = path.join(process.cwd(), "lib/certificate/fonts");
const FONT_FILES = [
  "Inter-ExtraBold.ttf",
  "NotoSansEthiopic-Bold.ttf",
];

let fontCache = null;
async function loadFonts() {
  if (!fontCache) {
    fontCache = Promise.all(
      FONT_FILES.map(async (file) => {
        const bytes = await readFile(path.join(FONT_DIR, file));
        return { bytes, face: fontkit.create(bytes) };
      })
    ).catch((err) => {
      fontCache = null; // don't cache a failed read forever
      throw err;
    });
  }
  return fontCache;
}

export const DEFAULT_NAME_LAYOUT = Object.freeze({
  x: 0.5, // fractions of the page until normalised against a real page
  y: 0.5,
  fontSize: 36,
  color: "#05060a",
  align: "center",
  maxWidth: 0.7,
});

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const num = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

/**
 * Coerce whatever the client sent into a layout that's safe to draw with,
 * in points, for a page of the given size.
 */
export function normaliseLayout(layout, pageWidth, pageHeight) {
  const l = layout || {};
  return {
    x: clamp(num(l.x, pageWidth * DEFAULT_NAME_LAYOUT.x), 0, pageWidth),
    y: clamp(num(l.y, pageHeight * DEFAULT_NAME_LAYOUT.y), 0, pageHeight),
    fontSize: clamp(num(l.fontSize, DEFAULT_NAME_LAYOUT.fontSize), 4, 400),
    color: /^#[0-9a-f]{6}$/i.test(l.color || "") ? l.color.toLowerCase() : DEFAULT_NAME_LAYOUT.color,
    align: ["left", "center", "right"].includes(l.align) ? l.align : DEFAULT_NAME_LAYOUT.align,
    maxWidth: clamp(num(l.maxWidth, pageWidth * DEFAULT_NAME_LAYOUT.maxWidth), 20, pageWidth),
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// Which bundled font (index into FONT_FILES) can draw this code point, or -1.
function fontIndexFor(cp, faces) {
  for (let i = 0; i < faces.length; i++) {
    if (faces[i].face.hasGlyphForCodePoint(cp)) return i;
  }
  return -1;
}

/**
 * Turn a profile name into what will actually be printed.
 * NFKC first so "𝐍𝐈𝐂𝐎𝐋𝐀𝐒"-style fancy-letter names become plain "NICOLAS".
 * Returns { text, dropped } — dropped is the characters no font could draw.
 */
export async function preparePrintedName(raw) {
  const faces = await loadFonts();
  const normalised = String(raw ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
  let text = "";
  const dropped = [];
  for (const ch of normalised) {
    const cp = ch.codePointAt(0);
    // Joiners and variation selectors ride along with emoji; drop silently.
    if (cp === 0x200d || (cp >= 0xfe00 && cp <= 0xfe0f)) continue;
    if (ch === " " || fontIndexFor(cp, faces) !== -1) text += ch;
    else dropped.push(ch);
  }
  return { text: text.replace(/\s+/g, " ").trim(), dropped };
}

/**
 * @param {Uint8Array|Buffer} templateBytes - one-page PDF (only page 1 is used)
 * @param {object} layout - see normaliseLayout
 * @param {string} name - already prepared with preparePrintedName
 * @returns {Promise<Uint8Array>} the finished certificate PDF
 */
export async function renderCertificatePdf(templateBytes, layout, name) {
  const faces = await loadFonts();

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(name ? `Certificate — ${name}` : "Certificate");
  doc.setProducer("Stark");

  const [template] = await doc.embedPdf(templateBytes, [0]);
  const { width, height } = template;
  const page = doc.addPage([width, height]);
  page.drawPage(template, { x: 0, y: 0, width, height });

  const l = normaliseLayout(layout, width, height);
  if (!name) return doc.save();

  // Split into runs of consecutive characters that share a font. Spaces
  // stay in whatever run they're in (every bundled font has a space).
  const runs = [];
  for (const ch of name) {
    const idx = ch === " " && runs.length ? runs[runs.length - 1].font : fontIndexFor(ch.codePointAt(0), faces);
    if (idx === -1) continue;
    const last = runs[runs.length - 1];
    if (last && last.font === idx) last.text += ch;
    else runs.push({ font: idx, text: ch });
  }

  // Only embed the fonts this name actually uses.
  const embedded = {};
  for (const run of runs) {
    if (!embedded[run.font]) {
      embedded[run.font] = await doc.embedFont(faces[run.font].bytes, { subset: true });
    }
  }

  const widthAt = (size) =>
    runs.reduce((sum, r) => sum + embedded[r.font].widthOfTextAtSize(r.text, size), 0);

  // Long names shrink to fit the line instead of running off it.
  let size = l.fontSize;
  const natural = widthAt(size);
  if (natural > l.maxWidth) size = size * (l.maxWidth / natural);
  const total = widthAt(size);

  let x = l.align === "center" ? l.x - total / 2 : l.align === "right" ? l.x - total : l.x;
  const y = height - l.y; // layout is measured from the top; PDF from the bottom
  const color = hexToRgb(l.color);

  for (const run of runs) {
    const font = embedded[run.font];
    page.drawText(run.text, { x, y, size, font, color });
    x += font.widthOfTextAtSize(run.text, size);
  }

  return doc.save();
}

/** Page size of a template, or throws if it isn't a readable PDF. */
export async function readTemplatePageSize(templateBytes) {
  const src = await PDFDocument.load(templateBytes, { ignoreEncryption: false });
  if (src.getPageCount() < 1) throw new Error("The PDF has no pages.");
  const { width, height } = src.getPage(0).getSize();
  return { width, height, pageCount: src.getPageCount() };
}
