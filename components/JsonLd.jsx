'use client';

import { useMemo } from 'react';

/**
 * Recursively sanitizes string values for strict XSS prevention (e.g. strips
 * angle brackets). Use when you want to ensure no HTML/script in UGC.
 * Optional: by default we only break </script> in the serialized output.
 */
function sanitizeStringStrict(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Recursively sanitizes all string values in an object/array (strict mode).
 */
function sanitizeForJsonLd(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return sanitizeStringStrict(data);
  if (typeof data === 'number' || typeof data === 'boolean') return data;
  if (Array.isArray(data)) return data.map(sanitizeForJsonLd);
  if (typeof data === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(data)) {
      out[key] = sanitizeForJsonLd(value);
    }
    return out;
  }
  return data;
}

/**
 * Serializes data to JSON and ensures "</script>" never appears in the
 * output so it cannot close the script tag (XSS-safe for user-generated content).
 * Optionally pass strict: true to recursively sanitize all string values.
 */
function safeJsonLdString(data, { strict = false } = {}) {
  const obj = strict ? sanitizeForJsonLd(data) : data;
  const json = JSON.stringify(obj);
  return json.replace(/<\/script/gi, '\\u003c/script');
}

/**
 * Reusable client component that injects JSON-LD with XSS-safe serialization.
 * Prevents "</script>" in UGC from closing the tag. Use for Organization,
 * Person, CreativeWork, etc.
 *
 * @param {Object} data - The JSON-LD object.
 * @param {string} [id] - Optional id attribute for the script tag.
 * @param {boolean} [strict] - If true, recursively sanitize all string values (angle brackets, etc.).
 */
export default function JsonLd({ data, id, strict = false }) {
  const html = useMemo(() => {
    if (!data || typeof data !== 'object') return '';
    return safeJsonLdString(data, { strict });
  }, [data, strict]);

  if (!html) return null;

  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export { sanitizeForJsonLd, safeJsonLdString };
