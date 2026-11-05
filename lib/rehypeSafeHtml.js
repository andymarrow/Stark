/**
 * rehype plugin: allowlist the HTML that user-written markdown may contain.
 * ------------------------------------------------------------------------
 * Project READMEs and changelogs render with rehype-raw so Tiptap mention
 * spans and GitHub-style README HTML (<p align="center"><img …>, <details>)
 * keep working. rehype-raw on its own, though, passes through anything a
 * project owner types — <iframe srcdoc="<script>…">, <object>, event
 * handler attributes — and that runs on stark.et for every visitor.
 *
 * Always list this AFTER rehypeRaw:  rehypePlugins={[rehypeRaw, rehypeSafeHtml]}
 *
 * Elements not on the list are unwrapped (their text is kept); the ones
 * that can run code or load a document are dropped with their contents.
 * Attributes are allowlisted by hast property name, so every on* handler,
 * style and srcdoc is gone, and href/src must be relative or http(s)/
 * mailto/tel. react-markdown's own urlTransform still runs afterwards.
 */
const ALLOWED_TAGS = new Set([
  "a", "abbr", "b", "blockquote", "br", "center", "code", "dd", "del", "details",
  "div", "dl", "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
  "ins", "kbd", "li", "mark", "ol", "p", "pre", "q", "s", "small", "span",
  "strike", "strong", "sub", "summary", "sup", "table", "tbody", "td", "tfoot",
  "th", "thead", "tr", "u", "ul", "input", // input: GFM task-list checkboxes
]);

const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet",
  "noscript", "template", "svg", "math", "form", "button", "textarea", "select",
  "option", "link", "meta", "base", "title", "head", "audio", "video", "source",
  "track", "canvas", "portal",
]);

const ALLOWED_PROPS = new Set([
  "href", "src", "alt", "title", "width", "height", "align", "className",
  "target", "rel", "colSpan", "rowSpan", "start", "open", "type", "checked",
  "disabled", "dataId", "dataLabel", "dataType", "language",
]);

const URL_PROPS = new Set(["href", "src"]);
const SAFE_SCHEMES = /^(https?|mailto|tel):$/i;

function isSafeUrl(value) {
  // Browsers ignore control chars and whitespace inside a scheme
  // ("java\tscript:"), so strip them before looking for one.
  const v = String(value ?? "").replace(/[\u0000- \u007f-\u009f]/g, "");
  const scheme = v.match(/^([a-z][a-z0-9+.-]*):/i);
  return !scheme || SAFE_SCHEMES.test(scheme[0]);
}

function cleanProps(tagName, props = {}) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_PROPS.has(key)) continue;
    if (URL_PROPS.has(key) && !isSafeUrl(value)) continue;
    out[key] = value;
  }
  // Only GFM's disabled checkboxes, never a real form control.
  if (tagName === "input") {
    if (out.type !== "checkbox") return null;
    out.disabled = true;
  }
  if (tagName === "a" && out.target) out.rel = "noopener noreferrer nofollow";
  return out;
}

function cleanChildren(children) {
  const out = [];
  for (const node of children || []) {
    if (node.type === "raw" || node.type === "comment" || node.type === "doctype") continue;
    if (node.type !== "element") {
      out.push(node);
      continue;
    }
    const tag = String(node.tagName || "").toLowerCase();
    if (DROP_WITH_CONTENT.has(tag)) continue;

    const kids = cleanChildren(node.children);
    if (!ALLOWED_TAGS.has(tag)) {
      out.push(...kids); // unknown tag: keep the text, lose the element
      continue;
    }
    const properties = cleanProps(tag, node.properties);
    if (!properties) continue;
    out.push({ ...node, tagName: tag, properties, children: kids });
  }
  return out;
}

export default function rehypeSafeHtml() {
  return (tree) => {
    tree.children = cleanChildren(tree.children);
  };
}
