/**
 * Turn an uploaded SVG certificate into the one-page PDF template the
 * server stamps names onto. Browser-only (needs DOMParser, Image, canvas).
 * --------------------------------------------------------------------
 * Why flatten in the browser: the server renders with pdf-lib, which can
 * place a PDF page or an image but can't draw SVG. The browser already
 * renders SVG — including fonts embedded as data URIs, which design tools
 * export — so it rasterises the design at print resolution and wraps it
 * in a PDF before upload. Server-side SVG renderers mostly ignore those
 * embedded fonts and would print the design in the wrong typeface.
 *
 * The name placeholder is found and removed before rasterising, and its
 * position, size and alignment become the starting name layout, so a
 * template that marks its placeholder needs no manual positioning. Any of
 * these count as the placeholder:
 *   <text id="participant-name">…</text>
 *   <text data-certificate-name>…</text>
 *   a <text> whose content contains {{name}}
 */
import { PDFDocument } from "pdf-lib";

const TARGET_DPI = 300;
const MAX_PIXELS_LONG_SIDE = 4200;

const UNIT_TO_PT = { pt: 1, px: 0.75, in: 72, mm: 72 / 25.4, cm: 72 / 2.54, pc: 12 };

function lengthToPt(value) {
  const m = String(value || "").trim().match(/^([\d.]+)\s*(pt|px|in|mm|cm|pc)?$/i);
  if (!m) return null;
  return parseFloat(m[1]) * UNIT_TO_PT[(m[2] || "px").toLowerCase()];
}

function findPlaceholder(svg) {
  return (
    svg.querySelector("#participant-name") ||
    svg.querySelector("[data-certificate-name]") ||
    [...svg.querySelectorAll("text")].find((t) => t.textContent.includes("{{name}}")) ||
    null
  );
}

function attrOrStyle(el, name) {
  return el.getAttribute(name) || el.style?.getPropertyValue(name) || "";
}

// Placeholders are often drawn in a soft grey so they read as "fill me in".
// The real name shouldn't inherit that, so a low-saturation mid-grey fill
// is swapped for near-black. Any deliberate colour (white on a dark band,
// gold, brand red) is kept.
function nameColourFrom(fill) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(fill) ? fill : null;
  if (!hex) return "#05060a";
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
  const n = parseInt(full.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const saturation = max === min ? 0 : (max - min) / 255;
  if (saturation < 0.15 && lightness > 0.3 && lightness < 0.8) return "#05060a";
  return full.toLowerCase();
}

// A horizontal rule just under the name (the signature-style line most
// certificates have) tells us how wide the name may get before shrinking.
function underlineWidth(svg, x, y, fontSize) {
  for (const line of svg.querySelectorAll("line")) {
    const x1 = parseFloat(line.getAttribute("x1"));
    const x2 = parseFloat(line.getAttribute("x2"));
    const y1 = parseFloat(line.getAttribute("y1"));
    const y2 = parseFloat(line.getAttribute("y2"));
    if ([x1, x2, y1, y2].some(Number.isNaN) || Math.abs(y1 - y2) > 1) continue;
    const [lo, hi] = [Math.min(x1, x2), Math.max(x1, x2)];
    if (y1 >= y && y1 <= y + fontSize && x >= lo - 1 && x <= hi + 1) return hi - lo;
  }
  return null;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The browser couldn't render this SVG."));
    img.src = url;
  });
}

/**
 * @param {File} file - the uploaded .svg
 * @returns {Promise<{ pdfBytes: Uint8Array, layout: object|null, pageWidth: number, pageHeight: number }>}
 *   layout is null when no placeholder was found.
 */
export async function svgFileToTemplatePdf(file) {
  const source = await file.text();
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  const svg = doc.documentElement;
  if (doc.querySelector("parsererror") || svg.nodeName.toLowerCase() !== "svg") {
    throw new Error("That file isn't a valid SVG.");
  }

  const viewBox = (svg.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
  const vbWidth = viewBox.length === 4 && viewBox[2] > 0 ? viewBox[2] : parseFloat(svg.getAttribute("width"));
  const vbHeight = viewBox.length === 4 && viewBox[3] > 0 ? viewBox[3] : parseFloat(svg.getAttribute("height"));
  const vbX = viewBox.length === 4 ? viewBox[0] : 0;
  const vbY = viewBox.length === 4 ? viewBox[1] : 0;
  if (!(vbWidth > 0 && vbHeight > 0)) throw new Error("The SVG needs a viewBox or a width and height.");

  // Physical page size: from width/height when they carry units (297mm),
  // otherwise treat SVG user units as CSS pixels.
  const pageWidth = lengthToPt(svg.getAttribute("width")) || vbWidth * 0.75;
  const pageHeight = lengthToPt(svg.getAttribute("height")) || vbHeight * 0.75;
  const scale = pageWidth / vbWidth; // user units -> points

  let layout = null;
  const placeholder = findPlaceholder(svg);
  if (placeholder) {
    const firstSpan = placeholder.querySelector("tspan[x]");
    const x = parseFloat(placeholder.getAttribute("x") ?? firstSpan?.getAttribute("x")) || 0;
    const y = parseFloat(placeholder.getAttribute("y") ?? firstSpan?.getAttribute("y")) || 0;
    const fontSize = parseFloat(attrOrStyle(placeholder, "font-size")) || 36;
    const anchor = attrOrStyle(placeholder, "text-anchor");
    const ruleWidth = underlineWidth(svg, x, y, fontSize);

    layout = {
      x: (x - vbX) * scale,
      y: (y - vbY) * scale,
      fontSize: fontSize * scale,
      color: nameColourFrom(attrOrStyle(placeholder, "fill")),
      align: anchor === "middle" ? "center" : anchor === "end" ? "right" : "left",
      maxWidth: (ruleWidth || vbWidth * 0.6) * scale,
    };
    placeholder.remove();
  }

  // Rasterise at print resolution.
  const pxPerPt = TARGET_DPI / 72;
  let pxWidth = Math.round(pageWidth * pxPerPt);
  let pxHeight = Math.round(pageHeight * pxPerPt);
  const shrink = Math.min(1, MAX_PIXELS_LONG_SIDE / Math.max(pxWidth, pxHeight));
  pxWidth = Math.round(pxWidth * shrink);
  pxHeight = Math.round(pxHeight * shrink);

  svg.setAttribute("width", String(pxWidth));
  svg.setAttribute("height", String(pxHeight));
  if (!svg.getAttribute("viewBox")) svg.setAttribute("viewBox", `0 0 ${vbWidth} ${vbHeight}`);

  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  let pngBytes;
  try {
    const img = await loadImage(url);
    if (img.decode) await img.decode().catch(() => {});
    if (document.fonts?.ready) await document.fonts.ready;

    const canvas = document.createElement("canvas");
    canvas.width = pxWidth;
    canvas.height = pxHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, pxWidth, pxHeight);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("Couldn't rasterise the SVG.");
    pngBytes = new Uint8Array(await png.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }

  const pdf = await PDFDocument.create();
  pdf.setProducer("Stark");
  const image = await pdf.embedPng(pngBytes);
  const page = pdf.addPage([pageWidth, pageHeight]);
  page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  return { pdfBytes: await pdf.save(), layout, pageWidth, pageHeight };
}
