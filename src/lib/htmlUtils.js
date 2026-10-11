// HTML cleaning utilities for displaying job descriptions safely.
// Strips HTML tags and converts basic HTML formatting to readable plain text.

/**
 * Strips HTML tags from a string and converts basic HTML elements to
 * readable plain text (line breaks, paragraphs, list items, headings).
 * @param {string} html - Raw HTML string
 * @returns {string} Cleaned plain text
 */
export function stripHtml(html) {
  if (!html) return "";

  return html
    // Convert structural elements to line breaks
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&bull;/g, "•")
    .replace(/&copy;/g, "©")
    .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)))
    // Clean up whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/ \n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Checks if a string appears to contain HTML tags.
 * @param {string} text
 * @returns {boolean}
 */
export function containsHtml(text) {
  if (!text) return false;
  return /<[a-z][\s\S]*?>/i.test(text);
}

/**
 * Cleans job description text: strips HTML if present, otherwise returns as-is.
 * @param {string} text
 * @returns {string}
 */
export function cleanJobDescription(text) {
  if (!text) return "";
  return containsHtml(text) ? stripHtml(text) : text;
}