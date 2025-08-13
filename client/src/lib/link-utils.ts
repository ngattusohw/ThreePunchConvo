import DOMPurify from "dompurify";
import * as linkify from "linkifyjs";

// Process text content and convert URLs to HTML links
export function processLinksInText(text: string): string {
  if (!text) return "";

  // First escape HTML characters to prevent XSS
  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  // Find all linkifiable elements
  const links = linkify.find(escapedText);

  if (links.length === 0) {
    return escapedText;
  }

  // Process the text by replacing URLs with anchor tags
  let processedText = escapedText;
  let offset = 0;

  links.forEach((link) => {
    if (link.type === "url") {
      const originalUrl = link.value;
      const href = link.href;

      let domain;
      try {
        domain = new URL(href).hostname;
      } catch {
        domain = href;
      }

      const displayText =
        originalUrl.length > 50
          ? originalUrl.substring(0, 47) + "..."
          : originalUrl;
      const anchorTag = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-ufc-blue hover:text-ufc-blue-hover underline break-all" title="${domain}">${displayText}</a>`;

      const startIndex = link.start + offset;
      const endIndex = link.end + offset;

      processedText =
        processedText.substring(0, startIndex) +
        anchorTag +
        processedText.substring(endIndex);
      offset += anchorTag.length - (endIndex - startIndex);
    }
  });

  // Sanitize the final HTML to ensure no malicious content
  return DOMPurify.sanitize(processedText, {
    ALLOWED_TAGS: ["a", "br"],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "title"],
  });
}

// Convert newlines to <br> tags for proper display
export function processNewlines(text: string): string {
  return text.replace(/\n/g, "<br>");
}

// Main function to process all text formatting
export function processTextContent(text: string): string {
  if (!text) return "";

  // First process newlines, then links
  // const withNewlines = processNewlines(text);
  const withLinks = processLinksInText(text);

  return withLinks;
}

// Helper function to check if text contains links
export function containsLinks(text: string): boolean {
  const links = linkify.find(text);
  return links.some((link) => link.type === "url");
}

// Helper function to extract all URLs from text
export function extractUrls(text: string): string[] {
  const links = linkify.find(text);
  return links.filter((link) => link.type === "url").map((link) => link.href);
}
