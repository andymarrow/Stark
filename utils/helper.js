import { NextResponse } from "next/server";

export const catchErrors = (controller) => {
	return async (request, context) => {
		try {
			return await controller(request, context);
		} catch (error) {
			console.error("Error:", error.message);
			const status = error.status || 500;
			const message = error.expose ? error.message : "Internal Server Error";
			return NextResponse.json({ error: message }, { status });
		}
	};
};

/**
 * Robustly extracts either IDs or Usernames from Tiptap HTML spans and Markdown patterns.
 */
export const extractMentionIdentifiers = (text) => {
  if (!text) return [];
  const identifiers = new Set();

  // 1. Match HTML format: <span data-id="username_or_uuid">
  // This regex is now more flexible with quotes and spacing
  const htmlRegex = /data-id\s*=\s*["']([^"']+)["']/g;
  let match;
  while ((match = htmlRegex.exec(text)) !== null) {
    identifiers.add(match[1]);
  }

  // 2. Match Markdown format: @[display](username_or_uuid)
  const mdRegex = /@\[[^\]]+\]\s*\(([^)]+)\)/g;
  while ((match = mdRegex.exec(text)) !== null) {
    identifiers.add(match[1]);
  }

  return Array.from(identifiers);
};